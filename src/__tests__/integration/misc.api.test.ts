// src/__tests__/integration/misc.api.test.ts
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
import { prisma } from '../../services/prisma.service';

describe('Clientes, Stats y WhatsApp API Integration Tests', () => {
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

  // ═══════════════════════════════════════════════════════════
  // CLIENTES API TESTS
  // ═══════════════════════════════════════════════════════════

  describe('GET /api/clientes', () => {
    it('debe listar clientes para usuario autenticado', async () => {
      const { token } = await createAuthenticatedUser(Rol.VIEWER);

      // Crear algunos clientes de prueba
      await prisma.cliente.createMany({
        data: [
          {
            telefono: '5491198765001',
            nombre: 'Cliente Test 1',
          },
          {
            telefono: '5491198765002',
            nombre: 'Cliente Test 2',
          },
        ],
      });

      const response = await request(app)
        .get('/api/clientes')
        .set(getAuthHeaders(token))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.clientes).toBeInstanceOf(Array);
      expect(response.body.clientes. length).toBeGreaterThanOrEqual(2);
    });

    it('debe rechazar sin autenticación', async () => {
      const response = await request(app). get('/api/clientes'). expect(401);

      expect(response.body.success).toBe(false);
    });

    it('debe soportar búsqueda por nombre', async () => {
      const { token } = await createAuthenticatedUser(Rol.VIEWER);

      await prisma.cliente.create({
        data: {
          telefono: '5491198765003',
          nombre: 'Juan Pérez',
        },
      });

      const response = await request(app)
        .get('/api/clientes? search=Juan')
        .set(getAuthHeaders(token))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.clientes).toBeInstanceOf(Array);
    });
  });

  describe('GET /api/clientes/:telefono', () => {
    it('debe obtener cliente por teléfono', async () => {
      const { token } = await createAuthenticatedUser(Rol.VIEWER);

      const cliente = await prisma.cliente.create({
        data: {
          telefono: '5491198765004',
          nombre: 'Cliente Específico',
        },
      });

      const response = await request(app)
        .get(`/api/clientes/${cliente.telefono}`)
        .set(getAuthHeaders(token))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.cliente. nombre).toBe('Cliente Específico');
    });

    it('debe retornar 404 si cliente no existe', async () => {
      const { token } = await createAuthenticatedUser(Rol.VIEWER);

      const response = await request(app)
        .get('/api/clientes/5491199999999')
        .set(getAuthHeaders(token))
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/clientes', () => {
    it('debe permitir a OPERATOR crear cliente', async () => {
      const { token } = await createAuthenticatedUser(Rol. OPERATOR);

      const response = await request(app)
        . post('/api/clientes')
        .set(getAuthHeaders(token))
        .send({
          telefono: '5491198765005',
          nombre: 'Nuevo Cliente',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.cliente. nombre).toBe('Nuevo Cliente');
    });

    it('debe rechazar a VIEWER', async () => {
      const { token } = await createAuthenticatedUser(Rol.VIEWER);

      const response = await request(app)
        .post('/api/clientes')
        .set(getAuthHeaders(token))
        .send({
          telefono: '5491198765006',
          nombre: 'Test',
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    it('debe rechazar sin autenticación', async () => {
      const response = await request(app)
        .post('/api/clientes')
        .send({
          telefono: '5491198765007',
          nombre: 'Test',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/clientes/:telefono', () => {
    it('debe permitir a OPERATOR actualizar cliente', async () => {
      const { token } = await createAuthenticatedUser(Rol.OPERATOR);

      const cliente = await prisma.cliente.create({
        data: {
          telefono: '5491198765008',
          nombre: 'Cliente Original',
        },
      });

      const response = await request(app)
        .put(`/api/clientes/${cliente.telefono}`)
        .set(getAuthHeaders(token))
        . send({
          nombre: 'Cliente Actualizado',
        })
        .expect(200);

      expect(response.body.success). toBe(true);
      expect(response.body.cliente.nombre).toBe('Cliente Actualizado');
    });

    it('debe rechazar a VIEWER', async () => {
      const { token } = await createAuthenticatedUser(Rol.VIEWER);

      const cliente = await prisma. cliente.create({
        data: {
          telefono: '5491198765009',
          nombre: 'Cliente Test',
        },
      });

      const response = await request(app)
        .put(`/api/clientes/${cliente.telefono}`)
        .set(getAuthHeaders(token))
        . send({ nombre: 'Intento actualizar' })
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // STATS API TESTS
  // ═══════════════════════════════════════════════════════════

  describe('GET /api/stats', () => {
    it('debe obtener estadísticas para ADMIN', async () => {
      const { token } = await createAuthenticatedUser(Rol.ADMIN);

      const response = await request(app)
        .get('/api/stats')
        .set(getAuthHeaders(token))
        .expect(200);

      expect(response.body.success). toBe(true);
      expect(response.body.stats).toBeDefined();
    });

    it('debe obtener estadísticas para OPERATOR', async () => {
      const { token } = await createAuthenticatedUser(Rol.OPERATOR);

      const response = await request(app)
        .get('/api/stats')
        .set(getAuthHeaders(token))
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('debe rechazar a VIEWER', async () => {
      const { token } = await createAuthenticatedUser(Rol. VIEWER);

      const response = await request(app)
        . get('/api/stats')
        .set(getAuthHeaders(token))
        .expect(403);

      expect(response.body. success).toBe(false);
    });

    it('debe rechazar sin autenticación', async () => {
      const response = await request(app). get('/api/stats').expect(401);

      expect(response. body.success).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // WHATSAPP API TESTS
  // ═══════════════════════════════════════════════════════════

  describe('GET /api/whatsapp/status', () => {
    it('debe obtener status de WhatsApp para OPERATOR', async () => {
      const { token } = await createAuthenticatedUser(Rol.OPERATOR);

      const response = await request(app)
        .get('/api/whatsapp/status')
        .set(getAuthHeaders(token))
        .expect(200);

      expect(response. body.success).toBe(true);
      expect(response.body.status).toBeDefined();
    });

    it('debe rechazar a VIEWER', async () => {
      const { token } = await createAuthenticatedUser(Rol.VIEWER);

      const response = await request(app)
        .get('/api/whatsapp/status')
        .set(getAuthHeaders(token))
        .expect(403);

      expect(response.body.success). toBe(false);
    });

    it('debe rechazar sin autenticación', async () => {
      const response = await request(app)
        .get('/api/whatsapp/status')
        . expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/whatsapp/send', () => {
    it('debe rechazar a VIEWER enviar mensaje', async () => {
      const { token } = await createAuthenticatedUser(Rol. VIEWER);

      const response = await request(app)
        . post('/api/whatsapp/send')
        .set(getAuthHeaders(token))
        . send({
          to: '5491198765010',
          message: 'Test message',
        })
        . expect(403);

      expect(response.body.success).toBe(false);
    });

    it('debe rechazar sin autenticación', async () => {
      const response = await request(app)
        .post('/api/whatsapp/send')
        . send({
          to: '5491198765011',
          message: 'Test',
        })
        .expect(401);

      expect(response. body.success).toBe(false);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // TESTS DE AUTORIZACIÓN COMBINADOS
  // ═══════════════════════════════════════════════════════════

  describe('Tests de autorización por rol', () => {
    it('VIEWER puede leer clientes pero no modificar', async () => {
      const { token } = await createAuthenticatedUser(Rol. VIEWER);

      // GET debe funcionar
      await request(app)
        .get('/api/clientes')
        .set(getAuthHeaders(token))
        .expect(200);

      // POST debe fallar
      await request(app)
        .post('/api/clientes')
        .set(getAuthHeaders(token))
        . send({
          telefono: '5491198765012',
          nombre: 'Test',
        })
        .expect(403);
    });

    it('OPERATOR puede leer y escribir clientes', async () => {
      const { token } = await createAuthenticatedUser(Rol. OPERATOR);

      // GET debe funcionar
      await request(app)
        .get('/api/clientes')
        .set(getAuthHeaders(token))
        . expect(200);

      // POST debe funcionar
      const createRes = await request(app)
        .post('/api/clientes')
        .set(getAuthHeaders(token))
        .send({
          telefono: '5491198765013',
          nombre: 'Test Operator',
        })
        .expect(201);

      expect(createRes.body.success). toBe(true);

      // PUT debe funcionar
      await request(app)
        .put(`/api/clientes/${createRes.body.cliente.telefono}`)
        .set(getAuthHeaders(token))
        . send({ nombre: 'Updated' })
        .expect(200);
    });

    it('VIEWER no puede acceder a stats ni WhatsApp', async () => {
      const { token } = await createAuthenticatedUser(Rol. VIEWER);

      // Stats debe fallar
      await request(app)
        .get('/api/stats')
        . set(getAuthHeaders(token))
        .expect(403);

      // WhatsApp debe fallar
      await request(app)
        .get('/api/whatsapp/status')
        .set(getAuthHeaders(token))
        .expect(403);
    });
  });
});