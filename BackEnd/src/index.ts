import express, { Application, Request, Response, NextFunction } from 'express';
import pool from './config/database';
import './config/passport';
import passport from 'passport';
import dotenv from 'dotenv';
import authRouter from './routes/auth.route';
import { errorHandler } from './middlewares/errorHandler';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import cors from 'cors';
import { startCleanupRefreshTokensJob } from './jobs/cleanupRefreshTokens.job';
dotenv.config();
const app: Application = express();
const PORT = process.env.PORT || 3000;
app.use(helmet());
app.use(
  cors({
    // Security: only allow configured frontend origin for credentialed requests.
    origin: process.env.FRONTEND_URL || 'http://localhost:3001',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 600,
  }),
);
app.use(express.json());
app.use(cookieParser());
app.use(passport.initialize());
// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${req.method} ${req.path}`);
  next();
});
app.use('/api/auth', authRouter);
// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    message: 'Backend is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});
// Database connection test
app.get('/api/db-test', async (req: Request, res: Response) => {
  // Security: prevent production/staging exposure of internal DB diagnostics.
  if (process.env.NODE_ENV !== 'development') {
    return res.status(404).json({
      status: 'error',
      message: 'Route not found',
    });
  }

  try {
    const result = await pool.query(
      'SELECT NOW() as current_time, current_database() as database',
    );
    res.json({
      status: 'ok',
      dbConnected: true,
      timestamp: result.rows[0].current_time,
      database: result.rows[0].database,
    });
  } catch (error: any) {
    console.error('Database test error:', error);
    res.status(500).json({
      status: 'error',
      dbConnected: false,
      error: error.message,
    });
  }
});
// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
    path: req.path,
  });
});

app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM signal received: closing HTTP server');
  cleanupJob?.stop();
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT signal received: closing HTTP server');
  cleanupJob?.stop();
  await pool.end();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🗄️  Database test: http://localhost:${PORT}/api/db-test`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
const cleanupJob =
  process.env.NODE_ENV === 'test' ? null : startCleanupRefreshTokensJob();