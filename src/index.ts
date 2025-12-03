import { env } from './config/env';
import { logger } from './utils/logger';
// import { whatsappService } from './services/whatsapp.service'; // DESHABILITADO TEMPORALMENTE
import { server } from './server';

async function main() {
  try {
    logger.info('========================================');
    logger.info('    BOTSITOT v2. 0 - Iniciando...       ');
    logger.info('========================================');
    logger.info('Entorno: ' + env.NODE_ENV);
    logger.info('Puerto: ' + env.PORT);

    // TODO: Descomentar cuando WhatsApp funcione
    // logger.info('');
    // logger.info('[1/2] Inicializando WhatsApp...');
    // await whatsappService.initialize();

    logger.info('');
    logger. info('Inicializando servidor API.. .');
    server.start();

    logger.info('');
    logger.success('========================================');
    logger.success('  SERVIDOR API INICIADO CORRECTAMENTE  ');
    logger. success('========================================');
  } catch (error) {
    logger.error('Error al iniciar BOTSITOT', error as Error);
    process.exit(1);
  }
}

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection: ' + String(reason));
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

main();
