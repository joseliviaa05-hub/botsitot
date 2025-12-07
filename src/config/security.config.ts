// ═══════════════════════════════════════════════════════════════
// SECURITY CONFIGURATION
// Helmet.js y security headers
// ═══════════════════════════════════════════════════════════════

import { env } from './env';

// ─────────────────────────────────────────────────────────────
// Content Security Policy (CSP)
// ─────────────────────────────────────────────────────────────

const CSP_DIRECTIVES = {
  defaultSrc: ["'self'"],
  
  scriptSrc: [
    "'self'",
    "'unsafe-inline'", // Necesario para algunos frameworks
    'https://cdn. jsdelivr.net',
    'https://unpkg.com',
  ],
  
  styleSrc: [
    "'self'",
    "'unsafe-inline'",
    'https://fonts. googleapis.com',
    'https://cdn.jsdelivr.net',
  ],
  
  fontSrc: [
    "'self'",
    'https://fonts.gstatic.com',
    'data:',
  ],
  
  imgSrc: [
    "'self'",
    'data:',
    'https:',
    'blob:',
  ],
  
  connectSrc: [
    "'self'",
    'https://api.openai.com',
    'wss:', // WebSockets (WhatsApp)
  ],
  
  frameSrc: ["'none'"],
  objectSrc: ["'none'"],
  ...(env.NODE_ENV === 'production' && { upgradeInsecureRequests: [] }),
};

// ─────────────────────────────────────────────────────────────
// Helmet Configuration
// ─────────────────────────────────────────────────────────────

export const helmetOptions = {
  // Content Security Policy
  contentSecurityPolicy: {
    directives: CSP_DIRECTIVES,
  },

  // X-DNS-Prefetch-Control
  dnsPrefetchControl: {
    allow: false,
  },

  // X-Frame-Options
  frameguard: {
    action: 'deny' as const,
  },

  // Hide X-Powered-By
  hidePoweredBy: true,

  // Strict-Transport-Security (HTTPS only)
  hsts: {
    maxAge: 31536000, // 1 año
    includeSubDomains: true,
    preload: true,
  },

  // X-Download-Options
  ieNoOpen: true,

  // X-Content-Type-Options
  noSniff: true,

  // Referrer-Policy
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin' as const,
  },

  // X-XSS-Protection
  xssFilter: true,
};

// ─────────────────────────────────────────────────────────────
// Helmet para desarrollo (más permisivo)
// ─────────────────────────────────────────────────────────────

export const helmetDevOptions = {
  contentSecurityPolicy: false, // Desactivar en dev
  hsts: false, // No HTTPS en dev
  hidePoweredBy: true,
  noSniff: true,
  xssFilter: true,
};

// ─────────────────────────────────────────────────────────────
// Export final según ambiente
// ─────────────────────────────────────────────────────────────

export const finalHelmetOptions =
  env.NODE_ENV === 'development' ? helmetDevOptions : helmetOptions;