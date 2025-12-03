import { Client, LocalAuth, Message } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import { logger } from '../utils/logger';
import { env } from '../config/env';
import { WhatsAppMessage } from '../types';

class WhatsAppService {
  private client: Client | null = null;
  private isReady: boolean = false;

  constructor() {
    this.initializeClient();
  }

  private initializeClient(): void {
    logger.info('Inicializando cliente de WhatsApp...');

    this.client = new Client({
      authStrategy: new LocalAuth({
        dataPath: env.SESSION_PATH
      }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      }
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    if (!this.client) return;

    this.client.on('qr', (qr: string) => {
      logger. info('Codigo QR recibido.  Escanea con tu telefono:');
      qrcode.generate(qr, { small: true });
    });

    this.client.on('ready', () => {
      this.isReady = true;
      logger.success('Cliente de WhatsApp listo! ');
    });

    this. client.on('authenticated', () => {
      logger.success('WhatsApp autenticado correctamente');
    });

    this.client.on('auth_failure', (msg) => {
      logger.error('Error de autenticacion: ' + msg);
    });

    this.client.on('disconnected', (reason) => {
      logger.warn('Cliente desconectado: ' + reason);
      this.isReady = false;
    });

    this.client.on('message', async (message: Message) => {
      await this.handleMessage(message);
    });
  }

  private async handleMessage(message: Message): Promise<void> {
    try {
      const from = message.from;
      const body = message.body;
      const hasMedia = message.hasMedia;

      logger.info('Mensaje recibido de ' + from + ': ' + body);

      // TODO: Integrar con messageController

    } catch (error) {
      logger.error('Error al manejar mensaje', error as Error);
    }
  }

  async initialize(): Promise<void> {
    if (!this.client) {
      throw new Error('Cliente no inicializado');
    }

    logger.info('Iniciando cliente de WhatsApp...');
    await this.client.initialize();
  }

  async sendMessage(to: string, message: string): Promise<void> {
    if (! this.client || !this.isReady) {
      throw new Error('Cliente no esta listo');
    }

    try {
      await this.client.sendMessage(to, message);
      logger.info('Mensaje enviado a ' + to);
    } catch (error) {
      logger.error('Error al enviar mensaje', error as Error);
      throw error;
    }
  }

  async sendMediaMessage(to: string, mediaPath: string, caption?: string): Promise<void> {
    if (!this.client || !this.isReady) {
      throw new Error('Cliente no esta listo');
    }

    try {
      const { MessageMedia } = await import('whatsapp-web.js');
      const media = MessageMedia.fromFilePath(mediaPath);
      await this.client.sendMessage(to, media, { caption });
      logger.info('Mensaje con media enviado a ' + to);
    } catch (error) {
      logger.error('Error al enviar mensaje con media', error as Error);
      throw error;
    }
  }

  getClient(): Client | null {
    return this.client;
  }

  isClientReady(): boolean {
    return this.isReady;
  }
}

export const whatsappService = new WhatsAppService();