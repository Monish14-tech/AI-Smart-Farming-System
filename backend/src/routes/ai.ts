import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { authenticate } from '../middleware/auth';
import { getChatModel } from '../lib/gemini';

const router = Router();
router.use(authenticate);

const chatSchema = z.object({
  message: z.string().min(1).max(2000),
  contextType: z.enum(['advisory', 'marketplace_search', 'support']),
  history: z.array(z.object({ role: z.enum(['user', 'model']), parts: z.array(z.object({ text: z.string() })) })).optional(),
});

// ─── POST /ai/chat ────────────────────────────────────────────────────
router.post('/chat', async (req: Request, res: Response): Promise<void> => {
  const parsed = chatSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }

  const { message, contextType, history = [] } = parsed.data;

  try {
    // For marketplace_search, enrich context with real listings (RAG)
    let ragContext = '';
    if (contextType === 'marketplace_search') {
      const listings = await prisma.cropListing.findMany({
        where: { status: 'active' },
        take: 15,
        orderBy: { createdAt: 'desc' },
        include: { farmer: { select: { name: true, address: true } } },
      });

      ragContext = `\n\nCurrent available listings on AgriNova marketplace:\n` +
        listings.map(l =>
          `- ${l.cropName} (Grade ${l.qualityGrade ?? 'N/A'}): ${l.quantityKg}kg at ₹${l.pricePerKg}/kg from ${l.farmer.name} in ${l.farmer.address ?? 'India'}. ID: ${l.id}`
        ).join('\n');
    }

    // For advisory bot, add weather context
    let weatherContext = '';
    if (contextType === 'advisory') {
      try {
        const weatherRes = await fetch(
          'https://api.open-meteo.com/v1/forecast?latitude=20.5937&longitude=78.9629&current=temperature_2m,precipitation,weathercode&timezone=Asia%2FKolkata',
          { signal: AbortSignal.timeout(3000) }
        );
        if (weatherRes.ok) {
          const weather = await weatherRes.json() as any;
          weatherContext = `\n\nCurrent weather in India (avg): ${weather.current?.temperature_2m}°C, precipitation: ${weather.current?.precipitation}mm`;
        }
      } catch { /* ignore weather errors */ }
    }

    const model = getChatModel(contextType);
    const chat = model.startChat({ history });

    const enrichedMessage = message + ragContext + weatherContext;
    const result = await chat.sendMessage(enrichedMessage);
    const reply = result.response.text();

    // Store in chat_logs
    await prisma.chatLog.createMany({
      data: [
        { userId: req.user!.userId, role: 'user', message, contextType },
        { userId: req.user!.userId, role: 'assistant', message: reply, contextType },
      ],
    });

    res.json({ reply, contextType });
  } catch (err) {
    console.error('[AI/CHAT]', err);
    res.status(500).json({ error: 'AI service temporarily unavailable. Please try again.' });
  }
});

// ─── GET /ai/chat/history ─────────────────────────────────────────────
router.get('/chat/history', async (req: Request, res: Response): Promise<void> => {
  const { contextType, limit = '20' } = req.query as Record<string, string>;

  try {
    const logs = await prisma.chatLog.findMany({
      where: {
        userId: req.user!.userId,
        ...(contextType && { contextType }),
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit) * 2,
    });

    res.json({ history: logs.reverse() });
  } catch {
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

// ─── GET /ai/weather ─────────────────────────────────────────────────
router.get('/weather', async (req: Request, res: Response): Promise<void> => {
  const { lat = '20.5937', lng = '78.9629' } = req.query as Record<string, string>;

  try {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weathercode&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode&timezone=Asia%2FKolkata&forecast_days=7`,
      { signal: AbortSignal.timeout(5000) }
    );

    if (!response.ok) throw new Error('Weather API failed');
    const data = await response.json();
    res.json({ weather: data });
  } catch (err: any) {
    console.warn('[AI/WEATHER] Open-Meteo fetch failed:', err.message);
    res.json({
      weather: null,
      message: 'Live weather service temporarily unavailable. Please try again.',
    });
  }
});

export default router;
