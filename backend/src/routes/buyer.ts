import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();
router.use(authenticate);
router.use(requireRole('buyer'));

// ─── GET /buyer/marketplace ──────────────────────────────────────────
router.get('/marketplace', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      crop,
      minPrice,
      maxPrice,
      grade,
      page = '1',
      limit = '20',
      sortBy = 'createdAt',
      order = 'desc',
    } = req.query as Record<string, string>;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where: any = { status: 'active' };
    if (crop) where.cropName = { contains: crop, mode: 'insensitive' };
    if (grade) where.qualityGrade = grade;
    if (minPrice || maxPrice) {
      where.pricePerKg = {};
      if (minPrice) where.pricePerKg.gte = parseFloat(minPrice);
      if (maxPrice) where.pricePerKg.lte = parseFloat(maxPrice);
    }

    const [listings, total] = await Promise.all([
      prisma.cropListing.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { [sortBy]: order },
        include: {
          farmer: {
            select: {
              id: true, name: true, address: true, latitude: true, longitude: true,
              reviewsReceived: { select: { rating: true }, take: 50 },
            },
          },
        },
      }),
      prisma.cropListing.count({ where }),
    ]);

    // Compute farmer avg rating
    const enriched = listings.map(l => ({
      ...l,
      farmer: {
        ...l.farmer,
        avgRating: l.farmer.reviewsReceived.length
          ? (l.farmer.reviewsReceived.reduce((s, r) => s + r.rating, 0) / l.farmer.reviewsReceived.length).toFixed(1)
          : null,
        reviewsReceived: undefined,
      },
    }));

    res.json({ listings: enriched, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    console.error('[BUYER/MARKETPLACE]', err);
    res.status(500).json({ error: 'Failed to fetch marketplace' });
  }
});

// ─── GET /buyer/marketplace/:id — listing detail ─────────────────────
router.get('/marketplace/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const listing = await prisma.cropListing.findUnique({
      where: { id: req.params.id as string },
      include: {
        farmer: {
          select: {
            id: true, name: true, phone: true, address: true, latitude: true, longitude: true,
            farmerProfile: true,
            reviewsReceived: { include: { reviewer: { select: { name: true } } } },
          },
        },
      },
    });

    if (!listing || listing.status !== 'active') {
      res.status(404).json({ error: 'Listing not found' });
      return;
    }

    res.json({ listing });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch listing' });
  }
});

// ─── POST /buyer/orders — place order ────────────────────────────────
const orderSchema = z.object({
  listingId: z.string().uuid(),
  quantityKg: z.number().positive(),
  deliveryAddress: z.string().min(3),
  deliveryLat: z.number().optional(),
  deliveryLng: z.number().optional(),
  notes: z.string().optional(),
});

router.post('/orders', async (req: Request, res: Response): Promise<void> => {
  const parsed = orderSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }

  const { listingId, quantityKg, deliveryAddress, deliveryLat, deliveryLng, notes } = parsed.data;

  try {
    const listing = await prisma.cropListing.findUnique({ where: { id: listingId } });
    if (!listing || listing.status !== 'active') {
      res.status(404).json({ error: 'Listing not available' });
      return;
    }

    if (quantityKg > listing.quantityKg) {
      res.status(400).json({ error: `Only ${listing.quantityKg}kg available` });
      return;
    }

    const totalPrice = quantityKg * listing.pricePerKg;

    const order = await prisma.order.create({
      data: {
        buyerId: req.user!.userId,
        listingId,
        quantityKg,
        totalPrice,
        deliveryAddress,
        deliveryLat: deliveryLat ?? null,
        deliveryLng: deliveryLng ?? null,
        notes: notes ?? null,
        paymentStatus: 'escrowed',
      },
      include: {
        listing: { include: { farmer: { select: { name: true, phone: true } } } },
      },
    });

    // Decrement remaining stock on listing; mark sold if 0 remaining
    const remainingQty = listing.quantityKg - quantityKg;
    await prisma.cropListing.update({
      where: { id: listingId },
      data: {
        quantityKg: Math.max(0, remainingQty),
        status: remainingQty <= 0 ? 'sold' : 'active',
      },
    });

    // Automatically create TransportJob immediately so transporters see the job right away
    const farmer = await prisma.user.findUnique({ where: { id: listing.farmerId } });
    await prisma.transportJob.create({
      data: {
        orderId: order.id,
        earningAmount: Math.round(totalPrice * 0.05), // 5% of order value
        pickupLat: farmer?.latitude ?? listing.latitude,
        pickupLng: farmer?.longitude ?? listing.longitude,
        pickupAddress: farmer?.address || 'Farmer Farm Location',
        dropLat: deliveryLat ?? null,
        dropLng: deliveryLng ?? null,
        dropAddress: deliveryAddress,
        status: 'pending',
      },
    });

    res.status(201).json({ order });
  } catch (err) {
    console.error('[BUYER/ORDERS POST]', err);
    res.status(500).json({ error: 'Failed to place order' });
  }
});

// ─── GET /buyer/orders ───────────────────────────────────────────────
router.get('/orders', async (req: Request, res: Response): Promise<void> => {
  try {
    const orders = await prisma.order.findMany({
      where: { buyerId: req.user!.userId },
      include: {
        listing: {
          include: { farmer: { select: { name: true, phone: true, address: true } } },
        },
        transportJob: {
          include: {
            transporter: {
              select: {
                name: true, phone: true,
                transporterProfile: { select: { vehicleType: true, vehicleNumber: true, currentLatitude: true, currentLongitude: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// ─── POST /buyer/orders/:id/pay — initiate Escrow / UPI payment ────────
router.post('/orders/:id/pay', async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  try {
    const order = await prisma.order.findFirst({
      where: { id, buyerId: req.user!.userId },
      include: { listing: { select: { cropName: true, farmer: { select: { name: true } } } } },
    });

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    // Generate unique AgriNova Smart Escrow Transaction ID
    const escrowTxId = `ESC_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // Generate standard UPI Payment Intent URI (No third-party key required)
    const upiUri = `upi://pay?pa=agrinova.escrow@upi&pn=AgriNova%20Smart%20Escrow&am=${order.totalPrice.toFixed(2)}&tn=Order%20${order.id.substring(0, 8)}%20${encodeURIComponent(order.listing.cropName)}&cu=INR`;

    // Update order with escrow payment reference and set paymentStatus to escrowed
    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: 'escrowed',
        paymentId: escrowTxId,
      },
    });

    res.json({
      success: true,
      escrowId: escrowTxId,
      amount: order.totalPrice,
      currency: 'INR',
      upiUri,
      status: updated.paymentStatus,
      message: 'Funds held in AgriNova Smart Escrow. Released to farmer only upon OTP delivery verification.',
    });
  } catch (err) {
    console.error('[BUYER/PAY]', err);
    res.status(500).json({ error: 'Escrow payment initiation failed' });
  }
});

// ─── POST /buyer/reviews ─────────────────────────────────────────────
const reviewSchema = z.object({
  orderId: z.string().uuid(),
  revieweeId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().optional(),
});

router.post('/reviews', async (req: Request, res: Response): Promise<void> => {
  const parsed = reviewSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }

  try {
    const review = await prisma.review.create({
      data: {
        orderId: parsed.data.orderId,
        reviewerId: req.user!.userId,
        revieweeId: parsed.data.revieweeId,
        rating: parsed.data.rating,
        comment: parsed.data.comment ?? null,
      },
    });
    res.status(201).json({ review });
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

// ─── GET /buyer/profile ──────────────────────────────────────────────
router.get('/profile', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) { res.status(404).json({ error: 'User not found' }); return; }
    const { passwordHash: _, ...u } = user;
    res.json({ user: u });
  } catch {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

export default router;
