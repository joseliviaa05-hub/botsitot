// ═══════════════════════════════════════════════════════════════
// RATE LIMITER MIDDLEWARE
// Rate limiting avanzado con Redis y límites por rol
// ═══════════════════════════════════════════════════════════════

import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redisClient } from '../config/redis.config';
import { Request, Response } from 'express';
import { AuthRequest } from '../types/auth.types';

// ─────────────────────────────────────────────────────────────
// Helper: Verificar si Redis está disponible
// ─────────────────────────────────────────────────────────────

const isRedisAvailable = (): boolean => {
  return redisClient !== null && redisClient.status === 'ready';
};

// ─────────────────────────────────────────────────────────────
// Helper: Determinar límite según rol
// ─────────────────────────────────────────────────────────────

const getRateLimitByRole = (req: Request): number => {
  const authReq = req as AuthRequest;

  // Si está autenticado, verificar rol
  if (authReq.usuario) {
    switch (authReq.usuario.rol) {
      case 'ADMIN':
        return 1000; // 1000 req/15min
      case 'OPERATOR':
        return 500; // 500 req/15min
      case 'VIEWER':
        return 200; // 200 req/15min
      default:
        return 100;
    }
  }

  // No autenticado: límite estricto
  return 100; // 100 req/15min
};

// ─────────────────────────────────────────────────────────────
// Rate Limiter General (15 min window)
// ─────────────────────────────────────────────────────────────

export const generalLimiter = rateLimit({
  store: isRedisAvailable()
    ? new RedisStore({
        // @ts-expect-error - RedisStore acepta el cliente v4
        client: redisClient,
        prefix: 'rl:general:',
      })
    : undefined, // Fallback a memory store si Redis no está disponible

  windowMs: 15 * 60 * 1000, // 15 minutos

  max: (req) => getRateLimitByRole(req), // Límite dinámico por rol

  message: {
    error: 'Too Many Requests',
    message: 'Demasiadas peticiones desde esta IP, intenta de nuevo más tarde.',
    retryAfter: '15 minutos',
  },

  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers

  // Skip successful requests (solo contar fallos)
  skipSuccessfulRequests: false,

  // Skip failed requests
  skipFailedRequests: false,

  // Handler cuando se excede el límite
  handler: (req: Request, res: Response) => {
    const authReq = req as AuthRequest;
    const role = authReq.usuario?.rol || 'anonymous';

    console.warn(`⚠️ Rate limit exceeded: ${role} - ${req.ip} - ${req.method} ${req.path}`);

    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Has excedido el límite de peticiones.  Intenta de nuevo más tarde.',
      retryAfter: Math.ceil(15 * 60), // segundos
      role,
    });
  },
});

// ─────────────────────────────────────────────────────────────
// Auth Rate Limiter (más estricto para login)
// ─────────────────────────────────────────────────────────────

export const authLimiter = rateLimit({
  store: isRedisAvailable()
    ? new RedisStore({
        // @ts-expect-error - RedisStore acepta el cliente v4
        client: redisClient,
        prefix: 'rl:auth:',
      })
    : undefined,

  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // 10 intentos de login por 15 min

  message: {
    error: 'Too Many Login Attempts',
    message: 'Demasiados intentos de inicio de sesión. Intenta de nuevo en 15 minutos.',
  },

  standardHeaders: true,
  legacyHeaders: false,

  skipSuccessfulRequests: true, // Solo contar intentos fallidos

  handler: (req: Request, res: Response) => {
    console.warn(`⚠️ Auth rate limit exceeded: ${req.ip} - ${req.body?.email}`);

    res.status(429).json({
      error: 'Too Many Login Attempts',
      message: 'Demasiados intentos de inicio de sesión. Por seguridad, espera 15 minutos.',
      retryAfter: Math.ceil(15 * 60),
    });
  },
});

// ─────────────────────────────────────────────────────────────
// Strict Limiter (para endpoints sensibles)
// ─────────────────────────────────────────────────────────────

export const strictLimiter = rateLimit({
  store: isRedisAvailable()
    ? new RedisStore({
        // @ts-expect-error - RedisStore acepta el cliente v4
        client: redisClient,
        prefix: 'rl:strict:',
      })
    : undefined,

  windowMs: 60 * 60 * 1000, // 1 hora
  max: 5, // Solo 5 requests por hora

  message: {
    error: 'Too Many Requests',
    message: 'Has excedido el límite para esta acción sensible.',
  },

  standardHeaders: true,
  legacyHeaders: false,

  handler: (req: Request, res: Response) => {
    console.warn(`⚠️ Strict rate limit exceeded: ${req.ip} - ${req.method} ${req.path}`);

    res.status(429).json({
      error: 'Too Many Requests',
      message: 'Esta acción tiene un límite muy estricto.  Intenta de nuevo en 1 hora.',
      retryAfter: Math.ceil(60 * 60),
    });
  },
});

// ─────────────────────────────────────────────────────────────
// API Limiter (más permisivo para APIs públicas)
// ─────────────────────────────────────────────────────────────

export const apiLimiter = rateLimit({
  store: isRedisAvailable()
    ? new RedisStore({
        // @ts-expect-error - RedisStore acepta el cliente v4
        client: redisClient,
        prefix: 'rl:api:',
      })
    : undefined,

  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 60, // 60 requests por minuto

  message: {
    error: 'Too Many Requests',
    message: 'Límite de API excedido. Máximo 60 peticiones por minuto.',
  },

  standardHeaders: true,
  legacyHeaders: false,
});

// ─────────────────────────────────────────────────────────────
// Export default (general limiter)
// ─────────────────────────────────────────────────────────────

export default generalLimiter;
