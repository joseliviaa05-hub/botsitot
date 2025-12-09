// src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { Rol } from '@prisma/client';
import authService from '../services/auth.service';

/**
 * Middleware para autenticar requests con JWT
 */
export const authenticateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Obtener token del header Authorization
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Token no proporcionado',
      });
      return;
    }

    // Verificar token
    const result = authService.verifyToken(token);

    if (!result.valid || !result.payload) {
      res.status(401).json({
        success: false,
        error: 'Token inválido o expirado',
      });
      return;
    }

    // Verificar que el usuario existe y está activo
    try {
      const user = await authService.getUserById(result.payload.userId);

      if (!user.activo) {
        res.status(403).json({
          success: false,
          error: 'Usuario inactivo',
        });
        return;
      }

      // Agregar usuario al request
      req.user = {
        userId: user.id,
        email: user.email,
        rol: user.rol,
      };

      next();
    } catch (error) {
      res.status(401).json({
        success: false,
        error: 'Usuario no encontrado',
      });
      return;
    }
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Error al autenticar',
      details: error.message,
    });
  }
};

/**
 * Middleware para autorizar por rol (RBAC)
 * @param rolesPermitidos - Array de roles que tienen acceso
 */
export const authorize = (...rolesPermitidos: Rol[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'No autenticado',
      });
      return;
    }

    if (!rolesPermitidos.includes(req.user.rol)) {
      res.status(403).json({
        success: false,
        error: 'No autorizado',
        message: `Se requiere uno de estos roles: ${rolesPermitidos.join(', ')}`,
      });
      return;
    }

    next();
  };
};

/**
 * Middleware para permitir solo ADMIN
 */
export const adminOnly = authorize(Rol.ADMIN);

/**
 * Middleware para permitir ADMIN y OPERATOR
 */
export const operatorOrAdmin = authorize(Rol.ADMIN, Rol.OPERATOR);

/**
 * Middleware para todos los usuarios autenticados (VIEWER+)
 */
export const authenticated = authorize(Rol.ADMIN, Rol.OPERATOR, Rol.VIEWER);
