// ═══════════════════════════════════════════════════════════════
// CORS CONFIGURATION
// Configuración avanzada de CORS
// ═══════════════════════════════════════════════════════════════

import { CorsOptions } from 'cors';
import { env } from './env';

// ─────────────────────────────────────────────────────────────
// Origins permitidos
// ─────────────────────────────────────────────────────────────

const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173', // Vite
  'http://localhost:4200', // Angular
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5173',
];

// En producción, agregar dominio real desde .  env si existe
if (env.NODE_ENV === 'production') {
  // TODO: Agregar FRONTEND_URL a EnvConfig y .  env si es necesario
  // ALLOWED_ORIGINS.push(env.FRONTEND_URL);
}

// ─────────────────────────────────────────────────────────────
// Configuración CORS
// ─────────────────────────────────────────────────────────────

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Permitir requests sin origin (mobile apps, Postman, curl)
    if (!origin) {
      return callback(null, true);
    }

    // Verificar si el origin está permitido
    if (ALLOWED_ORIGINS. includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS bloqueado: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },

  // Credentials (cookies, authorization headers)
  credentials: true,

  // Métodos HTTP permitidos
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

  // Headers permitidos
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-API-Key',
    'Accept',
    'Origin',
  ],

  // Headers expuestos al cliente
  exposedHeaders: [
    'X-Total-Count',
    'X-Page',
    'X-Per-Page',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining',
    'X-RateLimit-Reset',
  ],

  // Preflight cache (segundos)
  maxAge: 86400, // 24 horas

  // No pasar status 204 en preflight
  optionsSuccessStatus: 200,
};

// ─────────────────────────────────────────────────────────────
// CORS para desarrollo (más permisivo)
// ─────────────────────────────────────────────────────────────

export const corsDevOptions: CorsOptions = {
  origin: true, // Permitir cualquier origin
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-API-Key'],
  exposedHeaders: ['X-Total-Count', 'X-RateLimit-Limit'],
  maxAge: 86400,
  optionsSuccessStatus: 200,
};

// ─────────────────────────────────────────────────────────────
// Export final según ambiente
// ─────────────────────────────────────────────────────────────

export const finalCorsOptions =
  env.NODE_ENV === 'development' ?  corsDevOptions : corsOptions;