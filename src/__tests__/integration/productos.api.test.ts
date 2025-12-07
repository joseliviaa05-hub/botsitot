// src/__tests__/integration/productos.api.test.ts
import request from 'supertest';
import { Application } from 'express';
import { Rol, Categoria } from '@prisma/client';
import {
  createTestApp,
  createAuthenticatedUser,
  getAuthHeaders,
  setupIntegrationTest,
  teardownIntegrationTest,
} from '../helpers/integration';
import { prisma } from '../../services/prisma.service';

describe('Productos API Integration Tests', () => {
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

  describe('GET /api/productos', () => {
    it('debe listar productos para usuario autenticado', async () => {
      const { token } = await createAuthenticatedUser(Rol.VIEWER);

      // Crear algunos productos de prueba
      await prisma.producto.createMany({
        data: [
          {
            nombre: 'Producto 1',
            precio: 100,
            stock: true,
            categoria: Categoria.LIBRERIA,
            subcategoria: 'Cuadernos',
          },
          {
            nombre: 'Producto 2',
            precio: 200,
            stock: true,
            categoria: Categoria.COTILLON,
            subcategoria: 'Decoracion',
          },
        ],
      });

      const response = await request(app)
        .get('/api/productos')
        .set(getAuthHeaders(token))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.productos).toBeInstanceOf(Array);
      expect(response.body.productos.length).toBeGreaterThanOrEqual(2);
    });

    it('debe rechazar sin autenticación', async () => {
      const response = await request(app).get('/api/productos').expect(401);

      expect(response.body.success).toBe(false);
    });

    it('debe soportar paginación', async () => {
      const { token } = await createAuthenticatedUser(Rol.VIEWER);

      // Crear múltiples productos
      const productos = Array.from({ length: 15 }, (_, i) => ({
        nombre: `Producto ${i + 1}`,
        precio: 100 * (i + 1),
        stock: true,
        categoria: Categoria.LIBRERIA,
        subcategoria: 'Test',
      }));

      await prisma.producto.createMany({ data: productos });

      const response = await request(app)
        .get('/api/productos? page=1&limit=10')
        .set(getAuthHeaders(token))
        .expect(200);

      expect(response.body.productos.length).toBeLessThanOrEqual(10);
    });
  });

  describe('GET /api/productos/:id', () => {
    it('debe obtener producto por ID', async () => {
      const { token } = await createAuthenticatedUser(Rol.VIEWER);

      const producto = await prisma.producto.create({
        data: {
          nombre: 'Producto Test',
          precio: 150,
          stock: true,
          categoria: Categoria.JUGUETERIA,
          subcategoria: 'Didacticos',
        },
      });

      const response = await request(app)
        .get(`/api/productos/${producto.id}`)
        .set(getAuthHeaders(token))
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.producto.nombre).toBe('Producto Test');
    });

    it('debe retornar 404 si producto no existe', async () => {
      const { token } = await createAuthenticatedUser(Rol.VIEWER);

      const response = await request(app)
        .get('/api/productos/id-inexistente')
        .set(getAuthHeaders(token))
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/productos', () => {
    it('debe permitir a OPERATOR crear producto', async () => {
      const { token } = await createAuthenticatedUser(Rol.OPERATOR);

      const response = await request(app)
        .post('/api/productos')
        .set(getAuthHeaders(token))
        .send({
          nombre: 'Nuevo Producto',
          precio: 250,
          stock: true,
          categoria: Categoria. LIBRERIA,
          subcategoria: 'Lapices',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.producto.nombre).toBe('Nuevo Producto');
    });

    it('debe permitir a ADMIN crear producto', async () => {
      const { token } = await createAuthenticatedUser(Rol.ADMIN);

      const response = await request(app)
        .post('/api/productos')
        .set(getAuthHeaders(token))
        .send({
          nombre: 'Producto Admin',
          precio: 300,
          stock: true,
          categoria: Categoria. COTILLON,
          subcategoria: 'Globos',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
    });

    it('debe rechazar a VIEWER', async () => {
      const { token } = await createAuthenticatedUser(Rol.VIEWER);

      const response = await request(app)
        .post('/api/productos')
        .set(getAuthHeaders(token))
        .send({
          nombre: 'Producto Viewer',
          precio: 100,
          stock: true,
          categoria: Categoria. LIBRERIA,
          subcategoria: 'Test',
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('No autorizado');
    });

    it('debe rechazar sin autenticación', async () => {
      const response = await request(app)
        .post('/api/productos')
        .send({
          nombre: 'Producto',
          precio: 100,
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('debe validar datos requeridos', async () => {
      const { token } = await createAuthenticatedUser(Rol.OPERATOR);

      const response = await request(app)
        .post('/api/productos')
        .set(getAuthHeaders(token))
        .send({
          nombre: 'Producto sin precio',
          // Falta precio, categoria y subcategoria
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/productos/:id', () => {
    it('debe permitir a OPERATOR actualizar producto', async () => {
      const { token } = await createAuthenticatedUser(Rol.OPERATOR);

      const producto = await prisma.producto.create({
        data: {
          nombre: 'Producto Original',
          precio: 100,
          stock: true,
          categoria: Categoria. LIBRERIA,
          subcategoria: 'Cuadernos',
        },
      });

      const response = await request(app)
        .put(`/api/productos/${producto.id}`)
        .set(getAuthHeaders(token))
        .send({
          nombre: 'Producto Actualizado',
          precio: 150,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.producto.nombre).toBe('Producto Actualizado');
      expect(parseFloat(response.body.producto. precio)).toBe(150);
    });

    it('debe rechazar a VIEWER', async () => {
      const { token } = await createAuthenticatedUser(Rol.VIEWER);

      const producto = await prisma.producto.create({
        data: {
          nombre: 'Producto',
          precio: 100,
          stock: true,
          categoria: Categoria. LIBRERIA,
          subcategoria: 'Test',
        },
      });

      const response = await request(app)
        .put(`/api/productos/${producto.id}`)
        .set(getAuthHeaders(token))
        .send({ nombre: 'Intento actualizar' })
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/productos/:id', () => {
    it('debe permitir a ADMIN eliminar producto', async () => {
      const { token } = await createAuthenticatedUser(Rol.ADMIN);

      const producto = await prisma.producto.create({
        data: {
          nombre: 'Producto a eliminar',
          precio: 100,
          stock: true,
          categoria: Categoria. LIBRERIA,
          subcategoria: 'Test',
        },
      });

      const response = await request(app)
        .delete(`/api/productos/${producto.id}`)
        .set(getAuthHeaders(token))
        .expect(200);

      expect(response.body.success).toBe(true);

      // Verificar que fue eliminado
      const deleted = await prisma.producto.findUnique({
        where: { id: producto.id },
      });
      expect(deleted).toBeNull();
    });

    it('debe permitir a OPERATOR eliminar producto', async () => {
      const { token } = await createAuthenticatedUser(Rol.OPERATOR);

      const producto = await prisma.producto.create({
        data: {
          nombre: 'Producto a eliminar',
          precio: 100,
          stock: true,
          categoria: Categoria. LIBRERIA,
          subcategoria: 'Test',
        },
      });

      const response = await request(app)
        .delete(`/api/productos/${producto.id}`)
        .set(getAuthHeaders(token))
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('debe rechazar a VIEWER', async () => {
      const { token } = await createAuthenticatedUser(Rol.VIEWER);

      const producto = await prisma.producto.create({
        data: {
          nombre: 'Producto',
          precio: 100,
          stock: true,
          categoria: Categoria.LIBRERIA,
          subcategoria: 'Test',
        },
      });

      const response = await request(app)
        .delete(`/api/productos/${producto.id}`)
        .set(getAuthHeaders(token))
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Tests de autorización por rol', () => {
    it('VIEWER solo puede leer', async () => {
      const { token } = await createAuthenticatedUser(Rol.VIEWER);

      // GET debe funcionar
      await request(app)
        .get('/api/productos')
        .set(getAuthHeaders(token))
        .expect(200);

      // POST debe fallar
      await request(app)
        .post('/api/productos')
        .set(getAuthHeaders(token))
        .send({
          nombre: 'Test',
          precio: 100,
          stock: true,
          categoria: Categoria.LIBRERIA,
          subcategoria: 'Test',
        })
        .expect(403);
    });

    it('OPERATOR puede leer y escribir', async () => {
      const { token } = await createAuthenticatedUser(Rol.OPERATOR);

      // GET debe funcionar
      await request(app)
        .get('/api/productos')
        .set(getAuthHeaders(token))
        .expect(200);

      // POST debe funcionar
      const createRes = await request(app)
        .post('/api/productos')
        .set(getAuthHeaders(token))
        .send({
          nombre: 'Test Operator',
          precio: 100,
          stock: true,
          categoria: Categoria.LIBRERIA,
          subcategoria: 'Test',
        })
        .expect(201);

      // PUT debe funcionar
      await request(app)
        .put(`/api/productos/${createRes.body.producto.id}`)
        .set(getAuthHeaders(token))
        .send({ precio: 150 })
        .expect(200);

      // DELETE debe funcionar
      await request(app)
        .delete(`/api/productos/${createRes.body.producto.id}`)
        .set(getAuthHeaders(token))
        .expect(200);
    });

    it('ADMIN puede hacer todo', async () => {
      const { token } = await createAuthenticatedUser(Rol.ADMIN);

      // Todas las operaciones deben funcionar
      await request(app)
        .get('/api/productos')
        .set(getAuthHeaders(token))
        .expect(200);

      const createRes = await request(app)
        .post('/api/productos')
        .set(getAuthHeaders(token))
        .send({
          nombre: 'Test Admin',
          precio: 100,
          stock: true,
          categoria: Categoria.LIBRERIA,
          subcategoria: 'Test',
        })
        .expect(201);

      await request(app)
        .put(`/api/productos/${createRes.body.producto.id}`)
        .set(getAuthHeaders(token))
        .send({ precio: 200 })
        .expect(200);

      await request(app)
        .delete(`/api/productos/${createRes.body.producto.id}`)
        .set(getAuthHeaders(token))
        .expect(200);
    });
  });
});