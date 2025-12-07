// ═══════════════════════════════════════════════════════════════
// SECURITY MIDDLEWARE
// Sanitization, XSS protection, etc.
// ═══════════════════════════════════════════════════════════════

import { Request, Response, NextFunction } from 'express';
import mongoSanitize from 'express-mongo-sanitize';
const xss = require('xss-clean');
import hpp from 'hpp';

// ─────────────────────────────────────────────────────────────
// NoSQL Injection Prevention
// ─────────────────────────────────────────────────────────────

export const sanitizeNoSQL = mongoSanitize({
  // Reemplazar caracteres prohibidos
  replaceWith: '_',
  
  // Remover completamente (alternativa)
  // onSanitize: ({ req, key }) => {
  //   console.warn(`⚠️ Sanitized: ${key} in ${req.method} ${req. path}`);
  // },
});

// ─────────────────────────────────────────────────────────────
// XSS Protection
// ─────────────────────────────────────────────────────────────

export const sanitizeXSS = xss();

// ─────────────────────────────────────────────────────────────
// HTTP Parameter Pollution Prevention
// ─────────────────────────────────────────────────────────────

export const preventHPP = hpp({
  // Parámetros que SÍ pueden estar duplicados
  whitelist: [
    'sort',
    'fields',
    'page',
    'limit',
    'filter',
    'categoria',
    'estado',
  ],
});

// ─────────────────────────────────────────────────────────────
// Security Headers Middleware
// ─────────────────────────────────────────────────────────────

export const securityHeaders = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // X-Content-Type-Options
  res. setHeader('X-Content-Type-Options', 'nosniff');

  // X-Frame-Options
  res.setHeader('X-Frame-Options', 'DENY');

  // X-XSS-Protection
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Permissions-Policy
  res.setHeader(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=()'
  );

  // Referrer-Policy
  res. setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  next();
};

// ─────────────────────────────────────────────────────────────
// Request Size Limit
// ─────────────────────────────────────────────────────────────

export const limitRequestSize = (maxSize: string = '10mb') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const contentLength = req.headers['content-length'];
    
    if (contentLength) {
      const sizeInMB = parseInt(contentLength) / (1024 * 1024);
      const maxSizeInMB = parseInt(maxSize);
      
      if (sizeInMB > maxSizeInMB) {
        res. status(413).json({
          error: 'Payload Too Large',
          message: `Request size exceeds ${maxSize}`,
        });
        return;
      }
    }
    
    next();
  };
};

// ─────────────────────────────────────────────────────────────
// Sanitize User Input (custom)
// ─────────────────────────────────────────────────────────────

export const sanitizeInput = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Sanitizar body
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }

  // Sanitizar query params
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }

  // Sanitizar params
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }

  next();
};

// ─────────────────────────────────────────────────────────────
// Helper: Sanitize Object
// ─────────────────────────────────────────────────────────────

function sanitizeObject(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  const sanitized: any = Array.isArray(obj) ? [] : {};

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];

      // Recursivo para objetos anidados
      if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeObject(value);
      }
      // Strings: trim y básico
      else if (typeof value === 'string') {
        sanitized[key] = value.trim();
      }
      // Otros tipos
      else {
        sanitized[key] = value;
      }
    }
  }

  return sanitized;
}

// ─────────────────────────────────────────────────────────────
// Export all security middlewares
// ─────────────────────────────────────────────────────────────

export const securityMiddlewares = [
  sanitizeNoSQL,
  sanitizeXSS,
  preventHPP,
  securityHeaders,
  sanitizeInput,
];