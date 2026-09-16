import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import prisma from '../lib/prisma';
import { authenticate, requireRole } from '../middleware/auth';
import { solveVRP, generateTripSummary } from '../lib/vrp';

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

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const typedJob = job as typeof job & { order: { listing: { farmer: { latitude: number | null; longitude: number | null; address: string | null } }; deliveryLat: number | null; deliveryLng: number | null; deliveryAddress: string | null } };

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

    res.json({ job: updated, otp });
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

// ─── POST /transporter/jobs/:id/deliver - confirm delivery with OTP ───
router.post('/jobs/:id/deliver', async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const { otp } = req.body;

  try {
    const job = await prisma.transportJob.findFirst({
      where: { id, transporterId: req.user!.userId },
    });

    if (!job) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    if (job.otpCode !== otp) {
      res.status(400).json({ error: 'Invalid OTP' });
      return;
    }

    await prisma.transportJob.update({
      where: { id },
      data: { status: 'delivered', deliveredAt: new Date() },
    });

    await prisma.order.update({
      where: { id: job.orderId },
      data: { status: 'delivered', paymentStatus: 'paid' },
    });

    res.json({ message: 'Delivery confirmed! Payment released.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to confirm delivery' });
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
