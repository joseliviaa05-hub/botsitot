# 🐳 Scripts de Docker para BotSitot

## 🚀 Comandos Básicos

### **Desarrollo (con hot-reload):**
```bash
# Iniciar todo
docker-compose up -d

# Ver logs
docker-compose logs -f

# Ver logs solo de la app
docker-compose logs -f app

# Detener
docker-compose down

# Detener y eliminar volúmenes (CUIDADO: borra datos)
docker-compose down -v