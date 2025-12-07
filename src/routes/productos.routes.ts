// ═══════════════════════════════════════════════════════════════
// PRODUCTOS ROUTES
// Con autenticación, autorización y rate limiting
// ═══════════════════════════════════════════════════════════════

import { Router } from 'express';
import productosController from '../controllers/productos.controller';
import { generalLimiter, apiLimiter } from '../middleware/rateLimiter';
import { authenticateToken, operatorOrAdmin, authenticated } from '../middleware/auth.middleware';

const router = Router();

// ─────────────────────────────────────────────────────────────
// Rate Limiter General (todas las rutas)
// ─────────────────────────────────────────────────────────────
router.use(generalLimiter);

// ─────────────────────────────────────────────────────────────
// RUTAS DE LECTURA (VIEWER+)
// ─────────────────────────────────────────────────────────────

/**
 * GET /productos
 * Obtener todos los productos (paginado)
 * Auth: VIEWER+
 * Rate limit: 60 requests/minuto
 */
router.get('/', authenticateToken, authenticated, apiLimiter, productosController.getAll);

/**
 * GET /productos/:id
 * Obtener producto por ID
 * Auth: VIEWER+
 * Rate limit: 60 requests/minuto
 */
router.get('/:id', authenticateToken, authenticated, apiLimiter, productosController.getById);

// ─────────────────────────────────────────────────────────────
// RUTAS DE ESCRITURA (OPERATOR+)
// ─────────────────────────────────────────────────────────────

/**
 * POST /productos
 * Crear nuevo producto
 * Auth: OPERATOR+
 * Rate limit: General (dinámico por rol)
 */
router.post('/', authenticateToken, operatorOrAdmin, productosController.create);

/**
 * PUT /productos/:id
 * Actualizar producto existente
 * Auth: OPERATOR+
 */
router.put('/:id', authenticateToken, operatorOrAdmin, productosController.update);

/**
 * DELETE /productos/:id
 * Eliminar producto
 * Auth: OPERATOR+
 */
router.delete('/:id', authenticateToken, operatorOrAdmin, productosController.delete);

export default router;
