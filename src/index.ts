import { env } from './config/env';
import { logger } from './utils/logger';
import { whatsappService } from './services/whatsapp.service';

async function main() {
  try {
    logger.info('Iniciando BOTSITOT.. .');
    logger.info('Entorno: ' + env.NODE_ENV);
    logger.info('Puerto: ' + env.PORT);

    // Inicializar WhatsApp
    await whatsappService.initialize();

    logger.success('BOTSITOT iniciado correctamente');
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
