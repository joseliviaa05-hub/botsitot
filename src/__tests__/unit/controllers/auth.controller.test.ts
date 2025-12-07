// src/__tests__/unit/controllers/auth.controller.test.ts
import { Request, Response } from 'express';
import { Rol } from '@prisma/client';
import {
  register,
  login,
  getMe,
  changePassword,
  listUsers,
  updateUserRole,
  toggleUserStatus,
} from '../../../controllers/auth.controller';
import authService from '../../../services/auth.service';

// Mock de authService
jest. mock('../../../services/auth.service');

describe('AuthController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest. Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });

    mockRequest = {
      body: {},
      params: {},
      user: undefined,
    };

    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('debe registrar un nuevo usuario VIEWER', async () => {
      mockRequest.body = {
        email: 'newuser@example.com',
        password: 'password123',
        nombre: 'New User',
      };

      const mockResult = {
        user: {
          id: 'user-123',
          email: 'newuser@example.com',
          nombre: 'New User',
          rol: Rol.VIEWER,
        },
        token: 'jwt-token',
        expiresIn: '7d',
      };

      (authService.register as jest.Mock).mockResolvedValue(mockResult);

      await register(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockResult,
        message: 'Usuario registrado exitosamente',
      });
    });

    it('debe rechazar registro sin email', async () => {
      mockRequest.body = {
        password: 'password123',
        nombre: 'Test User',
      };

      await register(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalled();
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('requeridos'),
        })
      );
    });

    it('debe rechazar contraseña corta', async () => {
      mockRequest.body = {
        email: 'test@example.com',
        password: '123',
        nombre: 'Test User',
      };

      await register(mockRequest as Request, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalledWith(
        expect. objectContaining({
          success: false,
          error: expect. stringContaining('al menos 6 caracteres'),
        })
      );
    });

    it('debe rechazar email inválido', async () => {
      mockRequest.body = {
        email: 'email-invalido',
        password: 'password123',
        nombre: 'Test User',
      };

      await register(mockRequest as Request, mockResponse as Response);

      expect(jsonMock). toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Email inválido',
        })
      );
    });

    it('debe rechazar email duplicado', async () => {
      mockRequest.body = {
        email: 'existing@example.com',
        password: 'password123',
        nombre: 'Test User',
      };

      (authService. register as jest.Mock).mockRejectedValue(
        new Error('El email ya está registrado')
      );

      await register(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(409);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'El email ya está registrado',
      });
    });

    it('debe rechazar crear ADMIN sin ser ADMIN', async () => {
      mockRequest.body = {
        email: 'newadmin@example.com',
        password: 'password123',
        nombre: 'New Admin',
        rol: Rol.ADMIN,
      };

      mockRequest.user = {
        userId: 'user-123',
        email: 'operator@example.com',
        rol: Rol.OPERATOR, // No es ADMIN
      };

      await register(mockRequest as Request, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalledWith(
        expect. objectContaining({
          success: false,
          error: expect. stringContaining('Solo ADMIN'),
        })
      );
    });

    it('debe permitir a ADMIN crear otro ADMIN', async () => {
      mockRequest.body = {
        email: 'newadmin@example.com',
        password: 'password123',
        nombre: 'New Admin',
        rol: Rol.ADMIN,
      };

      mockRequest. user = {
        userId: 'admin-123',
        email: 'admin@example.com',
        rol: Rol.ADMIN,
      };

      const mockResult = {
        user: {
          id: 'user-456',
          email: 'newadmin@example.com',
          nombre: 'New Admin',
          rol: Rol. ADMIN,
        },
        token: 'jwt-token',
        expiresIn: '7d',
      };

      (authService.register as jest.Mock).mockResolvedValue(mockResult);

      await register(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(authService.register).toHaveBeenCalledWith(
        expect.objectContaining({ rol: Rol.ADMIN })
      );
    });
  });

  describe('login', () => {
    it('debe hacer login con credenciales válidas', async () => {
      mockRequest.body = {
        email: 'user@example.com',
        password: 'password123',
      };

      const mockResult = {
        user: {
          id: 'user-123',
          email: 'user@example.com',
          nombre: 'Test User',
          rol: Rol.VIEWER,
        },
        token: 'jwt-token',
        expiresIn: '7d',
      };

      (authService.login as jest.Mock).mockResolvedValue(mockResult);

      await login(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock). toHaveBeenCalledWith({
        success: true,
        data: mockResult,
        message: 'Login exitoso',
      });
    });

    it('debe rechazar login sin email', async () => {
      mockRequest.body = {
        password: 'password123',
      };

      await login(mockRequest as Request, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalledWith(
        expect. objectContaining({
          success: false,
          error: expect. stringContaining('requeridos'),
        })
      );
    });

    it('debe rechazar credenciales inválidas', async () => {
      mockRequest.body = {
        email: 'user@example.com',
        password: 'wrongpassword',
      };

      (authService.login as jest.Mock).mockRejectedValue(
        new Error('Credenciales inválidas')
      );

      await login(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Credenciales inválidas',
      });
    });

    it('debe rechazar usuario inactivo', async () => {
      mockRequest.body = {
        email: 'inactive@example.com',
        password: 'password123',
      };

      (authService.login as jest.Mock).mockRejectedValue(
        new Error('Usuario inactivo')
      );

      await login(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Usuario inactivo',
      });
    });
  });

  describe('getMe', () => {
    it('debe obtener información del usuario autenticado', async () => {
      mockRequest.user = {
        userId: 'user-123',
        email: 'user@example.com',
        rol: Rol.VIEWER,
      };

      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        nombre: 'Test User',
        rol: Rol. VIEWER,
        activo: true,
        createdAt: new Date(),
      };

      (authService.getUserById as jest.Mock).mockResolvedValue(mockUser);

      await getMe(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockUser,
      });
    });

    it('debe rechazar si no hay usuario en request', async () => {
      mockRequest.user = undefined;

      await getMe(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'No autenticado',
      });
    });
  });

  describe('changePassword', () => {
    it('debe cambiar contraseña correctamente', async () => {
      mockRequest.user = {
        userId: 'user-123',
        email: 'user@example.com',
        rol: Rol.VIEWER,
      };

      mockRequest.body = {
        oldPassword: 'oldpass123',
        newPassword: 'newpass123',
      };

      (authService.updatePassword as jest.Mock).mockResolvedValue(undefined);

      await changePassword(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        message: 'Contraseña actualizada exitosamente',
      });
    });

    it('debe rechazar si falta oldPassword', async () => {
      mockRequest.user = {
        userId: 'user-123',
        email: 'user@example.com',
        rol: Rol.VIEWER,
      };

      mockRequest.body = {
        newPassword: 'newpass123',
      };

      await changePassword(mockRequest as Request, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalledWith(
        expect. objectContaining({
          success: false,
          error: expect. stringContaining('requeridos'),
        })
      );
    });

    it('debe rechazar nueva contraseña corta', async () => {
      mockRequest.user = {
        userId: 'user-123',
        email: 'user@example.com',
        rol: Rol. VIEWER,
      };

      mockRequest.body = {
        oldPassword: 'oldpass123',
        newPassword: '123',
      };

      await changePassword(mockRequest as Request, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.stringContaining('al menos 6 caracteres'),
        })
      );
    });

    it('debe rechazar contraseña actual incorrecta', async () => {
      mockRequest.user = {
        userId: 'user-123',
        email: 'user@example.com',
        rol: Rol.VIEWER,
      };

      mockRequest.body = {
        oldPassword: 'wrongpass',
        newPassword: 'newpass123',
      };

      (authService.updatePassword as jest. Mock).mockRejectedValue(
        new Error('Contraseña actual incorrecta')
      );

      await changePassword(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Contraseña actual incorrecta',
      });
    });
  });

  describe('listUsers', () => {
    it('debe listar todos los usuarios', async () => {
      const mockUsers = [
        {
          id: 'user-1',
          email: 'user1@example.com',
          nombre: 'User 1',
          rol: Rol.ADMIN,
          activo: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'user-2',
          email: 'user2@example.com',
          nombre: 'User 2',
          rol: Rol.VIEWER,
          activo: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (authService.listUsers as jest.Mock).mockResolvedValue(mockUsers);

      await listUsers(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock). toHaveBeenCalledWith({
        success: true,
        data: mockUsers,
        count: 2,
      });
    });
  });

  describe('updateUserRole', () => {
    it('debe actualizar rol de usuario', async () => {
      mockRequest.params = { id: 'user-123' };
      mockRequest.body = { rol: Rol.OPERATOR };

      const mockUser = {
        id: 'user-123',
        email: 'user@example. com',
        nombre: 'Test User',
        rol: Rol.OPERATOR,
      };

      (authService.updateUserRole as jest.Mock).mockResolvedValue(mockUser);

      await updateUserRole(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockUser,
        message: 'Rol actualizado exitosamente',
      });
    });

    it('debe rechazar rol inválido', async () => {
      mockRequest.params = { id: 'user-123' };
      mockRequest.body = { rol: 'INVALID_ROLE' };

      await updateUserRole(mockRequest as Request, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Rol inválido',
        })
      );
    });

    it('debe rechazar si usuario no existe', async () => {
      mockRequest.params = { id: 'user-inexistente' };
      mockRequest.body = { rol: Rol.OPERATOR };

      (authService.updateUserRole as jest.Mock).mockRejectedValue(
        new Error('Usuario no encontrado')
      );

      await updateUserRole(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Usuario no encontrado',
      });
    });
  });

  describe('toggleUserStatus', () => {
    it('debe activar/desactivar usuario', async () => {
      mockRequest.params = { id: 'user-123' };
      mockRequest.body = { activo: false };

      const mockUser = {
        id: 'user-123',
        email: 'user@example.com',
        activo: false,
      };

      (authService.toggleUserStatus as jest.Mock).mockResolvedValue(mockUser);

      await toggleUserStatus(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: mockUser,
        message: 'Usuario desactivado exitosamente',
      });
    });

    it('debe rechazar valor no booleano', async () => {
      mockRequest.params = { id: 'user-123' };
      mockRequest.body = { activo: 'true' }; // String en lugar de boolean

      await toggleUserStatus(mockRequest as Request, mockResponse as Response);

      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'activo debe ser un booleano',
        })
      );
    });
  });
});