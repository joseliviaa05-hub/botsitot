// src/__tests__/unit/middleware/errorHandler.test.ts
import { Request, Response, NextFunction } from 'express';
import {
  ValidationError,
  NotFoundError,
  AuthenticationError,
  AuthorizationError,
  errorHandler,
} from '../../../middleware/errorHandler';

describe('ErrorHandler Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn(). mockReturnValue({ json: jsonMock });
    
    mockReq = {
      method: 'GET',
      url: '/test',
    };
    
    mockRes = {
      status: statusMock,
      json: jsonMock,
    };
    
    mockNext = jest.fn();
  });

  describe('ValidationError', () => {
    it('debe crear ValidationError correctamente', () => {
      const error = new ValidationError('Campo inválido');
      expect(error.message).toBe('Campo inválido');
      expect(error.statusCode).toBe(400);
    });

    it('debe manejar ValidationError con status 400', () => {
      const error = new ValidationError('Email inválido');
      
      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);
      
      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Email inválido',
        })
      );
    });
  });

  describe('NotFoundError', () => {
    it('debe crear NotFoundError correctamente', () => {
      const error = new NotFoundError('Recurso no encontrado');
      expect(error.message).toBe('Recurso no encontrado');
      expect(error.statusCode). toBe(404);
    });

    it('debe manejar NotFoundError con status 404', () => {
      const error = new NotFoundError('Usuario no encontrado');
      
      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);
      
      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock). toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Usuario no encontrado',
        })
      );
    });
  });

  describe('AuthenticationError', () => {
    it('debe crear AuthenticationError correctamente', () => {
      const error = new AuthenticationError('No autenticado');
      expect(error.message).toBe('No autenticado');
      expect(error.statusCode).toBe(401);
    });

    it('debe manejar AuthenticationError con status 401', () => {
      const error = new AuthenticationError('Token inválido');
      
      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);
      
      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock). toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Token inválido',
        })
      );
    });
  });

  describe('AuthorizationError', () => {
    it('debe crear AuthorizationError correctamente', () => {
      const error = new AuthorizationError('No autorizado');
      expect(error.message).toBe('No autorizado');
      expect(error. statusCode).toBe(403);
    });

    it('debe manejar AuthorizationError con status 403', () => {
      const error = new AuthorizationError('Permiso denegado');
      
      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);
      
      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Permiso denegado',
        })
      );
    });
  });

  describe('Error genérico', () => {
    it('debe manejar error genérico con status 500', () => {
      const error = new Error('Error inesperado');
      
      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);
      
      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock). toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: 'Error interno del servidor',
        })
      );
    });

    it('debe manejar error sin mensaje', () => {
      const error = new Error();
      
      errorHandler(error, mockReq as Request, mockRes as Response, mockNext);
      
      expect(statusMock).toHaveBeenCalledWith(500);
    });
  });
});