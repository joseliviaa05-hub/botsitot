import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import fs from 'fs';
import path from 'path';
import { env } from '../config/env';

class ClientesController {
  private clientesFile: string;

  constructor() {
    this.clientesFile = path. join(env.DATA_DIR, 'clientes.json');
  }

  private readFullData(): any {
    try {
      if (fs.existsSync(this. clientesFile)) {
        const data = fs.readFileSync(this.clientesFile, 'utf8');
        return JSON. parse(data);
      }
      return { clientes: [] };
    } catch (error) {
      logger.error('Error leyendo archivo clientes', error as Error);
      return { clientes: [] };
    }
  }

  private writeFullData(fullData: any): void {
    try {
      fs.writeFileSync(
        this.clientesFile,
        JSON.stringify(fullData, null, 2),
        'utf8'
      );
    } catch (error) {
      logger.error('Error escribiendo clientes', error as Error);
      throw error;
    }
  }

  getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = this.readFullData();
      res.json(data.clientes || []);
    } catch (error) {
      logger.error('Error en getAll clientes', error as Error);
      res.status(500).json({ error: 'Error al obtener clientes' });
    }
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const data = this.readFullData();
      const clientes = data.clientes || [];
      const cliente = clientes.find((c: any) => c.telefono === id || c.id === id);

      if (!cliente) {
        res. status(404).json({ error: 'Cliente no encontrado' });
        return;
      }

      res.json(cliente);
    } catch (error) {
      logger.error('Error en getById cliente', error as Error);
      res.status(500).json({ error: 'Error al obtener cliente' });
    }
  };

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = this.readFullData();
      const clientes = data.clientes || [];
      
      const nuevoCliente = {
        id: 'CLI-' + Date.now(),
        ...req.body,
        fecha_registro: new Date().toISOString(),
        ultima_interaccion: new Date(). toISOString(),
        total_pedidos: 0,
        total_gastado: 0
      };

      clientes. push(nuevoCliente);
      data.clientes = clientes;
      
      this.writeFullData(data);

      logger.success('Cliente creado: ' + nuevoCliente.id);
      res. status(201).json(nuevoCliente);
    } catch (error) {
      logger.error('Error en create cliente', error as Error);
      res.status(500).json({ error: 'Error al crear cliente' });
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const data = this.readFullData();
      const clientes = data.clientes || [];
      const index = clientes. findIndex((c: any) => c.telefono === id || c.id === id);

      if (index === -1) {
        res.status(404).json({ error: 'Cliente no encontrado' });
        return;
      }

      clientes[index] = {
        ...clientes[index],
        ...req. body
      };

      data.clientes = clientes;
      this.writeFullData(data);

      logger.success('Cliente actualizado: ' + id);
      res.json(clientes[index]);
    } catch (error) {
      logger.error('Error en update cliente', error as Error);
      res.status(500).json({ error: 'Error al actualizar cliente' });
    }
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const data = this.readFullData();
      const clientes = data.clientes || [];
      const filtered = clientes.filter((c: any) => c.telefono !== id && c.id !== id);

      if (clientes.length === filtered.length) {
        res.status(404). json({ error: 'Cliente no encontrado' });
        return;
      }

      data.clientes = filtered;
      this. writeFullData(data);

      logger.success('Cliente eliminado: ' + id);
      res. json({ message: 'Cliente eliminado correctamente' });
    } catch (error) {
      logger.error('Error en delete cliente', error as Error);
      res. status(500).json({ error: 'Error al eliminar cliente' });
    }
  };
}

export const clientesController = new ClientesController();