import { Request, Response } from 'express';
import { logger } from '../utils/logger';

export class WhatsAppController {
  /**
   * POST /api/whatsapp/send
   * Envía un mensaje de WhatsApp (MOCK por ahora)
   */
  async sendMessage(req: Request, res: Response) {
    try {
      const { to, message, type = 'text' } = req.body;

      // Validaciones
      if (!to) {
        return res.status(400).json({
          success: false,
          error: 'Campo "to" es requerido (número de teléfono)',
        });
      }

      if (! message) {
        return res. status(400).json({
          success: false,
          error: 'Campo "message" es requerido',
        });
      }

      // TODO: Aquí irá la integración real con WhatsApp API
      // Por ahora, simulamos el envío
      logger.info(`📤 Mensaje de WhatsApp (MOCK) → ${to}: ${message. substring(0, 50)}`);

      // Simular delay de envío
      await new Promise(resolve => setTimeout(resolve, 100));

      res.json({
        success: true,
        data: {
          messageId: `mock_${Date.now()}`,
          to,
          status: 'sent',
          timestamp: new Date().toISOString(),
        },
        message: '✅ Mensaje enviado exitosamente (MOCK)',
      });
    } catch (error: any) {
      logger. error(`Error enviando mensaje de WhatsApp: ${error.message}`);
      res.status(500).json({
        success: false,
        error: 'Error al enviar mensaje',
        message: error. message,
      });
    }
  }

  /**
   * POST /api/whatsapp/send-image
   * Envía una imagen por WhatsApp (MOCK)
   */
  async sendImage(req: Request, res: Response) {
    try {
      const { to, imageUrl, caption } = req. body;

      if (!to || !imageUrl) {
        return res.status(400).json({
          success: false,
          error: 'Campos "to" e "imageUrl" son requeridos',
        });
      }

      logger.info(`📤 Imagen de WhatsApp (MOCK) → ${to}: ${imageUrl}`);

      await new Promise(resolve => setTimeout(resolve, 150));

      res. json({
        success: true,
        data: {
          messageId: `mock_img_${Date.now()}`,
          to,
          status: 'sent',
          timestamp: new Date(). toISOString(),
        },
        message: '✅ Imagen enviada exitosamente (MOCK)',
      });
    } catch (error: any) {
      logger.error(`Error enviando imagen de WhatsApp: ${error.message}`);
      res.status(500).json({
        success: false,
        error: 'Error al enviar imagen',
        message: error.message,
      });
    }
  }

  /**
   * GET /api/whatsapp/status
   * Estado del servicio de WhatsApp
   */
  async getStatus(req: Request, res: Response) {
    res.json({
      success: true,
      data: {
        status: 'mock',
        connected: false,
        mode: 'development',
        message: 'WhatsApp en modo MOCK.  Configurar API oficial para producción.',
      },
    });
  }
}

export default new WhatsAppController();