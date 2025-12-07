// src/__tests__/unit/middleware/auth.middleware.test.ts
import { Request, Response, NextFunction } from 'express';
import { Rol } from '@prisma/client';
import { authenticateToken, authorize } from '../../../middleware/auth.middleware';
import authService from '../../../services/auth.service';
import { cleanupTestData, createTestUser } from '../../helpers';

// Mock de authService
jest.mock('../../../services/auth.service');

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn(). mockReturnValue({ json: jsonMock });

    mockRequest = {
      headers: {},
    };

    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };

    nextFunction = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('authenticateToken', () => {
    it('debe rechazar request sin token', async () => {
      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Token no proporcionado',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('debe rechazar token inválido', async () => {
      mockRequest.headers = {
        authorization: 'Bearer token-invalido',
      };

      (authService.verifyToken as jest.Mock).mockReturnValue({
        valid: false,
        error: 'Token inválido',
      });

      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Token inválido o expirado',
      });
      expect(nextFunction).not. toHaveBeenCalled();
    });

    it('debe rechazar si usuario no existe', async () => {
      mockRequest.headers = {
        authorization: 'Bearer token-valido',
      };

      (authService.verifyToken as jest.Mock).mockReturnValue({
        valid: true,
        payload: {
          userId: 'user-inexistente',
          email: 'test@example.com',
          rol: Rol.VIEWER,
        },
      });

      (authService.getUserById as jest. Mock).mockRejectedValue(
        new Error('Usuario no encontrado')
      );

      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock). toHaveBeenCalledWith({
        success: false,
        error: 'Usuario no encontrado',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('debe rechazar si usuario está inactivo', async () => {
      mockRequest.headers = {
        authorization: 'Bearer token-valido',
      };

      (authService.verifyToken as jest.Mock).mockReturnValue({
        valid: true,
        payload: {
          userId: 'user-123',
          email: 'test@example.com',
          rol: Rol.VIEWER,
        },
      });

      (authService.getUserById as jest. Mock).mockResolvedValue({
        id: 'user-123',
        email: 'test@example.com',
        nombre: 'Test User',
        rol: Rol.VIEWER,
        activo: false, // Usuario inactivo
      });

      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'Usuario inactivo',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('debe autenticar usuario válido y activo', async () => {
      mockRequest.headers = {
        authorization: 'Bearer token-valido',
      };

      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        nombre: 'Test User',
        rol: Rol.ADMIN,
        activo: true,
      };

      (authService.verifyToken as jest.Mock).mockReturnValue({
        valid: true,
        payload: {
          userId: mockUser.id,
          email: mockUser.email,
          rol: mockUser.rol,
        },
      });

      (authService.getUserById as jest.Mock).mockResolvedValue(mockUser);

      await authenticateToken(
        mockRequest as Request,
        mockResponse as Response,
        nextFunction
      );

      expect(mockRequest.user).toEqual({
        userId: mockUser.id,
        email: mockUser.email,
        rol: mockUser.rol,
      });
      expect(nextFunction).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
    });
  });

  describe('authorize', () => {
    beforeEach(() => {
      mockRequest.user = {
        userId: 'user-123',
        email: 'test@example.com',
        rol: Rol.VIEWER,
      };
    });

    it('debe rechazar si no hay usuario en request', () => {
      delete mockRequest.user;

      const middleware = authorize(Rol.ADMIN);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'No autenticado',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('debe rechazar si usuario no tiene el rol requerido', () => {
      mockRequest.user = {
        userId: 'user-123',
        email: 'test@example.com',
        rol: Rol.VIEWER,
      };

      const middleware = authorize(Rol.ADMIN);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        error: 'No autorizado',
        message: 'Se requiere uno de estos roles: ADMIN',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('debe permitir si usuario tiene el rol requerido', () => {
      mockRequest.user = {
        userId: 'user-123',
        email: 'test@example.com',
        rol: Rol.ADMIN,
      };

      const middleware = authorize(Rol.ADMIN);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(statusMock).not. toHaveBeenCalled();
    });

    it('debe permitir si usuario tiene uno de múltiples roles', () => {
      mockRequest.user = {
        userId: 'user-123',
        email: 'test@example.com',
        rol: Rol.OPERATOR,
      };

      const middleware = authorize(Rol.ADMIN, Rol.OPERATOR);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(statusMock).not. toHaveBeenCalled();
    });

    it('debe rechazar VIEWER cuando se requiere OPERATOR', () => {
      mockRequest.user = {
        userId: 'user-123',
        email: 'test@example. com',
        rol: Rol.VIEWER,
      };

      const middleware = authorize(Rol.OPERATOR, Rol.ADMIN);
      middleware(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });
});