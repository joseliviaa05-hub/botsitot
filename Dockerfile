# ═══════════════════════════════════════════════════════════════
# DOCKERFILE - BOTSITOT v2.0 (Multi-stage optimizado)
# ═══════════════════════════════════════════════════════════════

# ─────────────────────────────────────────────────────────────
# Stage 1: Builder - Compilar TypeScript
# ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

# Instalar dependencias necesarias para Prisma y build
RUN apk add --no-cache \
    openssl \
    libc6-compat \
    python3 \
    make \
    g++

WORKDIR /app

# Copiar archivos de dependencias primero (mejor cache)
COPY package*.json ./
COPY tsconfig.json ./
COPY prisma ./prisma/

# Instalar TODAS las dependencias (incluidas devDependencies)
RUN npm ci

# Copiar código fuente
COPY .  .

# Generar Prisma Client (usa URL dummy para build)
RUN DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy" npx prisma generate

# Compilar TypeScript
RUN npm run build

# Verificar que dist/ existe
RUN ls -la dist/

# Limpiar devDependencies (no se necesitan en producción)
RUN npm prune --production

# ─────────────────────────────────────────────────────────────
# Stage 2: Production - Imagen final ligera
# ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS production

# Metadata
LABEL maintainer="joseliviaa05-hub"
LABEL description="BotSitot v2.0 - Bot de WhatsApp empresarial"
LABEL version="2.0. 0"

# Instalar dependencias del sistema para WhatsApp + curl para health check
RUN apk add --no-cache \
    openssl \
    dumb-init \
    curl \
    git \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    font-noto-emoji

# Variables de entorno para Puppeteer (WhatsApp Web)
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copiar node_modules de producción y código compilado desde builder
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

# Crear directorios necesarios con permisos
RUN mkdir -p \
    /app/logs \
    /app/data \
    /app/. wwebjs_auth \
    /app/.wwebjs_cache && \
    chown -R nodejs:nodejs /app

# Cambiar a usuario no-root
USER nodejs

# Exponer puerto
EXPOSE 3000

# Health check con curl
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Variables de entorno por defecto
ENV NODE_ENV=production \
    PORT=3000

# Usar dumb-init para manejo correcto de señales (graceful shutdown)
ENTRYPOINT ["dumb-init", "--"]

# Comando de inicio
CMD ["node", "dist/index.js"]