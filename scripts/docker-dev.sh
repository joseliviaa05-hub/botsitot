#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Docker Development Environment
# ═══════════════════════════════════════════════════════════════

set -e

echo "🐳 Iniciando ambiente de desarrollo con Docker..."
echo ""

# Verificar que existe docker-compose. dev.yml
if [ ! -f "docker-compose.dev.yml" ]; then
    echo "❌ Error: docker-compose.dev.yml no encontrado"
    exit 1
fi

# Verificar que existe . env
if [ ! -f ".env" ]; then
    echo "⚠️  . env no encontrado, copiando desde .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
        echo "✅ . env creado.  Por favor, edita los valores antes de continuar."
        echo ""
        read -p "Presiona Enter cuando hayas editado . env..."
    else
        echo "❌ Error: .env.example no encontrado"
        exit 1
    fi
fi

# Levantar servicios
echo "🚀 Levantando servicios..."
docker-compose -f docker-compose.dev.yml up --build

echo ""
echo "✅ Ambiente de desarrollo iniciado!"
echo "📱 App: http://localhost:3000"
echo "🗄️  PostgreSQL: localhost:5432"
echo "🔴 Redis: localhost:6379"