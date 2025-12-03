import dotenv from 'dotenv';
import { EnvConfig } from '../types';

dotenv.config();

const requiredEnvVars = ['NODE_ENV', 'PORT', 'NUMERO_DUENO'];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error('Variable de entorno requerida no encontrada: ' + envVar);
  }
}

export const env: EnvConfig = {
  NODE_ENV: (process.env.NODE_ENV as 'development' | 'production') || 'development',
  PORT: parseInt(process.env.PORT || '3000', 10),
  DATABASE_URL: process.env.DATABASE_URL || '',
  REDIS_URL: process.env. REDIS_URL || '',
  JWT_SECRET: process.env.JWT_SECRET || 'temporal_secret',
  JWT_EXPIRATION: process.env.JWT_EXPIRATION || '7d',
  NUMERO_DUENO: process.env.NUMERO_DUENO! ,
  SESSION_PATH: process.env.SESSION_PATH || '. /. wwebjs_auth',
  CACHE_PATH: process.env.CACHE_PATH || './.wwebjs_cache',
  DATA_DIR: process.env.DATA_DIR || './data',
  LOGS_DIR: process.env. LOGS_DIR || './logs',
  BACKUP_DIR: process.env. BACKUP_DIR || './backups'
};

console.log('Configuracion cargada:');
console.log('  NODE_ENV:', env.NODE_ENV);
console.log('  PORT:', env.PORT);
console.log('  NUMERO_DUENO:', env.NUMERO_DUENO);
console.log('  DATA_DIR:', env.DATA_DIR);
