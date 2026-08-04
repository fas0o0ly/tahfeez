// src/app.js
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const authRoutes       = require('./routes/authRoutes');
const userRoutes       = require('./routes/userRoutes');
const profileRoutes    = require('./routes/profileRoutes');
const sessionRoutes    = require('./routes/sessionRoutes');
const agoraRoutes      = require('./routes/agoraRoutes');
const quranRoutes      = require('./routes/quranRoutes');
const assessmentRoutes  = require('./routes/assessmentRoutes');
const attendanceRoutes    = require('./routes/attendanceRoutes');
const progressRoutes      = require('./routes/progressRoutes');
const messageRoutes       = require('./routes/messageRoutes');
const notificationRoutes  = require('./routes/notificationRoutes');
const reportingRoutes     = require('./routes/reportingRoutes');
const certificateRoutes   = require('./routes/certificateRoutes');
const chatbotRoutes       = require('./routes/chatbotRoutes');

const { errorHandler } = require('./middleware/errorHandler');
const { success, notFound } = require('./utils/response');
const logger = require('./utils/logger');

const app = express();

// ─── Trust proxy (Railway / Vercel deployment) ─────────────────────────────
app.set('trust proxy', 1);

// ─── Security headers ──────────────────────────────────────────────────────
app.use(
  helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production',
    crossOriginEmbedderPolicy: false,
  })
);

// ─── CORS ──────────────────────────────────────────────────────────────────
const isDev = process.env.NODE_ENV !== 'production';

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (server-to-server, curl, etc.)
      if (!origin) return callback(null, true);

      // In development, allow any localhost port
      if (isDev && /^http:\/\/localhost(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }

      // In production, check explicit allow-list
      const allowedOrigins = [process.env.FRONTEND_URL].filter(Boolean);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ─── Rate limiters ─────────────────────────────────────────────────────────

// General limiter for non-auth routes
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Slow down.' },
});

app.use(generalLimiter);

// ─── Body parsing ──────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ─── HTTP request logging ──────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(
    morgan('combined', {
      stream: { write: (msg) => logger.http(msg.trim()) },
      skip: (req) => req.url === '/api/health' || req.path === '/api/auth/verify-email',
    })
  );
}

// ─── Health check ──────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  return success(res, {
    status: 'ok',
    timestamp: new Date().toISOString(),
  }, 'Server is healthy');
});

// ─── API routes ────────────────────────────────────────────────────────────
app.use('/api/auth',        authRoutes);
app.use('/api/users',       userRoutes);
app.use('/api/profile',     profileRoutes);
app.use('/api/sessions',    sessionRoutes);
app.use('/api/sessions',    agoraRoutes);
app.use('/api/quran',       quranRoutes);
app.use('/api/assessments', assessmentRoutes);
app.use('/api/attendance',     attendanceRoutes);
app.use('/api/progress',       progressRoutes);
app.use('/api/messages',       messageRoutes);
app.use('/api/notifications',  notificationRoutes);
app.use('/api/reports',        reportingRoutes);
app.use('/api/certificates',   certificateRoutes);
app.use('/api/chatbot',        chatbotRoutes);

// ─── 404 handler ──────────────────────────────────────────────────────────
app.use((req, res) => {
  return notFound(res, `Route ${req.method} ${req.originalUrl} not found`);
});

// ─── Global error handler ──────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;