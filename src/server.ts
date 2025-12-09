// ═══════════════════════════════════════════════════════════════
// SERVER. TS - Express Server Setup
// ═══════════════════════════════════════════════════════════════

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import { initSentry } from './config/sentry.config';
import { logger, requestLogger } from './utils/logger';
import { env } from './config/env';
import { finalCorsOptions } from './config/cors.config';
import { finalHelmetOptions } from './config/security.config';
import { securityMiddlewares } from './middleware/security.middleware';
import { authLimiter } from './middleware/rateLimiter';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

// Routes
import pedidosRoutes from './routes/pedidos.routes';
import productosRoutes from './routes/productos.routes';
import clientesRoutes from './routes/clientes.routes';
import statsRoutes from './routes/stats.routes';
import whatsappRoutes from './routes/whatsapp.routes';
import authRoutes from './routes/auth.routes';
import healthRoutes from './routes/health.routes';

// ─────────────────────────────────────────────────────────────
// Server Class
// ─────────────────────────────────────────────────────────────

class Server {
  private app: Application;
  private port: number;

  constructor() {
    this.app = express();
    this.port = env.PORT;

    // Inicializar Sentry (primero de todo, configura middleware internamente)
    initSentry(this.app);

    this.setupMiddlewares();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  // ─────────────────────────────────────────────────────────────
  // Setup Middlewares
  // ─────────────────────────────────────────────────────────────

  private setupMiddlewares(): void {
    // ═══════════════════════════════════════════════════════════
    // 🛡️ SECURITY MIDDLEWARES (ORDEN IMPORTANTE)
    // ═══════════════════════════════════════════════════════════

    // 1. Helmet - Security Headers (con excepción para Swagger)
    const helmetConfig = {
      ...finalHelmetOptions,
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https://validator.swagger.io'],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          frameSrc: ["'none'"],
        },
      },
    };

    this.app.use(helmet(helmetConfig));
    logger.info('✅ Helmet security headers habilitados');

    // 2.  CORS - Cross-Origin Resource Sharing
    this.app.use(cors(finalCorsOptions));
    logger.info('✅ CORS configurado');

    // 3.  Sanitization - NoSQL Injection, XSS, HPP
    this.app.use(securityMiddlewares);
    logger.info('✅ Input sanitization habilitado (NoSQL, XSS, HPP)');

    // ═══════════════════════════════════════════════════════════
    // 📦 BODY PARSING
    // ═══════════════════════════════════════════════════════════

    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // ═══════════════════════════════════════════════════════════
    // 🚦 RATE LIMITING
    // ═══════════════════════════════════════════════════════════

    this.app.use(authLimiter);
    logger.info('✅ Rate limiting habilitado');

    // ═══════════════════════════════════════════════════════════
    // 📝 REQUEST LOGGING (Winston)
    // ═══════════════════════════════════════════════════════════

    this.app.use(requestLogger);
    logger.info('✅ Request logging habilitado');
  }

  // ─────────────────────────────────────────────────────────────
  // Setup Routes
  // ─────────────────────────────────────────────────────────────

  private setupRoutes(): void {
    // ═══════════════════════════════════════════════════════════
    // 🏥 HEALTH CHECK ROUTES
    // ═══════════════════════════════════════════════════════════

    this.app.use('/', healthRoutes);

    // Legacy health endpoint (mantener para compatibilidad)
    this.app.get('/api/status', (_req: Request, res: Response) => {
      res.json({
        whatsapp: 'connected', // TODO: obtener estado real
        server: 'running',
        version: '2.0.0',
        environment: env.NODE_ENV,
        timestamp: new Date().toISOString(),
      });
    });

    // ═══════════════════════════════════════════════════════════
    // 📚 SWAGGER API DOCUMENTATION
    // ═══════════════════════════════════════════════════════════

    this.app.use(
      '/api-docs',
      swaggerUi.serve,
      swaggerUi.setup(swaggerSpec, {
        customCss: `
          . swagger-ui .topbar { display: none }
          .swagger-ui .information-container { margin: 30px 0 }
          .swagger-ui .scheme-container { box-shadow: none; margin: 0 }
        `,
        customSiteTitle: 'BotSitot API Docs',
        customfavIcon: '/favicon.ico',
        swaggerOptions: {
          persistAuthorization: true,
          displayRequestDuration: true,
          filter: true,
          syntaxHighlight: {
            activate: true,
            theme: 'monokai',
          },
        },
      })
    );

    logger.info('✅ Swagger API Documentation disponible en /api-docs');

    // ═══════════════════════════════════════════════════════════
    // 🔐 API ROUTES
    // ═══════════════════════════════════════════════════════════

    // Auth routes (públicas y protegidas)
    this.app.use('/api/auth', authRoutes);

    // Rutas protegidas (requieren autenticación)
    this.app.use('/api/pedidos', pedidosRoutes);
    this.app.use('/api/productos', productosRoutes);
    this.app.use('/api/clientes', clientesRoutes);
    this.app.use('/api/stats', statsRoutes);
    this.app.use('/api/whatsapp', whatsappRoutes);

    logger.info('✅ Rutas API configuradas');
  }

  // ─────────────────────────────────────────────────────────────
  // Setup Error Handling
  // ─────────────────────────────────────────────────────────────

  private setupErrorHandling(): void {
    // 404 - Not Found
    this.app.use(notFoundHandler);

    // Global Error Handler (Sentry ya está configurado en initSentry)
    this.app.use(errorHandler);

    logger.info('✅ Error handlers configurados');
  }

  // ─────────────────────────────────────────────────────────────
  // Start Server
  // ─────────────────────────────────────────────────────────────

  start(): void {
    this.app.listen(this.port, () => {
      logger.success('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logger.success('  BOTSITOT v2.0 - Servidor Express Iniciado');
      logger.success('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logger.info('');
      logger.info(`🌍 Entorno: ${env.NODE_ENV}`);
      logger.info(`🚀 Puerto: ${this.port}`);
      logger.info('');
      logger.info('📍 Endpoints disponibles:');
      logger.info(`   🏥 Health:           http://localhost:${this.port}/health`);
      logger.info(`   🏥 Health Detailed:  http://localhost:${this.port}/health/detailed`);
      logger.info(`   🏥 Readiness:        http://localhost:${this.port}/health/ready`);
      logger.info(`   🏥 Liveness:         http://localhost:${this.port}/health/live`);
      logger.info(`   📊 Status:           http://localhost:${this.port}/api/status`);
      logger.info(`   📚 API Docs:         http://localhost:${this.port}/api-docs`);
      logger.info('');
      logger.info('🔐 API Routes:');
      logger.info(`   🔑 Auth:      http://localhost:${this.port}/api/auth`);
      logger.info(`   📦 Productos: http://localhost:${this.port}/api/productos`);
      logger.info(`   📋 Pedidos:   http://localhost:${this.port}/api/pedidos`);
      logger.info(`   👥 Clientes:  http://localhost:${this.port}/api/clientes`);
      logger.info(`   📊 Stats:     http://localhost:${this.port}/api/stats`);
      logger.info(`   💬 WhatsApp:  http://localhost:${this.port}/api/whatsapp`);
      logger.info('');
      logger.success('✅ Servidor listo para recibir peticiones');
      logger.success('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    });
  }

  // ─────────────────────────────────────────────────────────────
  // Get Express App
  // ─────────────────────────────────────────────────────────────

  getApp(): Application {
    return this.app;
  }
}

// ─────────────────────────────────────────────────────────────
// Export Server Instance
// ─────────────────────────────────────────────────────────────

export const server = new Server();
