import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import fs from 'fs';
import path from 'path';
import { env } from '../config/env';

class PedidosController {
  private pedidosFile: string;

  constructor() {
    this.pedidosFile = path.join(env.DATA_DIR, 'pedidos.json');
  }

  private readPedidos(): any[] {
    try {
      if (fs.existsSync(this.pedidosFile)) {
        const data = fs.readFileSync(this.pedidosFile, 'utf8');
        const parsed = JSON.parse(data);
        
        // Si el JSON tiene estructura {pedidos: [...]}
        if (parsed.pedidos && Array.isArray(parsed.pedidos)) {
          return parsed.pedidos;
        }
        
        // Si es array directo
        if (Array.isArray(parsed)) {
          return parsed;
        }
        
        return [];
      }
      return [];
    } catch (error) {
      logger.error('Error leyendo pedidos', error as Error);
      return [];
    }
  }

  private writePedidos(pedidos: any[]): void {
    try {
      // Leer estructura actual para mantener campos adicionales
      let estructura: any = { pedidos: [], ultimo_numero: 0 };
      
      if (fs.existsSync(this.pedidosFile)) {
        const data = fs.readFileSync(this. pedidosFile, 'utf8');
        estructura = JSON. parse(data);
      }
      
      // Actualizar pedidos manteniendo resto de campos
      estructura.pedidos = pedidos;
      
      fs.writeFileSync(
        this.pedidosFile,
        JSON.stringify(estructura, null, 2),
        'utf8'
      );
    } catch (error) {
      logger.error('Error escribiendo pedidos', error as Error);
      throw error;
    }
  }

  getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const pedidos = this.readPedidos();
      res.json(pedidos);
    } catch (error) {
      logger.error('Error en getAll pedidos', error as Error);
      res.status(500). json({ error: 'Error al obtener pedidos' });
    }
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const pedidos = this. readPedidos();
      const pedido = pedidos.find((p: any) => p.id === id);

      if (!pedido) {
        res.status(404).json({ error: 'Pedido no encontrado' });
        return;
      }

      res. json(pedido);
    } catch (error) {
      logger.error('Error en getById pedido', error as Error);
      res.status(500).json({ error: 'Error al obtener pedido' });
    }
  };

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const pedidos = this.readPedidos();
      const nuevoPedido = {
        id: 'PED-' + Date. now(),
        ...req.body,
        fecha: new Date().toISOString()
      };

      pedidos. push(nuevoPedido);
      this.writePedidos(pedidos);

      logger.success('Pedido creado: ' + nuevoPedido.id);
      res.status(201).json(nuevoPedido);
    } catch (error) {
      logger.error('Error en create pedido', error as Error);
      res.status(500). json({ error: 'Error al crear pedido' });
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const pedidos = this.readPedidos();
      const index = pedidos.findIndex((p: any) => p.id === id);

      if (index === -1) {
        res. status(404).json({ error: 'Pedido no encontrado' });
        return;
      }

      pedidos[index] = {
        ...pedidos[index],
        ...req.body
      };

      this.writePedidos(pedidos);

      logger.success('Pedido actualizado: ' + id);
      res.json(pedidos[index]);
    } catch (error) {
      logger.error('Error en update pedido', error as Error);
      res.status(500).json({ error: 'Error al actualizar pedido' });
    }
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const pedidos = this. readPedidos();
      const filtered = pedidos.filter((p: any) => p.id !== id);

      if (pedidos.length === filtered.length) {
        res.status(404).json({ error: 'Pedido no encontrado' });
        return;
      }

      this.writePedidos(filtered);

      logger.success('Pedido eliminado: ' + id);
      res.json({ message: 'Pedido eliminado correctamente' });
    } catch (error) {
      logger.error('Error en delete pedido', error as Error);
      res.status(500).json({ error: 'Error al eliminar pedido' });
    }
  };
}

export const pedidosController = new PedidosController();