#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# Limpiar Docker completamente
# ═══════════════════════════════════════════════════════════════

echo "🗑️  ADVERTENCIA: Esto eliminará TODOS los datos de Docker"
echo "   - Todos los containers"
echo "   - Todos los volumes (base de datos, cache, etc)"
echo "   - Todas las imágenes"
echo ""
read -p "¿Estás seguro?  Escribe 'SI' para confirmar: " confirm

if [ "$confirm" != "SI" ]; then
    echo "❌ Cancelado"
    exit 0
fi

echo ""
echo "🛑 Deteniendo containers..."
docker-compose down -v

echo "🗑️  Limpiando sistema..."
docker system prune -af --volumes

echo ""
echo "✅ Limpieza completa!"