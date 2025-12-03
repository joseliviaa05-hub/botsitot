// src/controllers/messageController.js
/**
 * ═══════════════════════════════════════════════════════════════
 * 💬 MESSAGE CONTROLLER - Coordinador principal de mensajes
 * ═══════════════════════════════════════════════════════════════
 */

const cache = require('../utils/CacheManager');
const sessionManager = require('../utils/sessionManager');
const clientService = require('../services/clientService');
const rateLimiter = require('../utils/rateLimiter');
const messageValidator = require('../validators/messageValidator');
const logger = require('../middlewares/logger');

// Handlers
const ownerCommandHandler = require('./handlers/ownerCommandHandler');
const textMessageHandler = require('./handlers/textMessageHandler');
const servicioPersonalizadoHandler = require('./handlers/servicioPersonalizadoHandler');

class MessageController {
    /**
     * Maneja los mensajes entrantes (punto de entrada principal)
     * @param {Object} msg - Objeto de mensaje de whatsapp-web.js
     * @param {Object} client - Cliente de WhatsApp
     * @param {Number} botIniciadoEn - Timestamp de inicio del bot
     * @param {Object} sock - Cliente de WhatsApp para enviar mensajes (mismo que client)
     */
    async handleMessage(msg, client, botIniciadoEn, sock) {
        try {
            const from = msg.from;
            const texto = msg.body;
            const textoLower = texto ? texto.toLowerCase() : '';
            const contacto = await msg.getContact();
            const nombreContacto = contacto.pushname || contacto.name || contacto.number || from;
            
            logger.info(`📨 Mensaje de: ${nombreContacto} (${from})`);
            
            // ✅ NUEVO: Detectar si es una imagen/foto
            if (msg.hasMedia) {
                logger.info(`📷 Mensaje con media detectado`);
                
                // Verificar si está esperando datos de curriculum
                if (sessionManager.estaEnviandoCurriculum(from)) {
                    logger.info(`📄 Procesando foto de curriculum de ${nombreContacto}`);
                    
                    try {
                        // Descargar la media
                        const media = await msg.downloadMedia();
                        
                        if (media) {
                            const caption = msg.body || 'Sin descripción';
                            
                            // Procesar la foto con el handler
                            const respuesta = await servicioPersonalizadoHandler.procesarFotoRecibida(
                                from,
                                nombreContacto,
                                media,
                                caption,
                                sock || client
                            );
                            
                            if (respuesta) {
                                await msg.reply(respuesta);
                                logger.info('✅ Respuesta enviada correctamente');
                                return;
                            }
                        }
                    } catch (error) {
                        logger.error('❌ Error procesando foto de curriculum:', error);
                        await msg.reply('❌ Hubo un error al procesar tu foto. Por favor, intenta nuevamente.');
                        return;
                    }
                }
                
                // Si no está esperando curriculum, ignorar la foto
                logger.debug('📷 Foto recibida pero no está en contexto de curriculum - Ignorando');
                return;
            }
            
            logger.info(`💬 Contenido: "${texto}"`);

            // ═══════════════════════════════════════════════════════════
            // PASO 1: VALIDACIONES BÁSICAS
            // ═══════════════════════════════════════════════════════════

            // Validar formato del mensaje
            if (!messageValidator.esMensajeValido(texto)) {
                logger.debug('🚫 IGNORADO: Mensaje vacío o inválido');
                return;
            }

            // Verificar si es mensaje antiguo
            const mensajeTimestamp = msg.timestamp * 1000;
            
            if (botIniciadoEn && mensajeTimestamp < botIniciadoEn) {
                const minutosAntes = Math.floor((botIniciadoEn - mensajeTimestamp) / 60000);
                logger.debug(`🚫 IGNORADO: Mensaje antiguo (${minutosAntes} minutos antes del inicio)`);
                
                if (sessionManager.tieneSesionActiva(from)) {
                    sessionManager.limpiarSesion(from);
                }
                return;
            }

            // ═══════════════════════════════════════════════════════════
            // PASO 2: FILTROS DE TIPO DE CHAT
            // ═══════════════════════════════════════════════════════════

            // Filtrar grupos
            if (from.endsWith('@g.us')) {
                logger.debug('🚫 IGNORADO: Mensaje de grupo');
                return;
            }
            
            // Filtrar broadcasts
            if (from === 'status@broadcast' || from.endsWith('@broadcast')) {
                logger.debug('🚫 IGNORADO: Broadcast/Estado');
                return;
            }
            
            // Solo chats individuales
            if (!from.endsWith('@c.us')) {
                logger.debug('🚫 IGNORADO: No es chat individual');
                return;
            }
            
            logger.info('✅ CHAT INDIVIDUAL: Procesando mensaje');

            // ═══════════════════════════════════════════════════════════
            // PASO 3: RATE LIMITING (Anti-spam)
            // ═══════════════════════════════════════════════════════════

            const rateLimitResult = rateLimiter.verificarLimite(from);
            
            if (!rateLimitResult.allowed) {
                logger.warn(`🚫 RATE LIMIT: Usuario bloqueado temporalmente`);
                await msg.reply(rateLimitResult.mensaje);
                return;
            }

            // Enviar advertencia si está cerca del límite
            if (rateLimitResult.warning) {
                logger.warn(`⚠️ Usuario cerca del límite de mensajes`);
            }

            // ═══════════════════════════════════════════════════════════
            // PASO 4: REGISTRAR/ACTUALIZAR CLIENTE
            // ═══════════════════════════════════════════════════════════

            try {
                clientService.registrarOActualizar(from, nombreContacto);
                logger.debug(`✅ Cliente registrado/actualizado`);
            } catch (error) {
                logger.error('❌ Error al registrar cliente:', error);
            }

            // ═══════════════════════════════════════════════════════════
            // PASO 5: COMANDOS DEL DUEÑO
            // ═══════════════════════════════════════════════════════════

            const negocioData = cache.obtenerNegocioSync();
            
            if (from === negocioData.numero_dueño) {
                logger.info('👑 COMANDO DEL DUEÑO detectado');
                const respuestaComando = await ownerCommandHandler.handle(textoLower, negocioData);
                if (respuestaComando) {
                    await msg.reply(respuestaComando);
                    logger.info('📤 Respuesta de comando enviada');
                    return;
                }
            }

            // ═══════════════════════════════════════════════════════════
            // PASO 6: VERIFICAR SI RESPUESTAS AUTOMÁTICAS ESTÁN ACTIVAS
            // ═══════════════════════════════════════════════════════════

            if (!negocioData.respuestas_automaticas_activas) {
                logger.info('⏸️ IGNORADO: Respuestas automáticas pausadas');
                return;
            }

            // ═══════════════════════════════════════════════════════════
            // PASO 7: VERIFICAR LISTA NEGRA
            // ═══════════════════════════════════════════════════════════

            const contactosIgnorar = cache.obtenerContactosIgnorarSync();
            if (contactosIgnorar.contactos_ignorar.includes(from)) {
                logger.info('🚫 IGNORADO: Contacto en lista negra');
                return;
            }

            // ═══════════════════════════════════════════════════════════
            // PASO 8: VERIFICAR SI ES MENSAJE COMERCIAL O TIENE SESIÓN
            // ═══════════════════════════════════════════════════════════

            const tieneSesion = sessionManager.tieneSesionActiva(from);
            const esMensajeNegocio = textMessageHandler.verificarMensajeNegocio(textoLower);
            
            logger.info(`🔍 Análisis del mensaje:`);
            logger.info(`   • Sesión activa: ${tieneSesion ? 'SÍ' : 'NO'}`);
            logger.info(`   • Es mensaje de negocio: ${esMensajeNegocio ? 'SÍ' : 'NO'}`);
            
            if (!esMensajeNegocio && !tieneSesion) {
                logger.info('🤷 IGNORADO: No es mensaje comercial y no tiene sesión activa');
                return;
            }
            
            if (tieneSesion) {
                logger.info('🧠 PROCESANDO: Cliente con conversación activa');
            } else {
                logger.info('✅ PROCESANDO: Mensaje relacionado con negocio');
            }

            // ═══════════════════════════════════════════════════════════
            // PASO 9: MARCAR SESIÓN ACTIVA Y PROCESAR MENSAJE
            // ═══════════════════════════════════════════════════════════

            sessionManager.marcarSesionActiva(from);
            
            logger.info('🔄 Enviando a textMessageHandler...');
            
            // ✅ Pasar sock para enviar imágenes (usar client como sock si no existe)
            const sockToUse = sock || client;
            
            const respuesta = await textMessageHandler.procesarMensaje(
                textoLower, 
                texto, 
                from, 
                nombreContacto, 
                client,
                sockToUse // ✅ Pasar sock/client para enviar imágenes
            );
            
            if (respuesta) {
                await msg.reply(respuesta);
                logger.info('✅ Respuesta enviada correctamente');
                logger.debug(`📝 Respuesta: "${respuesta.substring(0, 100)}..."`);
            } else {
                logger.warn('⚠️ No se generó respuesta');
            }

        } catch (error) {
            logger.error('❌ Error al procesar mensaje:', error);
            logger.error('Stack trace:', error.stack);
            
            try {
                await msg.reply('❌ Ocurrió un error. Por favor intenta nuevamente en unos momentos.');
            } catch (replyError) {
                logger.error('❌ Error al enviar mensaje de error:', replyError);
            }
        }
    }
}

module.exports = new MessageController();