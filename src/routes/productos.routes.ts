// src/routes/productos.routes.ts
/**
 * ═══════════════════════════════════════════════════════════════
 * PRODUCTOS ROUTES - Con autenticación, autorización y rate limiting
 * ═══════════════════════════════════════════════════════════════
 */

import { Router } from 'express';
import productosController from '../controllers/productos.controller';
import { generalLimiter, flexibleLimiter } from '../middleware/rateLimiter';
import {
  authenticateToken,
  operatorOrAdmin,
  authenticated,
} from '../middleware/auth.middleware';

const router = Router();

// ─────────────────────────────────────────────────────────────
// Rate Limiter General (todas las rutas)
// ─────────────────────────────────────────────────────────────
router.use(generalLimiter);

// ─────────────────────────────────────────────────────────────
// RUTAS DE LECTURA (VIEWER+)
// Requieren autenticación, rate limiting más permisivo
// ─────────────────────────────────────────────────────────────

/**
 * GET /productos
 * Obtener todos los productos (paginado)
 * Auth: VIEWER+
 * Rate limit: 50 requests/minuto
 */
router.get(
  '/',
  authenticateToken,
  authenticated,
  flexibleLimiter({ 
    windowMs: 60 * 1000, // 1 minuto
    max: 50, 
    prefix: 'rl:productos:getAll:' 
  }),
  productosController.getAll
);

/**
 * GET /productos/:id
 * Obtener producto por ID
 * Auth: VIEWER+
 * Rate limit: 60 requests/minuto
 */
router. get(
  '/:id',
  authenticateToken,
  authenticated,
  flexibleLimiter({ 
    windowMs: 60 * 1000, 
    max: 60, 
    prefix: 'rl:productos:getById:' 
  }),
  productosController.getById
);

// ─────────────────────────────────────────────────────────────
// RUTAS DE ESCRITURA (OPERATOR+)
// Requieren autenticación y rol OPERATOR o ADMIN
// Rate limiting más restrictivo
// ─────────────────────────────────────────────────────────────

/**
 * POST /productos
 * Crear nuevo producto
 * Auth: OPERATOR+
 * Rate limit: 10 requests/minuto (prevenir spam)
 */
router.post(
  '/',
  authenticateToken,
  operatorOrAdmin,
  flexibleLimiter({ 
    windowMs: 60 * 1000, 
    max: 10, 
    prefix: 'rl:productos:create:' 
  }),
  productosController.create
);

/**
 * PUT /productos/:id
 * Actualizar producto existente
 * Auth: OPERATOR+
 * Rate limit: 20 requests/minuto
 */
router.put(
  '/:id',
  authenticateToken,
  operatorOrAdmin,
  flexibleLimiter({ 
    windowMs: 60 * 1000, 
    max: 20, 
    prefix: 'rl:productos:update:' 
  }),
  productosController.update
);

/**
 * DELETE /productos/:id
 * Eliminar producto
 * Auth: OPERATOR+
 * Rate limit: 5 requests/minuto (operación crítica)
 */
router. delete(
  '/:id',
  authenticateToken,
  operatorOrAdmin,
  flexibleLimiter({ 
    windowMs: 60 * 1000, 
    max: 5, 
    prefix: 'rl:productos:delete:' 
  }),
  productosController.delete
);

export default router;