# 🐳 Scripts de Docker - BotSitot v2.0

Comandos útiles para trabajar con Docker. 

---

## 🚀 Comandos Básicos

### **Desarrollo local:**

```bash
# Iniciar todos los servicios
docker-compose up -d

# Ver logs en tiempo real
docker-compose logs -f

# Ver logs solo de la app
docker-compose logs -f app

# Reiniciar solo la app
docker-compose restart app

# Detener todo
docker-compose down

# Detener y eliminar volúmenes (CUIDADO: borra datos)
docker-compose down -v

Build desde cero:
bash
# Build sin cache
docker-compose build --no-cache

# Build y levantar
docker-compose up -d --build

🔧 Mantenimiento
Entrar a contenedores:
bash
# Shell en la app
docker-compose exec app sh

# Shell en PostgreSQL
docker-compose exec db psql -U botsitot_user -d botsitot

# Shell en Redis
docker-compose exec redis redis-cli -a redis_password_change_in_production

Migraciones de Prisma:
bash
# Ejecutar migraciones
docker-compose exec app npx prisma migrate deploy

# Generar Prisma Client
docker-compose exec app npx prisma generate

# Seed de base de datos
docker-compose exec app npx prisma db seed

# Ver estado de migraciones
docker-compose exec app npx prisma migrate status


Ver logs:
bash
# Todos los servicios
docker-compose logs -f

# Solo errores
docker-compose logs -f | grep -i error

# Últimas 100 líneas
docker-compose logs --tail=100

# Logs de app dentro del contenedor
docker-compose exec app cat /app/logs/combined-$(date +%Y-%m-%d).log


📊 Monitoreo
Estado de contenedores:
bash
# Ver servicios corriendo
docker-compose ps

# Ver recursos en tiempo real
docker stats

# Ver recursos solo de botsitot
docker stats botsitot-app botsitot-db botsitot-redis



Health checks:
bash
# Health check de la app
curl http://localhost:3000/health

# Health check detallado
curl http://localhost:3000/health/detailed | jq

# Health check de PostgreSQL
docker-compose exec db pg_isready -U botsitot_user

# Health check de Redis
docker-compose exec redis redis-cli -a redis_password_change_in_production ping

# Ver estado de health checks
docker inspect --format='{{. State.Health.Status}}' botsitot-app


🔄 Backup y Restore
Backup de PostgreSQL:
bash
# Crear backup
docker-compose exec -T db pg_dump -U botsitot_user botsitot > backup-$(date +%Y%m%d-%H%M%S).sql

# Restore desde backup
docker-compose exec -T db psql -U botsitot_user botsitot < backup-20251207-120000.sql




ackup de volúmenes Docker:
bash
# Backup de sesión de WhatsApp
docker run --rm \
  -v botsitot_whatsapp_session:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/whatsapp-session-$(date +%Y%m%d). tar.gz /data

# Restore de sesión
docker run --rm \
  -v botsitot_whatsapp_session:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/whatsapp-session-20251207.tar.gz -C /



🧹 Limpieza
Limpiar selectivamente:
bash
# Detener contenedores
docker-compose down

# Eliminar volúmenes (borra datos)
docker-compose down -v

# Limpiar imágenes no usadas
docker image prune -a

# Limpiar build cache
docker builder prune


impieza completa (NUCLEAR OPTION):
bash
# CUIDADO: Esto borra TODO
docker-compose down -v
docker system prune -a --volumes


🚀 Producción
Deploy manual:
bash
# Pull última versión
git pull origin main

# Rebuild y restart
docker-compose down
docker-compose up -d --build

# Ver que todo esté OK
docker-compose ps
docker-compose logs -f app
Actualización sin downtime:
bash
# Build nueva imagen
docker-compose build app

# Recrear solo app (DB y Redis siguen corriendo)
docker-compose up -d --no-deps --build app
🐛 Troubleshooting
Contenedor no arranca:
bash
# Ver últimos logs
docker-compose logs --tail=100 app

# Ver solo errores
docker-compose logs app | grep -i error

# Ejecutar comando manualmente
docker-compose run --rm app sh
Base de datos no conecta:
bash
# Verificar que DB esté corriendo
docker-compose ps db

# Ver logs de DB
docker-compose logs db

# Test de conexión desde app
docker-compose exec app npx prisma db pull
Redis no conecta:
bash
# Ver logs
docker-compose logs redis

# Test manual
docker-compose exec redis redis-cli -a redis_password_change_in_production ping
WhatsApp no se conecta:
bash
# Ver logs de WhatsApp
docker-compose logs app | grep -i whatsapp

# Eliminar sesión y reconectar
docker-compose down
docker volume rm botsitot_whatsapp_session
docker-compose up -d
📝 Variables de Entorno
Crear archivo .env en la raíz del proyecto:

env
# Database
DB_USER=botsitot_user
DB_PASSWORD=your_secure_password_here
DB_NAME=botsitot
DB_PORT=5432

# Redis
REDIS_PASSWORD=your_redis_password_here
REDIS_PORT=6379

# JWT
JWT_SECRET=your_jwt_secret_min_32_chars
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Business
BUSINESS_NAME=Botsitot
BUSINESS_PHONE=+5491162002289
NUMERO_DUENO=5491162002289
DELIVERY_COST=500

# WhatsApp
WHATSAPP_WHITELIST=5491162002289,5491160208947

# Optional
OPENAI_API_KEY=sk-... 
SENTRY_DSN=https://...
🎯 Comandos Rápidos
bash
# Start
docker-compose up -d

# Stop
docker-compose down

# Restart app
docker-compose restart app

# Logs
docker-compose logs -f app

# Shell
docker-compose exec app sh

# Health
curl localhost:3000/health

# Stats
docker stats botsitot-app
📚 Documentación
Docker Docs: https://docs.docker.com
Docker Compose: https://docs.docker.com/compose
Prisma Docs: https://www.prisma.io/docs
Code

**Guardar (Ctrl+S)**

---

## ✅ SIGUIENTE: PROBAR DOCKER

```powershell
# Build
docker-compose build

# Iniciar
docker-compose up -d

# Ver logs
docker-compose logs -f
