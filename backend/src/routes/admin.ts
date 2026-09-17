import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authenticate, requireRole } from '../middleware/auth';
import { disburseEscrowPayout, processAutoSettlementTimeouts } from '../lib/escrowPaymentService';

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

// ─── PUT /admin/users/:id/verify - approve KYC ───────────────────────
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

// ─── PUT /admin/users/:id/unverify - reject KYC / revoke verification ─
router.put('/users/:id/unverify', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.update({
      where: { id: req.params.id as string },
      data: { isVerified: false },
    });
    const { passwordHash: _, ...u } = user;
    res.json({ user: u, message: 'User verification revoked / KYC rejected' });
  } catch {
    res.status(500).json({ error: 'Failed to revoke verification' });
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

// ─── GET /admin/listings - moderation queue ───────────────────────────
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
          buyer: { select: { name: true, email: true, phone: true } },
          listing: { select: { cropName: true, pricePerKg: true, farmer: { select: { name: true, email: true, phone: true } } } },
          transportJob: { include: { transporter: { select: { name: true, phone: true } } } },
          dispute: true,
          escrowLedgers: { orderBy: { createdAt: 'desc' } },
        },
      }),
      prisma.order.count(),
    ]);

    res.json({ orders, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// ─── GET /admin/disputes ──────────────────────────────────────────────
router.get('/disputes', async (_req: Request, res: Response): Promise<void> => {
  try {
    const disputes = await prisma.dispute.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        order: {
          include: {
            buyer: { select: { id: true, name: true, email: true, phone: true } },
            listing: { include: { farmer: { select: { id: true, name: true, email: true, phone: true } } } },
            transportJob: { include: { transporter: { select: { id: true, name: true, email: true, phone: true } } } },
            escrowLedgers: { orderBy: { createdAt: 'desc' } },
          },
        },
        raisedBy: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    res.json({ disputes });
  } catch (err) {
    console.error('[ADMIN/GET-DISPUTES]', err);
    res.status(500).json({ error: 'Failed to fetch disputes' });
  }
});

// ─── PUT /admin/orders/:id/dispute-resolve ────────────────────────────
// Multi-Party Adjudication supporting full release, full refund, or partial damage settlement
router.put('/orders/:id/dispute-resolve', async (req: Request, res: Response): Promise<void> => {
  const id = req.params.id as string;
  const {
    resolution,
    acceptedPercentage,
    farmerAmount: customFarmerAmount,
    transporterAmount: customCarrierAmount,
    buyerRefund: customBuyerRefund,
    adminNotes,
  } = req.body;

  const validResolutions = ['refund_buyer', 'release_farmer', 'partial_settlement', 'dismiss'];
  if (!validResolutions.includes(resolution)) {
    res.status(400).json({ error: `Valid resolution required (${validResolutions.join(', ')})` });
    return;
  }

  try {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        listing: { include: { farmer: true } },
        transportJob: { include: { transporter: true } },
        buyer: true,
        dispute: true,
      },
    });

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    if (order.paymentStatus === 'paid' || order.paymentStatus === 'refunded') {
      res.status(400).json({ error: `Order is already finalized with status: ${order.paymentStatus}` });
      return;
    }

    const grossAmount = order.totalPrice;
    const carrierFreight = order.transportJob?.earningAmount ?? 0;

    let farmerAmount = 0;
    let buyerRefund = 0;
    let transporterAmount = carrierFreight;

    if (resolution === 'release_farmer') {
      // 100% payout to farmer (minus 2% platform fee), transporter paid, 0 buyer refund
      farmerAmount = Math.round((grossAmount * 0.98) * 100) / 100;
      buyerRefund = 0;
    } else if (resolution === 'refund_buyer') {
      // 100% refund to buyer, 0 to farmer. Transporter receives compensation if already mobilized
      buyerRefund = grossAmount;
      farmerAmount = 0;
    } else if (resolution === 'partial_settlement') {
      // Support percentage-based or exact custom amounts
      if (customBuyerRefund !== undefined && customFarmerAmount !== undefined) {
        buyerRefund = Number(customBuyerRefund);
        farmerAmount = Number(customFarmerAmount);
        if (customCarrierAmount !== undefined) {
          transporterAmount = Number(customCarrierAmount);
        }
      } else {
        // Use acceptedPercentage (damage claim %: e.g. 30% damaged -> 30% refund, 70% to farmer)
        const damagePercent = Math.min(100, Math.max(0, Number(acceptedPercentage || order.dispute?.claimedPercentage || 50)));
        buyerRefund = Math.round((grossAmount * (damagePercent / 100)) * 100) / 100;
        const farmerGrossShare = grossAmount - buyerRefund;
        farmerAmount = Math.round((farmerGrossShare * 0.98) * 100) / 100; // 2% fee on farmer's net share
      }
    } else if (resolution === 'dismiss') {
      // Dismiss buyer's claim: release standard payout to farmer
      farmerAmount = Math.round((grossAmount * 0.98) * 100) / 100;
      buyerRefund = 0;
    }

    const payoutResult = await disburseEscrowPayout({
      orderId: id,
      resolvedBy: `admin_adjudication_${resolution}`,
      customSplits: {
        farmerAmount,
        transporterAmount,
        buyerRefund,
        reason: adminNotes || `Admin adjudicated resolution: ${resolution}`,
      },
    });

    const resolutionLog = `\n[ADMIN ADJUDICATION: ${resolution.toUpperCase()}] Buyer Refund: ₹${buyerRefund}, Farmer: ₹${farmerAmount}, Transporter: ₹${transporterAmount}. ${adminNotes ? 'Notes: ' + adminNotes : ''} (${new Date().toISOString()})`;
    const updatedNotes = order.notes ? `${order.notes}${resolutionLog}` : resolutionLog;

    await prisma.order.update({
      where: { id },
      data: { notes: updatedNotes },
    });

    res.json({
      success: true,
      message: `Dispute resolved successfully as ${resolution}`,
      result: payoutResult,
    });
  } catch (err) {
    console.error('[ADMIN/DISPUTE-RESOLVE]', err);
    res.status(500).json({ error: 'Failed to adjudicate dispute' });
  }
});

// ─── POST /admin/orders/check-auto-release ─────────────────────────────
// Trigger 48-hour timeout auto-settlement worker manually or via scheduler
router.post('/orders/check-auto-release', async (_req: Request, res: Response): Promise<void> => {
  try {
    const results = await processAutoSettlementTimeouts();
    res.json({
      success: true,
      message: `Processed ${results.autoSettledCount} auto-settlement order timeouts`,
      settlements: results,
    });
  } catch (err) {
    console.error('[ADMIN/AUTO-RELEASE]', err);
    res.status(500).json({ error: 'Failed to process auto-settlements' });
  }
});

export default router;
