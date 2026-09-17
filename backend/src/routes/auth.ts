import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { generateTokens, JwtPayload, Role, authenticate } from '../middleware/auth';
import rateLimit from 'express-rate-limit';
import { generateSecureOtp, timingSafeOtpEqual } from '../lib/otpService';
import { sendWelcomeEmail, sendPasswordResetOtpEmail } from '../lib/emailService';

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

    // Trigger automated welcome onboarding email (fire-and-forget)
    sendWelcomeEmail({
      to: user.email,
      name: user.name,
      role: user.role,
    }).catch((mailErr) => console.error('[AUTH/WELCOME_MAIL]', mailErr));

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

// ─── In-memory Password Reset OTP Store (15-min validity) ───────────
interface PasswordResetEntry {
  otp: string;
  expiresAt: Date;
  attempts: number;
}
const passwordResetStore = new Map<string, PasswordResetEntry>();

// Clean up expired tokens periodically
setInterval(() => {
  const now = new Date();
  for (const [email, entry] of passwordResetStore.entries()) {
    if (entry.expiresAt < now) {
      passwordResetStore.delete(email);
    }
  }
}, 5 * 60 * 1000);

// ─── POST /auth/forgot-password ──────────────────────────────────────
const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email('Please enter a valid email address'),
});

router.post('/forgot-password', authLimiter, async (req: Request, res: Response): Promise<void> => {
  const parsed = forgotPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid email format' });
    return;
  }

  const { email } = parsed.data;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Return success to avoid email enumeration
      res.json({ message: 'If an account exists with this email, a 6-digit reset code has been sent.' });
      return;
    }

    // Generate cryptographically secure 6-digit numeric OTP
    const otp = generateSecureOtp(6);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    // Prevent memory exhaustion: cap in-memory store size
    if (passwordResetStore.size > 5000) {
      const firstKey = passwordResetStore.keys().next().value;
      if (firstKey) passwordResetStore.delete(firstKey);
    }

    passwordResetStore.set(email, { otp, expiresAt, attempts: 0 });

    console.log(`\n🔑 [AUTH] Password reset OTP generated for ${email}: ${otp} (expires in 15m)`);

    // Dispatch automated password reset email
    sendPasswordResetOtpEmail({
      to: email,
      name: user.name,
      otp,
    }).catch((mailErr) => console.error('[AUTH/RESET_MAIL]', mailErr));

    res.json({
      message: 'If an account exists with this email, a 6-digit reset code has been sent.',
      email,
      devOtp: process.env.NODE_ENV !== 'production' ? otp : undefined,
    });
  } catch (err) {
    console.error('[AUTH/FORGOT-PASSWORD]', err);
    res.status(500).json({ error: 'Failed to process password reset request' });
  }
});

// ─── POST /auth/reset-password ───────────────────────────────────────
const resetPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email('Please enter a valid email address'),
  otp: z.string().trim().length(6, 'Reset code must be 6 digits'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

router.post('/reset-password', authLimiter, async (req: Request, res: Response): Promise<void> => {
  const parsed = resetPasswordSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid parameters' });
    return;
  }

  const { email, otp, newPassword } = parsed.data;

  try {
    const entry = passwordResetStore.get(email);
    if (!entry) {
      res.status(400).json({ error: 'No active reset request found or OTP has expired. Please request a new code.' });
      return;
    }

    if (entry.expiresAt < new Date()) {
      passwordResetStore.delete(email);
      res.status(400).json({ error: 'Reset code has expired. Please request a new one.' });
      return;
    }

    // Timing-safe constant time comparison to prevent timing side-channel attacks
    if (!timingSafeOtpEqual(entry.otp, otp)) {
      entry.attempts += 1;
      if (entry.attempts >= 5) {
        passwordResetStore.delete(email);
        res.status(400).json({ error: 'Too many incorrect attempts. Please request a new code.' });
        return;
      }
      res.status(400).json({ error: `Invalid reset code. ${5 - entry.attempts} attempt(s) remaining.` });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    });

    // Invalidate existing sessions
    await prisma.refreshToken.deleteMany({ where: { userId: user.id } }).catch(() => {});
    passwordResetStore.delete(email);

    res.json({ message: 'Password has been reset successfully. You can now log in with your new password.' });
  } catch (err) {
    console.error('[AUTH/RESET-PASSWORD]', err);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// ─── PUT /auth/profile - update user profile ─────────────────────────
const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(150).optional(),
  phone: z.string().trim().transform(val => val.replace(/[\s\-\+]/g, '')).refine(val => /^\d{10,15}$/.test(val), {
    message: 'Please enter a valid 10-digit mobile number',
  }).optional(),
  address: z.string().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  // Farmer specific
  farmSizeAcres: z.number().nullable().optional(),
  upiId: z.string().nullable().optional(),
  bankAccount: z.string().nullable().optional(),
  ifscCode: z.string().nullable().optional(),
  aadhaarNumber: z.string().nullable().optional(),
  landDocUrl: z.string().nullable().optional(),
  // Transporter specific
  vehicleType: z.string().nullable().optional(),
  vehicleCapacityKg: z.number().nullable().optional(),
  vehicleNumber: z.string().nullable().optional(),
  licenseNumber: z.string().nullable().optional(),
  licenseDocUrl: z.string().nullable().optional(),
});

router.put('/profile', authenticate, async (req: Request, res: Response): Promise<void> => {
  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.issues[0]?.message || 'Validation failed', details: parsed.error.flatten() });
    return;
  }

  const {
    name, phone, address, latitude, longitude,
    farmSizeAcres, upiId, bankAccount, ifscCode, aadhaarNumber, landDocUrl,
    vehicleType, vehicleCapacityKg, vehicleNumber, licenseNumber, licenseDocUrl,
  } = parsed.data;

  try {
    const userId = req.user!.userId;

    // Check if phone changed and belongs to another user
    if (phone) {
      const existingPhone = await prisma.user.findFirst({
        where: { phone, NOT: { id: userId } },
      });
      if (existingPhone) {
        res.status(409).json({ error: 'This phone number is already registered to another account' });
        return;
      }
    }

    // Update user base info
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(phone && { phone }),
        ...(address !== undefined && { address }),
        ...(latitude !== undefined && { latitude }),
        ...(longitude !== undefined && { longitude }),
      },
      include: { farmerProfile: true, transporterProfile: true },
    });

    // Update Farmer Profile if applicable
    if (updatedUser.role === 'farmer') {
      const hasFarmerKycChange =
        landDocUrl !== undefined ||
        bankAccount !== undefined ||
        ifscCode !== undefined ||
        upiId !== undefined ||
        aadhaarNumber !== undefined ||
        farmSizeAcres !== undefined;

      await prisma.farmerProfile.upsert({
        where: { userId },
        create: {
          userId,
          farmSizeAcres: farmSizeAcres ?? null,
          upiId: upiId ?? null,
          bankAccount: bankAccount ?? null,
          ifscCode: ifscCode ?? null,
          aadhaarNumber: aadhaarNumber ?? null,
          landDocUrl: landDocUrl ?? null,
        },
        update: {
          ...(farmSizeAcres !== undefined && { farmSizeAcres }),
          ...(upiId !== undefined && { upiId }),
          ...(bankAccount !== undefined && { bankAccount }),
          ...(ifscCode !== undefined && { ifscCode }),
          ...(aadhaarNumber !== undefined && { aadhaarNumber }),
          ...(landDocUrl !== undefined && { landDocUrl }),
        },
      });

      // Every time farmer edits documents or bank details, reset isVerified to false for admin re-verification
      if (hasFarmerKycChange) {
        await prisma.user.update({
          where: { id: userId },
          data: { isVerified: false },
        });
      }
    }

    // Update Transporter Profile if applicable
    if (updatedUser.role === 'transporter') {
      const hasTransporterKycChange =
        vehicleType !== undefined ||
        vehicleCapacityKg !== undefined ||
        vehicleNumber !== undefined ||
        licenseNumber !== undefined ||
        licenseDocUrl !== undefined;

      await prisma.transporterProfile.upsert({
        where: { userId },
        create: {
          userId,
          vehicleType: vehicleType ?? null,
          vehicleCapacityKg: vehicleCapacityKg ?? null,
          vehicleNumber: vehicleNumber ?? null,
          licenseNumber: licenseNumber ?? null,
          licenseDocUrl: licenseDocUrl ?? null,
        },
        update: {
          ...(vehicleType !== undefined && { vehicleType }),
          ...(vehicleCapacityKg !== undefined && { vehicleCapacityKg }),
          ...(vehicleNumber !== undefined && { vehicleNumber }),
          ...(licenseNumber !== undefined && { licenseNumber }),
          ...(licenseDocUrl !== undefined && { licenseDocUrl }),
        },
      });

      // Every time transporter edits vehicle or license details, reset isVerified to false for admin re-verification
      if (hasTransporterKycChange) {
        await prisma.user.update({
          where: { id: userId },
          data: { isVerified: false },
        });
      }
    }

    const refreshed = await prisma.user.findUnique({
      where: { id: userId },
      include: { farmerProfile: true, transporterProfile: true },
    });

    const { passwordHash: _, ...userWithoutPassword } = refreshed!;
    res.json({ user: userWithoutPassword, message: 'Profile updated successfully' });
  } catch (err) {
    console.error('[AUTH/PROFILE PUT]', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;
