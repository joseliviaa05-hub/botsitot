import { env } from './config/env';
import { logger } from './utils/logger';
import { whatsappService } from './services/whatsapp.service';
import { server } from './server';

async function main() {
  try {
    logger.info('========================================');
    logger.info('    BOTSITOT v2.0 - Iniciando...         ');
    logger.info('========================================');
    logger.info('Entorno: ' + env.NODE_ENV);
    logger.info('Puerto: ' + env.PORT);

    logger.info('');
    logger.info('[1/2] Inicializando WhatsApp...');
    await whatsappService.initialize();

    logger.info('');
    logger.info('[2/2] Inicializando servidor API...');
    server.start();

    logger.info('');

    // Determinar host y URL base
    const host = process.env.NODE_ENV === 'production' ? '0.0. 0.0' : 'localhost';
    const publicUrl = process.env.RENDER_EXTERNAL_URL || `http://${host}:${env.PORT}`;

    logger.success('========================================');
    logger.success('  SISTEMA COMPLETO INICIADO           ');
    logger.success('  - API REST: ' + publicUrl);
    logger.success('  - WhatsApp Bot: CONECTADO           ');
    logger.success('  - Base de datos: PostgreSQL         ');
    logger.success('  - Cache: Redis (Upstash)            ');
    logger.success('========================================');
  } catch (error) {
    logger.error('Error al iniciar BOTSITOT', error as Error);
    process.exit(1);
  }
}

// ─────────────────────────────────────────────────────────────
// Process Error Handlers
// ─────────────────────────────────────────────────────────────

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise);
  logger.error('Reason:', String(reason));
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

main();
