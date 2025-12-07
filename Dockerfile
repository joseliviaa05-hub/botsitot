# ═══════════════════════════════════════════════════════════════
# DOCKERFILE - BOTSITOT (PRODUCCIÓN)
# Multi-stage build optimizado
# ═══════════════════════════════════════════════════════════════

# ─────────────────────────────────────────────────────────────
# STAGE 1: Builder (compilar TypeScript)
# ─────────────────────────────────────────────────────────────
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar archivos de configuración
COPY package*.json ./
COPY tsconfig. json ./
COPY prisma ./prisma

# Instalar TODAS las dependencias (incluidas dev para compilar)
RUN npm ci

# Copiar código fuente
COPY . .

# Generar Prisma Client
RUN npx prisma generate

# ✅ COMPILAR TYPESCRIPT
RUN npm run build

# Verificar que dist/ se creó
RUN ls -la dist/

# ─────────────────────────────────────────────────────────────
# STAGE 2: Runner (imagen final ligera)
# ─────────────────────────────────────────────────────────────
FROM node:18-alpine

WORKDIR /app

# Instalar dependencias del sistema para WhatsApp
RUN apk add --no-cache \
    git \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    font-noto-emoji

# Variables de entorno para Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    NODE_ENV=production

# Copiar package files
COPY package*.json ./

# Instalar SOLO dependencias de producción
RUN npm ci --only=production && npm cache clean --force

# Copiar Prisma schema y client generado
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/. prisma ./node_modules/.prisma

# ✅ COPIAR CÓDIGO COMPILADO (dist/)
COPY --from=builder /app/dist ./dist

# Crear directorios necesarios
RUN mkdir -p \
    /app/. wwebjs_auth \
    /app/. wwebjs_cache \
    /app/logs \
    /app/data

# Usuario no-root por seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Exponer puerto
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# ✅ COMANDO CORRECTO
CMD ["node", "dist/index.js"]