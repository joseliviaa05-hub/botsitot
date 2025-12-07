// src/__tests__/integration/auth.api. test.ts
import request from 'supertest';
import { Application } from 'express';
import { Rol } from '@prisma/client';
import {
  createTestApp,
  createAuthenticatedUser,
  getAuthHeaders,
  setupIntegrationTest,
  teardownIntegrationTest,
} from '../helpers/integration';

describe('Auth API Integration Tests', () => {
  let app: Application;

  beforeAll(() => {
    app = createTestApp();
  });

  beforeEach(async () => {
    await setupIntegrationTest();
  });

  afterEach(async () => {
    await teardownIntegrationTest();
  });

  describe('POST /api/auth/register', () => {
    it('debe registrar un nuevo usuario VIEWER', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'newuser@example.com',
          password: 'password123',
          nombre: 'New User',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data). toHaveProperty('user');
      expect(response.body.data). toHaveProperty('token');
      expect(response.body.data. user.email).toBe('newuser@example.com');
      expect(response.body.data. user.rol).toBe(Rol. VIEWER);
    });

    it('debe rechazar email duplicado', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'password123',
        nombre: 'Test User',
      };

      // Primer registro
      await request(app). post('/api/auth/register'). send(userData).expect(201);

      // Segundo registro (duplicado)
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body. error).toContain('ya está registrado');
    });

    it('debe rechazar datos inválidos', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalidemail',
          password: '123',
          nombre: 'Test',
        })
        .expect(400);

      expect(response. body.success).toBe(false);
    });

    it('debe rechazar crear ADMIN sin ser ADMIN', async () => {
      const { token } = await createAuthenticatedUser(Rol.OPERATOR);

      const response = await request(app)
        .post('/api/auth/register')
        .set(getAuthHeaders(token))
        .send({
          email: 'newadmin@example.com',
          password: 'password123',
          nombre: 'New Admin',
          rol: Rol.ADMIN,
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body. error).toContain('Solo ADMIN');
    });

    it('debe permitir a ADMIN crear otro ADMIN', async () => {
      const { token } = await createAuthenticatedUser(Rol. ADMIN);

      const response = await request(app)
        . post('/api/auth/register')
        .set(getAuthHeaders(token))
        .send({
          email: 'newadmin@example.com',
          password: 'password123',
          nombre: 'New Admin',
          rol: Rol.ADMIN,
        })
        . expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.rol).toBe(Rol. ADMIN);
    });
  });

  describe('POST /api/auth/login', () => {
    it('debe hacer login con credenciales válidas', async () => {
      // Crear usuario primero
      const { user } = await createAuthenticatedUser(Rol.VIEWER);

      const response = await request(app)
        .post('/api/auth/login')
        . send({
          email: user. email,
          password: 'password123',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data). toHaveProperty('token');
      expect(response.body.data.user.email).toBe(user.email);
    });

    it('debe rechazar credenciales inválidas', async () => {
      const { user } = await createAuthenticatedUser(Rol.VIEWER);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: user.email,
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body. error).toContain('inválidas');
    });

    it('debe rechazar email inexistente', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'noexiste@example.com',
          password: 'password123',
        })
        .expect(401);

      expect(response.body. success).toBe(false);
    });
  });

  describe('GET /api/auth/me', () => {
    it('debe obtener información del usuario autenticado', async () => {
      const { user, token } = await createAuthenticatedUser(Rol.VIEWER);

      const response = await request(app)
        .get('/api/auth/me')
        . set(getAuthHeaders(token))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response. body.data. email).toBe(user.email);
      expect(response.body.data. rol).toBe(user.rol);
    });

    it('debe rechazar request sin token', async () => {
      const response = await request(app). get('/api/auth/me'). expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Token no proporcionado');
    });

    it('debe rechazar token inválido', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        . set(getAuthHeaders('token-invalido'))
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/auth/change-password', () => {
    it('debe cambiar contraseña correctamente', async () => {
      const { token } = await createAuthenticatedUser(Rol.VIEWER);

      const response = await request(app)
        .put('/api/auth/change-password')
        .set(getAuthHeaders(token))
        .send({
          oldPassword: 'password123',
          newPassword: 'newpassword123',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('actualizada');
    });

    it('debe rechazar contraseña actual incorrecta', async () => {
      const { token } = await createAuthenticatedUser(Rol.VIEWER);

      const response = await request(app)
        .put('/api/auth/change-password')
        .set(getAuthHeaders(token))
        .send({
          oldPassword: 'wrongpassword',
          newPassword: 'newpassword123',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body. error).toContain('incorrecta');
    });

    it('debe rechazar nueva contraseña corta', async () => {
      const { token } = await createAuthenticatedUser(Rol. VIEWER);

      const response = await request(app)
        .put('/api/auth/change-password')
        .set(getAuthHeaders(token))
        .send({
          oldPassword: 'password123',
          newPassword: '123',
        })
        . expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('al menos 6 caracteres');
    });
  });

  describe('GET /api/auth/users', () => {
    it('debe permitir a ADMIN listar usuarios', async () => {
      const { token } = await createAuthenticatedUser(Rol.ADMIN);

      const response = await request(app)
        .get('/api/auth/users')
        .set(getAuthHeaders(token))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.count).toBeGreaterThan(0);
    });

    it('debe rechazar VIEWER', async () => {
      const { token } = await createAuthenticatedUser(Rol.VIEWER);

      const response = await request(app)
        .get('/api/auth/users')
        . set(getAuthHeaders(token))
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error). toContain('No autorizado');
    });

    it('debe rechazar OPERATOR', async () => {
      const { token } = await createAuthenticatedUser(Rol.OPERATOR);

      const response = await request(app)
        .get('/api/auth/users')
        .set(getAuthHeaders(token))
        .expect(403);

      expect(response.body. success).toBe(false);
    });
  });

  describe('Flujo completo: Register → Login → GetMe', () => {
    it('debe completar flujo de autenticación', async () => {
      const userData = {
        email: 'fullflow@example.com',
        password: 'password123',
        nombre: 'Full Flow User',
      };

      // 1. Register
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(registerRes.body.success). toBe(true);
      const { token: registerToken } = registerRes.body.data;

      // 2. GetMe con token de registro
      const getMeRes1 = await request(app)
        .get('/api/auth/me')
        .set(getAuthHeaders(registerToken))
        .expect(200);

      expect(getMeRes1.body. data.email).toBe(userData. email);

      // 3. Login
      const loginRes = await request(app)
        .post('/api/auth/login')
        . send({
          email: userData.email,
          password: userData.password,
        })
        .expect(200);

      expect(loginRes.body.success).toBe(true);
      const { token: loginToken } = loginRes.body.data;

      // 4. GetMe con token de login
      const getMeRes2 = await request(app)
        . get('/api/auth/me')
        .set(getAuthHeaders(loginToken))
        .expect(200);

      expect(getMeRes2.body.data. email).toBe(userData.email);
    });
  });
});