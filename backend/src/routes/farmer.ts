import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import prisma from '../lib/prisma';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();
router.use(authenticate);
router.use(requireRole('farmer'));

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const upload = multer({ storage: multer.memoryStorage() });

const listingSchema = z.object({
  cropName: z.string().min(1).max(100),
  qualityGrade: z.enum(['A', 'B', 'C']).optional(),
  quantityKg: z.number().positive(),
  pricePerKg: z.number().positive(),
  harvestDate: z.string().optional(),
  description: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

// ─── GET /farmer/listings — my listings ─────────────────────────────
router.get('/listings', async (req: Request, res: Response): Promise<void> => {
  try {
    const listings = await prisma.cropListing.findMany({
      where: { farmerId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        orders: { select: { id: true, status: true, quantityKg: true, totalPrice: true, buyer: { select: { name: true, phone: true } } } },
      },
    });
    res.json({ listings });
  } catch (err) {
    console.error('[FARMER/LISTINGS GET]', err);
    res.status(500).json({ error: 'Failed to fetch listings' });
  }
});

// ─── GET /farmer/listings/:id — single listing detail ────────────────
router.get('/listings/:id', async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  try {
    const listing = await prisma.cropListing.findFirst({
      where: { id, farmerId: req.user!.userId },
    });
    if (!listing) {
      res.status(404).json({ error: 'Listing not found' });
      return;
    }
    res.json({ listing });
  } catch (err) {
    console.error('[FARMER/LISTING DETAIL]', err);
    res.status(500).json({ error: 'Failed to fetch listing' });
  }
});

// ─── POST /farmer/listings — create listing ──────────────────────────
router.post('/listings', upload.array('images', 5), async (req: Request, res: Response): Promise<void> => {
  const body = {
    ...req.body,
    quantityKg: req.body.quantityKg ? Number(req.body.quantityKg) : undefined,
    pricePerKg: req.body.pricePerKg ? Number(req.body.pricePerKg) : undefined,
    latitude: req.body.latitude ? Number(req.body.latitude) : undefined,
    longitude: req.body.longitude ? Number(req.body.longitude) : undefined,
  };
  const parsed = listingSchema.safeParse(body);

  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }

  try {
    const imageUrls: string[] = [];
    const files = req.files as Express.Multer.File[];

    // Upload images to Cloudinary if available
    for (const file of files || []) {
      try {
        const base64 = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
        const result = await cloudinary.uploader.upload(base64, { folder: 'agrinova/listings' });
        imageUrls.push(result.secure_url);
      } catch (cloudErr) {
        console.warn('[CLOUDINARY] Upload skipped or demo mode:', cloudErr);
      }
    }

    const listing = await prisma.cropListing.create({
      data: {
        farmerId: req.user!.userId,
        cropName: parsed.data.cropName,
        qualityGrade: parsed.data.qualityGrade ?? null,
        quantityKg: parsed.data.quantityKg,
        pricePerKg: parsed.data.pricePerKg,
        harvestDate: parsed.data.harvestDate ? new Date(parsed.data.harvestDate) : null,
        description: parsed.data.description ?? null,
        images: imageUrls,
        latitude: parsed.data.latitude ?? null,
        longitude: parsed.data.longitude ?? null,
      },
    });

    res.status(201).json({ listing });
  } catch (err) {
    console.error('[FARMER/LISTINGS POST]', err);
    res.status(500).json({ error: 'Failed to create listing' });
  }
});

// ─── PUT /farmer/listings/:id — update listing ──────────────────────
router.put('/listings/:id', async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const body = {
    ...req.body,
    ...(req.body.quantityKg !== undefined && { quantityKg: Number(req.body.quantityKg) }),
    ...(req.body.pricePerKg !== undefined && { pricePerKg: Number(req.body.pricePerKg) }),
    ...(req.body.latitude !== undefined && { latitude: Number(req.body.latitude) }),
    ...(req.body.longitude !== undefined && { longitude: Number(req.body.longitude) }),
  };
  const parsed = listingSchema.partial().safeParse(body);

  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }

  try {
    const existing = await prisma.cropListing.findFirst({ where: { id, farmerId: req.user!.userId } });
    if (!existing) {
      res.status(404).json({ error: 'Listing not found' });
      return;
    }

    const updated = await prisma.cropListing.update({
      where: { id },
      data: {
        ...(parsed.data.cropName && { cropName: parsed.data.cropName }),
        ...(parsed.data.qualityGrade !== undefined && { qualityGrade: parsed.data.qualityGrade }),
        ...(parsed.data.quantityKg !== undefined && { quantityKg: parsed.data.quantityKg }),
        ...(parsed.data.pricePerKg !== undefined && { pricePerKg: parsed.data.pricePerKg }),
        ...(parsed.data.harvestDate !== undefined && { harvestDate: parsed.data.harvestDate ? new Date(parsed.data.harvestDate) : null }),
        ...(parsed.data.description !== undefined && { description: parsed.data.description }),
      },
    });

    res.json({ listing: updated });
  } catch (err) {
    console.error('[FARMER/LISTINGS PUT]', err);
    res.status(500).json({ error: 'Failed to update listing' });
  }
});

// ─── DELETE /farmer/listings/:id ────────────────────────────────────
router.delete('/listings/:id', async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  try {
    const existing = await prisma.cropListing.findFirst({ where: { id, farmerId: req.user!.userId } });
    if (!existing) {
      res.status(404).json({ error: 'Listing not found' });
      return;
    }
    await prisma.cropListing.update({ where: { id }, data: { status: 'cancelled' } });
    res.json({ message: 'Listing cancelled' });
  } catch (err) {
    console.error('[FARMER/LISTINGS DELETE]', err);
    res.status(500).json({ error: 'Failed to delete listing' });
  }
});

// ─── GET /farmer/orders — incoming orders ────────────────────────────
router.get('/orders', async (req: Request, res: Response): Promise<void> => {
  try {
    const orders = await prisma.order.findMany({
      where: { listing: { farmerId: req.user!.userId } },
      include: {
        buyer: { select: { name: true, phone: true, email: true, address: true } },
        listing: { select: { cropName: true, pricePerKg: true, images: true } },
        transportJob: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ orders });
  } catch (err) {
    console.error('[FARMER/ORDERS GET]', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// ─── PUT /farmer/orders/:id/status ───────────────────────────────────
router.put('/orders/:id/status', async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const { status } = req.body;

  if (!['confirmed', 'cancelled'].includes(status)) {
    res.status(400).json({ error: 'Invalid status. Farmer can only confirm or cancel orders' });
    return;
  }

  try {
    const order = await prisma.order.findFirst({
      where: { id, listing: { farmerId: req.user!.userId } },
      include: { listing: true },
    });

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    const updated = await prisma.order.update({ where: { id }, data: { status } });

    // Create transport job when order is confirmed (safely upsert to prevent duplicates)
    if (status === 'confirmed') {
      const existingJob = await prisma.transportJob.findUnique({ where: { orderId: id } });
      if (!existingJob) {
        const farmer = await prisma.user.findUnique({ where: { id: req.user!.userId } });
        await prisma.transportJob.create({
          data: {
            orderId: id,
            earningAmount: order.totalPrice * 0.05, // 5% of order value
            pickupLat: farmer?.latitude ?? order.listing.latitude,
            pickupLng: farmer?.longitude ?? order.listing.longitude,
            pickupAddress: farmer?.address,
            dropLat: order.deliveryLat,
            dropLng: order.deliveryLng,
            dropAddress: order.deliveryAddress,
          },
        });
      }
    }

    // Restore listing quantity when order is cancelled
    if (status === 'cancelled' && order.status !== 'cancelled') {
      await prisma.cropListing.update({
        where: { id: order.listingId },
        data: {
          quantityKg: { increment: order.quantityKg },
          status: 'active',
        },
      });
    }

    res.json({ order: updated });
  } catch (err) {
    console.error('[FARMER/ORDERS STATUS]', err);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// ─── GET /farmer/earnings ────────────────────────────────────────────
router.get('/earnings', async (req: Request, res: Response): Promise<void> => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        listing: { farmerId: req.user!.userId },
        status: 'delivered',
        paymentStatus: 'paid',
      },
      include: { listing: { select: { cropName: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const totalEarnings = orders.reduce((sum, o) => sum + o.totalPrice, 0);
    const thisMonth = orders.filter(o => {
      const d = new Date(o.createdAt);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).reduce((sum, o) => sum + o.totalPrice, 0);

    res.json({ orders, totalEarnings, thisMonthEarnings: thisMonth });
  } catch (err) {
    console.error('[FARMER/EARNINGS]', err);
    res.status(500).json({ error: 'Failed to fetch earnings' });
  }
});

// ─── GET /farmer/mandi-prices — live mandi prices ────────────────────
router.get('/mandi-prices', async (req: Request, res: Response): Promise<void> => {
  const { commodity = 'Tomato' } = req.query as Record<string, string>;
  try {
    // Fetch from data.gov.in Agmarknet API (free, open government dataset)
    const response = await fetch(
      `https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070?api-key=579b464db66ec23bdd000001cdd3946e44ce4aab825f5763a294e74&format=json&limit=25&filters%5Bcommodity%5D=${encodeURIComponent(commodity)}`,
      { signal: AbortSignal.timeout(6000) }
    );

    if (!response.ok) throw new Error(`Mandi API returned status ${response.status}`);
    const data = await response.json() as any;
    res.json({ prices: data.records || [], total: data.total || 0, source: 'Agmarknet / data.gov.in' });
  } catch (err: any) {
    console.warn('[FARMER/MANDI] Live API fetch error:', err.message);
    res.json({
      prices: [],
      source: 'Agmarknet / data.gov.in',
      message: 'Government Mandi API is currently updating records or unreachable. Please try again shortly.',
    });
  }
});

// ─── GET /farmer/profile ─────────────────────────────────────────────
router.get('/profile', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      include: { farmerProfile: true },
    });
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }
    const { passwordHash: _, ...u } = user;
    res.json({ user: u });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

export default router;
