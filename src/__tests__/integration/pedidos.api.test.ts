// src/__tests__/integration/pedidos.api.test.ts
import request from 'supertest';
import { Application } from 'express';
import { Rol, Categoria, TipoEntrega, EstadoPedido, EstadoPago } from '@prisma/client';
import {
  createTestApp,
  createAuthenticatedUser,
  getAuthHeaders,
  setupIntegrationTest,
  teardownIntegrationTest,
} from '../helpers/integration';
import { prisma } from '../../services/prisma.service';

describe('Pedidos API Integration Tests', () => {
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

  describe('GET /api/pedidos', () => {
    it('debe listar pedidos para usuario autenticado', async () => {
      const { token } = await createAuthenticatedUser(Rol.VIEWER);

      // Crear cliente y producto de prueba
      const cliente = await prisma.cliente.create({
        data: {
          telefono: '5491112345678',
          nombre: 'Cliente Test',
        },
      });

      const producto = await prisma. producto.create({
        data: {
          nombre: 'Producto Test',
          precio: 100,
          stock: true,
          categoria: Categoria.LIBRERIA,
          subcategoria: 'Test',
        },
      });

      // Crear pedido
      await prisma.pedido.create({
        data: {
          numero: 'PED-001',
          clienteId: cliente.id,
          nombreCliente: cliente.nombre,
          subtotal: 100,
          total: 100,
          tipoEntrega: TipoEntrega.RETIRO,
          items: {
            create: [
              {
                productoId: producto.id,
                nombre: producto.nombre,
                cantidad: 1,
                precioUnitario: 100,
                subtotal: 100,
              },
            ],
          },
        },
      });

      const response = await request(app)
        .get('/api/pedidos')
        .set(getAuthHeaders(token))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.pedidos).toBeInstanceOf(Array);
      expect(response.body.pedidos.length).toBeGreaterThanOrEqual(1);
    });

    it('debe rechazar sin autenticación', async () => {
      const response = await request(app). get('/api/pedidos'). expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/pedidos/:id', () => {
    it('debe obtener pedido por ID', async () => {
      const { token } = await createAuthenticatedUser(Rol.VIEWER);

      const cliente = await prisma.cliente. create({
        data: {
          telefono: '5491112345679',
          nombre: 'Cliente Test 2',
        },
      });

      const producto = await prisma.producto.create({
        data: {
          nombre: 'Producto Test 2',
          precio: 150,
          stock: true,
          categoria: Categoria.LIBRERIA,
          subcategoria: 'Test',
        },
      });

      const pedido = await prisma. pedido.create({
        data: {
          numero: 'PED-002',
          clienteId: cliente.id,
          nombreCliente: cliente.nombre,
          subtotal: 150,
          total: 150,
          tipoEntrega: TipoEntrega.DELIVERY,
          items: {
            create: [
              {
                productoId: producto.id,
                nombre: producto.nombre,
                cantidad: 1,
                precioUnitario: 150,
                subtotal: 150,
              },
            ],
          },
        },
      });

      const response = await request(app)
        .get(`/api/pedidos/${pedido.id}`)
        .set(getAuthHeaders(token))
        .expect(200);

      expect(response.body.success). toBe(true);
      expect(response.body.pedido. numero).toBe('PED-002');
    });

    it('debe retornar 404 si pedido no existe', async () => {
      const { token } = await createAuthenticatedUser(Rol.VIEWER);

      const response = await request(app)
        .get('/api/pedidos/id-inexistente')
        .set(getAuthHeaders(token))
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/pedidos', () => {
    it('debe permitir a OPERATOR crear pedido', async () => {
      const { token } = await createAuthenticatedUser(Rol.OPERATOR);

      const cliente = await prisma.cliente.create({
        data: {
          telefono: '5491112345680',
          nombre: 'Cliente Operator',
        },
      });

      const producto = await prisma.producto.create({
        data: {
          nombre: 'Producto Operator',
          precio: 200,
          stock: true,
          categoria: Categoria.COTILLON,
          subcategoria: 'Globos',
        },
      });

      const response = await request(app)
        .post('/api/pedidos')
        .set(getAuthHeaders(token))
        .send({
          clienteId: cliente.id,
          items: [
            {
              productoId: producto.id,
              cantidad: 2,
            },
          ],
          tipoEntrega: TipoEntrega.DELIVERY,
          delivery: 500,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.pedido). toBeDefined();
      expect(Number(response.body.pedido.total)).toBeGreaterThan(0);
    });

    it('debe permitir a ADMIN crear pedido', async () => {
      const { token } = await createAuthenticatedUser(Rol.ADMIN);

      const cliente = await prisma.cliente.create({
        data: {
          telefono: '5491112345681',
          nombre: 'Cliente Admin',
        },
      });

      const producto = await prisma.producto.create({
        data: {
          nombre: 'Producto Admin',
          precio: 300,
          stock: true,
          categoria: Categoria.JUGUETERIA,
          subcategoria: 'Didacticos',
        },
      });

      const response = await request(app)
        .post('/api/pedidos')
        .set(getAuthHeaders(token))
        .send({
          clienteId: cliente.id,
          items: [
            {
              productoId: producto.id,
              cantidad: 1,
            },
          ],
          tipoEntrega: TipoEntrega.RETIRO,
        })
        .expect(201);

      expect(response.body. success).toBe(true);
    });

    it('debe rechazar a VIEWER', async () => {
      const { token } = await createAuthenticatedUser(Rol.VIEWER);

      const response = await request(app)
        .post('/api/pedidos')
        .set(getAuthHeaders(token))
        .send({
          clienteId: 'cliente-id',
          items: [],
          tipoEntrega: TipoEntrega.RETIRO,
        })
        . expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('No autorizado');
    });

    it('debe rechazar sin autenticación', async () => {
      const response = await request(app)
        .post('/api/pedidos')
        .send({
          clienteId: 'cliente-id',
          items: [],
        })
        .expect(401);

      expect(response.body. success).toBe(false);
    });

    it('debe validar datos requeridos', async () => {
      const { token } = await createAuthenticatedUser(Rol. OPERATOR);

      const response = await request(app)
        . post('/api/pedidos')
        .set(getAuthHeaders(token))
        .send({
          // Falta clienteId e items
        })
        .expect(400);

      expect(response. body.success).toBe(false);
    });
  });

  describe('PUT /api/pedidos/:id', () => {
    it('debe permitir a OPERATOR actualizar pedido', async () => {
      const { token } = await createAuthenticatedUser(Rol.OPERATOR);

      const cliente = await prisma.cliente.create({
        data: {
          telefono: '5491112345682',
          nombre: 'Cliente Update',
        },
      });

      const producto = await prisma. producto.create({
        data: {
          nombre: 'Producto Update',
          precio: 100,
          stock: true,
          categoria: Categoria.LIBRERIA,
          subcategoria: 'Test',
        },
      });

      const pedido = await prisma.pedido.create({
        data: {
          numero: 'PED-UPDATE-001',
          clienteId: cliente.id,
          nombreCliente: cliente.nombre,
          subtotal: 100,
          total: 100,
          tipoEntrega: TipoEntrega.RETIRO,
          estado: EstadoPedido. PENDIENTE,
          items: {
            create: [
              {
                productoId: producto. id,
                nombre: producto. nombre,
                cantidad: 1,
                precioUnitario: 100,
                subtotal: 100,
              },
            ],
          },
        },
      });

      const response = await request(app)
        . put(`/api/pedidos/${pedido.id}`)
        .set(getAuthHeaders(token))
        .send({
          estado: EstadoPedido. CONFIRMADO,
        })
        . expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.pedido.estado). toBe(EstadoPedido.CONFIRMADO);
    });

    it('debe rechazar a VIEWER', async () => {
      const { token } = await createAuthenticatedUser(Rol.VIEWER);

      const cliente = await prisma.cliente.create({
        data: {
          telefono: '5491112345683',
          nombre: 'Cliente Test',
        },
      });

      const producto = await prisma.producto.create({
        data: {
          nombre: 'Producto Test',
          precio: 100,
          stock: true,
          categoria: Categoria.LIBRERIA,
          subcategoria: 'Test',
        },
      });

      const pedido = await prisma.pedido.create({
        data: {
          numero: 'PED-003',
          clienteId: cliente.id,
          nombreCliente: cliente.nombre,
          subtotal: 100,
          total: 100,
          tipoEntrega: TipoEntrega.RETIRO,
          items: {
            create: [
              {
                productoId: producto.id,
                nombre: producto.nombre,
                cantidad: 1,
                precioUnitario: 100,
                subtotal: 100,
              },
            ],
          },
        },
      });

      const response = await request(app)
        .put(`/api/pedidos/${pedido.id}`)
        .set(getAuthHeaders(token))
        .send({ estado: EstadoPedido. CONFIRMADO })
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/pedidos/:id', () => {
    it('debe permitir a ADMIN eliminar pedido', async () => {
      const { token } = await createAuthenticatedUser(Rol.ADMIN);

      const cliente = await prisma.cliente.create({
        data: {
          telefono: '5491112345684',
          nombre: 'Cliente Delete',
        },
      });

      const producto = await prisma. producto.create({
        data: {
          nombre: 'Producto Delete',
          precio: 100,
          stock: true,
          categoria: Categoria. LIBRERIA,
          subcategoria: 'Test',
        },
      });

      const pedido = await prisma.pedido. create({
        data: {
          numero: 'PED-DELETE-001',
          clienteId: cliente.id,
          nombreCliente: cliente.nombre,
          subtotal: 100,
          total: 100,
          tipoEntrega: TipoEntrega.RETIRO,
          items: {
            create: [
              {
                productoId: producto.id,
                nombre: producto.nombre,
                cantidad: 1,
                precioUnitario: 100,
                subtotal: 100,
              },
            ],
          },
        },
      });

      const response = await request(app)
        .delete(`/api/pedidos/${pedido. id}`)
        .set(getAuthHeaders(token))
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verificar que fue eliminado
      const deleted = await prisma.pedido. findUnique({
        where: { id: pedido.id },
      });
      expect(deleted).toBeNull();
    });

    it('debe permitir a OPERATOR eliminar pedido', async () => {
      const { token } = await createAuthenticatedUser(Rol.OPERATOR);

      const cliente = await prisma.cliente.create({
        data: {
          telefono: '5491112345685',
          nombre: 'Cliente Delete 2',
        },
      });

      const producto = await prisma.producto.create({
        data: {
          nombre: 'Producto Delete 2',
          precio: 100,
          stock: true,
          categoria: Categoria.LIBRERIA,
          subcategoria: 'Test',
        },
      });

      const pedido = await prisma. pedido.create({
        data: {
          numero: 'PED-DELETE-002',
          clienteId: cliente.id,
          nombreCliente: cliente.nombre,
          subtotal: 100,
          total: 100,
          tipoEntrega: TipoEntrega. RETIRO,
          items: {
            create: [
              {
                productoId: producto. id,
                nombre: producto. nombre,
                cantidad: 1,
                precioUnitario: 100,
                subtotal: 100,
              },
            ],
          },
        },
      });

      const response = await request(app)
        . delete(`/api/pedidos/${pedido.id}`)
        .set(getAuthHeaders(token))
        .expect(200);

      expect(response.body. success).toBe(true);
    });

    it('debe rechazar a VIEWER', async () => {
      const { token } = await createAuthenticatedUser(Rol.VIEWER);

      const cliente = await prisma.cliente. create({
        data: {
          telefono: '5491112345686',
          nombre: 'Cliente Test',
        },
      });

      const producto = await prisma.producto.create({
        data: {
          nombre: 'Producto Test',
          precio: 100,
          stock: true,
          categoria: Categoria.LIBRERIA,
          subcategoria: 'Test',
        },
      });

      const pedido = await prisma.pedido.create({
        data: {
          numero: 'PED-004',
          clienteId: cliente.id,
          nombreCliente: cliente.nombre,
          subtotal: 100,
          total: 100,
          tipoEntrega: TipoEntrega.RETIRO,
          items: {
            create: [
              {
                productoId: producto.id,
                nombre: producto.nombre,
                cantidad: 1,
                precioUnitario: 100,
                subtotal: 100,
              },
            ],
          },
        },
      });

      const response = await request(app)
        .delete(`/api/pedidos/${pedido.id}`)
        .set(getAuthHeaders(token))
        .expect(403);

      expect(response. body.success).toBe(false);
    });
  });

  describe('Tests de autorización por rol', () => {
    it('VIEWER solo puede leer pedidos', async () => {
      const { token } = await createAuthenticatedUser(Rol.VIEWER);

      // GET debe funcionar
      await request(app)
        .get('/api/pedidos')
        .set(getAuthHeaders(token))
        .expect(200);

      // POST debe fallar
      await request(app)
        .post('/api/pedidos')
        .set(getAuthHeaders(token))
        . send({
          clienteId: 'test-id',
          items: [],
        })
        .expect(403);
    });
  });
});