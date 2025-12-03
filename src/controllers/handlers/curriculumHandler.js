// src/controllers/handlers/curriculumHandler.js
/**
 * ═══════════════════════════════════════════════════════════════
 * 📄 CURRICULUM HANDLER - Gestión de solicitudes de CV
 * ═══════════════════════════════════════════════════════════════
 */

const sessionManager = require('../../utils/sessionManager');
const simpleNotificationService = require('../../services/SimpleNotificationService');
const logger = require('../../middlewares/logger');

class CurriculumHandler {
    
    /**
     * Verifica si el mensaje contiene datos de CV
     */
    esDatosDeCurriculum(texto) {
        // Verificar si contiene la estructura de datos personales
        const indicadores = [
            'datos personales',
            'nombre completo',
            'fecha de nacimiento',
            'dni',
            'educación',
            'experiencia laboral',
            'habilidades'
        ];
        
        const textoLower = texto.toLowerCase();
        let coincidencias = 0;
        
        indicadores.forEach(ind => {
            if (textoLower.includes(ind)) {
                coincidencias++;
            }
        });
        
        // Si tiene al menos 3 indicadores, probablemente sea datos de CV
        return coincidencias >= 3;
    }

    /**
     * Procesa datos recibidos de curriculum
     */
    async procesarDatosCurriculum(from, nombreCliente, texto, sock) {
        try {
            logger.info(`📄 Procesando datos de CV de ${nombreCliente}`);
            
            // Notificar al cliente
            const respuestaCliente = this.generarRespuestaCliente(nombreCliente);
            
            // Notificar al dueño
            await this.notificarDueño(from, nombreCliente, texto, null, sock);
            
            // Limpiar sesión de curriculum
            sessionManager.limpiarDatosCurriculum(from);
            
            return respuestaCliente;
            
        } catch (error) {
            logger.error('❌ Error procesando datos de curriculum:', error);
            return '❌ Hubo un error al procesar tu solicitud. Por favor, intenta nuevamente.';
        }
    }

    /**
     * Procesa foto de datos de curriculum
     */
    async procesarFotoCurriculum(from, nombreCliente, media, caption, sock) {
        try {
            logger.info(`📷 Procesando foto de CV de ${nombreCliente}`);
            
            // Notificar al cliente
            const respuestaCliente = this.generarRespuestaCliente(nombreCliente);
            
            // Notificar al dueño con la foto
            await this.notificarDueño(from, nombreCliente, caption || 'Sin descripción', media, sock);
            
            // Limpiar sesión de curriculum
            sessionManager.limpiarDatosCurriculum(from);
            
            return respuestaCliente;
            
        } catch (error) {
            logger.error('❌ Error procesando foto de curriculum:', error);
            return '❌ Hubo un error al procesar tu foto. Por favor, intenta nuevamente.';
        }
    }

    /**
     * Genera respuesta para el cliente
     */
    generarRespuestaCliente(nombreCliente) {
        let msg = `✅ *¡Datos recibidos exitosamente!*\n\n`;
        msg += `Hola ${nombreCliente}, hemos recibido tu información.\n\n`;
        msg += `🔔 *Próximos pasos:*\n`;
        msg += `1️⃣ Revisaremos tu información\n`;
        msg += `2️⃣ Te contactaremos en breve para confirmar detalles\n`;
        msg += `3️⃣ Prepararemos tu CV profesional\n`;
        msg += `4️⃣ Te avisaremos cuando esté listo para retirar\n\n`;
        msg += `⏱️ *Tiempo de entrega:* 24-48 horas\n`;
        msg += `💰 *Precio:* $3000\n\n`;
        msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
        msg += `¿Necesitás algo más?`;
        
        return msg;
    }

    /**
     * Procesa opción 3 (traer al local)
     */
    async procesarTraerAlLocal(from, nombreCliente) {
        try {
            logger.info(`🏪 ${nombreCliente} elegió traer datos al local`);
            
            const negocio = require('../../utils/CacheManager').obtenerNegocioSync();
            
            let msg = `✅ *Perfecto, ${nombreCliente}!*\n\n`;
            msg += `📍 *Dirección:*\n`;
            msg += `${negocio.direccion}\n\n`;
            msg += `🕐 *Horarios:*\n`;
            msg += `${negocio.horarios}\n\n`;
            msg += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
            msg += `💡 *Qué traer:*\n`;
            msg += `• Información personal completa\n`;
            msg += `• Detalles de tu educación\n`;
            msg += `• Experiencia laboral\n`;
            msg += `• Habilidades y competencias\n`;
            msg += `• Foto tipo carnet (opcional)\n\n`;
            msg += `Te esperamos! 😊\n\n`;
            msg += `¿Necesitás algo más?`;
            
            // Notificar al dueño
            await this.notificarDueñoLocal(from, nombreCliente);
            
            // Limpiar sesión
            sessionManager.limpiarDatosCurriculum(from);
            
            return msg;
            
        } catch (error) {
            logger.error('❌ Error procesando opción local:', error);
            return '❌ Hubo un error. Por favor, intenta nuevamente.';
        }
    }

    /**
     * Notifica al dueño sobre nueva solicitud de CV
     */
    async notificarDueño(telefono, nombreCliente, datos, media, sock) {
        try {
            const tel = telefono.replace('@c.us', '');
            
            let mensaje = `📄 *NUEVA SOLICITUD DE CURRÍCULUM*\n\n`;
            mensaje += `━━━━━━━━━━━━━━━━━━━━━\n`;
            mensaje += `👤 *Cliente:* ${nombreCliente}\n`;
            mensaje += `📱 *Teléfono:* ${tel}\n`;
            mensaje += `📅 *Fecha:* ${new Date().toLocaleString('es-AR')}\n`;
            mensaje += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
            
            if (media) {
                mensaje += `📷 *El cliente envió una foto con los datos*\n\n`;
            } else {
                mensaje += `📝 *DATOS RECIBIDOS:*\n\n`;
                mensaje += `${datos}\n\n`;
            }
            
            mensaje += `━━━━━━━━━━━━━━━━━━━━━\n`;
            mensaje += `💰 *Precio:* $3000\n`;
            mensaje += `⏱️ *Tiempo de entrega:* 24-48 horas\n\n`;
            mensaje += `📲 *Contactar cliente:*\n`;
            mensaje += `https://wa.me/${tel}`;
            
            // Enviar notificación usando el servicio
            const resultado = await simpleNotificationService.notificarCustom(
                mensaje,
                sock
            );
            
            // Si hay foto, enviarla también
            if (media) {
                await simpleNotificationService.notificarMedia(
                    media,
                    `📷 Datos de CV de ${nombreCliente}`,
                    sock
                );
            }
            
            logger.info(`✅ Notificación de CV enviada al dueño`);
            
        } catch (error) {
            logger.error('❌ Error notificando al dueño:', error);
        }
    }

    /**
     * Notifica al dueño que el cliente traerá datos al local
     */
    async notificarDueñoLocal(telefono, nombreCliente) {
        try {
            const tel = telefono.replace('@c.us', '');
            
            let mensaje = `📄 *SOLICITUD DE CURRÍCULUM - RETIRO LOCAL*\n\n`;
            mensaje += `━━━━━━━━━━━━━━━━━━━━━\n`;
            mensaje += `👤 *Cliente:* ${nombreCliente}\n`;
            mensaje += `📱 *Teléfono:* ${tel}\n`;
            mensaje += `📅 *Fecha:* ${new Date().toLocaleString('es-AR')}\n`;
            mensaje += `━━━━━━━━━━━━━━━━━━━━━\n\n`;
            mensaje += `🏪 *El cliente traerá los datos al local*\n\n`;
            mensaje += `💰 *Precio:* $3000\n`;
            mensaje += `⏱️ *Tiempo de entrega:* 24-48 horas\n\n`;
            mensaje += `📲 *Contactar cliente:*\n`;
            mensaje += `https://wa.me/${tel}`;
            
            // Enviar notificación
            await simpleNotificationService.notificarCustom(mensaje);
            
            logger.info(`✅ Notificación de CV (local) enviada al dueño`);
            
        } catch (error) {
            logger.error('❌ Error notificando al dueño:', error);
        }
    }
}

module.exports = new CurriculumHandler();