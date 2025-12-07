<div align="center">

# 🤖 BotSitot - WhatsApp Business Bot

### Bot de WhatsApp multifuncional para gestión de negocios

[![TypeScript](https://img.shields. io/badge/TypeScript-5.9-blue? logo=typescript)](https://www.typescriptlang.org/)
[![Node. js](https://img.shields. io/badge/Node.js-20+-green?logo=node.js)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.22-lightgrey?logo=express)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-blue?logo=postgresql)](https://www.postgresql.org/)
[![Redis](https://img.shields. io/badge/Redis-7+-red?logo=redis)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)](https://www.docker.com/)
[![Prisma](https://img.shields. io/badge/Prisma-6.19-2D3748?logo=prisma)](https://www.prisma. io/)
[![Tests](https://img.shields.io/badge/Tests-256%20passing-success)](https://jestjs.io/)
[![Coverage](https://img.shields.io/badge/Coverage-42. 73%25-yellow)](https://jestjs.io/)
[![License](https://img.shields.io/badge/License-MIT-green)](./LICENSE)

[Características](#-características) •
[Demo](#-demo) •
[Instalación](#-instalación) •
[Uso](#-uso) •
[API](#-api) •
[Documentación](#-documentación)

</div>

---

## 📋 Descripción

**BotSitot** es un bot de WhatsApp empresarial completo, diseñado para automatizar la gestión de negocios multirubro. Permite a los clientes realizar pedidos, consultar productos, y gestionar información de manera conversacional a través de WhatsApp.

### 🎯 Problema que resuelve

- ❌ **Antes:** Gestión manual de pedidos por WhatsApp (lento, propenso a errores)
- ✅ **Ahora:** Sistema automatizado con base de datos, autenticación, y API REST completa

---

## ✨ Características

### 🤖 Bot de WhatsApp
- ✅ **Conversación natural** - Interfaz conversacional intuitiva
- ✅ **Catálogo de productos** - Navegación por categorías
- ✅ **Carrito de compras** - Agregar/quitar productos dinámicamente
- ✅ **Pedidos automatizados** - Gestión completa de pedidos
- ✅ **Notificaciones** - Confirmaciones y actualizaciones automáticas
- ✅ **Whitelist de números** - Control de acceso

### 🔐 API REST Segura
- ✅ **Autenticación JWT** - Tokens seguros con refresh tokens
- ✅ **Roles y permisos** - Admin, Operator, User
- ✅ **Rate limiting** - Protección contra abusos
- ✅ **Validación robusta** - express-validator + sanitización
- ✅ **Seguridad avanzada** - Helmet, CORS, XSS protection, HPP

### 📊 Gestión de Datos
- ✅ **PostgreSQL** - Base de datos relacional (Neon serverless)
- ✅ **Prisma ORM** - Type-safe queries
- ✅ **Redis Cache** - Cache inteligente con TTL
- ✅ **Migraciones** - Versionado de schema
- ✅ **Indexación** - Queries optimizados

### 🧪 Testing & CI/CD
- ✅ **256 tests** - Unit + Integration tests
- ✅ **42.73% coverage** - Jest con coverage reports
- ✅ **GitHub Actions** - CI/CD automático
- ✅ **ESLint + Prettier** - Code quality
- ✅ **Husky** - Git hooks para pre-commit

### 🐳 Docker & Deploy
- ✅ **Multi-stage Dockerfile** - Build optimizado
- ✅ **Docker Compose** - Dev + Prod environments
- ✅ **Hot-reload** - Desarrollo con nodemon
- ✅ **Health checks** - Monitoreo automático
- ✅ **Railway ready** - Deploy con un click

---

## 🛠️ Stack Tecnológico

<table>
<tr>
<td>

**Backend**
- TypeScript 5.9
- Node.js 20+
- Express 4.22
- Prisma 6.19

</td>
<td>

**Base de Datos**
- PostgreSQL 14+
- Redis 7
- Neon (Serverless)
- Upstash (Redis Cloud)

</td>
<td>

**WhatsApp**
- @whiskeysockets/baileys
- QR Code auth
- Multi-device support

</td>
</tr>
<tr>
<td>

**Seguridad**
- JWT (jsonwebtoken)
- bcryptjs
- Helmet. js
- express-validator

</td>
<td>

**Testing**
- Jest 30
- Supertest
- ts-jest
- 256 tests

</td>
<td>

**DevOps**
- Docker
- GitHub Actions
- ESLint + Prettier
- Husky

</td>
</tr>
</table>

---

## 🚀 Instalación

### Prerrequisitos

```bash
node >= 18.0.0
npm >= 9.0.0
PostgreSQL 14+
Redis 7+ (opcional)
```

### 1. Clonar el repositorio

```bash
git clone https://github.com/joseliviaa05-hub/botsitot.git
cd botsitot
git checkout refactor-v2
```

### 2. Instalar dependencias

```bash
npm install
```

### 3.  Configurar variables de entorno

```bash
cp .env.example . env
```

**Editar `. env` con tus credenciales:**

```env
# ═══════════════════════════════════════════════
# DATABASE (Neon PostgreSQL)
# ═══════════════════════════════════════════════
DATABASE_URL="postgresql://user:password@host/database? sslmode=require"

# ═══════════════════════════════════════════════
# JWT (Generar con: openssl rand -base64 32)
# ═══════════════════════════════════════════════
JWT_SECRET="tu-secret-super-seguro-aqui"
JWT_EXPIRES_IN="7d"
JWT_REFRESH_EXPIRES_IN="30d"

# ═══════════════════════════════════════════════
# WHATSAPP
# ═══════════════════════════════════════════════
NUMERO_DUENO="+5491112345678"
WHATSAPP_WHITELIST="+5491112345678,+5491187654321"

# ═══════════════════════════════════════════════
# REDIS (Opcional - Upstash)
# ═══════════════════════════════════════════════
REDIS_URL="redis://default:password@host:port"

# ═══════════════════════════════════════════════
# SERVER
# ═══════════════════════════════════════════════
PORT=3000
NODE_ENV=development
```

### 4. Configurar base de datos

```bash
# Generar cliente Prisma
npm run prisma:generate

# Ejecutar migraciones
npm run prisma:migrate

# Seed (datos de prueba)
npm run prisma:seed
```

### 5. Iniciar el servidor

**Desarrollo (con hot-reload):**
```bash
npm run dev
```

**Producción:**
```bash
npm run build
npm start
```

**Con Docker:**
```bash
docker-compose up -d
```

---

## 📱 Uso

### Iniciar el bot de WhatsApp

1.  Ejecutar el servidor:
```bash
npm run dev
```

2. Escanear el código QR que aparece en la consola con WhatsApp

3. El bot estará activo y responderá a mensajes

### Ejemplo de conversación

```
👤 Usuario: Hola
🤖 Bot: ¡Hola! Bienvenido a [Tu Negocio]

       ¿Qué te gustaría hacer?
       
       1️⃣ Ver productos
       2️⃣ Hacer un pedido
       3️⃣ Ver mis pedidos
       4️⃣ Contactar soporte
       5️⃣ Info del negocio

👤 Usuario: 1
🤖 Bot: 📦 Categorías disponibles:
       
       1.  Electrónica
       2. Ropa
       3. Alimentos
       
       Enviá el número de la categoría... 

👤 Usuario: 1
🤖 Bot: 📱 Productos en Electrónica:
       
       1. iPhone 15 - $999
       2. Samsung Galaxy S24 - $899
       3. AirPods Pro - $249
       
       Enviá el número para agregar al carrito... 
```

---

## 🔌 API

### Autenticación

```bash
# Registrar usuario
POST /api/auth/register
Content-Type: application/json

{
  "username": "admin",
  "email": "admin@example.com",
  "password": "SecurePass123! ",
  "nombre": "Admin User"
}

# Login
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "SecurePass123!"
}

# Response
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.. .",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.. .",
  "user": {
    "id": "uuid",
    "username": "admin",
    "role": "ADMIN"
  }
}
```

### Productos

```bash
# Listar productos
GET /api/productos? page=1&limit=10&categoria=Electrónica
Authorization: Bearer <token>

# Crear producto (requiere rol OPERATOR o ADMIN)
POST /api/productos
Authorization: Bearer <token>
Content-Type: application/json

{
  "nombre": "iPhone 15 Pro",
  "descripcion": "Último modelo de Apple",
  "precio": 1199.99,
  "stock": 50,
  "categoria": "Electrónica",
  "activo": true
}
```

### Pedidos

```bash
# Crear pedido
POST /api/pedidos
Authorization: Bearer <token>
Content-Type: application/json

{
  "clienteId": "uuid-del-cliente",
  "items": [
    {
      "productoId": "uuid-del-producto",
      "cantidad": 2,
      "precioUnitario": 999.99
    }
  ],
  "tipoEntrega": "DELIVERY",
  "direccionEntrega": "Av.  Siempre Viva 742"
}
```

**Ver documentación completa en:** `http://localhost:3000/api-docs` (próximamente con Swagger)

---

## 📦 Scripts npm

```bash
# Desarrollo
npm run dev              # Servidor con hot-reload
npm run dev:debug        # Servidor con inspector

# Producción
npm run build            # Compilar TypeScript
npm start                # Iniciar servidor compilado

# Testing
npm test                 # Ejecutar tests
npm run test:watch       # Tests en modo watch
npm run test:coverage    # Tests con coverage

# Prisma
npm run prisma:generate  # Generar cliente
npm run prisma:migrate   # Ejecutar migraciones
npm run prisma:studio    # Abrir Prisma Studio
npm run prisma:seed      # Seed de datos

# Code Quality
npm run lint             # Verificar código
npm run lint:fix         # Auto-fix issues
npm run format           # Formatear con Prettier
npm run type-check       # Verificar tipos TS
```

---

## 🐳 Docker

### Development

```bash
docker-compose up -d
```

### Production

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Comandos útiles

```bash
# Ver logs
docker-compose logs -f app

# Ejecutar migraciones
docker-compose exec app npm run prisma:migrate

# Abrir shell
docker-compose exec app sh

# Rebuild
docker-compose up -d --build
```

---

## 📊 Estado del Proyecto

```yaml
✅ Fase 1  - Fundaciones:        87%
✅ Fase 2  - Base de Datos:      98%
✅ Fase 3  - Seguridad:          90%
✅ Fase 4  - Testing:            75%
✅ Fase 5  - CI/CD:              70%
✅ Fase 6  - Optimizaciones:     88%
❌ Fase 7  - WhatsApp Oficial:    0%
✅ Fase 8  - Docker:             95%
🟡 Fase 9  - Monitoreo:          25%
🟡 Fase 10 - Documentación:      15%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOTAL: 88% ✅
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🤝 Contribuir

¡Las contribuciones son bienvenidas! Ver [CONTRIBUTING.md](./CONTRIBUTING.md) para más detalles.

```bash
# 1. Fork el proyecto
# 2. Crear branch de feature
git checkout -b feature/AmazingFeature

# 3. Commit cambios
git commit -m 'Add: Amazing Feature'

# 4. Push al branch
git push origin feature/AmazingFeature

# 5.  Abrir Pull Request
```

---

## 📝 Licencia

Este proyecto está bajo la Licencia MIT. Ver [LICENSE](./LICENSE) para más detalles.

---

## 👨‍💻 Autor

**joseliviaa05-hub**

- GitHub: [@joseliviaa05-hub](https://github.com/joseliviaa05-hub)
- Proyecto: [botsitot](https://github. com/joseliviaa05-hub/botsitot)

---

## 🙏 Agradecimientos

- [Baileys](https://github.com/WhiskeySockets/Baileys) - WhatsApp Web API
- [Prisma](https://www.prisma.io/) - Next-generation ORM
- [Express](https://expressjs.com/) - Fast, minimalist web framework
- [TypeScript](https://www.typescriptlang.org/) - JavaScript with types

---

<div align="center">

**⭐ Si te gustó el proyecto, dale una estrella! ⭐**

Made with ❤️ by [joseliviaa05-hub](https://github.com/joseliviaa05-hub)

</div>