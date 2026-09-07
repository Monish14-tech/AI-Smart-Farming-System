import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, requireRole } from '../middleware/auth';

const router = Router();
router.use(authenticate);
router.use(requireRole('admin'));

// ─── GET /admin/analytics ─────────────────────────────────────────────
router.get('/analytics', async (_req: Request, res: Response): Promise<void> => {
  try {
    const [
      totalUsers, totalListings, totalOrders, totalRevenue,
      usersByRole, ordersByStatus, recentOrders, topCrops,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.cropListing.count(),
      prisma.order.count(),
      prisma.order.aggregate({ _sum: { totalPrice: true }, where: { paymentStatus: 'paid' } }),
      prisma.user.groupBy({ by: ['role'], _count: true }),
      prisma.order.groupBy({ by: ['status'], _count: true }),
      prisma.order.findMany({
        take: 10, orderBy: { createdAt: 'desc' },
        include: {
          buyer: { select: { name: true } },
          listing: { select: { cropName: true } },
        },
      }),
      prisma.cropListing.groupBy({
        by: ['cropName'], _count: true, _sum: { quantityKg: true },
        orderBy: { _count: { cropName: 'desc' } }, take: 8,
      }),
    ]);

    res.json({
      overview: {
        totalUsers, totalListings, totalOrders,
        totalRevenue: totalRevenue._sum.totalPrice ?? 0,
      },
      usersByRole,
      ordersByStatus,
      recentOrders,
      topCrops,
    });
  } catch (err) {
    console.error('[ADMIN/ANALYTICS]', err);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// ─── GET /admin/users ─────────────────────────────────────────────────
router.get('/users', async (req: Request, res: Response): Promise<void> => {
  try {
    const { role, verified, page = '1', limit = '20' } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where: any = {};
    if (role) where.role = role;
    if (verified !== undefined) where.isVerified = verified === 'true';

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where, skip, take: parseInt(limit), orderBy: { createdAt: 'desc' },
        select: { id: true, name: true, email: true, phone: true, role: true, isVerified: true, createdAt: true, address: true, farmerProfile: true, transporterProfile: true },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({ users, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// ─── PUT /admin/users/:id/verify — approve KYC ───────────────────────
router.put('/users/:id/verify', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.update({
      where: { id: req.params.id as string },
      data: { isVerified: true },
    });
    const { passwordHash: _, ...u } = user;
    res.json({ user: u, message: 'User verified successfully' });
  } catch {
    res.status(500).json({ error: 'Failed to verify user' });
  }
});

// ─── DELETE /admin/users/:id ──────────────────────────────────────────
router.delete('/users/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    await prisma.user.delete({ where: { id: req.params.id as string } });
    res.json({ message: 'User deleted' });
  } catch {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ─── GET /admin/listings — moderation queue ───────────────────────────
router.get('/listings', async (req: Request, res: Response): Promise<void> => {
  try {
    const { status = 'active', page = '1', limit = '20' } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [listings, total] = await Promise.all([
      prisma.cropListing.findMany({
        where: { status: status as any },
        skip, take: parseInt(limit), orderBy: { createdAt: 'desc' },
        include: { farmer: { select: { name: true, email: true } } },
      }),
      prisma.cropListing.count({ where: { status: status as any } }),
    ]);

    res.json({ listings, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch {
    res.status(500).json({ error: 'Failed to fetch listings' });
  }
});

// ─── PUT /admin/listings/:id/moderate ────────────────────────────────
router.put('/listings/:id/moderate', async (req: Request, res: Response): Promise<void> => {
  const { status } = req.body;
  if (!['active', 'cancelled'].includes(status)) {
    res.status(400).json({ error: 'Invalid status' });
    return;
  }
  try {
    const listing = await prisma.cropListing.update({ where: { id: req.params.id as string }, data: { status } });
    res.json({ listing });
  } catch {
    res.status(500).json({ error: 'Failed to moderate listing' });
  }
});

// ─── GET /admin/orders ────────────────────────────────────────────────
router.get('/orders', async (req: Request, res: Response): Promise<void> => {
  try {
    const { page = '1', limit = '20' } = req.query as Record<string, string>;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        skip, take: parseInt(limit), orderBy: { createdAt: 'desc' },
        include: {
          buyer: { select: { name: true, email: true } },
          listing: { select: { cropName: true, pricePerKg: true, farmer: { select: { name: true } } } },
          transportJob: true,
        },
      }),
      prisma.order.count(),
    ]);

    res.json({ orders, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

export default router;
