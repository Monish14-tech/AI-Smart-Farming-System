import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import Razorpay from 'razorpay';
import prisma from '../lib/prisma';
import { holdOrderFundsInEscrow } from '../lib/escrowPaymentService';

const router = Router();

import path from 'path';
import dotenv from 'dotenv';

// Ensure .env is loaded whether run from workspace or root directory
if (!process.env.RAZORPAY_KEY_ID) {
  dotenv.config({ path: path.resolve(__dirname, '../../.env') });
  dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
  dotenv.config({ path: path.resolve(process.cwd(), '.env') });
  dotenv.config({ path: path.resolve(process.cwd(), 'backend/.env') });
}

// Lazy or dynamic Razorpay initialization with environment variables
function getRazorpayClient(): Razorpay {
  let key_id = process.env.RAZORPAY_KEY_ID;
  let key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    // Retry loading env files directly
    dotenv.config({ path: path.resolve(__dirname, '../../.env') });
    dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
    key_id = process.env.RAZORPAY_KEY_ID;
    key_secret = process.env.RAZORPAY_KEY_SECRET;
  }

  if (!key_id || !key_secret) {
    throw new Error('Razorpay API keys not configured. Please ensure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are set in your .env file and restart your server.');
  }

  return new Razorpay({
    key_id,
    key_secret,
  });
}

// ─── GET /config - Public key for frontend ────────────────────────────
router.get('/config', (_req: Request, res: Response): void => {
  res.json({
    key_id: process.env.RAZORPAY_KEY_ID || '',
    currency: 'INR',
  });
});

// ─── POST /create-order - Create a Razorpay Order ─────────────────────
router.post('/create-order', async (req: Request, res: Response): Promise<void> => {
  try {
    const { amount, currency = 'INR', receipt, notes, orderId } = req.body;

    if (!amount || typeof amount !== 'number') {
      res.status(400).json({ error: 'Valid amount in paise is required (number)' });
      return;
    }

    // Minimum amount: 100 paise (₹1.00) as required by Razorpay
    if (amount < 100) {
      res.status(400).json({ error: 'Amount must be at least 100 paise (₹1.00)' });
      return;
    }

    const razorpay = getRazorpayClient();

    // Razorpay receipt limit is max 40 alphanumeric/underscore characters
    const cleanOrderId = orderId ? String(orderId).replace(/[^a-zA-Z0-9]/g, '').slice(-16) : '';
    const safeReceipt = (receipt ? String(receipt) : (cleanOrderId ? `rcpt_${cleanOrderId}` : `rcpt_${Date.now()}`)).slice(0, 40);

    const options = {
      amount: Math.round(amount),
      currency: currency.toUpperCase(),
      receipt: safeReceipt,
      notes: {
        ...(notes || {}),
        ...(orderId ? { platformOrderId: String(orderId) } : {}),
      },
    };

    const order = await razorpay.orders.create(options);

    res.status(200).json({
      success: true,
      order_id: order.id,
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      key_id: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err: any) {
    console.error('[RAZORPAY/CREATE-ORDER]', err);
    const detailMsg = err.error?.description || err.message || 'Razorpay order creation failed';
    if (err.statusCode === 401 || err.error?.code === 'BAD_REQUEST_ERROR') {
      res.status(err.statusCode || 400).json({
        error: detailMsg,
      });
      return;
    }
    res.status(500).json({
      error: detailMsg,
      details: detailMsg,
    });
  }
});

// ─── POST /verify-payment - Verify HMAC-SHA256 signature ─────────────
router.post('/verify-payment', async (req: Request, res: Response): Promise<void> => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, orderId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      res.status(400).json({
        success: false,
        error: 'Missing required verification fields: razorpay_order_id, razorpay_payment_id, and razorpay_signature are all required',
      });
      return;
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      res.status(500).json({ success: false, error: 'Server configuration error: RAZORPAY_KEY_SECRET is missing' });
      return;
    }

    // Algorithm: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    // Constant-time comparison to prevent timing attacks
    const expectedBuffer = Buffer.from(expectedSignature);
    const signatureBuffer = Buffer.from(razorpay_signature);

    let isMatch = false;
    if (expectedBuffer.length === signatureBuffer.length) {
      isMatch = crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
    }

    if (!isMatch) {
      res.status(400).json({
        success: false,
        error: 'Payment verification failed: Invalid cryptographic signature',
      });
      return;
    }

    // If orderId is linked, lock funds in Escrow and update order status
    let updatedOrder = null;
    if (orderId) {
      try {
        const order = await prisma.order.findUnique({ where: { id: orderId } });
        if (order) {
          updatedOrder = await prisma.order.update({
            where: { id: orderId },
            data: {
              paymentStatus: 'escrowed',
              paymentId: razorpay_payment_id,
            },
          });

          // Ensure escrow ledger records the transaction
          await holdOrderFundsInEscrow({
            orderId: order.id,
            totalPrice: order.totalPrice,
            buyerId: order.buyerId,
          }).catch(escErr => {
            console.warn('[ESCROW/HOLD_NOTE]', escErr.message);
          });
        }
      } catch (dbErr: any) {
        console.warn('[DB/ORDER_UPDATE_NOTE]', dbErr.message);
      }
    }

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully ✓',
      payment_id: razorpay_payment_id,
      order_id: razorpay_order_id,
      order: updatedOrder,
    });
  } catch (err: any) {
    console.error('[RAZORPAY/VERIFY-PAYMENT]', err);
    res.status(500).json({
      success: false,
      error: 'Internal error during payment verification',
      details: err.message,
    });
  }
});

export default router;
