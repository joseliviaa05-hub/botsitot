// ═══════════════════════════════════════════════════════════════
// AUTH ROUTES
// Rutas de autenticación y gestión de usuarios
// ═══════════════════════════════════════════════════════════════

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
import { authLimiter, strictLimiter } from '../middleware/rateLimiter';

const router = Router();

// ─────────────────────────────────────────────────────────────
// 🔓 RUTAS PÚBLICAS (con rate limiting estricto)
// ─────────────────────────────────────────────────────────────

/**
 * POST /register
 * Registro de usuarios
 * - Público: Registra VIEWER sin autenticación
 * - Autenticado (ADMIN): Registra cualquier rol
 */
router.post('/register', authLimiter, (req, res, next) => {
  // Si tiene Authorization header, validar token
  if (req.headers.authorization) {
    return authenticateToken(req, res, next);
  }
  // Si no, continuar sin autenticación (registro público como VIEWER)
  next();
}, register);

/**
 * POST /login
 * Inicio de sesión
 * Rate limit: 10 intentos por 15 minutos
 */
router.post('/login', authLimiter, login);

// ─────────────────────────────────────────────────────────────
// 🔐 RUTAS PROTEGIDAS (requieren autenticación)
// ─────────────────────────────────────────────────────────────

/**
 * GET /me
 * Obtener información del usuario actual
 */
router.get('/me', authenticateToken, authenticated, getMe);

/**
 * PUT /change-password
 * Cambiar contraseña del usuario actual
 * Rate limit estricto: 5 cambios por hora
 */
router.put(
  '/change-password',
  strictLimiter,
  authenticateToken,
  authenticated,
  changePassword
);

// ─────────────────────────────────────────────────────────────
// 👑 RUTAS ADMIN (solo administradores)
// ─────────────────────────────────────────────────────────────

/**
 * GET /users
 * Listar todos los usuarios (solo ADMIN)
 */
router.get('/users', authenticateToken, adminOnly, listUsers);

/**
 * PUT /users/:id/role
 * Actualizar rol de usuario (solo ADMIN)
 * Rate limit estricto: 5 cambios por hora
 */
router.put(
  '/users/:id/role',
  strictLimiter,
  authenticateToken,
  adminOnly,
  updateUserRole
);

/**
 * PUT /users/:id/status
 * Activar/desactivar usuario (solo ADMIN)
 * Rate limit estricto: 5 cambios por hora
 */
router.put(
  '/users/:id/status',
  strictLimiter,
  authenticateToken,
  adminOnly,
  toggleUserStatus
);

export default router;