import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'socket.io';

import authRoutes from './routes/auth';
import farmerRoutes from './routes/farmer';
import buyerRoutes from './routes/buyer';
import transporterRoutes from './routes/transporter';
import adminRoutes from './routes/admin';
import aiRoutes from './routes/ai';

const app = express();
const httpServer = createServer(app);

// ─── Socket.io setup ──────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// Store io globally for use in routes
(global as any).__io = io;

io.on('connection', (socket) => {
  console.log(`[WS] Client connected: ${socket.id}`);

  socket.on('join:transporter', (transporterId: string) => {
    socket.join(`transporter:${transporterId}`);
  });

  socket.on('join:order', (orderId: string) => {
    socket.join(`order:${orderId}`);
  });

  socket.on('disconnect', () => {
    console.log(`[WS] Client disconnected: ${socket.id}`);
  });
});

// ─── Middleware ────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Health check ──────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'AgriNova API', timestamp: new Date().toISOString() });
});

// ─── Routes ────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/farmer', farmerRoutes);
app.use('/api/buyer', buyerRoutes);
app.use('/api/transporter', transporterRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai', aiRoutes);

// ─── 404 handler ──────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─── Global error handler ──────────────────────────────────────────────
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[ERROR]', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Start server ──────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════╗
║        AgriNova API Server               ║
║  Running on http://localhost:${PORT}        ║
║  Environment: ${process.env.NODE_ENV?.padEnd(10)}             ║
╚══════════════════════════════════════════╝
  `);
});

export { io };
