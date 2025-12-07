/**
 * ═══════════════════════════════════════════════════════════════
 * TEST DE BULL QUEUES
 * ═══════════════════════════════════════════════════════════════
 */

import './config/env';
import queueService from './services/queue.service';
import { whatsappQueue } from './config/queue.config';

async function testQueues() {
  console.log('\n🧪 PROBANDO BULL QUEUES...\n');
  console.log('═'.repeat(60));

  if (!whatsappQueue) {
    console.error('❌ Queues no disponibles (Redis requerido)');
    process.exit(1);
  }

  try {
    // 1. Agregar job a WhatsApp queue
    console.log('\n1️⃣ Agregando mensaje a WhatsApp Queue...');
    const job = await queueService.addWhatsAppMessage({
      phoneNumber: '5491112345678',
      message: 'Hola!  Este es un test de Bull Queue',
      priority: 1,
    });
    console.log(`   ✅ Job creado: ${job?.id}\n`);

    // 2. Ver estadísticas
    console.log('2️⃣ Estadísticas de WhatsApp Queue.. .');
    const stats = await queueService.getQueueStats('whatsapp');
    console.log('   📊 Stats:', stats, '\n');

    // 3. Programar limpieza de cache
    console.log('3️⃣ Programando limpieza de cache...');
    const cleanupJob = await queueService.scheduleCacheCleanup({
      pattern: 'test:*',
    });
    console.log(`   ✅ Limpieza programada: ${cleanupJob?.id}\n`);

    // 4. Esperar un poco
    console.log('4️⃣ Esperando procesamiento...');
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // 5.  Ver stats finales
    console.log('\n5️⃣ Estadísticas finales.. .');
    const finalStats = await queueService.getQueueStats('whatsapp');
    console.log('   📊 Stats:', finalStats, '\n');

    console.log('═'.repeat(60));
    console.log('\n✅ TESTS DE QUEUES COMPLETADOS\n');
  } catch (error: any) {
    console.error('\n❌ ERROR:', error.message);
  } finally {
    process.exit(0);
  }
}

testQueues();
