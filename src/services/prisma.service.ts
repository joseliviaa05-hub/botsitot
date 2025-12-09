/**
 * ═══════════════════════════════════════════════════════════════
 * PRISMA SERVICE - Singleton para gestionar conexiones
 * ⭐ MEJORADO: Reconexión automática + Health checks
 * ═══════════════════════════════════════════════════════════════
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

class PrismaService {
  private static instance: PrismaClient;
  private static reconnectAttempts = 0;
  private static readonly MAX_RECONNECT_ATTEMPTS = 5;
  private static readonly RECONNECT_INTERVAL = 5000; // 5 segundos

  private constructor() {}

  static getInstance(): PrismaClient {
    if (!PrismaService.instance) {
      PrismaService.instance = new PrismaClient({
        log: [
          { emit: 'event', level: 'error' },
          { emit: 'event', level: 'warn' },
        ],
      });

      // ⭐ Event handlers para logs y reconexión
      PrismaService.instance.$on('error' as never, (e: any) => {
        logger.error('❌ Prisma Error:', e);
        PrismaService.handleConnectionError();
      });

      PrismaService.instance.$on('warn' as never, (e: any) => {
        logger.warn('⚠️ Prisma Warning:', e);
      });

      PrismaService.instance.$on('query' as never, (e: any) => {
        // Solo loguear queries en desarrollo
        if (process.env.NODE_ENV === 'development') {
          logger.debug(`Query: ${e.query} - Duration: ${e.duration}ms`);
        }
      });

      // ⭐ Manejar desconexión limpia
      process.on('beforeExit', async () => {
        await PrismaService.disconnect();
      });

      process.on('SIGINT', async () => {
        logger.info('🛑 SIGINT recibido, cerrando Prisma.. .');
        await PrismaService.disconnect();
        process.exit(0);
      });

      process.on('SIGTERM', async () => {
        logger.info('🛑 SIGTERM recibido, cerrando Prisma...');
        await PrismaService.disconnect();
        process.exit(0);
      });

      // ⭐ Test de conexión inicial
      PrismaService.testConnection();
    }

    return PrismaService.instance;
  }

  /**
   * ⭐ Test de conexión inicial
   */
  private static async testConnection(): Promise<void> {
    try {
      await PrismaService.instance.$connect();
      logger.success('✅ PostgreSQL conectado exitosamente');
    } catch (error: any) {
      logger.error(`❌ Error al conectar a PostgreSQL: ${error.message}`);
      await PrismaService.handleConnectionError();
    }
  }

  /**
   * ⭐ Reconexión automática cuando se detecta error
   */
  private static async handleConnectionError(): Promise<void> {
    if (PrismaService.reconnectAttempts >= PrismaService.MAX_RECONNECT_ATTEMPTS) {
      logger.error(
        `❌ Máximo de intentos de reconexión alcanzado (${PrismaService.MAX_RECONNECT_ATTEMPTS}).  Saliendo...`
      );
      process.exit(1);
    }

    PrismaService.reconnectAttempts++;
    logger.warn(
      `⚠️ Intentando reconectar a PostgreSQL (${PrismaService.reconnectAttempts}/${PrismaService.MAX_RECONNECT_ATTEMPTS})...`
    );

    await new Promise((resolve) => setTimeout(resolve, PrismaService.RECONNECT_INTERVAL));

    try {
      // Desconectar instancia anterior
      await PrismaService.instance.$disconnect();

      // Reconectar
      await PrismaService.instance.$connect();

      logger.success('✅ Reconexión a PostgreSQL exitosa');
      PrismaService.reconnectAttempts = 0; // Reset contador
    } catch (error: any) {
      logger.error(`❌ Reconexión fallida: ${error.message}`);
      await PrismaService.handleConnectionError(); // Retry recursivo
    }
  }

  /**
   * ⭐ Health check de conexión
   */
  static async healthCheck(): Promise<boolean> {
    try {
      await PrismaService.instance.$queryRaw`SELECT 1`;
      return true;
    } catch (error: any) {
      logger.error(`❌ PostgreSQL health check falló: ${error.message}`);
      return false;
    }
  }

  /**
   * Desconectar Prisma
   */
  static async disconnect(): Promise<void> {
    if (PrismaService.instance) {
      try {
        logger.info('🔌 Desconectando Prisma...');
        await PrismaService.instance.$disconnect();
        logger.success('✅ Prisma desconectado correctamente');
      } catch (error: any) {
        logger.error(`❌ Error al desconectar Prisma: ${error.message}`);
      }
    }
  }
}

export const prisma = PrismaService.getInstance();
export default PrismaService;
