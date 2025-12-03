import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { env } from '../config/env';

export class StatsController {
  private pedidosFile: string;
  private productosFile: string;
  private clientesFile: string;

  constructor() {
    this.pedidosFile = path.join(env. DATA_DIR, 'pedidos. json');
    this.productosFile = path.join(env. DATA_DIR, 'lista-precios.json');
    this. clientesFile = path.join(env.DATA_DIR, 'clientes.json');
  }

  private readJSON(filepath: string): any {
    try {
      if (fs.existsSync(filepath)) {
        const data = fs.readFileSync(filepath, 'utf-8');
        return JSON.parse(data);
      }
      return null;
    } catch (error) {
      console.error('Error leyendo archivo:', error);
      return null;
    }
  }

  /**
   * GET /api/stats
   * Estadísticas generales del sistema
   */
  async getStats(req: Request, res: Response) {
    try {
      // Leer datos
      const pedidosData = this.readJSON(this.pedidosFile);
      const productosData = this. readJSON(this.productosFile);
      const clientesData = this.readJSON(this.clientesFile);

      // Estadísticas de pedidos
      const pedidos = pedidosData?. pedidos || [];
      const totalPedidos = pedidos.length;
      
      const pedidosPorEstado = pedidos.reduce((acc: any, p: any) => {
        acc[p.estado] = (acc[p.estado] || 0) + 1;
        return acc;
      }, {});

      // Pedidos de hoy
      const hoy = new Date().toISOString().split('T')[0];
      const pedidosHoy = pedidos.filter((p: any) => 
        p.fecha?. startsWith(hoy)
      ). length;

      // Facturación
      const totalVendido = pedidos.reduce((sum: number, p: any) => 
        sum + (p.total || 0), 0
      );
      const promedioTicket = totalPedidos > 0 ? totalVendido / totalPedidos : 0;

      // Estadísticas de productos
      let totalProductos = 0;
      let productosConStock = 0;

      if (productosData) {
        Object.values(productosData).forEach((categoria: any) => {
          Object.values(categoria).forEach((subcategoria: any) => {
            Object.values(subcategoria).forEach((producto: any) => {
              totalProductos++;
              if (producto.stock !== false) {
                productosConStock++;
              }
            });
          });
        });
      }

      // Estadísticas de clientes
      const clientes = clientesData?.clientes || [];
      const totalClientes = clientes.length;

      // Cliente top (el que más gastó)
      const clienteTop = clientes.length > 0
        ? clientes.reduce((prev: any, current: any) => 
            (current.total_gastado > prev.total_gastado) ? current : prev
          )
        : null;

      // Producto más vendido
      const productosMasVendidos: any = {};
      pedidos.forEach((pedido: any) => {
        pedido.productos?. forEach((item: any) => {
          const nombre = item.nombre;
          if (! productosMasVendidos[nombre]) {
            productosMasVendidos[nombre] = {
              nombre,
              cantidad: 0,
              ventas: 0
            };
          }
          productosMasVendidos[nombre].cantidad += item.cantidad;
          productosMasVendidos[nombre]. ventas += item.subtotal;
        });
      });

      const topProducto = Object.values(productosMasVendidos)
        .sort((a: any, b: any) => b. cantidad - a.cantidad)[0] || null;

      res.json({
        success: true,
        data: {
          pedidos: {
            total: totalPedidos,
            hoy: pedidosHoy,
            porEstado: pedidosPorEstado,
            pendientes: pedidosPorEstado['pendiente'] || 0,
            confirmados: pedidosPorEstado['confirmado'] || 0,
            entregados: pedidosPorEstado['entregado'] || 0
          },
          facturacion: {
            total: Math.round(totalVendido),
            promedio: Math.round(promedioTicket),
            hoy: pedidos
              .filter((p: any) => p.fecha?.startsWith(hoy))
              .reduce((sum: number, p: any) => sum + (p.total || 0), 0)
          },
          productos: {
            total: totalProductos,
            enStock: productosConStock,
            sinStock: totalProductos - productosConStock,
            masVendido: topProducto
          },
          clientes: {
            total: totalClientes,
            top: clienteTop ?  {
              nombre: clienteTop.nombre,
              pedidos: clienteTop.total_pedidos,
              gastado: clienteTop.total_gastado
            } : null
          }
        }
      });
    } catch (error: any) {
      console.error('Error en getStats:', error);
      res. status(500).json({
        success: false,
        error: 'Error al obtener estadísticas',
        message: error.message
      });
    }
  }
}

export default new StatsController();
