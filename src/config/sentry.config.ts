// ═══════════════════════════════════════════════════════════════
// SENTRY CONFIGURATION
// Error Tracking & Performance Monitoring
// ═══════════════════════════════════════════════════════════════

import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { env } from './env';
import { Application } from 'express';

// ─────────────────────────────────────────────────────────────
// Initialize Sentry
// ─────────────────────────────────────────────────────────────

export const initSentry = (app: Application): void => {
  // Solo inicializar en producción o si está configurado el DSN
  if (!process.env.SENTRY_DSN) {
    console.log('⚠️  Sentry DSN no configurado - Error tracking deshabilitado');
    return;
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: env.NODE_ENV,
    release: `botsitot@${process.env.npm_package_version || '2.0.0'}`,

    // ═══════════════════════════════════════════════════════════
    // Performance Monitoring
    // ═══════════════════════════════════════════════════════════

    tracesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0, // 10% en prod, 100% en dev

    // ═══════════════════════════════════════════════════════════
    // Profiling
    // ═══════════════════════════════════════════════════════════

    profilesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0,

    integrations: [
      // HTTP integration
      Sentry.httpIntegration(),

      // Express integration
      Sentry.expressIntegration(),

      // Node profiling
      nodeProfilingIntegration(),
    ],

    // ═══════════════════════════════════════════════════════════
    // Filtros
    // ═══════════════════════════════════════════════════════════

    beforeSend(event, hint) {
      // Filtrar errores conocidos que no son críticos
      const error = hint.originalException as Error;

      // No enviar a Sentry errores de validación
      if (error?.name === 'ValidationError') {
        return null;
      }

      // No enviar 404s
      if (event.message?.includes('404')) {
        return null;
      }

      return event;
    },

    // ═══════════════════════════════════════════════════════════
    // Configuración adicional
    // ═══════════════════════════════════════════════════════════

    // Incluir código fuente en stack traces (útil para debugging)
    includeLocalVariables: env.NODE_ENV !== 'production',

    // Cantidad de breadcrumbs a mantener
    maxBreadcrumbs: 50,

    // Attachments (screenshots, logs, etc)
    attachStacktrace: true,
  });

  // Setup Express error handler
  Sentry.setupExpressErrorHandler(app);

  console.log('✅ Sentry inicializado - Error tracking habilitado');
};

// ─────────────────────────────────────────────────────────────
// Manual Error Capture
// ─────────────────────────────────────────────────────────────

export const captureException = (error: Error, context?: any) => {
  if (!process.env.SENTRY_DSN) return;

  Sentry.captureException(error, {
    contexts: {
      custom: context,
    },
  });
};

export const captureMessage = (message: string, level: Sentry.SeverityLevel = 'info') => {
  if (!process.env.SENTRY_DSN) return;

  Sentry.captureMessage(message, level);
};

// ─────────────────────────────────────────────────────────────
// Set User Context
// ─────────────────────────────────────────────────────────────

export const setUserContext = (user: { id: string; username?: string; email?: string }) => {
  if (!process.env.SENTRY_DSN) return;

  Sentry.setUser({
    id: user.id,
    username: user.username,
    email: user.email,
  });
};

// ─────────────────────────────────────────────────────────────
// Performance Monitoring
// ─────────────────────────────────────────────────────────────

export const startSpan = (name: string, op: string, callback: () => any) => {
  if (!process.env.SENTRY_DSN) return callback();

  return Sentry.startSpan({ name, op }, callback);
};

export { Sentry };
