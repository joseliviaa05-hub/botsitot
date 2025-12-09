/**
 * ═══════════════════════════════════════════════════════════════
 * AI SERVICE - Groq Integration
 * Respuestas naturales con IA para WhatsApp
 * ═══════════════════════════════════════════════════════════════
 */

import Groq from 'groq-sdk';
import { logger } from '../utils/logger';
import { env } from '../config/env';

class AIService {
  private groq: Groq | null = null;
  private isEnabled: boolean = false;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      logger.warn('⚠️ GROQ_API_KEY no configurado - IA deshabilitada');
      logger.warn('   El bot usará respuestas predefinidas');
      return;
    }

    try {
      this.groq = new Groq({ apiKey });
      this.isEnabled = true;
      logger.success('✅ Groq IA habilitado');
    } catch (error: any) {
      logger.error(`❌ Error inicializando Groq: ${error.message}`);
    }
  }

  /**
   * ⭐ Generar respuesta natural con contexto del negocio
   */
  async generarRespuesta(params: {
    mensajeUsuario: string;
    nombreCliente?: string;
    contexto?: string;
    tipoConsulta?: 'general' | 'producto' | 'precio' | 'horario' | 'ubicacion';
  }): Promise<string> {
    // Si IA está deshabilitada, retornar respuesta genérica
    if (!this.isEnabled || !this.groq) {
      return this.respuestaFallback(params.tipoConsulta || 'general');
    }

    try {
      const systemPrompt = this.construirPrompt(params);

      const completion = await this.groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile', // Modelo rápido y bueno
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: params.mensajeUsuario,
          },
        ],
        temperature: 0.7, // Balance entre creatividad y consistencia
        max_tokens: 200, // Respuestas concisas
        top_p: 1,
      });

      const respuesta = completion.choices[0]?.message?.content || '';

      if (!respuesta) {
        return this.respuestaFallback(params.tipoConsulta || 'general');
      }

      logger.debug(`🤖 IA Response: ${respuesta.substring(0, 100)}...`);
      return respuesta.trim();
    } catch (error: any) {
      logger.error(`❌ Error generando respuesta IA: ${error.message}`);
      return this.respuestaFallback(params.tipoConsulta || 'general');
    }
  }

  /**
   * ⭐ Construir prompt del sistema según el tipo de consulta
   */
  private construirPrompt(params: {
    nombreCliente?: string;
    contexto?: string;
    tipoConsulta?: string;
  }): string {
    const nombreNegocio = env.BUSINESS_NAME || 'BOTSITOT';
    const nombreCliente = params.nombreCliente || 'cliente';

    let basePrompt = `Sos un vendedor profesional y amable de ${nombreNegocio}, una tienda que vende artículos de librería, cotillón y juguetería. 

**TU PERSONALIDAD:**
- Amigable, cercano y profesional
- Usás lenguaje argentino informal pero respetuoso (vos, che, dale, etc.)
- Breve y directo (máximo 2-3 líneas)
- Siempre positivo y servicial
- No usás emojis en exceso (máximo 1-2 por mensaje)

**TU OBJETIVO:**
- Ayudar al cliente a encontrar lo que necesita
- Guiarlo naturalmente hacia hacer un pedido
- Responder consultas de forma clara

**REGLAS IMPORTANTES:**
- NUNCA inventes productos o precios
- Si no sabés algo, derivá amablemente al catálogo
- Si te preguntan por stock, decí que pueden consultar el catálogo
- Mantené respuestas cortas (2-3 líneas máximo)
- Si te saludan, saludá de vuelta brevemente`;

    // Agregar contexto específico según tipo
    if (params.tipoConsulta === 'precio') {
      basePrompt += `\n\n**CONTEXTO ACTUAL:** El cliente está consultando precios.   Recordale que puede ver el catálogo completo escribiendo "categorias". `;
    } else if (params.tipoConsulta === 'producto') {
      basePrompt += `\n\n**CONTEXTO ACTUAL:** El cliente busca un producto específico.  Ayudalo a encontrarlo y sugerile ver el catálogo si no encontramos lo que busca.`;
    } else if (params.tipoConsulta === 'horario') {
      basePrompt += `\n\n**INFORMACIÓN:** Lunes a Viernes 9:00-19:00, Sábados 9:00-13:00, Domingos cerrado.`;
    }

    if (params.contexto) {
      basePrompt += `\n\n**CONTEXTO ADICIONAL:** ${params.contexto}`;
    }

    return basePrompt;
  }

  /**
   * ⭐ Respuestas de fallback cuando IA no está disponible
   */
  private respuestaFallback(tipo: string): string {
    const fallbacks: Record<string, string[]> = {
      general: [
        '¡Hola!   ¿En qué puedo ayudarte hoy?  😊',
        '¡Buenas!   Estoy acá para ayudarte.   ¿Qué necesitás? ',
        'Hola!   Decime en qué puedo asistirte.',
      ],
      producto: [
        'Dale, buscá el producto que necesitás y te ayudo a encontrarlo.',
        'Perfecto, decime qué producto estás buscando.',
        'Claro!   ¿Qué producto necesitás?',
      ],
      precio: [
        'Genial, ¿de qué producto querés saber el precio?',
        'Dale, consultá el precio que necesites.',
        'Perfecto, decime qué producto te interesa.',
      ],
      horario: [
        'Estamos de lunes a viernes de 9 a 19hs, y sábados de 9 a 13hs.   Domingos cerrado.',
        'Nuestro horario es L a V de 9 a 19hs, y sábados de 9 a 13hs.  ',
      ],
      ubicacion: ['Te paso nuestra ubicación por privado.   ¿Necesitás algo más?'],
    };

    const opciones = fallbacks[tipo] || fallbacks.general;
    return opciones[Math.floor(Math.random() * opciones.length)];
  }

  /**
   * ⭐ Verificar si IA está habilitada
   */
  isAIEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * ⭐ Analizar intención del usuario (clasificación básica)
   */
  async analizarIntencion(mensaje: string): Promise<{
    intencion: 'saludo' | 'pedido' | 'consulta' | 'precio' | 'otro';
    confianza: number;
  }> {
    const mensajeLower = mensaje.toLowerCase();

    // Saludos
    if (mensajeLower.match(/\b(hola|buenas|buen día|buenos días|buenas tardes|che)\b/)) {
      return { intencion: 'saludo', confianza: 0.9 };
    }

    // Pedido
    if (mensajeLower.match(/\b(quiero|necesito|busco|comprar|pedir|pedido|encargar)\b/)) {
      return { intencion: 'pedido', confianza: 0.8 };
    }

    // Precio
    if (mensajeLower.match(/\b(cuanto|precio|vale|cuesta|sale)\b/)) {
      return { intencion: 'precio', confianza: 0.85 };
    }

    // Consulta general
    if (mensajeLower.match(/\b(tienen|hay|stock|horario|donde|ubicacion)\b/)) {
      return { intencion: 'consulta', confianza: 0.7 };
    }

    return { intencion: 'otro', confianza: 0.5 };
  }
}

export default new AIService();
