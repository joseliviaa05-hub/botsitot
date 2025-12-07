// src/__tests__/unit/services/cliente. service.extra.test.ts
import clienteService from '../../../services/cliente.service';
import { prisma } from '../../../services/prisma.service';

// Mock de prisma
jest.mock('../../../services/prisma.service', () => ({
  prisma: {
    cliente: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
      count: jest.fn(),
    },
    pedido: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
    },
  },
}));

describe('ClienteService - Tests Adicionales', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('obtenerOCrear - casos edge', () => {
    it('debe crear cliente con nombre por defecto si no se proporciona', async () => {
      (prisma.cliente.findUnique as jest.Mock).mockResolvedValue(null);
      
      const mockCliente = {
        id: '1',
        telefono: '5491112345678',
        nombre: 'Cliente WhatsApp',
        totalPedidos: 0,
        totalGastado: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        fechaRegistro: new Date(),
      };

      (prisma.cliente.create as jest.Mock).mockResolvedValue(mockCliente);

      const result = await clienteService.obtenerOCrear('5491112345678');

      expect(result. nombre).toBe('Cliente WhatsApp');
      expect(prisma.cliente.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            telefono: '5491112345678',
            nombre: 'Cliente WhatsApp',
          }),
        })
      );
    });

    it('debe retornar cliente existente sin crear duplicado', async () => {
      const mockCliente = {
        id: '1',
        telefono: '5491112345679',
        nombre: 'Cliente Existente',
        totalPedidos: 5,
        totalGastado: 1000,
        createdAt: new Date(),
        updatedAt: new Date(),
        fechaRegistro: new Date(),
      };

      (prisma.cliente.findUnique as jest.Mock).mockResolvedValue(mockCliente);

      const result = await clienteService.obtenerOCrear('5491112345679');

      expect(result). toEqual(mockCliente);
      expect(prisma.cliente.create).not.toHaveBeenCalled();
    });

    it('debe limpiar caracteres no numéricos del teléfono', async () => {
      (prisma.cliente.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.cliente.create as jest.Mock).mockResolvedValue({
        id: '1',
        telefono: '5491112345678',
        nombre: 'Cliente WhatsApp',
      });

      await clienteService.obtenerOCrear('+549-111-234-5678');

      expect(prisma.cliente.findUnique).toHaveBeenCalledWith({
        where: { telefono: '5491112345678' },
      });
    });
  });

  describe('obtenerTodos con filtros', () => {
    it('debe aplicar ordenamiento por fechaRegistro descendente', async () => {
      const mockClientes = [
        { id: '1', telefono: '111', nombre: 'Cliente 1' },
        { id: '2', telefono: '222', nombre: 'Cliente 2' },
      ];

      (prisma.cliente.findMany as jest.Mock). mockResolvedValue(mockClientes);
      (prisma.cliente.count as jest.Mock).mockResolvedValue(2);

      await clienteService.obtenerTodos();

      expect(prisma.cliente.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { fechaRegistro: 'desc' }, // ← Corregido
        })
      );
    });

    it('debe calcular paginación correctamente para página 3', async () => {
      (prisma.cliente.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.cliente. count as jest.Mock).mockResolvedValue(100);

      await clienteService.obtenerTodos(3, 20);

      expect(prisma. cliente.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 40, // (3-1) * 20
          take: 20,
        })
      );
    });

    it('debe retornar estructura con data y pagination', async () => {
      const mockClientes = [{ id: '1', nombre: 'Test' }];
      (prisma.cliente.findMany as jest. Mock).mockResolvedValue(mockClientes);
      (prisma.cliente.count as jest. Mock).mockResolvedValue(1);

      const result = await clienteService.obtenerTodos();

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('pagination');
      expect(result. data).toEqual(mockClientes);
      expect(result.pagination. total).toBe(1);
    });
  });

  describe('buscar con diferentes criterios', () => {
    it('debe buscar por nombre parcial (case-insensitive)', async () => {
      const mockClientes = [
        { id: '1', telefono: '111', nombre: 'Juan Pérez' },
        { id: '2', telefono: '222', nombre: 'Juan García' },
      ];

      (prisma.cliente.findMany as jest.Mock).mockResolvedValue(mockClientes);

      await clienteService.buscar('Juan');

      expect(prisma.cliente.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: [
              { nombre: { contains: 'juan', mode: 'insensitive' } }, // ← toLowerCase aplicado
              { telefono: { contains: 'juan' } },
            ],
          },
        })
      );
    });

    it('debe buscar por teléfono parcial', async () => {
      (prisma.cliente.findMany as jest.Mock).mockResolvedValue([]);

      await clienteService.buscar('549111');

      expect(prisma. cliente.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            OR: expect.arrayContaining([
              expect.objectContaining({ telefono: { contains: '549111' } }),
            ]),
          },
        })
      );
    });

    it('debe retornar array vacío si no encuentra resultados', async () => {
      (prisma.cliente.findMany as jest.Mock).mockResolvedValue([]);

      const result = await clienteService.buscar('NoExiste');

      expect(result).toEqual([]);
    });

    it('debe ordenar resultados por nombre ascendente', async () => {
      (prisma.cliente.findMany as jest.Mock).mockResolvedValue([]);

      await clienteService.buscar('test');

      expect(prisma. cliente.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { nombre: 'asc' },
        })
      );
    });
  });

  describe('obtenerPorTelefono', () => {
    it('debe retornar cliente con conteo de pedidos', async () => {
      const mockCliente = {
        id: '1',
        telefono: '5491112345678',
        nombre: 'Test Cliente',
        _count: { pedidos: 5 },
      };

      (prisma. cliente.findUnique as jest. Mock).mockResolvedValue(mockCliente);

      const result = await clienteService.obtenerPorTelefono('5491112345678');

      expect(result).toEqual(mockCliente);
      expect(prisma.cliente.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            _count: {
              select: { pedidos: true },
            },
          },
        })
      );
    });

    it('debe limpiar teléfono antes de buscar', async () => {
      (prisma.cliente. findUnique as jest.Mock). mockResolvedValue(null);

      await clienteService.obtenerPorTelefono('+549 (111) 234-5678');

      expect(prisma.cliente.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { telefono: '5491112345678' },
        })
      );
    });

    it('debe retornar null si cliente no existe', async () => {
      (prisma.cliente.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await clienteService.obtenerPorTelefono('9999999999');

      expect(result).toBeNull();
    });
  });

  describe('actualizarNombre', () => {
    it('debe actualizar nombre del cliente', async () => {
      const mockCliente = {
        id: '1',
        telefono: '5491112345678',
        nombre: 'Nuevo Nombre',
      };

      (prisma.cliente.update as jest.Mock).mockResolvedValue(mockCliente);

      const result = await clienteService.actualizarNombre(
        '5491112345678',
        'Nuevo Nombre'
      );

      expect(result. nombre).toBe('Nuevo Nombre');
      expect(prisma.cliente.update).toHaveBeenCalledWith({
        where: { telefono: '5491112345678' },
        data: { nombre: 'Nuevo Nombre' },
      });
    });
  });

  describe('obtenerEstadisticas', () => {
    it('debe retornar estadísticas del cliente', async () => {
      const mockCliente = {
        id: '1',
        telefono: '5491112345678',
        totalPedidos: 10,
        totalGastado: 5000,
        _count: { pedidos: 10 },
      };

      const mockUltimoPedido = {
        fecha: new Date('2024-01-15'),
      };

      (prisma.cliente.findUnique as jest.Mock).mockResolvedValue(mockCliente);
      (prisma.pedido.findFirst as jest.Mock).mockResolvedValue(mockUltimoPedido);

      const result = await clienteService.obtenerEstadisticas('5491112345678');

      expect(result. totalPedidos).toBe(10);
      expect(result. totalGastado).toBe(5000);
      expect(result. ultimaCompra).toEqual(new Date('2024-01-15'));
    });

    it('debe retornar estadísticas vacías si cliente no existe', async () => {
      (prisma.cliente.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await clienteService.obtenerEstadisticas('9999999999');

      expect(result).toEqual({
        totalPedidos: 0,
        totalGastado: 0,
        ultimaCompra: null,
      });
    });
  });

  describe('manejo de errores', () => {
    it('debe manejar error en obtenerPorTelefono', async () => {
      (prisma.cliente.findUnique as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      await expect(
        clienteService.obtenerPorTelefono('5491112345678')
      ). rejects.toThrow();
    });

    it('debe manejar error en crear dentro de obtenerOCrear', async () => {
      (prisma.cliente.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.cliente.create as jest.Mock).mockRejectedValue(
        new Error('Validation failed')
      );

      await expect(
        clienteService. obtenerOCrear('5491112345678', 'Test')
      ).rejects.toThrow();
    });

    it('debe manejar error en buscar', async () => {
      (prisma.cliente.findMany as jest.Mock).mockRejectedValue(
        new Error('Query timeout')
      );

      await expect(clienteService.buscar('test')).rejects.toThrow();
    });
  });

  describe('validación de datos', () => {
    it('debe crear cliente con nombre personalizado', async () => {
      (prisma.cliente.findUnique as jest.Mock).mockResolvedValue(null);

      const mockCliente = {
        id: '1',
        telefono: '5491112345678',
        nombre: 'María González',
        totalPedidos: 0,
        totalGastado: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        fechaRegistro: new Date(),
      };

      (prisma.cliente.create as jest. Mock).mockResolvedValue(mockCliente);

      const result = await clienteService.obtenerOCrear(
        '5491112345678',
        'María González'
      );

      expect(result.nombre).toBe('María González');
      expect(prisma.cliente.create). toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            telefono: '5491112345678',
            nombre: 'María González',
          }),
        })
      );
    });
  });
});