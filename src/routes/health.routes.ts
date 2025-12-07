// ═══════════════════════════════════════════════════════════════
// HEALTH CHECK ROUTES
// Advanced health monitoring endpoints
// ═══════════════════════════════════════════════════════════════

import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import redis from '../config/redis.config'; // ⬅️ CAMBIO: usar redis principal
import cacheService from '../services/cache.service'; // ⬅️ NUEVO: usar CacheService
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

  // ═══════════════════════════════════════════════════════════
  // Check Database
  // ═══════════════════════════════════════════════════════════
  let dbStatus = 'unknown';
  let dbLatency = 0;
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatency = Date.now() - dbStart;
    dbStatus = dbLatency < 100 ? 'healthy' : dbLatency < 500 ? 'slow' : 'degraded';
  } catch (error) {
    dbStatus = 'unhealthy';
  }

  // ═══════════════════════════════════════════════════════════
  // Check Redis (usando CacheService)
  // ═══════════════════════════════════════════════════════════
  let redisStatus = 'unknown';
  let redisLatency = 0;

  try {
    // Verificar si Redis está disponible
    if (redis && redis.status === 'ready') {
      const redisStart = Date.now();
      const pingResult = await cacheService.ping();
      redisLatency = Date.now() - redisStart;

      if (pingResult) {
        redisStatus = redisLatency < 50 ? 'healthy' : redisLatency < 200 ? 'slow' : 'degraded';
      } else {
        redisStatus = 'unhealthy';
      }
    } else if (redis && redis.status === 'connecting') {
      redisStatus = 'connecting';
    } else if (redis && redis.status === 'reconnecting') {
      redisStatus = 'reconnecting';
    } else {
      redisStatus = 'disconnected';
    }
  } catch (error: any) {
    console.error('Health check Redis error:', error.message);
    redisStatus = 'error';
  }

  // ═══════════════════════════════════════════════════════════
  // System Info
  // ═══════════════════════════════════════════════════════════
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const memoryUsagePercent = ((usedMemory / totalMemory) * 100).toFixed(2);

  const cpus = os.cpus();
  const loadAverage = os.loadavg();

  // ═══════════════════════════════════════════════════════════
  // Overall Status
  // ═══════════════════════════════════════════════════════════
  const isHealthy =
    dbStatus === 'healthy' && (redisStatus === 'healthy' || redisStatus === 'disconnected'); // Redis es opcional

  const isDegraded = dbStatus === 'slow' || redisStatus === 'slow' || redisStatus === 'connecting';

  const overallStatus = isHealthy ? 'healthy' : isDegraded ? 'degraded' : 'unhealthy';
  const statusCode = isHealthy ? 200 : isDegraded ? 200 : 503;

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
        provider: 'Neon',
      },
      cache: {
        status: redisStatus,
        latency:
          redisStatus !== 'disconnected' && redisStatus !== 'connecting'
            ? `${redisLatency}ms`
            : 'N/A',
        type: 'Redis',
        provider: 'Upstash',
        optional: true, // Indicar que es opcional
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
// Readiness Check (para Kubernetes/Render)
// ─────────────────────────────────────────────────────────────

router.get('/health/ready', async (_req: Request, res: Response) => {
  try {
    // Verificar que DB esté disponible (requisito mínimo)
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
      message: 'Service is ready to accept traffic',
    });
  } catch (error) {
    res.status(503).json({
      status: 'not_ready',
      message: 'Database not available',
      timestamp: new Date().toISOString(),
    });
  }
});

// ─────────────────────────────────────────────────────────────
// Liveness Check (para Kubernetes/Render)
// ─────────────────────────────────────────────────────────────

router.get('/health/live', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    message: 'Service is alive',
  });
});

// ─────────────────────────────────────────────────────────────
// Redis-specific health check (debug endpoint)
// ─────────────────────────────────────────────────────────────

router.get('/health/redis', async (_req: Request, res: Response) => {
  try {
    const stats = cacheService.getStats();
    const pingResult = await cacheService.ping();

    const info = redis
      ? {
          status: redis.status,
          available: stats.available,
          pingResult,
          connectionStatus: redis.status,
        }
      : {
          status: 'not_configured',
          available: false,
          message: 'Redis not configured (REDIS_URL missing)',
        };

    res.status(200).json({
      redis: info,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
