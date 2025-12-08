// ═══════════════════════════════════════════════════════════════
// INDEX. TS - Application Entry Point
// ═══════════════════════════════════════════════════════════════

import { env } from './config/env';
import { logger } from './utils/logger';
import { server } from './server';
import { prisma } from './config/database';
import { redis } from './config/redis.config';

async function bootstrap() {
  try {
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.info('  BOTSITOT v2.0 - Iniciando Aplicación');
    logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.info('');
    logger.info(`🌍 Entorno: ${env.NODE_ENV}`);
    logger.info(`🚀 Puerto: ${env.PORT}`);
    logger.info('');

    // ═══════════════════════════════════════════════════════════
    // 1. DATABASE CONNECTION
    // ═══════════════════════════════════════════════════════════
    logger.info('[1/3] Conectando a la base de datos...');

    try {
      await prisma.$connect();
      logger.success('✅ Base de datos conectada (PostgreSQL)');
    } catch (error) {
      logger.error('❌ Error conectando a la base de datos:', error);
      throw error;
    }

    logger.info('');

    // ═══════════════════════════════════════════════════════════
    // 2. REDIS CONNECTION
    // ═══════════════════════════════════════════════════════════
    logger.info('[2/3] Conectando a Redis...');

    try {
      await redis.ping();
      logger.success('✅ Redis conectado (Upstash)');
    } catch (error) {
      logger.error('❌ Error conectando a Redis:', error);
      throw error;
    }

    logger.info('');

    // ═══════════════════════════════════════════════════════════
    // 3. WHATSAPP SERVICE (DISABLED IN PRODUCTION)
    // ═══════════════════════════════════════════════════════════
    logger.info('[3/3] WhatsApp Service.. .');

    if (env.NODE_ENV === 'production') {
      logger.info('⚠️  WhatsApp desactivado en producción');
      logger.info('💡 El bot debe ejecutarse localmente con: npm run whatsapp');
    } else {
      logger.info('⚠️  WhatsApp NO se inicia automáticamente');
      logger.info('💡 Para iniciar el bot: npm run whatsapp');
    }

    logger.info('');

    // ═══════════════════════════════════════════════════════════
    // 4. START SERVER
    // ═══════════════════════════════════════════════════════════
    server.start();

    logger.info('');
    logger.success('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.success('  ✅ API REST INICIADA CORRECTAMENTE');
    logger.success('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.info('');
    logger.info('📊 Componentes activos:');
    logger.info('   ✅ Express Server');
    logger.info('   ✅ PostgreSQL (Neon)');
    logger.info('   ✅ Redis (Upstash)');
    logger.info('   ⚠️  WhatsApp Bot (ejecutar localmente)');
    logger.info('');

    if (env.NODE_ENV === 'production') {
      logger.info(
        `🌐 API disponible en: ${process.env.RENDER_EXTERNAL_URL || 'https://botsitot-1.onrender.com'}`
      );
    } else {
      logger.info(`🌐 API disponible en: http://localhost:${env.PORT}`);
    }

    logger.info('');
  } catch (error) {
    logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.error('❌ Error fatal al iniciar la aplicación');
    logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.error(error);
    process.exit(1);
  }
}

// ═══════════════════════════════════════════════════════════════
// GRACEFUL SHUTDOWN
// ═══════════════════════════════════════════════════════════════

process.on('SIGTERM', async () => {
  logger.info('');
  logger.info('🛑 SIGTERM recibido.  Cerrando aplicación...');

  try {
    await prisma.$disconnect();
    logger.info('✅ PostgreSQL desconectado');

    await redis.disconnect();
    logger.info('✅ Redis desconectado');

    logger.success('✅ Aplicación cerrada correctamente');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error durante el cierre:', error);
    process.exit(1);
  }
});

process.on('SIGINT', async () => {
  logger.info('');
  logger.info('🛑 SIGINT recibido. Cerrando aplicación...');

  try {
    await prisma.$disconnect();
    logger.info('✅ PostgreSQL desconectado');

    await redis.disconnect();
    logger.info('✅ Redis desconectado');

    logger.success('✅ Aplicación cerrada correctamente');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error durante el cierre:', error);
    process.exit(1);
  }
});

// ═══════════════════════════════════════════════════════════════
// PROCESS ERROR HANDLERS
// ═══════════════════════════════════════════════════════════════

process.on('unhandledRejection', (reason, promise) => {
  logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  logger.error('❌ Unhandled Rejection');
  logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  logger.error('Promise:', promise);
  logger.error('Reason:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  logger.error('❌ Uncaught Exception');
  logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  logger.error(error);
  process.exit(1);
});

// ═══════════════════════════════════════════════════════════════
// START APPLICATION
// ═══════════════════════════════════════════════════════════════

bootstrap();
