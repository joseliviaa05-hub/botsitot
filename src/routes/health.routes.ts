// ═══════════════════════════════════════════════════════════════
// HEALTH CHECK ROUTES
// Advanced health monitoring endpoints
// ═══════════════════════════════════════════════════════════════

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { redisClient } from '../config/redis.config';
import os from 'os';
import { env } from '../config/env';

const router = Router();
const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────────
// Basic Health Check
// ─────────────────────────────────────────────────────────────

router.get('/health', async (_req: Request, res: Response) => {
  try {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: env.NODE_ENV,
      version: '2.0.0',
    };

    res.status(200).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'error',
      message: 'Health check failed',
    });
  }
});

// ─────────────────────────────────────────────────────────────
// Detailed Health Check
// ─────────────────────────────────────────────────────────────

router.get('/health/detailed', async (_req: Request, res: Response) => {
  const startTime = Date.now();

  // Check Database
  let dbStatus = 'unknown';
  let dbLatency = 0;
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatency = Date.now() - dbStart;
    dbStatus = dbLatency < 100 ? 'healthy' : 'slow';
  } catch (error) {
    dbStatus = 'unhealthy';
  }

  // Check Redis
  let redisStatus = 'unknown';
  let redisLatency = 0;
  try {
    if (redisClient && redisClient.status === 'ready') {
      const redisStart = Date.now();
      await redisClient.ping();
      redisLatency = Date.now() - redisStart;
      redisStatus = redisLatency < 50 ? 'healthy' : 'slow';
    } else {
      redisStatus = 'disconnected';
    }
  } catch (error) {
    redisStatus = 'unhealthy';
  }

  // System Info
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const memoryUsagePercent = ((usedMemory / totalMemory) * 100).toFixed(2);

  const cpus = os.cpus();
  const loadAverage = os.loadavg();

  // Overall Status
  const isHealthy =
    dbStatus === 'healthy' && (redisStatus === 'healthy' || redisStatus === 'disconnected');
  const overallStatus = isHealthy ? 'healthy' : 'degraded';
  const statusCode = isHealthy ? 200 : 503;

  const responseTime = Date.now() - startTime;

  const healthDetail = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    environment: env.NODE_ENV,
    uptime: {
      process: process.uptime(),
      system: os.uptime(),
    },
    services: {
      database: {
        status: dbStatus,
        latency: `${dbLatency}ms`,
        type: 'PostgreSQL',
      },
      cache: {
        status: redisStatus,
        latency: redisStatus !== 'disconnected' ? `${redisLatency}ms` : 'N/A',
        type: 'Redis',
      },
    },
    system: {
      platform: os.platform(),
      arch: os.arch(),
      nodeVersion: process.version,
      memory: {
        total: `${(totalMemory / 1024 / 1024 / 1024).toFixed(2)} GB`,
        free: `${(freeMemory / 1024 / 1024 / 1024).toFixed(2)} GB`,
        used: `${(usedMemory / 1024 / 1024 / 1024).toFixed(2)} GB`,
        usagePercent: `${memoryUsagePercent}%`,
      },
      cpu: {
        cores: cpus.length,
        model: cpus[0]?.model || 'Unknown',
        loadAverage: {
          '1min': loadAverage[0].toFixed(2),
          '5min': loadAverage[1].toFixed(2),
          '15min': loadAverage[2].toFixed(2),
        },
      },
    },
    performance: {
      responseTime: `${responseTime}ms`,
    },
  };

  res.status(statusCode).json(healthDetail);
});

// ─────────────────────────────────────────────────────────────
// Readiness Check (para Kubernetes/Railway)
// ─────────────────────────────────────────────────────────────

router.get('/health/ready', async (_req: Request, res: Response) => {
  try {
    // Verificar que DB esté disponible
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'not_ready',
      message: 'Database not available',
    });
  }
});

// ─────────────────────────────────────────────────────────────
// Liveness Check (para Kubernetes/Railway)
// ─────────────────────────────────────────────────────────────

router.get('/health/live', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
  });
});

export default router;
