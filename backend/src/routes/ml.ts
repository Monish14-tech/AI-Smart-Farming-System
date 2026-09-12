import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import prisma from '../lib/prisma';
import {
  predictCropFairPrice,
  evaluateListingDeal,
  getBestCropsForBuyer,
  getOptimalPriceForFarmer,
  getHighDemandCropsForFarmer,
  predictFreightRate
} from '../lib/mlEngine';

const router = Router();
router.use(authenticate);

// ─── 1. BUYER ML ENDPOINTS ───────────────────────────────────────────

/**
 * GET /ml/buyer/deals
 * Evaluates all active listings and attaches ML deal ratings & badges
 */
router.get('/buyer/deals', async (req: Request, res: Response): Promise<void> => {
  try {
    const listings = await prisma.cropListing.findMany({
      where: { status: 'active' },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        farmer: {
          select: { id: true, name: true, address: true }
        }
      }
    });

    const evaluated = listings.map(l => {
      const deal = evaluateListingDeal(l);
      return {
        ...l,
        mlDeal: deal
      };
    });

    // Count statistics
    const greatDeals = evaluated.filter(e => e.mlDeal.dealRating === 'GREAT_DEAL').length;
    const fairDeals = evaluated.filter(e => e.mlDeal.dealRating === 'FAIR_PRICE').length;

    res.json({
      listings: evaluated,
      summary: {
        totalEvaluated: evaluated.length,
        greatDealsCount: greatDeals,
        fairDealsCount: fairDeals
      }
    });
  } catch (err) {
    console.error('[ML/BUYER/DEALS]', err);
    res.status(500).json({ error: 'Failed to evaluate marketplace deals' });
  }
});

/**
 * GET /ml/buyer/recommendations
 * Recommends top best-value crops to buy based on abundance, price drop vs historical, and quality
 */
router.get('/buyer/recommendations', async (_req: Request, res: Response): Promise<void> => {
  try {
    const recommendations = await getBestCropsForBuyer();
    res.json({ recommendations });
  } catch (err) {
    console.error('[ML/BUYER/RECOMMENDATIONS]', err);
    res.status(500).json({ error: 'Failed to compute crop recommendations' });
  }
});

/**
 * GET /ml/buyer/fair-price
 * Predicts fair baseline price for any crop
 */
router.get('/buyer/fair-price', (req: Request, res: Response): void => {
  const { cropName = 'Tomato', grade = 'B', quantityKg = '100' } = req.query as Record<string, string>;
  const prediction = predictCropFairPrice(cropName, grade, parseFloat(quantityKg) || 100);
  res.json({ prediction });
});

// ─── 2. FARMER ML ENDPOINTS ──────────────────────────────────────────

/**
 * GET /ml/farmer/price-recommendation
 * Provides smart selling price guidance for a farmer listing produce
 */
router.get('/farmer/price-recommendation', async (req: Request, res: Response): Promise<void> => {
  const { cropName = 'Tomato', grade = 'A', quantityKg = '500' } = req.query as Record<string, string>;
  try {
    const recommendation = await getOptimalPriceForFarmer(
      cropName,
      grade,
      parseFloat(quantityKg) || 500
    );
    res.json({ recommendation });
  } catch (err) {
    console.error('[ML/FARMER/PRICE]', err);
    res.status(500).json({ error: 'Failed to generate price recommendation' });
  }
});

/**
 * GET /ml/farmer/crop-demand
 * Recommends top crops to plant/sell based on buyer demand velocity and price margins
 */
router.get('/farmer/crop-demand', async (_req: Request, res: Response): Promise<void> => {
  try {
    const crops = await getHighDemandCropsForFarmer();
    res.json({ crops });
  } catch (err) {
    console.error('[ML/FARMER/DEMAND]', err);
    res.status(500).json({ error: 'Failed to compute crop demand forecast' });
  }
});

// ─── 3. TRANSPORTER ML ENDPOINTS ─────────────────────────────────────

/**
 * GET /ml/transporter/rate-suggestion
 * Dynamic freight quote calculation based on distance, cargo weight, and crop perishability
 */
router.get('/ml/transporter/rate-suggestion', async (req: Request, res: Response): Promise<void> => {
  const { distanceKm, cargoWeightKg, cropName, vehicleType, jobId } = req.query as Record<string, string>;

  try {
    let dist = parseFloat(distanceKm) || 50;
    let weight = parseFloat(cargoWeightKg) || 500;
    let crop = cropName || 'Tomato';

    // If a jobId is provided, pull real details from the database
    if (jobId) {
      const job = await prisma.transportJob.findUnique({
        where: { id: jobId },
        include: { order: { include: { listing: true } } }
      });
      if (job) {
        weight = job.order.quantityKg;
        crop = job.order.listing.cropName;
        if (job.estimatedKm) {
          dist = job.estimatedKm;
        } else if (job.pickupLat && job.dropLat && job.pickupLng && job.dropLng) {
          // Approximate Haversine distance
          const R = 6371;
          const dLat = ((job.dropLat - job.pickupLat) * Math.PI) / 180;
          const dLng = ((job.dropLng - job.pickupLng) * Math.PI) / 180;
          const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos((job.pickupLat * Math.PI) / 180) *
            Math.cos((job.dropLat * Math.PI) / 180) *
            Math.sin(dLng / 2) ** 2;
          dist = Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 1.2); // 1.2x road routing factor
        }
      }
    }

    const suggestion = predictFreightRate({
      distanceKm: dist,
      cargoWeightKg: weight,
      cropName: crop,
      vehicleType
    });

    res.json({ suggestion });
  } catch (err) {
    console.error('[ML/TRANSPORTER/RATE]', err);
    res.status(500).json({ error: 'Failed to compute transport rate suggestion' });
  }
});

export default router;
