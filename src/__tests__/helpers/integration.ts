// src/__tests__/helpers/integration.ts
import express, { Application } from 'express';
import cors from 'cors';
import { Rol } from '@prisma/client';
import authRoutes from '../../routes/auth.routes';
import productosRoutes from '../../routes/productos.routes';
import pedidosRoutes from '../../routes/pedidos.routes';
import clientesRoutes from '../../routes/clientes.routes';
import statsRoutes from '../../routes/stats.routes';
import whatsappRoutes from '../../routes/whatsapp.routes';
import { errorHandler, notFoundHandler } from '../../middleware/errorHandler';
import authService from '../../services/auth.service';
import { cleanupTestData, createTestUser } from './index';

/**
 * Crear aplicación Express para tests de integración
 */
export const createTestApp = (): Application => {
  const app = express();

  // Middlewares
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Routes
  app. use('/api/auth', authRoutes);
  app.use('/api/productos', productosRoutes);
  app.use('/api/pedidos', pedidosRoutes);
  app.use('/api/clientes', clientesRoutes);
  app.use('/api/stats', statsRoutes);
  app.use('/api/whatsapp', whatsappRoutes);

  // Error handlers
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

/**
 * Helper para crear usuario y obtener token
 */
export const createAuthenticatedUser = async (rol: Rol = Rol.VIEWER) => {
  const userData = {
    email: `test-${rol. toLowerCase()}-${Date.now()}@example.com`,
    password: 'password123',
    nombre: `Test ${rol}`,
    rol,
  };

  const user = await createTestUser(userData);
  
  const token = authService.generateToken({
    userId: user.id,
    email: user.email,
    rol: user.rol,
  });

  return { user, token };
};

/**
 * Helper para obtener headers con autenticación
 */
export const getAuthHeaders = (token: string) => ({
  Authorization: `Bearer ${token}`,
});

/**
 * Setup y teardown para tests de integración
 */
export const setupIntegrationTest = async () => {
  // Limpiar datos de prueba antes de cada test
  await cleanupTestData();
};

export const teardownIntegrationTest = async () => {
  // Limpiar datos después de cada test
  await cleanupTestData();
};