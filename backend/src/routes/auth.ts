import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { generateTokens, JwtPayload, Role } from '../middleware/auth';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Too many requests, please try again later' },
  validate: { xForwardedForHeader: false, default: false },
});

// ─── Schemas ────────────────────────────────────────────────────────
const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(150),
  email: z.string().trim().toLowerCase().email('Please enter a valid email address'),
  phone: z.string().trim().transform(val => val.replace(/[\s\-\+]/g, '')).refine(val => /^\d{10,15}$/.test(val), {
    message: 'Please enter a valid 10-digit mobile number',
  }),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['farmer', 'buyer', 'transporter'], { message: 'Please select a valid role' }),
  // Optional role-specific fields
  farmSizeAcres: z.number().nullable().optional(),
  vehicleType: z.string().nullable().optional(),
  vehicleCapacityKg: z.number().nullable().optional(),
  licenseNumber: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

// ─── Register ───────────────────────────────────────────────────────
router.post('/register', authLimiter, async (req: Request, res: Response): Promise<void> => {
  // Sanitize numeric fields if passed as NaN or empty string
  const body = {
    ...req.body,
    email: typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : req.body.email,
    farmSizeAcres: typeof req.body.farmSizeAcres === 'number' && !isNaN(req.body.farmSizeAcres) ? req.body.farmSizeAcres : undefined,
    vehicleCapacityKg: typeof req.body.vehicleCapacityKg === 'number' && !isNaN(req.body.vehicleCapacityKg) ? req.body.vehicleCapacityKg : undefined,
  };

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues[0]?.message || 'Validation failed';
    res.status(400).json({ error: errorMsg, details: parsed.error.flatten() });
    return;
  }

  const { name, email, phone, password, role, farmSizeAcres, vehicleType, vehicleCapacityKg, licenseNumber, address, latitude, longitude } = parsed.data;

  try {
    // Check existing user
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { phone }] },
    });

    if (existing) {
      res.status(409).json({ error: existing.email === email ? 'An account with this email already exists' : 'An account with this mobile number already exists' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        passwordHash,
        role: role as Role,
        address: address ?? null,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        farmerProfile: role === 'farmer' ? {
          create: { farmSizeAcres: farmSizeAcres ?? null },
        } : undefined,
        transporterProfile: role === 'transporter' ? {
          create: {
            vehicleType: vehicleType ?? null,
            vehicleCapacityKg: vehicleCapacityKg ?? null,
            licenseNumber: licenseNumber ?? null,
          },
        } : undefined,
      },
      include: { farmerProfile: true, transporterProfile: true },
    });

    const payload: JwtPayload = { userId: user.id, role: user.role, email: user.email };
    const { accessToken, refreshToken } = generateTokens(payload);

    // Store refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await prisma.refreshToken.create({ data: { userId: user.id, token: refreshToken, expiresAt } });

    const { passwordHash: _, ...userWithoutPassword } = user;
    res.status(201).json({ user: userWithoutPassword, accessToken, refreshToken });
  } catch (err) {
    console.error('[AUTH/REGISTER]', err);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
});

// ─── Login ──────────────────────────────────────────────────────────
router.post('/login', authLimiter, async (req: Request, res: Response): Promise<void> => {
  const body = {
    ...req.body,
    email: typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : req.body.email,
  };

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues[0]?.message || 'Invalid email or password format';
    res.status(400).json({ error: errorMsg, details: parsed.error.flatten() });
    return;
  }

  const { email, password } = parsed.data;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { farmerProfile: true, transporterProfile: true },
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const passwordMatch = await bcrypt.compare(password, user.passwordHash);
    if (!passwordMatch) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const payload: JwtPayload = { userId: user.id, role: user.role, email: user.email };
    const { accessToken, refreshToken } = generateTokens(payload);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await prisma.refreshToken.create({ data: { userId: user.id, token: refreshToken, expiresAt } });

    const { passwordHash: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword, accessToken, refreshToken });
  } catch (err) {
    console.error('[AUTH/LOGIN]', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ─── Refresh Token ──────────────────────────────────────────────────
router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    res.status(400).json({ error: 'Refresh token required' });
    return;
  }

  try {
    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });

    if (!stored || stored.expiresAt < new Date()) {
      res.status(401).json({ error: 'Invalid or expired refresh token' });
      return;
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as JwtPayload;
    const payload: JwtPayload = { userId: decoded.userId, role: decoded.role, email: decoded.email };
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(payload);

    // Rotate refresh token
    await prisma.refreshToken.delete({ where: { token: refreshToken } });
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await prisma.refreshToken.create({ data: { userId: decoded.userId, token: newRefreshToken, expiresAt } });

    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// ─── Logout ─────────────────────────────────────────────────────────
router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } }).catch(() => {});
  }
  res.json({ message: 'Logged out successfully' });
});

// ─── Get Current User ────────────────────────────────────────────────
router.get('/me', async (req: Request, res: Response): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as JwtPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: { farmerProfile: true, transporterProfile: true },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const { passwordHash: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
