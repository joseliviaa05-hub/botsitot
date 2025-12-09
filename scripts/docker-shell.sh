#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Acceder al shell del container
# ═══════════════════════════════════════════════════════════════

SERVICE=${1:-app}

echo "🐚 Abriendo shell en: $SERVICE"
echo ""

docker-compose exec $SERVICE sh