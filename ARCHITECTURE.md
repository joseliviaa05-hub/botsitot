# 🏗️ Arquitectura del Sistema

Documentación técnica de la arquitectura de **BotSitot v2. 0**

---

## 📋 Tabla de Contenidos

- [Visión General](#visión-general)
- [Arquitectura de Alto Nivel](#arquitectura-de-alto-nivel)
- [Estructura de Carpetas](#estructura-de-carpetas)
- [Flujo de Datos](#flujo-de-datos)
- [Stack Tecnológico](#stack-tecnológico)
- [Patrones de Diseño](#patrones-de-diseño)
- [Base de Datos](#base-de-datos)
- [Seguridad](#seguridad)
- [Deployment](#deployment)

---

## 🎯 Visión General

**BotSitot** es un sistema de automatización empresarial que combina:

- 🤖 Bot de WhatsApp conversacional
- 🔌 API REST completa
- 💾 Base de datos PostgreSQL
- ⚡ Cache con Redis
- 🔐 Autenticación JWT
- 🐳 Containerización con Docker

---

## 🏛️ Arquitectura de Alto Nivel

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTS                               │
├──────────────┬──────────────────┬─────────────────────────┤
│  WhatsApp    │   Web/Mobile App  │   External APIs         │
│   Users      │   (Frontend)      │   (Integrations)        │
└──────┬───────┴─────────┬─────────┴──────────┬──────────────┘
       │                 │                    │
       │                 │                    │
       ▼                 ▼                    ▼
┌─────────────────────────────────────────────────────────────┐
│                    LOAD BALANCER (Railway)                   │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   EXPRESS SERVER (Node.js)                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  MIDDLEWARE LAYER                                     │  │
│  │  - Helmet (Security Headers)                          │  │
│  │  - CORS                                               │  │
│  │  - Rate Limiting (Redis)                              │  │
│  │  - Input Sanitization (XSS, NoSQL Injection, HPP)    │  │
│  │  - JWT Authentication                                 │  │
│  │  - Request Logging                                    │  │
│  └───────────────────────────────────────────────────────┘  │
│                           │                                  │
│  ┌────────────────────────┼──────────────────────────────┐  │
│  │         ROUTES LAYER   │                              │  │
│  │  ┌─────────────────────▼──────────────────────────┐  │  │
│  │  │ /api/auth      │ /api/productos  │ /api/pedidos│  │  │
│  │  │ /api/clientes  │ /api/stats      │ /api/whatsapp│ │  │
│  │  └────────────────────┬───────────────────────────┘  │  │
│  └────────────────────────┼──────────────────────────────┘  │
│                           │                                  │
│  ┌────────────────────────▼──────────────────────────────┐  │
│  │         CONTROLLERS LAYER                              │  │
│  │  - Request Validation                                  │  │
│  │  - Business Logic Orchestration                        │  │
│  │  - Response Formatting                                 │  │
│  └────────────────────────┬───────────────────────────────┘  │
│                           │                                  │
│  ┌────────────────────────▼──────────────────────────────┐  │
│  │         SERVICES LAYER                                 │  │
│  │  - Business Logic                                      │  │
│  │  - Data Processing                                     │  │
│  │  - External API Calls                                  │  │
│  │  - Cache Management                                    │  │
│  └────────────────────────┬───────────────────────────────┘  │
│                           │                                  │
│  ┌────────────────────────▼──────────────────────────────┐  │
│  │      PRISMA ORM (Type-safe DB Client)                  │  │
│  └────────────────────────┬───────────────────────────────┘  │
└────────────────────────────┼──────────────────────────────────┘
                            │
        ┌───────────────────┼────────────────────┐
        │                   │                    │
        ▼                   ▼                    ▼
┌──────────────┐   ┌──────────────┐    ┌──────────────┐
│  PostgreSQL  │   │    Redis     │    │   WhatsApp   │
│  (Neon DB)   │   │   (Upstash)  │    │  (Baileys)   │
│              │   │              │    │              │
│  - Users     │   │  - Sessions  │    │  - Messages  │
│  - Productos │   │  - Cache     │    │  - QR Auth   │
│  - Clientes  │   │  - Rate Limit│    │  - Webhooks  │
│  - Pedidos   │   │  - Tokens    │    │              │
└──────────────┘   └──────────────┘    └──────────────┘
```

---

## 📁 Estructura de Carpetas

```
botsitot/
│
├── src/                          # Código fuente
│   ├── config/                   # Configuraciones
│   │   ├── env. ts               # Variables de entorno
│   │   ├── cors.config.ts       # Configuración CORS
│   │   ├── security.config.ts   # Helmet config
│   │   ├── redis.config.ts      # Redis/Upstash
│   │   └── swagger.ts           # Swagger/OpenAPI
│   │
│   ├── controllers/              # Controladores (req/res)
│   │   ├── auth.controller. ts
│   │   ├── productos.controller.ts
│   │   ├── clientes.controller.ts
│   │   ├── pedidos.controller.ts
│   │   └── stats.controller.ts
│   │
│   ├── services/                 # Lógica de negocio
│   │   ├── auth. service.ts
│   │   ├── producto.service.ts
│   │   ├── cliente.service. ts
│   │   ├── pedido.service.ts
│   │   └── whatsapp.service.ts
│   │
│   ├── middleware/               # Middlewares
│   │   ├── auth.middleware.ts   # JWT verification
│   │   ├── rateLimiter.ts       # Rate limiting
│   │   ├── security.middleware.ts # XSS, NoSQL, HPP
│   │   ├── errorHandler.ts      # Global error handler
│   │   └── validators/          # Request validators
│   │
│   ├── routes/                   # Definición de rutas
│   │   ├── auth.routes. ts
│   │   ├── productos.routes.ts
│   │   ├── clientes.routes.ts
│   │   ├── pedidos.routes.ts
│   │   ├── stats.routes.ts
│   │   └── whatsapp.routes.ts
│   │
│   ├── types/                    # TypeScript types
│   │   ├── index.ts
│   │   ├── auth.types.ts
│   │   └── whatsapp.types.ts
│   │
│   ├── utils/                    # Utilidades
│   │   ├── logger.ts            # Winston logger
│   │   ├── jwt.ts               # JWT helpers
│   │   └── validators.ts        # Validation helpers
│   │
│   ├── server. ts                 # Express server setup
│   └── index.ts                  # Entry point
│
├── prisma/                       # Prisma ORM
│   ├── schema.prisma            # Database schema
│   ├── migrations/              # DB migrations
│   └── seed. ts                  # Seed data
│
├── tests/                        # Tests
│   ├── unit/                    # Unit tests
│   ├── integration/             # Integration tests
│   └── e2e/                     # End-to-end tests
│
├── . github/                      # GitHub Actions
│   └── workflows/
│       ├── ci.yml               # CI pipeline
│       ├── deploy.yml           # Deploy pipeline
│       └── docker-publish.yml   # Docker build
│
├── dist/                         # Compiled TypeScript
├── node_modules/                 # Dependencies
│
├── .env                          # Environment variables
├── .eslintrc.js                 # ESLint config
├── .prettierrc                  # Prettier config
├── tsconfig.json                # TypeScript config
├── package.json                 # Dependencies & scripts
├── Dockerfile                   # Docker image
├── docker-compose.yml           # Docker compose (dev)
└── README.md                    # Documentation
```

---

## 🔄 Flujo de Datos

### 1️⃣ Request de Usuario (API REST)

```
1. Cliente envía request
   ↓
2. Express recibe request
   ↓
3.  MIDDLEWARE CHAIN:
   ├─ Helmet (security headers)
   ├─ CORS (cross-origin)
   ├─ Rate Limiter (Redis check)
   ├─ Body Parser (JSON parsing)
   ├─ Input Sanitization (XSS, NoSQL, HPP)
   ├─ JWT Authentication (verify token)
   └─ Request Logger
   ↓
4. Router dirige a endpoint correcto
   ↓
5. Controller:
   ├─ Valida request (express-validator)
   ├─ Llama a Service
   └─ Formatea response
   ↓
6. Service:
   ├─ Business logic
   ├─ Cache check (Redis)
   ├─ DB query (Prisma)
   └─ Cache update (Redis)
   ↓
7. Response al cliente
```

### 2️⃣ Mensaje de WhatsApp

```
1. Usuario envía mensaje a WhatsApp
   ↓
2.  Baileys recibe mensaje
   ↓
3. WhatsApp Service procesa:
   ├─ Identifica tipo de mensaje
   ├─ Verifica whitelist
   ├─ Extrae intención del usuario
   └─ Determina acción
   ↓
4. Ejecuta acción:
   ├─ Consulta DB (vía Prisma)
   ├─ Actualiza estado conversacional (Redis)
   ├─ Genera respuesta
   └─ Envía mensaje
   ↓
5. Usuario recibe respuesta en WhatsApp
```

---

## 🛠️ Stack Tecnológico

### **Backend**

| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| Node.js | 20+ | Runtime de JavaScript |
| TypeScript | 5.9 | Type safety |
| Express | 4.22 | Web framework |
| Prisma | 6.19 | ORM type-safe |

### **Base de Datos**

| Tecnología | Propósito |
|------------|-----------|
| PostgreSQL 14+ | Base de datos principal (Neon serverless) |
| Redis 7+ | Cache, sessions, rate limiting (Upstash) |

### **Seguridad**

| Librería | Propósito |
|----------|-----------|
| Helmet | Security headers |
| jsonwebtoken | JWT auth |
| bcryptjs | Password hashing |
| express-validator | Input validation |
| express-mongo-sanitize | NoSQL injection protection |
| xss-clean | XSS protection |
| hpp | HTTP Parameter Pollution |
| express-rate-limit | Rate limiting |

### **Testing**

| Librería | Propósito |
|----------|-----------|
| Jest | Test runner |
| Supertest | HTTP testing |
| ts-jest | TypeScript support |

### **DevOps**

| Tecnología | Propósito |
|------------|-----------|
| Docker | Containerización |
| GitHub Actions | CI/CD |
| Railway | Hosting |
| ESLint | Linting |
| Prettier | Code formatting |
| Husky | Git hooks |

### **WhatsApp**

| Librería | Propósito |
|----------|-----------|
| @whiskeysockets/baileys | WhatsApp Web API |
| qrcode-terminal | QR code generation |

---

## 🎨 Patrones de Diseño

### **1. Layered Architecture (Capas)**

```
Presentation Layer (Controllers)
        ↓
Business Logic Layer (Services)
        ↓
Data Access Layer (Prisma)
        ↓
Database (PostgreSQL)
```

**Ventajas:**
- ✅ Separación de responsabilidades
- ✅ Fácil de testear
- ✅ Fácil de mantener
- ✅ Escalable

### **2. Dependency Injection**

```typescript
// Service recibe dependencias inyectadas
class ProductoService {
  constructor(
    private prisma: PrismaClient,
    private cache: RedisClient
  ) {}
}
```

### **3. Repository Pattern (vía Prisma)**

```typescript
// Abstracción de acceso a datos
const producto = await prisma.producto.findUnique({
  where: { id }
});
```

### **4. Middleware Chain Pattern**

```typescript
app.use(helmet());
app.use(cors());
app.use(rateLimiter);
app.use(authenticate);
```

### **5. Factory Pattern (para rate limiters)**

```typescript
export const createRateLimiter = (options) => {
  return rateLimit({ ... defaultOptions, ...options });
};
```

---

## 💾 Base de Datos

### **Schema Principal**

```prisma
model User {
  id            String   @id @default(uuid())
  username      String   @unique
  email         String   @unique
  password      String
  nombre        String
  rol           Role     @default(USER)
  activo        Boolean  @default(true)
  refreshTokens RefreshToken[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model Cliente {
  id        String   @id @default(uuid())
  telefono  String   @unique
  nombre    String
  email     String? 
  direccion String?
  activo    Boolean  @default(true)
  pedidos   Pedido[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Producto {
  id          String        @id @default(uuid())
  nombre      String
  descripcion String? 
  precio      Decimal
  stock       Int
  categoria   String
  activo      Boolean       @default(true)
  imagenes    Json? 
  items       PedidoItem[]
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
}

model Pedido {
  id                String      @id @default(uuid())
  numeroOrden       String      @unique
  cliente           Cliente     @relation(fields: [clienteId], references: [id])
  clienteId         String
  items             PedidoItem[]
  subtotal          Decimal
  descuento         Decimal     @default(0)
  impuestos         Decimal     @default(0)
  total             Decimal
  estado            EstadoPedido @default(PENDIENTE)
  tipoEntrega       TipoEntrega
  direccionEntrega  String?
  estadoPago        EstadoPago  @default(PENDIENTE)
  metodoPago        String?
  notas             String?
  createdAt         DateTime    @default(now())
  updatedAt         DateTime    @updatedAt
}
```

### **Índices para Performance**

```prisma
@@index([telefono])           // Cliente lookup
@@index([categoria, activo])  // Producto filtering
@@index([estado, createdAt])  // Pedido queries
@@index([clienteId, estado])  // Client orders
```

---

## 🔐 Seguridad

### **Capas de Seguridad**

```
1. Network Layer
   └─ HTTPS/TLS (Railway)

2. Application Layer
   ├─ Helmet (security headers)
   ├─ CORS (allowed origins)
   └─ Rate Limiting (Redis)

3. Authentication Layer
   ├─ JWT tokens (RS256)
   ├─ Refresh tokens
   └─ Password hashing (bcrypt)

4. Authorization Layer
   ├─ Role-based access (RBAC)
   └─ Resource-level permissions

5. Input Validation Layer
   ├─ express-validator
   ├─ Sanitization (XSS, NoSQL)
   └─ Schema validation

6. Data Layer
   ├─ Prepared statements (Prisma)
   ├─ Encrypted connections
   └─ No SQL injection (ORM)
```

### **JWT Token Flow**

```
1. User login con credentials
   ↓
2. Server valida y genera:
   ├─ Access Token (15min TTL)
   └─ Refresh Token (30 days TTL)
   ↓
3. Cliente guarda tokens
   ↓
4.  Cada request incluye Access Token
   ↓
5. Si Access Token expira:
   └─ Usar Refresh Token para obtener nuevo Access Token
   ↓
6. Si Refresh Token expira:
   └─ Login nuevamente
```

---

## 🚀 Deployment

### **Entornos**

```yaml
Development:
  - Local: Docker Compose
  - DB: PostgreSQL local
  - Redis: Local o Upstash
  - WhatsApp: QR scan local

Staging:
  - Railway Preview Deploy
  - DB: Neon (staging branch)
  - Redis: Upstash
  - WhatsApp: Deshabilitado

Production:
  - Railway Production
  - DB: Neon (main branch)
  - Redis: Upstash
  - WhatsApp: Habilitado
```

### **CI/CD Pipeline**

```
1. Push a GitHub
   ↓
2. GitHub Actions ejecuta:
   ├─ Install dependencies
   ├─ Run linter (ESLint)
   ├─ Run tests (Jest)
   ├─ Build TypeScript
   ├─ Security audit (npm audit)
   └─ Upload coverage (Codecov)
   ↓
3. Si todo pasa y es push a main:
   ↓
4. Deploy to Railway:
   ├─ Build Docker image
   ├─ Run migrations
   ├─ Health check
   └─ Route traffic
```

---

## 📊 Monitoreo (Próximamente)

```yaml
Logs:
  - Winston (structured logging)
  - Archivos rotativos
  - Niveles: error, warn, info, debug

Errors:
  - Sentry (error tracking)
  - Stack traces
  - User context

Metrics:
  - Response times
  - Request counts
  - Error rates
  - DB query performance

Health Checks:
  - /health (uptime, version)
  - /api/status (services status)
  - DB connectivity
  - Redis connectivity
```

---

## 🔮 Escalabilidad Futura

### **Horizontal Scaling**

```
┌─────────┐   ┌─────────┐   ┌─────────┐
│ Node 1  │   │ Node 2  │   │ Node 3  │
└────┬────┘   └────┬────┘   └────┬────┘
     └─────────────┼─────────────┘
                   │
         ┌─────────▼─────────┐
         │  Load Balancer    │
         └───────────────────┘
                   │
         ┌─────────▼─────────┐
         │  Redis (Sessions) │
         └───────────────────┘
```

### **Microservicios (Fase 3)**

```
API Gateway
    ├─ Auth Service
    ├─ Product Service
    ├─ Order Service
    └─ WhatsApp Service
```

---

<div align="center">

**Documentación actualizada: 2025-12-07**

[⬅️ Volver al README](./README.md)

</div>