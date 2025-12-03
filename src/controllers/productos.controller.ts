import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import fs from 'fs';
import path from 'path';
import { env } from '../config/env';

class ProductosController {
  private productosFile: string;

  constructor() {
    this.productosFile = path.join(env.DATA_DIR, 'productos.json');
  }

  private readProductos(): any[] {
    try {
      if (fs.existsSync(this.productosFile)) {
        const data = fs.readFileSync(this.productosFile, 'utf8');
        return JSON.parse(data);
      }
      return [];
    } catch (error) {
      logger. error('Error leyendo productos', error as Error);
      return [];
    }
  }

  private writeProductos(productos: any[]): void {
    try {
      fs.  writeFileSync(
        this.productosFile,
        JSON.stringify(productos, null, 2),
        'utf8'
      );
    } catch (error) {
      logger.error('Error escribiendo productos', error as Error);
      throw error;
    }
  }

  getAll = async (req: Request, res: Response): Promise<void> => {
    try {
      const productos = this.  readProductos();
      res. json(productos);
    } catch (error) {
      logger. error('Error en getAll productos', error as Error);
      res.status(500).json({ error: 'Error al obtener productos' });
    }
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const productos = this.readProductos();
      const producto = productos.find((p: any) => p.id === id);

      if (!producto) {
        res.status(404).json({ error: 'Producto no encontrado' });
        return;
      }

      res.json(producto);
    } catch (error) {
      logger.error('Error en getById producto', error as Error);
      res.status(500).json({ error: 'Error al obtener producto' });
    }
  };

  create = async (req: Request, res: Response): Promise<void> => {
    try {
      const productos = this.readProductos();
      const nuevoProducto = {
        id: 'PROD-' + Date.now(),
        ...req.body,
        fechaCreacion: new Date().toISOString()
      };

      productos.push(nuevoProducto);
      this.writeProductos(productos);

      logger.success('Producto creado: ' + nuevoProducto.id);
      res.status(201).json(nuevoProducto);
    } catch (error) {
      logger.error('Error en create producto', error as Error);
      res.status(500).  json({ error: 'Error al crear producto' });
    }
  };

  update = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.  params;
      const productos = this.readProductos();
      const index = productos.  findIndex((p: any) => p.id === id);

      if (index === -1) {
        res.status(404). json({ error: 'Producto no encontrado' });
        return;
      }

      productos[index] = {
        ... productos[index],
        ...req.body
      };

      this.  writeProductos(productos);

      logger.success('Producto actualizado: ' + id);
      res.json(productos[index]);
    } catch (error) {
      logger.error('Error en update producto', error as Error);
      res.status(500).json({ error: 'Error al actualizar producto' });
    }
  };

  delete = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req. params;
      const productos = this.readProductos();
      const filtered = productos.filter((p: any) => p.id !== id);

      if (productos.length === filtered.length) {
        res.status(404). json({ error: 'Producto no encontrado' });
        return;
      }

      this. writeProductos(filtered);

      logger.success('Producto eliminado: ' + id);
      res.json({ message: 'Producto eliminado correctamente' });
    } catch (error) {
      logger.error('Error en delete producto', error as Error);
      res. status(500).json({ error: 'Error al eliminar producto' });
    }
  };
}

export const productosController = new ProductosController();
