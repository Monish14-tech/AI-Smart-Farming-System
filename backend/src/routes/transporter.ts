import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import prisma from '../lib/prisma';
import { authenticate, requireRole } from '../middleware/auth';
import { solveVRP, generateTripSummary } from '../lib/vrp';
import {
  generateSecureOtp,
  timingSafeOtpEqual,
  isDeliveryVerificationLocked,
  recordDeliveryFailedAttempt,
  clearDeliveryAttempts,
} from '../lib/otpService';
import { sendDeliveryOtpEmail, sendPayoutReleasedEmail } from '../lib/emailService';
import { markConsignmentArrival, disburseEscrowPayout } from '../lib/escrowPaymentService';
import { sendDeliveryOtpSms } from '../lib/smsService';

const router = Router();
router.use(authenticate);
router.use(requireRole('transporter'));

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({ storage: multer.memoryStorage() });

// ─── GET /transporter/jobs - available jobs ──────────────────────────
router.get('/jobs', async (req: Request, res: Response): Promise<void> => {
  try {
    // Verification check: Transporter must be verified by admin to see and accept jobs
    const transporterUser = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { isVerified: true },
    });

    if (!transporterUser?.isVerified) {
      res.json({
        jobs: [],
        verificationRequired: true,
        message: 'Driver license and vehicle document verification required before viewing available transport jobs',
      });
      return;
    }

    // 1. Auto-backfill: check for any active orders without a transport job
    const ordersWithoutJob = await prisma.order.findMany({
      where: {
        status: { in: ['pending', 'confirmed'] },
        transportJob: null,
      },
      include: {
        listing: { include: { farmer: true } },
      },
    });

    for (const ord of ordersWithoutJob) {
      await prisma.transportJob.create({
        data: {
          orderId: ord.id,
          earningAmount: Math.round(ord.totalPrice * 0.05),
          pickupLat: ord.listing.farmer.latitude ?? ord.listing.latitude,
          pickupLng: ord.listing.farmer.longitude ?? ord.listing.longitude,
          pickupAddress: ord.listing.farmer.address || 'Farm Pickup Location',
          dropLat: ord.deliveryLat ?? null,
          dropLng: ord.deliveryLng ?? null,
          dropAddress: ord.deliveryAddress || 'Buyer Drop Location',
          status: 'pending',
        },
      }).catch(() => {});
    }

    // 2. Fetch all available unassigned pending jobs for non-cancelled orders
    const jobs = await prisma.transportJob.findMany({
      where: {
        status: 'pending',
        transporterId: null,
        order: {
          status: { notIn: ['cancelled', 'delivered'] },
        },
      },
      include: {
        order: {
          include: {
            buyer: { select: { name: true, phone: true, address: true } },
            listing: {
              include: { farmer: { select: { name: true, phone: true, address: true, latitude: true, longitude: true } } },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ jobs });
  } catch (err) {
    console.error('[TRANSPORTER/JOBS]', err);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// ─── POST /transporter/jobs/:id/accept - accept a job ────────────────
router.post('/jobs/:id/accept', async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;

  try {
    const transporterUser = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { isVerified: true },
    });

    if (!transporterUser?.isVerified) {
      res.status(403).json({
        error: 'Account verification required before accepting transport jobs. Please upload your driving license and vehicle registration documents for admin approval.',
      });
      return;
    }

    const job = await prisma.transportJob.findUnique({
      where: { id },
      include: { order: { include: { listing: { include: { farmer: true } }, buyer: true } } },
    });

    if (!job || job.transporterId) {
      res.status(404).json({ error: 'Job not available' });
      return;
    }

    const otp = generateSecureOtp(6);
    const typedJob = job as typeof job & {
      order: {
        quantityKg: number;
        listing: { cropName: string; farmer: { latitude: number | null; longitude: number | null; address: string | null } };
        buyer: { name: string; email: string };
        deliveryLat: number | null;
        deliveryLng: number | null;
        deliveryAddress: string | null;
      };
    };

    const updated = await prisma.transportJob.update({
      where: { id },
      data: {
        transporterId: req.user!.userId,
        status: 'assigned',
        otpCode: otp,
        pickupLat: typedJob.order.listing.farmer.latitude,
        pickupLng: typedJob.order.listing.farmer.longitude,
        pickupAddress: typedJob.order.listing.farmer.address ?? undefined,
        dropLat: typedJob.order.deliveryLat,
        dropLng: typedJob.order.deliveryLng,
        dropAddress: typedJob.order.deliveryAddress,
      },
    });

    // Update order status
    await prisma.order.update({ where: { id: job.orderId }, data: { status: 'in_transit' } });

    // Securely dispatch delivery OTP directly to buyer's email & SMS
    const buyer = typedJob.order.buyer;
    if (buyer?.email) {
      sendDeliveryOtpEmail({
        toBuyer: buyer.email,
        buyerName: buyer.name,
        otp,
        orderId: job.orderId,
        cropName: typedJob.order.listing.cropName,
        quantityKg: typedJob.order.quantityKg,
        transporterName: req.user?.email || 'AgriNova Certified Transporter',
      }).catch((mailErr) => console.error('[TRANSPORTER/MAIL_OTP]', mailErr));
    }

    if ((buyer as any)?.phone) {
      sendDeliveryOtpSms({
        toPhone: (buyer as any).phone,
        otp,
        orderId: job.orderId,
        cropName: typedJob.order.listing.cropName,
      }).catch((smsErr) => console.error('[TRANSPORTER/SMS_OTP]', smsErr));
    }

    // Security fix: Transporter must NOT receive the buyer's secret escrow delivery OTP
    res.json({ job: updated });
  } catch (err) {
    console.error('[TRANSPORTER/ACCEPT]', err);
    res.status(500).json({ error: 'Failed to accept job' });
  }
});

// ─── GET /transporter/active ─────────────────────────────────────────
router.get('/active', async (req: Request, res: Response): Promise<void> => {
  try {
    const transporterUser = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { isVerified: true },
    });

    if (!transporterUser?.isVerified) {
      res.json({
        jobs: [],
        verificationRequired: true,
        message: 'Driver license and vehicle document verification required before viewing active trips',
      });
      return;
    }

    const jobs = await prisma.transportJob.findMany({
      where: {
        transporterId: req.user!.userId,
        status: { in: ['assigned', 'picked_up', 'in_transit'] },
      },
      include: {
        order: {
          include: {
            buyer: { select: { name: true, phone: true, address: true } },
            listing: {
              include: { farmer: { select: { name: true, phone: true, address: true, latitude: true, longitude: true } } },
            },
          },
        },
      },
    });
    res.json({ jobs });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch active jobs' });
  }
});

// ─── POST /transporter/gps - update GPS location ─────────────────────
router.post('/gps', async (req: Request, res: Response): Promise<void> => {
  const { latitude, longitude } = req.body;
  if (!latitude || !longitude) {
    res.status(400).json({ error: 'latitude and longitude required' });
    return;
  }

  try {
    await prisma.transporterProfile.update({
      where: { userId: req.user!.userId },
      data: { currentLatitude: latitude, currentLongitude: longitude },
    });

    // Broadcast via Socket.io (handled in index.ts via global io instance)
    const io = (global as any).__io;
    if (io) {
      const payload = { transporterId: req.user!.userId, latitude, longitude, timestamp: new Date() };
      io.emit(`transporter:${req.user!.userId}:location`, payload);

      // Also emit to order rooms for active jobs
      const activeJobs = await prisma.transportJob.findMany({
        where: { transporterId: req.user!.userId, status: { in: ['assigned', 'picked_up', 'in_transit'] } },
        select: { orderId: true },
      });
      for (const j of activeJobs) {
        io.to(`order:${j.orderId}`).emit(`order:${j.orderId}:location`, payload);
        io.emit(`order:${j.orderId}:location`, payload);
      }
    }

    res.json({ updated: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update location' });
  }
});

// ─── POST /transporter/jobs/:id/arrive - mark arrival at delivery destination ───
router.post('/jobs/:id/arrive', async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  try {
    const job = await prisma.transportJob.findFirst({
      where: { id, transporterId: req.user!.userId },
      include: {
        order: {
          include: {
            buyer: { select: { name: true, phone: true, email: true } },
            listing: { select: { cropName: true } },
          },
        },
      },
    });

    if (!job) {
      res.status(404).json({ error: 'Transport assignment not found' });
      return;
    }

    if (job.status === 'delivered') {
      res.status(400).json({ error: 'Shipment already completed' });
      return;
    }

    // Mark arrival and start 48-hour auto-release countdown
    const updatedOrder = await markConsignmentArrival(job.orderId, job.id);

    // Resend OTP to buyer via SMS upon physical arrival at dock
    if (job.order.buyer.phone && job.otpCode) {
      sendDeliveryOtpSms({
        toPhone: job.order.buyer.phone,
        otp: job.otpCode,
        orderId: job.orderId,
        cropName: job.order.listing.cropName,
      }).catch((err) => console.error('[SMS/ARRIVE_OTP]', err));
    }

    res.json({
      message: 'Arrival registered! 48-hour inspection and escrow window initiated.',
      arrivedAt: updatedOrder.arrivedAt,
      autoReleaseAt: updatedOrder.autoReleaseAt,
    });
  } catch (err) {
    console.error('[TRANSPORTER/ARRIVE]', err);
    res.status(500).json({ error: 'Failed to record arrival' });
  }
});

// ─── POST /transporter/jobs/:id/deliver - confirm delivery with OTP ───
router.post('/jobs/:id/deliver', async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const { otp } = req.body;

  if (!otp || typeof otp !== 'string' || otp.trim().length !== 6) {
    res.status(400).json({ error: 'A valid 6-digit numeric OTP is required' });
    return;
  }

  // Check brute force lockout
  const lockStatus = isDeliveryVerificationLocked(id);
  if (lockStatus.locked) {
    res.status(429).json({
      error: `Too many incorrect attempts. Verification locked for ${lockStatus.waitMinutes} minutes to protect escrow.`,
    });
    return;
  }

  try {
    const job = await prisma.transportJob.findFirst({
      where: { id, transporterId: req.user!.userId },
      include: {
        order: {
          include: {
            listing: { include: { farmer: true } },
            buyer: true,
          },
        },
      },
    });

    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    if (job.status === 'delivered') {
      res.status(400).json({ error: 'This shipment has already been confirmed as delivered and escrow released' });
      return;
    }

    // Timing-safe constant time comparison to prevent timing attacks
    const isValid = timingSafeOtpEqual(job.otpCode, otp);

    if (!isValid) {
      const attempt = recordDeliveryFailedAttempt(id);
      res.status(400).json({
        error: 'Invalid delivery OTP code',
        attemptsRemaining: attempt.attemptsLeft,
        locked: attempt.locked,
        message: attempt.locked
          ? `Too many failed attempts. Verification locked for ${attempt.waitMinutes} minutes.`
          : `${attempt.attemptsLeft} attempt(s) remaining before security lockout.`,
      });
      return;
    }

    // Clear failed attempts counter upon valid OTP
    clearDeliveryAttempts(id);

    // Atomically execute multi-party payout with strict idempotency & double-entry ledger audit
    const settlement = await disburseEscrowPayout({
      orderId: job.orderId,
      resolvedBy: 'otp_verification',
    });

    res.json({
      message: 'Delivery confirmed! Escrow funds atomically released.',
      payouts: settlement.payouts,
    });
  } catch (err) {
    console.error('[TRANSPORTER/DELIVER]', err);
    res.status(500).json({ error: 'Failed to confirm delivery' });
  }
});

// ─── POST /transporter/jobs/:id/dispute-counter - submit counter-evidence ───
const carrierCounterSchema = z.object({
  statement: z.string().min(5, 'Statement must be at least 5 characters').max(1000),
  evidenceUrls: z.array(z.string()).optional(),
});

router.post('/jobs/:id/dispute-counter', async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const parsed = carrierCounterSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }

  try {
    const job = await prisma.transportJob.findFirst({
      where: { id, transporterId: req.user!.userId },
      include: { order: { include: { dispute: true } } },
    });

    if (!job || !job.order.dispute) {
      res.status(404).json({ error: 'Active dispute not found for this assignment' });
      return;
    }

    const updatedDispute = await prisma.dispute.update({
      where: { id: job.order.dispute.id },
      data: {
        transporterNotes: parsed.data.statement,
        transporterEvidenceUrls: parsed.data.evidenceUrls || [],
        status: 'countered',
      },
    });

    res.json({
      message: 'Transporter transit logs and counter-evidence submitted for arbitration review.',
      dispute: updatedDispute,
    });
  } catch (err) {
    console.error('[TRANSPORTER/DISPUTE_COUNTER]', err);
    res.status(500).json({ error: 'Failed to submit counter evidence' });
  }
});

// ─── POST /transporter/route-optimize - VRP route optimization ────────
router.post('/route-optimize', async (req: Request, res: Response): Promise<void> => {
  const { jobIds } = req.body;

  if (!Array.isArray(jobIds) || jobIds.length === 0) {
    res.status(400).json({ error: 'jobIds array required' });
    return;
  }

  try {
    const jobs = await prisma.transportJob.findMany({
      where: { id: { in: jobIds }, transporterId: req.user!.userId },
      include: { order: { include: { listing: { include: { farmer: true } } } } },
    });

    if (jobs.length === 0) {
      res.status(404).json({ error: 'No jobs found' });
      return;
    }

    // Build stops for VRP solver
    const stops = jobs.map((j: any) => ({
      id: j.id,
      pickupLat: j.order.listing.farmer.latitude ?? 0,
      pickupLng: j.order.listing.farmer.longitude ?? 0,
      dropLat: j.dropLat ?? 0,
      dropLng: j.dropLng ?? 0,
      label: j.order.listing.cropName,
      farmerName: j.order.listing.farmer.name,
    }));

    // Get transporter current location
    const profile = await prisma.transporterProfile.findUnique({ where: { userId: req.user!.userId } });
    const origin = {
      lat: profile?.currentLatitude ?? stops[0].pickupLat,
      lng: profile?.currentLongitude ?? stops[0].pickupLng,
    };

    const route = solveVRP(origin, stops);
    const summary = await generateTripSummary(route, stops);

    res.json({ route, summary, stopsCount: stops.length });
  } catch (err) {
    console.error('[TRANSPORTER/VRP]', err);
    res.status(500).json({ error: 'Route optimization failed' });
  }
});

// ─── GET /transporter/earnings ───────────────────────────────────────
router.get('/earnings', async (req: Request, res: Response): Promise<void> => {
  try {
    const jobs = await prisma.transportJob.findMany({
      where: { transporterId: req.user!.userId, status: 'delivered' },
      include: { order: { include: { listing: { select: { cropName: true } } } } },
      orderBy: { deliveredAt: 'desc' },
    });

    const totalEarnings = jobs.reduce((sum: number, j: any) => sum + (j.earningAmount ?? 0), 0);
    res.json({ jobs, totalEarnings });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch earnings' });
  }
});

// ─── PUT /transporter/availability ───────────────────────────────────
router.put('/availability', async (req: Request, res: Response): Promise<void> => {
  const { isAvailable } = req.body;
  try {
    await prisma.transporterProfile.update({
      where: { userId: req.user!.userId },
      data: { isAvailable },
    });
    res.json({ updated: true });
  } catch {
    res.status(500).json({ error: 'Failed to update availability' });
  }
});

// ─── POST /transporter/verify-documents - submit license and vehicle docs ───
router.post('/verify-documents', upload.single('licenseDoc'), async (req: Request, res: Response): Promise<void> => {
  const { vehicleType, vehicleCapacityKg, licenseNumber, vehicleNumber, licenseDocUrl: rawUrl } = req.body;

  try {
    let documentUrl = rawUrl;
    const file = req.file;

    if (file) {
      try {
        const base64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
        const result = await cloudinary.uploader.upload(base64, {
          folder: 'agrinova/transporter_docs',
          resource_type: 'auto',
        });
        documentUrl = result.secure_url;
      } catch (err) {
        console.warn('[CLOUDINARY] License document upload fallback to base64 data URI');
        documentUrl = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      }
    }

    // Upsert transporter profile with documents and vehicle details
    await prisma.transporterProfile.upsert({
      where: { userId: req.user!.userId },
      create: {
        userId: req.user!.userId,
        vehicleType: vehicleType || null,
        vehicleCapacityKg: vehicleCapacityKg ? parseFloat(vehicleCapacityKg) : null,
        vehicleNumber: vehicleNumber || null,
        licenseNumber: licenseNumber || null,
        licenseDocUrl: documentUrl || null,
      },
      update: {
        ...(vehicleType !== undefined && { vehicleType: vehicleType || null }),
        ...(vehicleCapacityKg !== undefined && { vehicleCapacityKg: vehicleCapacityKg ? parseFloat(vehicleCapacityKg) : null }),
        ...(vehicleNumber !== undefined && { vehicleNumber: vehicleNumber || null }),
        ...(licenseNumber !== undefined && { licenseNumber: licenseNumber || null }),
        ...(documentUrl && { licenseDocUrl: documentUrl }),
      },
    });

    // Reset verification status to false whenever documents or vehicle details are edited!
    await prisma.user.update({
      where: { id: req.user!.userId },
      data: { isVerified: false },
    });

    const refreshedUser = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: { transporterProfile: true },
    });

    const { passwordHash: _, ...u } = refreshedUser!;
    res.json({
      user: u,
      message: 'Driving license and vehicle details submitted successfully. Your account is now pending administrator verification.',
    });
  } catch (err) {
    console.error('[TRANSPORTER/VERIFY-DOCUMENTS]', err);
    res.status(500).json({ error: 'Failed to submit driver and vehicle documents' });
  }
});

export default router;
