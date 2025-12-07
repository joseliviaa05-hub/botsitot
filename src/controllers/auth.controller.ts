// src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import { Rol } from '@prisma/client';
import authService from '../services/auth.service';
import { ValidationError } from '../middleware/errorHandler';

/**
 * POST /auth/register - Registrar nuevo usuario
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, nombre, rol } = req. body;

    // Validaciones básicas
    if (!email || ! password || !nombre) {
      res.status(400).json({
        success: false,
        error: 'Email, password y nombre son requeridos',
      });
      return;
    }

    if (password.length < 6) {
      res. status(400).json({
        success: false,
        error: 'La contraseña debe tener al menos 6 caracteres',
      });
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex. test(email)) {
      res.status(400).json({
        success: false,
        error: 'Email inválido',
      });
      return;
    }

    // Determinar el rol final
    let finalRol = Rol.VIEWER; // Por defecto VIEWER para registro público

    // Si se especifica un rol
    if (rol) {
      // Si intenta crear ADMIN u OPERATOR, debe estar autenticado como ADMIN
      if ([Rol.ADMIN, Rol.OPERATOR].includes(rol)) {
        if (!req.user || req.user.rol !== Rol.ADMIN) {
          res.status(403).json({
            success: false,
            error: 'Solo ADMIN puede crear usuarios con rol ADMIN u OPERATOR',
          });
          return;
        }
        finalRol = rol; // Usar el rol especificado
      } else {
        // Para VIEWER u otros roles permitidos
        finalRol = rol;
      }
    }

    const result = await authService. register({
      email,
      password,
      nombre,
      rol: finalRol,
    });

    res.status(201).json({
      success: true,
      data: result,
      message: 'Usuario registrado exitosamente',
    });
  } catch (error: any) {
    if (error.message === 'El email ya está registrado') {
      res.status(409).json({
        success: false,
        error: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Error al registrar usuario',
    });
  }
};

/**
 * POST /auth/login - Iniciar sesión
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400). json({
        success: false,
        error: 'Email y password son requeridos',
      });
      return;
    }

    const result = await authService. login({ email, password });

    res.status(200).json({
      success: true,
      data: result,
      message: 'Login exitoso',
    });
  } catch (error: any) {
    if (
      error.message === 'Credenciales inválidas' ||
      error.message === 'Usuario inactivo'
    ) {
      res.status(401).json({
        success: false,
        error: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Error al hacer login',
    });
  }
};

/**
 * GET /auth/me - Obtener información del usuario autenticado
 */
export const getMe = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401). json({
        success: false,
        error: 'No autenticado',
      });
      return;
    }

    const user = await authService.getUserById(req.user.userId);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Error al obtener información del usuario',
    });
  }
};

/**
 * PUT /auth/change-password - Cambiar contraseña
 */
export const changePassword = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'No autenticado',
      });
      return;
    }

    const { oldPassword, newPassword } = req. body;

    if (!oldPassword || !newPassword) {
      res.status(400).json({
        success: false,
        error: 'oldPassword y newPassword son requeridos',
      });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({
        success: false,
        error: 'La nueva contraseña debe tener al menos 6 caracteres',
      });
      return;
    }

    await authService.updatePassword(req. user.userId, oldPassword, newPassword);

    res.status(200).json({
      success: true,
      message: 'Contraseña actualizada exitosamente',
    });
  } catch (error: any) {
    if (error.message === 'Contraseña actual incorrecta') {
      res.status(400).json({
        success: false,
        error: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Error al cambiar contraseña',
    });
  }
};

/**
 * GET /auth/users - Listar usuarios (solo ADMIN)
 */
export const listUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await authService.listUsers();

    res.status(200). json({
      success: true,
      data: users,
      count: users.length,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Error al listar usuarios',
    });
  }
};

/**
 * PUT /auth/users/:id/role - Cambiar rol de usuario (solo ADMIN)
 */
export const updateUserRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req. params;
    const { rol } = req.body;

    if (!rol || !Object.values(Rol).includes(rol)) {
      res.status(400). json({
        success: false,
        error: 'Rol inválido',
      });
      return;
    }

    const user = await authService.updateUserRole(id, rol);

    res.status(200).json({
      success: true,
      data: user,
      message: 'Rol actualizado exitosamente',
    });
  } catch (error: any) {
    if (error.message === 'Usuario no encontrado') {
      res.status(404). json({
        success: false,
        error: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      error: 'Error al actualizar rol',
    });
  }
};

/**
 * PUT /auth/users/:id/status - Activar/desactivar usuario (solo ADMIN)
 */
export const toggleUserStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { activo } = req.body;

    if (typeof activo !== 'boolean') {
      res. status(400). json({
        success: false,
        error: 'activo debe ser un booleano',
      });
      return;
    }

    const user = await authService.toggleUserStatus(id, activo);

    res.status(200).json({
      success: true,
      data: user,
      message: `Usuario ${activo ? 'activado' : 'desactivado'} exitosamente`,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Error al cambiar estado del usuario',
    });
  }
};