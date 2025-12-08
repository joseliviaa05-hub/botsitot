// ═══════════════════════════════════════════════════════════════
// START-WHATSAPP.TS - WhatsApp Bot Standalone (Local Mode)
// ═══════════════════════════════════════════════════════════════

import { logger } from './utils/logger';
import { whatsappService } from './services/whatsapp.service';

async function startWhatsAppBot() {
  logger.success('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  logger.success('  🤖 BOTSITOT - WhatsApp Bot (Local Mode)');
  logger.success('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  logger.info('');
  logger.info('🚀 Iniciando WhatsApp Bot localmente...');
  logger.info('📡 API REST: https://botsitot-1.onrender.com');
  logger.info('💾 Sesión guardada en: .wwebjs_auth/');
  logger.info('');
  logger.info('⏳ Esperando conexión...');
  logger.info('');

  try {
    await whatsappService.initialize();

    logger.info('');
    logger.success('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.success('✅ WhatsApp Bot iniciado correctamente');
    logger.success('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.info('');
    logger.info('📱 Bot conectado y listo para recibir mensajes');
    logger.info('🔄 El bot se mantendrá activo hasta que lo detengas');
    logger.info('🛑 Presiona Ctrl+C para detener el bot');
    logger.info('');
  } catch (error) {
    logger.error('');
    logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.error('❌ Error al iniciar WhatsApp Bot');
    logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    logger.error(String(error));
    logger.info('');
    logger.info('💡 Posibles soluciones:');
    logger.info('   1. Verifica tu conexión a internet');
    logger.info('   2. Asegúrate de tener WhatsApp instalado en tu teléfono');
    logger.info('   3. Elimina la carpeta .wwebjs_auth/ y vuelve a intentar');
    logger.info('');
    process.exit(1);
  }
}

// ═══════════════════════════════════════════════════════════════
// GRACEFUL SHUTDOWN HANDLERS
// ═══════════════════════════════════════════════════════════════

process.on('SIGINT', async () => {
  logger.info('');
  logger.info('🛑 Deteniendo WhatsApp Bot...');

  try {
    await whatsappService.destroy();
    logger.success('✅ Bot detenido correctamente');
    logger.info('💾 Sesión guardada en: .wwebjs_auth/');
    logger.info('');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error al detener bot');
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  logger.info('');
  logger.info('🛑 Deteniendo WhatsApp Bot (SIGTERM)...');

  try {
    await whatsappService.destroy();
    logger.success('✅ Bot detenido correctamente');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error al detener bot');
    process.exit(1);
  }
});

// ═══════════════════════════════════════════════════════════════
// ERROR HANDLERS
// ═══════════════════════════════════════════════════════════════

process.on('unhandledRejection', (reason) => {
  logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  logger.error('❌ Unhandled Rejection en WhatsApp Bot');
  logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  logger.error(String(reason));
  logger.info('');
  logger.info('⚠️  El bot continuará ejecutándose...');
  logger.info('');
});

process.on('uncaughtException', (error: Error) => {
  logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  logger.error('❌ Uncaught Exception en WhatsApp Bot');
  logger.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  logger.error(error.message);
  logger.info('');
  logger.info('🛑 Deteniendo bot por error crítico...');
  process.exit(1);
});

// ═══════════════════════════════════════════════════════════════
// START WHATSAPP BOT
// ═══════════════════════════════════════════════════════════════

startWhatsAppBot();
