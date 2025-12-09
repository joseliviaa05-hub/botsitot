// src/__tests__/unit/services/producto.service.extra.test.ts
import productoService from '../../../services/producto.service';
import { prisma } from '../../../services/prisma.service';
import { Categoria } from '@prisma/client';

// Mock de prisma
jest.mock('../../../services/prisma.service', () => ({
  prisma: {
    producto: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
    },
    itemPedido: {
      groupBy: jest.fn(),
    },
  },
}));

// Mock de cache
jest.mock('../../../services/cache.service', () => ({
  __esModule: true,
  default: {
    get: jest.fn(). mockResolvedValue(null),
    set: jest.fn(). mockResolvedValue(undefined),
    del: jest.fn().mockResolvedValue(undefined),
    delPattern: jest.fn().mockResolvedValue(undefined),
    getOrSet: jest.fn((key, fn) => fn()), // Ejecutar función directamente
    exists: jest.fn().mockResolvedValue(false),
  },
}));

describe('ProductoService - Tests Adicionales', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('obtenerPorCategoria', () => {
    it('debe obtener productos de una categoría específica', async () => {
      const mockProductos = [
        {
          id: '1',
          nombre: 'Producto 1',
          categoria: Categoria.LIBRERIA,
          stock: true,
          precio: 100,
          imagenes: [],
        },
      ];

      (prisma.producto.findMany as jest.Mock).mockResolvedValue(mockProductos);

      const result = await productoService.obtenerPorCategoria('LIBRERIA');

      expect(prisma.producto.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            categoria: 'LIBRERIA',
            stock: true,
          }),
        })
      );
      expect(result).toEqual(mockProductos);
    });

    it('debe incluir solo productos con stock', async () => {
      (prisma.producto.findMany as jest.Mock).mockResolvedValue([]);

      await productoService.obtenerPorCategoria('COTILLON');

      expect(prisma.producto.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            stock: true,
          }),
        })
      );
    });

    it('debe ordenar por nombre ascendente', async () => {
      (prisma.producto.findMany as jest.Mock).mockResolvedValue([]);

      await productoService.obtenerPorCategoria('JUGUETERIA');

      expect(prisma.producto.findMany). toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { nombre: 'asc' },
        })
      );
    });
  });

  describe('buscar', () => {
    it('debe buscar productos case-insensitive', async () => {
      const mockProductos = [
        {
          id: '1',
          nombre: 'LAPIZ AZUL',
          categoria: Categoria.LIBRERIA,
          precio: 50,
        },
      ];

      (prisma.producto.findMany as jest.Mock). mockResolvedValue(mockProductos);

      await productoService.buscar('lapiz');

      expect(prisma.producto.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: expect.arrayContaining([
              expect.objectContaining({
                nombre: { contains: 'lapiz', mode: 'insensitive' },
              }),
            ]),
            stock: true,
          },
        })
      );
    });

    it('debe buscar en nombre y subcategoría', async () => {
      (prisma.producto.findMany as jest.Mock).mockResolvedValue([]);

      await productoService.buscar('cuaderno');

      expect(prisma.producto.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect. arrayContaining([
              expect. objectContaining({ nombre: expect.anything() }),
              expect.objectContaining({ subcategoria: expect.anything() }),
            ]),
          }),
        })
      );
    });

    it('debe limitar resultados a 10', async () => {
      (prisma.producto.findMany as jest.Mock). mockResolvedValue([]);

      await productoService.buscar('test');

      expect(prisma.producto.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
        })
      );
    });

    it('debe retornar array vacío si no hay resultados', async () => {
      (prisma.producto.findMany as jest.Mock).mockResolvedValue([]);

      const result = await productoService.buscar('inexistente');

      expect(result).toEqual([]);
    });
  });

  describe('obtenerPorNombre', () => {
    it('debe buscar producto por nombre aproximado', async () => {
      const mockProducto = {
        id: '1',
        nombre: 'Cuaderno Rivadavia',
        categoria: Categoria.LIBRERIA,
        precio: 200,
      };

      (prisma.producto.findFirst as jest.Mock).mockResolvedValue(mockProducto);

      const result = await productoService.obtenerPorNombre('cuaderno');

      expect(prisma.producto.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            nombre: {
              contains: 'cuaderno',
              mode: 'insensitive',
            },
          },
        })
      );
      expect(result).toEqual(mockProducto);
    });

    it('debe retornar null si no encuentra producto', async () => {
      (prisma.producto.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await productoService.obtenerPorNombre('inexistente');

      expect(result). toBeNull();
    });
  });

  describe('obtenerTodos con paginación', () => {
    it('debe aplicar paginación correctamente', async () => {
      const mockProductos = [
        { id: '1', nombre: 'Producto 1' },
        { id: '2', nombre: 'Producto 2' },
      ];

      (prisma.producto.findMany as jest.Mock).mockResolvedValue(mockProductos);
      (prisma.producto.count as jest.Mock).mockResolvedValue(10);

      const result = await productoService.obtenerTodos(2, 5);

      expect(prisma. producto.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 5,
          take: 5,
        })
      );

      expect(result.data).toEqual(mockProductos);
      expect(result.pagination. total).toBe(10);
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.limit). toBe(5);
    });

    it('debe manejar página 1 correctamente', async () => {
      (prisma.producto.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.producto.count as jest.Mock).mockResolvedValue(0);

      const result = await productoService.obtenerTodos(1, 10);

      expect(prisma. producto.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
        })
      );
      expect(result.data).toEqual([]);
      expect(result.pagination.page).toBe(1);
    });

    it('debe calcular totalPages correctamente', async () => {
      (prisma.producto. findMany as jest.Mock).mockResolvedValue([]);
      (prisma.producto.count as jest.Mock).mockResolvedValue(25);

      const result = await productoService.obtenerTodos(1, 10);

      expect(result.pagination.totalPages).toBe(3); // Math.ceil(25/10)
    });

    it('debe indicar hasMore correctamente', async () => {
      (prisma.producto.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.producto.count as jest. Mock).mockResolvedValue(25);

      const result1 = await productoService.obtenerTodos(1, 10);
      expect(result1.pagination.hasMore).toBe(true);

      const result2 = await productoService.obtenerTodos(3, 10);
      expect(result2.pagination.hasMore). toBe(false);
    });
  });

  describe('crear producto', () => {
    it('debe crear producto con datos mínimos', async () => {
      const mockProducto = {
        id: '1',
        nombre: 'Producto Nuevo',
        categoria: Categoria. LIBRERIA,
        precio: 100,
        stock: true,
        subcategoria: 'General',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma. producto.create as jest.Mock). mockResolvedValue(mockProducto);

      const result = await productoService.crear({
        nombre: 'Producto Nuevo',
        categoria: Categoria.LIBRERIA,
        precio: 100,
        stock: true,
        subcategoria: 'General',
      });

      expect(result).toEqual(mockProducto);
      expect(prisma.producto.create).toHaveBeenCalled();
    });

    it('debe usar stock=true por defecto', async () => {
      (prisma.producto.create as jest.Mock).mockResolvedValue({});

      await productoService.crear({
        nombre: 'Test',
        categoria: Categoria. LIBRERIA,
        precio: 100,
        subcategoria: 'Test',
      });

      expect(prisma.producto.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            stock: true,
          }),
        })
      );
    });
  });

  describe('actualizar producto', () => {
    it('debe actualizar producto existente', async () => {
      const mockProducto = {
        id: '1',
        nombre: 'Producto Actualizado',
        precio: 150,
      };

      (prisma.producto.update as jest.Mock).mockResolvedValue(mockProducto);

      const result = await productoService.actualizar('1', {
        nombre: 'Producto Actualizado',
        precio: 150,
      });

      expect(result).toEqual(mockProducto);
      expect(prisma.producto.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { nombre: 'Producto Actualizado', precio: 150 },
      });
    });
  });

  describe('eliminar producto', () => {
    it('debe eliminar producto exitosamente', async () => {
      (prisma.producto.delete as jest.Mock).mockResolvedValue({ id: '1' });

      await productoService.eliminar('1');

      expect(prisma. producto.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });
  });

  describe('verificarStock', () => {
    it('debe retornar true si hay stock', async () => {
      (prisma.producto.findUnique as jest.Mock).mockResolvedValue({
        stock: true,
      });

      const result = await productoService.verificarStock('1');

      expect(result).toBe(true);
    });

    it('debe retornar false si no hay stock', async () => {
      (prisma.producto.findUnique as jest.Mock).mockResolvedValue({
        stock: false,
      });

      const result = await productoService.verificarStock('1');

      expect(result).toBe(false);
    });

    it('debe retornar false si producto no existe', async () => {
      (prisma.producto.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await productoService.verificarStock('inexistente');

      expect(result).toBe(false);
    });
  });

  describe('obtenerCategorias', () => {
    it('debe retornar lista de categorías únicas', async () => {
      (prisma.producto.findMany as jest.Mock).mockResolvedValue([
        { categoria: 'LIBRERIA' },
        { categoria: 'COTILLON' },
        { categoria: 'JUGUETERIA' },
      ]);

      const result = await productoService.obtenerCategorias();

      expect(result).toEqual(['LIBRERIA', 'COTILLON', 'JUGUETERIA']);
    });
  });

  describe('manejo de errores', () => {
    it('debe manejar error en obtenerPorId', async () => {
      (prisma.producto.findUnique as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      await expect(productoService.obtenerPorId('error-id')).rejects.toThrow();
    });

    it('debe manejar error en crear', async () => {
      (prisma.producto.create as jest.Mock).mockRejectedValue(
        new Error('Validation error')
      );

      await expect(
        productoService.crear({
          nombre: 'Error',
          categoria: Categoria.LIBRERIA,
          precio: 100,
          stock: true,
          subcategoria: 'Test',
        })
      ).rejects.toThrow();
    });
  });
});