// ═══════════════════════════════════════════════════════════════
// WINSTON LOGGER - Advanced Logging System
// ═══════════════════════════════════════════════════════════════

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import fs from 'fs';
import { env } from '../config/env';

// ─────────────────────────────────────────────────────────────
// Ensure Logs Directory Exists
// ─────────────────────────────────────────────────────────────

const logsDir = env.LOGS_DIR || './logs';
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// ─────────────────────────────────────────────────────────────
// Log Levels
// ─────────────────────────────────────────────────────────────

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
  success: 5,
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'cyan',
  http: 'magenta',
  debug: 'white',
  success: 'green',
};

winston.addColors(colors);

// ─────────────────────────────────────────────────────────────
// Formato para Development (bonito y legible)
// ─────────────────────────────────────────────────────────────

const devFormat = winston.format.combine(
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;
    let msg = `${timestamp} [${level}]: ${message}`;

    // Si hay metadata adicional, agregarla
    if (Object.keys(meta).length > 0 && meta.stack === undefined) {
      msg += `\n${JSON.stringify(meta, null, 2)}`;
    }

    // Si hay stack trace (error), mostrarlo
    if (meta.stack) {
      msg += `\n${meta.stack}`;
    }

    return msg;
  })
);

// ─────────────────────────────────────────────────────────────
// Formato para Production (JSON estructurado)
// ─────────────────────────────────────────────────────────────

const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// ─────────────────────────────────────────────────────────────
// Transports
// ─────────────────────────────────────────────────────────────

const transports: winston.transport[] = [
  // Console (siempre activo)
  new winston.transports.Console({
    format: env.NODE_ENV === 'production' ? prodFormat : devFormat,
  }),
];

// Archivos con rotación (en development y production)
if (env.NODE_ENV === 'production' || process.env.ENABLE_FILE_LOGS === 'true') {
  // Logs de errores (solo errores)
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxFiles: '30d', // Mantener 30 días
      maxSize: '20m', // Máximo 20MB por archivo
      format: prodFormat,
      zippedArchive: true,
    })
  );

  // Logs combinados (todo)
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxFiles: '14d', // Mantener 14 días
      maxSize: '20m',
      format: prodFormat,
      zippedArchive: true,
    })
  );

  // Logs HTTP (requests)
  transports.push(
    new DailyRotateFile({
      filename: path.join(logsDir, 'http-%DATE%. log'),
      datePattern: 'YYYY-MM-DD',
      level: 'http',
      maxFiles: '7d', // Mantener 7 días
      maxSize: '10m',
      format: prodFormat,
      zippedArchive: true,
    })
  );
}

// ─────────────────────────────────────────────────────────────
// Create Logger Instance
// ─────────────────────────────────────────────────────────────

const loggerInstance = winston.createLogger({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  levels,
  transports,
  exitOnError: false,
});

// ─────────────────────────────────────────────────────────────
// Custom Logger Class (mantener compatibilidad con código existente)
// ─────────────────────────────────────────────────────────────

class Logger {
  info(message: string, meta?: any): void {
    loggerInstance.info(message, meta);
  }

  success(message: string, meta?: any): void {
    loggerInstance.log('success', message, meta);
  }

  warn(message: string, meta?: any): void {
    loggerInstance.warn(message, meta);
  }

  error(message: string, err?: Error | any): void {
    if (err instanceof Error) {
      loggerInstance.error(message, {
        error: {
          name: err.name,
          message: err.message,
          stack: err.stack,
        },
      });
    } else if (err) {
      loggerInstance.error(message, { error: err });
    } else {
      loggerInstance.error(message);
    }
  }

  debug(message: string, meta?: any): void {
    loggerInstance.debug(message, meta);
  }

  http(message: string, meta?: any): void {
    loggerInstance.log('http', message, meta);
  }
}

// ─────────────────────────────────────────────────────────────
// Helper Functions
// ─────────────────────────────────────────────────────────────

// Error Logger
export const logError = (error: Error, context?: any): void => {
  loggerInstance.error(error.message, {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    context,
    timestamp: new Date().toISOString(),
  });
};

// Performance Logger
export const logPerformance = (operation: string, duration: number, metadata?: any): void => {
  const level = duration > 1000 ? 'warn' : 'debug';
  loggerInstance[level](`Performance: ${operation}`, {
    operation,
    duration: `${duration}ms`,
    ...metadata,
  });
};

// Database Query Logger
export const logQuery = (query: string, duration: number, params?: any): void => {
  if (env.NODE_ENV === 'development') {
    loggerInstance.debug(`DB Query: ${query}`, {
      query,
      duration: `${duration}ms`,
      params,
    });
  }
};

// Request Logger Middleware
export const requestLogger = (req: any, res: any, next: any): void => {
  const start = Date.now();

  // Log cuando termina la respuesta
  res.on('finish', () => {
    const duration = Date.now() - start;
    const statusColor = res.statusCode >= 400 ? 'error' : 'http';

    loggerInstance[statusColor](`${req.method} ${req.path}`, {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      userId: req.usuario?.id || 'anonymous',
    });
  });

  next();
};

// ─────────────────────────────────────────────────────────────
// Export Logger Instance
// ─────────────────────────────────────────────────────────────

export const logger = new Logger();
export { loggerInstance };
export default logger;
