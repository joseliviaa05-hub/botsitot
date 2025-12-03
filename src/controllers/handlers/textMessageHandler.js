// src/controllers/handlers/textMessageHandler.js
const sessionManager = require('../../utils/sessionManager');
const cache = require('../../utils/CacheManager');
const aiService = require('../../services/aiService');
const clientService = require('../../services/clientService');
const { limpiarTexto } = require('../../utils/textHelpers');
const { MENSAJES_PERSONALES, PALABRAS_INTENCION, SALUDOS_COMERCIALES } = require('../../config/constants');
const logger = require('../../middlewares/logger');

// Importar otros handlers
const commandHandler = require('./commandHandler');
const cartHandler = require('./cartHandler');
const orderHandler = require('./orderHandler');
const productDetectionHandler = require('./productDetectionHandler');
const servicioPersonalizadoHandler = require('./servicioPersonalizadoHandler');

class TextMessageHandler {
    /**
     * ✅ Calcula similitud entre dos textos (distancia de Levenshtein)
     */
    calcularSimilitud(texto1, texto2) {
        const a = texto1.toLowerCase().trim();
        const b = texto2.toLowerCase().trim();
        
        const matriz = [];
        
        for (let i = 0; i <= b.length; i++) {
            matriz[i] = [i];
        }
        
        for (let j = 0; j <= a.length; j++) {
            matriz[0][j] = j;
        }
        
        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matriz[i][j] = matriz[i - 1][j - 1];
                } else {
                    matriz[i][j] = Math.min(
                        matriz[i - 1][j - 1] + 1,
                        matriz[i][j - 1] + 1,
                        matriz[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matriz[b.length][a.length];
    }
    
    /**
     * ✅ CORREGIDO: Verifica coincidencia con tolerancia inteligente
     */
    coincideConPalabras(texto, palabras, toleranciaBase = 2) {
        let textoNormalizado = texto.toLowerCase().trim();
        
        // ✅ Normalizar repeticiones: "siiii" → "sii", "nooo" → "noo"
        textoNormalizado = textoNormalizado.replace(/(.)\1{2,}/g, '$1$1');
        
        // ✅ Para textos muy cortos (1-2 chars), solo coincidencia exacta
        if (textoNormalizado.length <= 2) {
            for (const palabra of palabras) {
                const palabraNormalizada = palabra.toLowerCase().trim();
                if (textoNormalizado === palabraNormalizada) {
                    return { coincide: true, palabra };
                }
            }
            return { coincide: false, palabra: null };
        }
        
        for (const palabra of palabras) {
            const palabraNormalizada = palabra.toLowerCase().trim();
            
            // Coincidencia exacta
            if (textoNormalizado === palabraNormalizada) {
                return { coincide: true, palabra };
            }
            
            // ✅ Tolerancia proporcional (35% de la longitud mínima)
            const longitudMinima = Math.min(textoNormalizado.length, palabraNormalizada.length);
            const tolerancia = Math.max(1, Math.floor(longitudMinima * 0.35));
            
            const distancia = this.calcularSimilitud(textoNormalizado, palabraNormalizada);
            
            if (distancia <= tolerancia) {
                logger.info(`✅ Coincidencia aproximada: "${texto}" ≈ "${palabra}" (distancia: ${distancia}, tolerancia: ${tolerancia})`);
                return { coincide: true, palabra };
            }
        }
        
        return { coincide: false, palabra: null };
    }
    
    /**
     * Procesa el mensaje de texto y genera respuesta
     */
    async procesarMensaje(textoLower, textoOriginal, from, nombreContacto, client, sock) {
        logger.info('📝 TextMessageHandler: Iniciando procesamiento...');

        // ✅ Comando para reactivar el bot manualmente (solo para dueño)
        const NUMERO_DUENO = '5491162002289@c.us';
        
        if (textoLower === '!bot activar' && from === NUMERO_DUENO) {
            sessionManager.liberarAtencionHumana(from);
            logger.info('🤖 Bot reactivado manualmente por el dueño');
            return `🤖 *Bot reactivado*\n\nYa puedo responder mensajes automáticamente de nuevo.`;
        }

        // ✅ Detectar solicitud de atención humana
        const patronesAtencionHumana = [
            /quiero hablar con (patri|betoo|dueño|dueña|dueno|duena|encargado|encargada|alguien|una persona)/,
            /necesito hablar con (patri|betoo|dueño|dueña|dueno|duena|encargado|encargada|alguien|una persona)/,
            /quisiera hablar con (patri|betoo|dueño|dueña|dueno|duena|encargado|encargada|alguien|una persona)/,
            /puedo hablar con (patri|betoo|dueño|dueña|dueno|duena|encargado|encargada|alguien)/,
            /me gustaria hablar con (patri|betoo|dueño|dueña|dueno|duena|encargado|encargada)/,
            /comunicarme con (patri|betoo|dueño|dueña|dueno|duena|encargado|encargada)/,
            /contactar (a|con) (patri|betoo|dueño|dueña|dueno|duena|encargado|encargada)/,
            /hablar con (el dueño|la dueña|el encargado|la encargada|patri|betoo)/,
            /ver a (patri|betoo|el dueño|la dueña)/,
            /atender con (patri|betoo|dueño|dueña|dueno|duena)/,
            /atencion personal/,
            /persona real/,
            /un humano/,
            /transferir(me)? con (patri|betoo|dueño|dueno|encargado)/,
            /pasar(me)? con (patri|betoo|dueño|dueno|encargado)/,
            /derivar(me)? con (patri|betoo|dueño|dueno|encargado)/
        ];

        const requiereAtencion = patronesAtencionHumana.some(patron => patron.test(textoLower));

        if (requiereAtencion) {
            logger.info('👤 Solicitud de atención humana detectada');
            sessionManager.marcarAtencionHumana(from);
            
            return `👤 *¡Entendido!*\n\n` +
                   `Te estoy transfiriendo con el equipo. En breve te responderán personalmente.\n\n` +
                   `📱 El dueño recibirá una notificación de tu mensaje.\n\n` +
                   `⏰ _Si no recibes respuesta en 1 hora, el bot se reactivará automáticamente._`;
        }

        // Historial de pedidos
        if (textoLower.match(/mis pedidos|mi historial|historial|pedidos anteriores|ultimos pedidos/)) {
            logger.info('📜 Comando detectado: Historial de pedidos');
            return commandHandler.mostrarHistorial(from);
        }

        const carrito = sessionManager.obtenerCarrito(from);
        
        // ═══════════════════════════════════════════════════════════════
        // PRIORIDAD 1: RESPUESTAS A ESTADOS ACTIVOS (Orden crítico)
        // ═══════════════════════════════════════════════════════════════
        
        // ✅ NUEVO: Verificar si está enviando datos de curriculum
        if (sessionManager.estaEnviandoCurriculum(from)) {
            logger.info('📄 Usuario enviando datos de curriculum');
            
            // Procesar los datos recibidos
            const respuesta = await servicioPersonalizadoHandler.procesarDatosRecibidos(
                from,
                nombreContacto,
                textoOriginal,
                sock
            );
            
            if (respuesta) {
                return respuesta;
            }
        }
        
        // ✅ PRIORIDAD 1A: Tipo de entrega (DEBE IR PRIMERO)
        if (carrito.esperando_tipo_entrega && textoLower.match(/^[12]$/)) {
            logger.info('🚚 Seleccionando tipo de entrega');
            
            // ✅ CORREGIDO: Pasar sock para notificaciones
            const respuestaEntrega = await orderHandler.procesarOpcionEntrega(from, textoLower, nombreContacto, sock);
            if (respuestaEntrega) {
                sessionManager.limpiarSesion(from);
                return respuestaEntrega;
            }
        }
        
        // ✅ PRIORIDAD 1B: Respuesta a servicio personalizado activo
        if (carrito.servicio_personalizado && textoOriginal.trim().match(/^[123]$/)) {
            logger.info(`📋 Respuesta a servicio personalizado: ${carrito.servicio_personalizado}`);
            
            const respuesta = await servicioPersonalizadoHandler.manejarOpcionEnvio(
                from,
                textoOriginal.trim(),
                carrito.servicio_personalizado,
                nombreContacto
            );
            
            delete carrito.servicio_personalizado;
            sessionManager.actualizarCarrito(from, carrito);
            
            return respuesta;
        }
        
        // ✅ PRIORIDAD 1C: Selección de opciones múltiples de productos
        if (carrito.opciones_multiples && carrito.opciones_multiples.length > 0) {
            const numeroElegido = parseInt(textoOriginal.trim());
            
            if (!isNaN(numeroElegido) && numeroElegido > 0 && numeroElegido <= carrito.opciones_multiples.length) {
                logger.info('🔢 Procesando selección de producto múltiple por número');
                return await productDetectionHandler.manejarSeleccion(textoOriginal, from, sock);
            }
            
            const cancelarResult = this.coincideConPalabras(textoOriginal, ['cancelar', 'no quiero', 'olvida']);
            if (cancelarResult.coincide) {
                delete carrito.opciones_multiples;
                delete carrito.cantidad_solicitada;
                sessionManager.actualizarCarrito(from, carrito);
                return `❌ Opciones canceladas.\n\n¿En qué más te puedo ayudar?`;
            }
        }
        
        // ✅ PRIORIDAD 1D: Confirmar productos temporales (SOLO SI HAY TEMPORAL)
        if (carrito.temporal && carrito.temporal.length > 0) {
            const palabrasSi = ['si', 'sí', 'ok', 'dale', 'confirmo', 'agregar', 'añadir', 'aceptar', 'acepto'];
            const confirmacionResult = this.coincideConPalabras(textoOriginal, palabrasSi);
            
            if (confirmacionResult.coincide) {
                logger.info(`✅ Confirmación detectada: "${textoOriginal}" ≈ "${confirmacionResult.palabra}"`);
                sessionManager.marcarSesionActiva(from, 'pedido');
                return cartHandler.agregarAlCarrito(from);
            }
            
            const palabrasNo = ['no', 'nope', 'cancel', 'no quiero', 'cancelar'];
            const cancelacionResult = this.coincideConPalabras(textoOriginal, palabrasNo);
            
            if (cancelacionResult.coincide) {
                logger.info(`❌ Cancelación detectada: "${textoOriginal}" ≈ "${cancelacionResult.palabra}"`);
                carrito.temporal = [];
                sessionManager.actualizarCarrito(from, carrito);
                sessionManager.limpiarSesion(from);
                return `❌ Pedido cancelado.\n\nPuedes hacer otro pedido cuando quieras.`;
            }
        }
        
        // ═══════════════════════════════════════════════════════════════
        // PRIORIDAD 2: DETECCIÓN DE NUEVOS CONTEXTOS
        // ═══════════════════════════════════════════════════════════════
        
        // ✅ PRIORIDAD 2A: Detectar nuevo servicio personalizado
        logger.info('🔍 Verificando si solicita servicio personalizado...');
        const tipoServicio = servicioPersonalizadoHandler.detectarServicio(textoLower);

        if (tipoServicio) {
            logger.info(`📋 Servicio personalizado detectado: ${tipoServicio}`);
            
            // Limpiar estados previos
            if (carrito.opciones_multiples) {
                logger.info('🧹 Limpiando opciones múltiples previas');
                delete carrito.opciones_multiples;
                delete carrito.cantidad_solicitada;
            }
            if (carrito.esperando_tipo_entrega) {
                logger.info('🧹 Limpiando esperando_tipo_entrega previo');
                delete carrito.esperando_tipo_entrega;
            }
            
            carrito.servicio_personalizado = tipoServicio;
            sessionManager.actualizarCarrito(from, carrito);
            
            return servicioPersonalizadoHandler.generarRespuestaServicio(tipoServicio);
        }

        // ═══════════════════════════════════════════════════════════════
        // PRIORIDAD 3: COMANDOS DE CARRITO (Solo si hay carrito activo)
        // ═══════════════════════════════════════════════════════════════
        
        // Ver carrito
        if (textoLower.match(/ver carrito|mi carrito|carrito|mi pedido|que tengo/)) {
            logger.info('🛒 Comando: Ver carrito');
            sessionManager.marcarSesionActiva(from, 'consulta_carrito');
            return cartHandler.mostrarCarrito(from);
        }
        
        // ✅ Confirmar pedido final (solo si hay productos en el carrito)
        if (carrito.productos && carrito.productos.length > 0) {
            const palabrasConfirmar = ['confirmar', 'confirmo', 'finalizar', 'terminar', 'terminar pedido'];
            const confirmarPedidoResult = this.coincideConPalabras(textoOriginal, palabrasConfirmar);
            
            if (confirmarPedidoResult.coincide) {
                logger.info(`✅ Confirmación de pedido: "${textoOriginal}" ≈ "${confirmarPedidoResult.palabra}"`);
                return await orderHandler.confirmarPedido(from, nombreContacto);
            }
        }
        
        // Cancelar carrito (solo si hay algo que cancelar)
        if ((carrito.productos && carrito.productos.length > 0) || (carrito.temporal && carrito.temporal.length > 0)) {
            if (textoLower.match(/^(cancelar|vaciar|borrar carrito|limpiar carrito)$/)) {
                logger.info('🗑️ Vaciando carrito');
                sessionManager.limpiarSesion(from);
                return cartHandler.cancelarCarrito(from);
            }
        }
        
        // Quitar producto del carrito (solo si hay productos)
        if (carrito.productos && carrito.productos.length > 0 && textoLower.match(/quitar|eliminar|sacar/)) {
            logger.info('➖ Quitando producto del carrito');
            const { extraerNumero } = require('../../utils/textHelpers');
            const numero = extraerNumero(textoOriginal);
            if (numero) {
                sessionManager.marcarSesionActiva(from, 'modificando_carrito');
                return cartHandler.quitarProducto(from, numero - 1);
            }
        }

        // ═══════════════════════════════════════════════════════════════
        // PRIORIDAD 4: COMANDOS GENERALES DE INFORMACIÓN
        // ═══════════════════════════════════════════════════════════════

        // Saludos
        if (textoLower.match(/^(hola|buenas|buenos dias|buenas tardes|buenas noches|hey|hi)$/)) {
            logger.info('👋 Saludo detectado');
            return commandHandler.generarSaludo(from, nombreContacto);
        }

        // Horarios
        if (textoLower.match(/horario|hora|atencion|abren|cierran|abierto/)) {
            logger.info('🕐 Consulta: Horarios');
            return commandHandler.mostrarHorarios(from);
        }

        // Ubicación
        if (textoLower.match(/ubicacion|direccion|donde|local|negocio|como llego/)) {
            logger.info('📍 Consulta: Ubicación');
            return commandHandler.mostrarUbicacion(from);
        }

        // Medios de pago
        if (textoLower.match(/pago|efectivo|tarjeta|transfer|mercadopago|debito|credito/)) {
            logger.info('💳 Consulta: Medios de pago');
            return commandHandler.mostrarMediosPago(from);
        }

        // Contacto
        if (textoLower.match(/contacto|telefono|whatsapp|llamar/)) {
            logger.info('📞 Consulta: Contacto');
            return commandHandler.mostrarContacto(from);
        }

        // ═══════════════════════════════════════════════════════════════
        // PRIORIDAD 5: BÚSQUEDA DE PRODUCTOS (ANTES DE FOTOS)
        // ═══════════════════════════════════════════════════════════════

        logger.info('🔍 Buscando productos en el mensaje...');
        const productosDetectados = productDetectionHandler.detectarProductos(textoOriginal);
        
        if (productosDetectados.length > 0) {
            logger.info(`✅ Productos encontrados: ${productosDetectados.length}`);
            
            // Limpiar estados previos
            if (carrito.servicio_personalizado) {
                logger.info('🧹 Limpiando servicio personalizado previo');
                delete carrito.servicio_personalizado;
            }
            if (carrito.esperando_tipo_entrega) {
                logger.info('🧹 Limpiando esperando_tipo_entrega previo');
                delete carrito.esperando_tipo_entrega;
            }
            
            sessionManager.marcarSesionActiva(from, 'consultando_productos');
            sessionManager.actualizarCarrito(from, carrito);
            
            return await productDetectionHandler.procesarDeteccion(from, productosDetectados, sock);
        }

        // ✅ CORREGIDO: Solicitud de fotos DESPUÉS de buscar productos
        if (textoLower.match(/^foto\b|^imagen\b|^pic\b|\bfoto\b|\bimagen\b|\bfotograf|\bpicture\b|\bver foto\b|\btenes foto\b|\bmanda.*foto\b|\bquiero.*foto\b|\bmostrar.*foto\b|\bver.*imagen\b/)) {
            logger.info('📸 Solicitud de foto detectada');
            
            if (carrito.ultimo_producto_consultado || carrito.temporal) {
                return await productDetectionHandler.enviarFotosProducto(from, sock);
            } else {
                return `🤔 No tengo productos guardados para mostrarte fotos.\n\nBusca un producto primero (ejemplo: "tenes alcohol?") y luego pide la foto.`;
            }
        }

        // Catálogo general
        if (textoLower.match(/^(lista|catalogo|que tienen|que venden|productos|menu)$/)) {
            logger.info('📋 Comando: Catálogo completo');
            return commandHandler.mostrarCatalogo(from);
        }

        // Consulta de stock
        if (textoLower.match(/stock|hay|tienen|disponible|queda|quedan/)) {
            logger.info('📦 Consulta: Stock');
            return commandHandler.mostrarInfoStock(from);
        }

        // ═══════════════════════════════════════════════════════════════
        // PRIORIDAD 6: FILTROS Y FALLBACKS
        // ═══════════════════════════════════════════════════════════════

        // Filtrar mensajes personales/videojuegos
        if (textoLower.match(/que onda|sale|vamos|juga|juego|fortnite|valorant|lol|free fire|minecraft|fifa|pes|cod|call of duty|among us|roblox|gta/)) {
            logger.info('💬 Mensaje personal/videojuegos detectado - Ignorando');
            return null;
        }

        // IA solo para consultas de negocio
        logger.info('🤖 No coincide con patrones. Verificando si es consulta de negocio...');

        const pareceNegocio = textoLower.match(/precio|cuanto|cuesta|vend|tien|hay|stock|comprar|producto|catalogo|lista|menu|donde|ubicacion|horario|pago|entrega|delivery|envio|servicio|atencion|consulta|necesito|quiero|busco|me interesa/);

        if (!pareceNegocio) {
            logger.info('💬 Mensaje no relacionado con negocio - No usar IA');
            return null;
        }

        logger.info('✅ Parece consulta de negocio - Consultando IA...');
        const respuestaIA = await aiService.procesarMensaje(textoOriginal, {
            nombre: nombreContacto,
            telefono: from,
            historial: clientService.obtenerPorTelefono(from)
        });
        
        if (respuestaIA) {
            logger.info('✅ IA generó respuesta');
            sessionManager.marcarSesionActiva(from, 'consulta_ia');
            return respuestaIA;
        }

        // Respuesta por defecto
        logger.warn('⚠️ Sin respuesta disponible - Enviando mensaje por defecto');
        return `No entendí bien tu consulta 🤔\n\n` +
               `Puedes preguntarme sobre:\n` +
               `• Precios y productos\n` +
               `• Hacer un pedido (ej: "Quiero 2 cuadernos")\n` +
               `• Ver mis pedidos anteriores\n` +
               `• Horarios de atención\n` +
               `• Ubicación del local\n` +
               `• Stock disponible\n` +
               `• Medios de pago\n\n` +
               `¿En qué te puedo ayudar?`;
    }

    /**
     * Verifica si el mensaje es comercial (relacionado al negocio)
     */
    verificarMensajeNegocio(texto) {
        const textoLimpio = limpiarTexto(texto);
        
        const palabras = textoLimpio.split(' ').filter(p => p.length > 0);
        
        if (palabras.length <= 3) {
            const esSoloPersonal = MENSAJES_PERSONALES.some(personal => 
                textoLimpio === personal.toLowerCase() || 
                textoLimpio === personal.toLowerCase().replace(/\s/g, '')
            );
            
            if (esSoloPersonal) {
                logger.debug('   └─ Mensaje personal detectado');
                return false;
            }
        }
        
        const tieneIntencion = PALABRAS_INTENCION.some(palabra => 
            textoLimpio.includes(palabra)
        );
        
        if (tieneIntencion) {
            logger.debug('   └─ Palabra de intención encontrada');
        }
        
        const palabrasClave = cache.obtenerPalabrasClaveSync();
        const tieneProducto = (palabrasClave.palabras_productos || []).some(producto => {
            const productoLimpio = limpiarTexto(producto);
            return textoLimpio.includes(productoLimpio);
        });
        
        if (tieneProducto) {
            logger.debug('   └─ Producto mencionado');
        }
        
        const tieneSaludoComercial = SALUDOS_COMERCIALES.some(saludo => 
            textoLimpio.includes(saludo)
        );
        
        if (tieneSaludoComercial) {
            logger.debug('   └─ Saludo comercial detectado');
        }
        
        return tieneIntencion || tieneProducto || tieneSaludoComercial;
    }
}

module.exports = new TextMessageHandler();