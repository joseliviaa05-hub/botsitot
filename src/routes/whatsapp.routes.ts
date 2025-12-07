// src/routes/whatsapp.routes.ts
import { Router } from 'express';
import whatsappController from '../controllers/whatsappController';
import {
  authenticateToken,
  operatorOrAdmin,
} from '../middleware/auth.middleware';

const router = Router();

/**
 * GET /whatsapp/status
 * Ver estado de WhatsApp (OPERATOR+)
 */
router. get(
  '/status', 
  authenticateToken, 
  operatorOrAdmin, // ← Cambiado de authenticated a operatorOrAdmin
  whatsappController.getStatus.bind(whatsappController)
);

/**
 * POST /whatsapp/send
 * Enviar mensaje (OPERATOR+)
 */
router.post(
  '/send', 
  authenticateToken, 
  operatorOrAdmin, 
  whatsappController.sendMessage.bind(whatsappController)
);

/**
 * POST /whatsapp/send-image
 * Enviar imagen (OPERATOR+)
 */
router.post(
  '/send-image', 
  authenticateToken, 
  operatorOrAdmin, 
  whatsappController. sendImage.bind(whatsappController)
);

export default router;