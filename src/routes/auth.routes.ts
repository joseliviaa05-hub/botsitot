// src/routes/auth. routes.ts
import { Router } from 'express';
import {
  register,
  login,
  getMe,
  changePassword,
  listUsers,
  updateUserRole,
  toggleUserStatus,
} from '../controllers/auth.controller';
import {
  authenticateToken,
  adminOnly,
  authenticated,
} from '../middleware/auth.middleware';

const router = Router();

/**
 * POST /register
 * Puede ser:
 * - Pública: Registra VIEWER sin autenticación
 * - Autenticada (ADMIN): Registra cualquier rol si está autenticado como ADMIN
 */
router. post('/register', (req, res, next) => {
  // Si tiene Authorization header, validar token
  if (req.headers.authorization) {
    return authenticateToken(req, res, next);
  }
  // Si no, continuar sin autenticación (registro público como VIEWER)
  next();
}, register);

/**
 * POST /login
 * Ruta pública para iniciar sesión
 */
router.post('/login', login);

/**
 * Rutas protegidas (requieren autenticación)
 */
router.get('/me', authenticateToken, authenticated, getMe);
router.put('/change-password', authenticateToken, authenticated, changePassword);

/**
 * Rutas solo para ADMIN
 */
router.get('/users', authenticateToken, adminOnly, listUsers);
router.put('/users/:id/role', authenticateToken, adminOnly, updateUserRole);
router. put('/users/:id/status', authenticateToken, adminOnly, toggleUserStatus);

export default router;