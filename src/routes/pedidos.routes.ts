// src/routes/pedidos.routes.ts
import { Router } from 'express';
import pedidosController from '../controllers/pedidos.controller';
import { authenticateToken, operatorOrAdmin, authenticated } from '../middleware/auth.middleware';

const router = Router();

/**
 * Rutas de lectura (VIEWER+)
 * Requieren autenticación pero cualquier usuario puede ver
 */
router.get('/', authenticateToken, authenticated, pedidosController.getAll);
router.get('/:id', authenticateToken, authenticated, pedidosController.getById);

/**
 * Rutas de escritura (OPERATOR+)
 * Requieren autenticación y rol OPERATOR o ADMIN
 */
router.post('/', authenticateToken, operatorOrAdmin, pedidosController.create);
router.put('/:id', authenticateToken, operatorOrAdmin, pedidosController.update);
router.delete('/:id', authenticateToken, operatorOrAdmin, pedidosController.delete);

export default router;
