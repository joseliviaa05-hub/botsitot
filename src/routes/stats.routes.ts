// src/routes/stats.routes.ts
import { Router } from 'express';
import statsController from '../controllers/statsController';
import { authenticateToken, operatorOrAdmin } from '../middleware/auth.middleware';

const router = Router();

/**
 * GET /stats
 * Obtener estadísticas generales
 * Auth: OPERATOR+ (solo operadores y admins)
 */
router.get(
  '/',
  authenticateToken,
  operatorOrAdmin, // ← Cambiado de authenticated a operatorOrAdmin
  statsController.getStats.bind(statsController)
);

export default router;
