#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Docker Production Environment
# ═══════════════════════════════════════════════════════════════

set -e

echo "🚀 Iniciando ambiente de producción con Docker..."
echo ""

# Verificar . env
if [ ! -f ". env" ]; then
    echo "❌ Error: .env no encontrado"
    echo "   Copia .env.example y configura las variables:"
    echo "   cp .env.example .env"
    exit 1
fi

# Verificar variables críticas
if !  grep -q "DB_PASSWORD=change_me" .env; then
    echo "⚠️  ADVERTENCIA: Parece que usas la contraseña por defecto"
    read -p "¿Continuar de todos modos? (y/N): " confirm
    if [ "$confirm" != "y" ]; then
        exit 1
    fi
fi

# Build y levantar servicios
echo "🔨 Building containers..."
docker-compose build

echo "🚀 Levantando servicios en segundo plano..."
docker-compose up -d

echo ""
echo "⏳ Esperando a que los servicios estén listos..."
sleep 10

# Ejecutar migraciones
echo "📊 Ejecutando migraciones de base de datos..."
docker-compose exec -T app npx prisma migrate deploy

echo ""
echo "✅ Ambiente de producción iniciado!"
echo ""
echo "📊 Ver logs:"
echo "   docker-compose logs -f"
echo ""
echo "🔍 Ver estado:"
echo "   docker-compose ps"
echo ""
echo "🛑 Detener:"
echo "   docker-compose down"