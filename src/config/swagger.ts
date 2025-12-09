// ═══════════════════════════════════════════════════════════════
// SWAGGER CONFIGURATION
// API Documentation con OpenAPI 3.0
// ═══════════════════════════════════════════════════════════════

import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env';

const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'BotSitot API',
      version: '2.0.0',
      description: `
        API REST completa para gestión de bot de WhatsApp empresarial. 
        
        ## Características
        - 🔐 Autenticación JWT con refresh tokens
        - 👥 Sistema de roles (Admin, Operator, User)
        - 📦 Gestión completa de productos
        - 👤 CRUD de clientes
        - 🛒 Sistema de pedidos
        - 📊 Estadísticas y reportes
        - 🤖 Integración con WhatsApp
        
        ## Autenticación
        La mayoría de endpoints requieren autenticación JWT.
        
        1.  Registrarse en \`/api/auth/register\`
        2. Login en \`/api/auth/login\`
        3. Usar el token en el header: \`Authorization: Bearer <token>\`
      `,
      contact: {
        name: 'joseliviaa05-hub',
        url: 'https://github.com/joseliviaa05-hub/botsitot',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: `http://localhost:${env.PORT}`,
        description: 'Servidor de Desarrollo',
      },
      {
        url: 'https://botsitot-production.up.railway.app',
        description: 'Servidor de Producción',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Ingrese el token JWT (sin "Bearer")',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Mensaje de error',
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
              },
              description: 'Detalles de errores de validación',
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            username: {
              type: 'string',
            },
            email: {
              type: 'string',
              format: 'email',
            },
            nombre: {
              type: 'string',
            },
            role: {
              type: 'string',
              enum: ['ADMIN', 'OPERATOR', 'USER'],
            },
            activo: {
              type: 'boolean',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Producto: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            nombre: {
              type: 'string',
            },
            descripcion: {
              type: 'string',
            },
            precio: {
              type: 'number',
              format: 'float',
            },
            stock: {
              type: 'integer',
            },
            categoria: {
              type: 'string',
            },
            activo: {
              type: 'boolean',
            },
            imagenes: {
              type: 'array',
              items: {
                type: 'object',
              },
            },
          },
        },
        Cliente: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            telefono: {
              type: 'string',
            },
            nombre: {
              type: 'string',
            },
            email: {
              type: 'string',
              format: 'email',
            },
            direccion: {
              type: 'string',
            },
            activo: {
              type: 'boolean',
            },
          },
        },
        Pedido: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            numeroOrden: {
              type: 'string',
            },
            clienteId: {
              type: 'string',
              format: 'uuid',
            },
            subtotal: {
              type: 'number',
              format: 'float',
            },
            total: {
              type: 'number',
              format: 'float',
            },
            estado: {
              type: 'string',
              enum: [
                'PENDIENTE',
                'CONFIRMADO',
                'EN_PREPARACION',
                'EN_CAMINO',
                'ENTREGADO',
                'CANCELADO',
              ],
            },
            tipoEntrega: {
              type: 'string',
              enum: ['DELIVERY', 'RETIRO'],
            },
            estadoPago: {
              type: 'string',
              enum: ['PENDIENTE', 'PAGADO', 'CANCELADO'],
            },
            items: {
              type: 'array',
              items: {
                type: 'object',
              },
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      {
        name: 'Auth',
        description: 'Autenticación y autorización',
      },
      {
        name: 'Productos',
        description: 'Gestión de productos',
      },
      {
        name: 'Clientes',
        description: 'Gestión de clientes',
      },
      {
        name: 'Pedidos',
        description: 'Gestión de pedidos',
      },
      {
        name: 'Stats',
        description: 'Estadísticas y reportes',
      },
      {
        name: 'WhatsApp',
        description: 'Control del bot de WhatsApp',
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(swaggerOptions);
