/**
 * ═══════════════════════════════════════════════════════════════
 * TEST DE RATE LIMITING
 * ═══════════════════════════════════════════════════════════════
 */

import './config/env';
import { whatsappLimiter } from './middleware/rateLimiter';

async function testRateLimiting() {
  console.log('\n🧪 PROBANDO RATE LIMITING...\n');
  console.log('═'. repeat(60));

  const testPhone = '5491112345678';

  console.log(`\n📱 Testing con número: ${testPhone}\n`);

  // Test 1: Hacer 7 requests (límite es 5)
  console.log('1️⃣ Haciendo 7 requests (límite: 5)...\n');

  for (let i = 1; i <= 7; i++) {
    const result = await whatsappLimiter.canMakeRequest(testPhone);

    console.log(`   Request #${i}:`);
    console.log(`      ${result.allowed ? '✅' : '❌'} Permitido: ${result.allowed}`);
    console.log(`      📊 Restantes: ${result.remaining}`);
    console.log(`      ⏰ Reset: ${result.resetAt. toLocaleTimeString()}`);
    console. log('');

    if (i === 5) {
      console.log('   ⚠️ Límite alcanzado, siguientes requests serán bloqueados\n');
    }

    // Pequeña pausa
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Test 2: Ver estado
  console.log('\n2️⃣ Verificando estado actual...\n');
  const status = await whatsappLimiter.getStatus(testPhone);
  console.log(`   📊 Requests hechos: ${status.count}/${status.limit}`);
  console.log(`   ⏰ Reset en: ${status.resetAt?.toLocaleTimeString() || 'N/A'}\n`);

  // Test 3: Reset manual
  console.log('3️⃣ Reseteando límite...\n');
  await whatsappLimiter.reset(testPhone);
  console.log('   ✅ Límite reseteado\n');

  // Test 4: Verificar que se reseteó
  console.log('4️⃣ Verificando después del reset...\n');
  const afterReset = await whatsappLimiter.canMakeRequest(testPhone);
  console.log(`   ${afterReset.allowed ? '✅' : '❌'} Permitido: ${afterReset.allowed}`);
  console. log(`   📊 Restantes: ${afterReset.remaining}\n`);

  // Cleanup
  await whatsappLimiter.reset(testPhone);

  console.log('═'.repeat(60));
  console.log('\n✅ TESTS DE RATE LIMITING COMPLETADOS\n');
}

testRateLimiting()
  .then(() => process.exit(0))
  . catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });