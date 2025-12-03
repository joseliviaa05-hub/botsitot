import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { logger } from './utils/logger';
import { env } from './config/env';

class Server {
  private app: Application;
  private port: number;

  constructor() {
    this.app = express();
    this.port = env. PORT;
    this.setupMiddlewares();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddlewares(): void {
    // CORS
    this.app. use(cors({
      origin: ['http://localhost:3000', 'http://localhost:5173'],
      credentials: true
    }));

    // Body parser
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Logging middleware
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      logger.info(req.method + ' ' + req.path);
      next();
    });
  }

  private setupRoutes(): void {
    // Health check
    this.app. get('/health', (req: Request, res: Response) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    });

    // API routes placeholder
    this.app.get('/api/status', (req: Request, res: Response) => {
      res. json({
        whatsapp: 'connected',
        database: 'pending',
        version: '2.0.0'
      });
    });

    // 404 handler
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({ error: 'Endpoint no encontrado' });
    });
  }

  private setupErrorHandling(): void {
    this. app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
      logger.error('Error en servidor:', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    });
  }

  start(): void {
    this.app.listen(this.port, () => {
      logger.success('Servidor Express iniciado en puerto ' + this.port);
      logger.info('Health check: http://localhost:' + this.port + '/health');
      logger.info('API Status: http://localhost:' + this.port + '/api/status');
    });
  }

  getApp(): Application {
    return this.app;
  }
}

export const server = new Server();