/**
 * ═══════════════════════════════════════════════════════════════
 * REDIS CONFIGURATION - UPSTASH
 * ═══════════════════════════════════════════════════════════════
 */

import './env'; // ⚠️ Cargar env primero para que dotenv. config() se ejecute
import Redis from 'ioredis';

// Leer REDIS_URL después de que env.ts cargó dotenv
const redisUrl = process.env.REDIS_URL;

let redis: Redis | null = null;
let redisClient: Redis | null = null;
let redisSubscriber: Redis | null = null;

if (redisUrl) {
  console.log('🔧 Configurando Redis/Upstash...');
  console.log(`   URL: ${redisUrl.replace(/:([^@]+)@/, ':****@')}`);

  const redisConfig = {
    // TLS requerido para rediss://
    tls: redisUrl.startsWith('rediss://')
      ? { rejectUnauthorized: false } // Upstash requiere esto
      : undefined,

    maxRetriesPerRequest: 3,
    enableReadyCheck: true, // ⬅️ CAMBIO: true para verificar conexión
    connectTimeout: 10000,
    // lazyConnect: true,    // ⬅️ REMOVIDO - conectar inmediatamente

    retryStrategy(times: number) {
      if (times > 3) {
        console.error('❌ Redis: Máximo de reintentos alcanzado');
        return null; // Detener reintentos
      }
      const delay = Math.min(times * 50, 2000);
      console.log(`⚠️ Redis: Reintento ${times} en ${delay}ms`);
      return delay;
    },
  };

  try {
    // Cliente Redis principal
    redis = new Redis(redisUrl, redisConfig);

    // Clientes para Bull (pub/sub)
    redisClient = new Redis(redisUrl, redisConfig);
    redisSubscriber = new Redis(redisUrl, redisConfig);

    // ═══════════════════════════════════════════════════════════
    // Event Handlers
    // ═══════════════════════════════════════════════════════════

    redis.on('connect', () => {
      console.log('🔌 Redis conectando.. .');
    });

    redis.on('ready', () => {
      console.log('✅ Redis listo para usar');
    });

    redis.on('error', (err) => {
      console.error('❌ Redis error:', err.message);
      // No hacer exit, solo loguear el error
    });

    redis.on('close', () => {
      console.warn('⚠️ Redis conexión cerrada');
    });

    redis.on('reconnecting', () => {
      console.log('🔄 Redis reconectando...');
    });

    // ═══════════════════════════════════════════════════════════
    // Test de conexión inicial (opcional pero recomendado)
    // ═══════════════════════════════════════════════════════════

    redis
      .ping()
      .then(() => {
        console.log('✅ Redis PING exitoso - Conexión verificada');
      })
      .catch((err) => {
        console.error('❌ Redis PING falló:', err.message);
      });
  } catch (error: any) {
    console.error('❌ Error inicializando Redis:', error.message);
    redis = null;
    redisClient = null;
    redisSubscriber = null;
  }
} else {
  console.warn('⚠️ REDIS_URL no configurado.  Cache deshabilitado.');
  console.warn('   El sistema funcionará sin cache (más lento).');
}

// ═══════════════════════════════════════════════════════════
// Helper function para verificar conexión
// ═══════════════════════════════════════════════════════════

export async function checkRedisConnection(): Promise<{
  connected: boolean;
  latency?: number;
  error?: string;
}> {
  if (!redis) {
    return { connected: false, error: 'Redis not configured' };
  }

  try {
    const start = Date.now();
    await redis.ping();
    const latency = Date.now() - start;

    return { connected: true, latency };
  } catch (error: any) {
    return { connected: false, error: error.message };
  }
}

export { redis, redisClient, redisSubscriber };
export default redis;
