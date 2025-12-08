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

    // ═══════════════════════════════════════════════════════════
    // 🔧 TRUST PROXY - NECESARIO PARA RENDER/RAILWAY/DOCKER
    // ═══════════════════════════════════════════════════════════
    // Render usa un proxy reverso (nginx) delante de tu app.
    // Sin esto, express-rate-limit no puede identificar IPs reales
    // y el header X-Forwarded-For causa errores.
    this.app.set('trust proxy', 1);
    logger.info('✅ Trust proxy habilitado (para deployment en Render)');

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

    // 3. Sanitization - NoSQL Injection, XSS, HPP
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

    // ═══════════════════════════════════════════════════════════
    // 🏠 ROOT ENDPOINT - LANDING PAGE
    // ═══════════════════════════════════════════════════════════
    // Agregar DESPUÉS de todas las otras rutas pero ANTES del 404
    this.app.get('/', (_req: Request, res: Response) => {
      res.status(200).send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1. 0">
          <title>BOTSITOT API</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 20px;
            }
            .container {
              background: white;
              border-radius: 20px;
              padding: 60px 40px;
              max-width: 600px;
              box-shadow: 0 20px 60px rgba(0,0,0,0.3);
              text-align: center;
            }
            h1 {
              font-size: 3em;
              margin-bottom: 20px;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
            }
            p {
              font-size: 1.2em;
              color: #666;
              margin-bottom: 30px;
            }
            .status {
              display: inline-flex;
              align-items: center;
              gap: 10px;
              background: #10b981;
              color: white;
              padding: 10px 20px;
              border-radius: 50px;
              margin-bottom: 40px;
              font-weight: 600;
            }
            . status::before {
              content: '';
              width: 10px;
              height: 10px;
              background: white;
              border-radius: 50%;
              animation: pulse 2s infinite;
            }
            @keyframes pulse {
              0%, 100% { opacity: 1; }
              50% { opacity: 0.5; }
            }
            .buttons {
              display: flex;
              gap: 15px;
              justify-content: center;
              flex-wrap: wrap;
            }
            . btn {
              display: inline-block;
              padding: 15px 30px;
              border-radius: 10px;
              text-decoration: none;
              font-weight: 600;
              transition: transform 0.2s, box-shadow 0.2s;
            }
            .btn:hover {
              transform: translateY(-2px);
              box-shadow: 0 10px 20px rgba(0,0,0,0.2);
            }
            .btn-primary {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
            }
            .btn-secondary {
              background: #f3f4f6;
              color: #374151;
            }
            . features {
              margin-top: 40px;
              text-align: left;
            }
            .feature {
              display: flex;
              align-items: center;
              gap: 10px;
              padding: 10px;
              margin: 5px 0;
            }
            .feature::before {
              content: '✓';
              color: #10b981;
              font-weight: bold;
              font-size: 1.5em;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>🤖 BOTSITOT</h1>
            <p>Sistema de Gestión con API REST + WhatsApp Bot</p>
            
            <div class="status">
              API Online
            </div>

            <div class="buttons">
              <a href="/api-docs" class="btn btn-primary">📚 Documentación</a>
              <a href="/health/detailed" class="btn btn-secondary">🏥 Health Check</a>
            </div>

            <div class="features">
              <div class="feature">RESTful API completa</div>
              <div class="feature">WhatsApp Bot Integration</div>
              <div class="feature">JWT Authentication</div>
              <div class="feature">PostgreSQL + Prisma</div>
              <div class="feature">Redis Caching</div>
              <div class="feature">Swagger Documentation</div>
              <div class="feature">Response time: ~7ms</div>
            </div>
          </div>
        </body>
        </html>
      `);
    });
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
    // Bind to 0.0.0.0 to be accessible from outside container (for Render, Railway, etc.)
    const host = '0.0.0.0';

    this.app.listen(this.port, host, () => {
      logger.success('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logger.success('  BOTSITOT v2.0 - Servidor Express Iniciado');
      logger.success('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      logger.info('');
      logger.info(`🌍 Entorno: ${env.NODE_ENV}`);
      logger.info(`🚀 Puerto: ${this.port}`);
      logger.info(`🌐 Host: ${host}`);
      logger.info('');
      logger.info('📍 Endpoints disponibles:');
      logger.info(`   🏥 Health:           http://${host}:${this.port}/health`);
      logger.info(`   🏥 Health Detailed:  http://${host}:${this.port}/health/detailed`);
      logger.info(`   🏥 Readiness:        http://${host}:${this.port}/health/ready`);
      logger.info(`   🏥 Liveness:         http://${host}:${this.port}/health/live`);
      logger.info(`   📊 Status:           http://${host}:${this.port}/api/status`);
      logger.info(`   📚 API Docs:         http://${host}:${this.port}/api-docs`);
      logger.info('');
      logger.info('🔐 API Routes:');
      logger.info(`   🔑 Auth:      http://${host}:${this.port}/api/auth`);
      logger.info(`   📦 Productos: http://${host}:${this.port}/api/productos`);
      logger.info(`   📋 Pedidos:   http://${host}:${this.port}/api/pedidos`);
      logger.info(`   👥 Clientes:  http://${host}:${this.port}/api/clientes`);
      logger.info(`   📊 Stats:     http://${host}:${this.port}/api/stats`);
      logger.info(`   💬 WhatsApp:  http://${host}:${this.port}/api/whatsapp`);
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
