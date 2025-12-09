// src/routes/clientes.routes.ts
import { Router } from 'express';
import clientesController from '../controllers/clientes.controller';
import { authenticateToken, authenticated, operatorOrAdmin } from '../middleware/auth.middleware';

const router = Router();

/**
 * GET /clientes
 * Listar clientes (VIEWER+)
 */
router.get(
  '/',
  authenticateToken,
  authenticated,
  clientesController.getAll.bind(clientesController)
);

/**
 * GET /clientes/:telefono
 * Obtener cliente por teléfono (VIEWER+)
 */
router.get(
  '/:telefono',
  authenticateToken,
  authenticated,
  clientesController.getByTelefono.bind(clientesController)
);

/**
 * POST /clientes
 * Crear cliente (OPERATOR+)
 */
router.post(
  '/',
  authenticateToken,
  operatorOrAdmin, // ← Cambiado a operatorOrAdmin
  clientesController.create.bind(clientesController)
);

/**
 * PUT /clientes/:telefono
 * Actualizar cliente (OPERATOR+)
 */
router.put(
  '/:telefono', // ← Cambiado de /:id a /:telefono
  authenticateToken,
  operatorOrAdmin, // ← Cambiado a operatorOrAdmin
  clientesController.update.bind(clientesController)
);

/**
 * DELETE /clientes/:id
 * Eliminar cliente (OPERATOR+)
 */
router.delete(
  '/:id',
  authenticateToken,
  operatorOrAdmin, // ← Cambiado a operatorOrAdmin
  clientesController.delete.bind(clientesController)
);

export default router;
