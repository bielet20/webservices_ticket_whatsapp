# 🎉 Sistema de Despliegue con Docker Completado

## ✅ Archivos Creados

### Archivos Docker
- ✅ **Dockerfile** - Imagen optimizada para producción con Alpine Linux
- ✅ **docker-compose.yml** - Orquestación de servicios
- ✅ **.dockerignore** - Exclusión de archivos innecesarios
- ✅ **deploy.sh** - Script de despliegue automatizado
- ✅ **.env.docker** - Configuración para Docker

### Documentación
- ✅ **DOCKER.md** - Guía completa de despliegue con Docker
- ✅ **README.md** - Actualizado con instrucciones Docker

### Configuración
- ✅ **.gitignore** - Actualizado para Docker y backups

## 🚀 Inicio Rápido

### Opción 1: Docker (Recomendado para Producción)

```bash
# 1. Dar permisos al script
chmod +x deploy.sh

# 2. Iniciar
./deploy.sh start

# 3. Ver logs (para QR de WhatsApp)
./deploy.sh logs
```

### Opción 2: Desarrollo Local

```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor
node server.js
```

## 📋 Comandos Docker Disponibles

```bash
./deploy.sh start      # Iniciar servicios
./deploy.sh stop       # Detener servicios
./deploy.sh restart    # Reiniciar servicios
./deploy.sh logs       # Ver logs en tiempo real
./deploy.sh status     # Ver estado
./deploy.sh build      # Reconstruir imagen
./deploy.sh backup     # Backup de base de datos
./deploy.sh clean      # Limpiar todo
```

## 🔧 Características de la Imagen Docker

### Optimizaciones
- ✅ Imagen base Alpine Linux (pequeña y segura)
- ✅ Multi-stage build (optimiza tamaño)
- ✅ Usuario no-root (seguridad)
- ✅ Chromium incluido (para WhatsApp Web)
- ✅ Health check automático
- ✅ Volúmenes persistentes

### Seguridad
- ✅ Variables de entorno desde archivo .env
- ✅ Credenciales por defecto bloqueadas en producción
- ✅ Ejecución como usuario nodejs (no root)
- ✅ Health checks cada 30 segundos

### Persistencia
- ✅ Base de datos: `./tickets.db` (montado como volumen)
- ✅ Sesión WhatsApp: Volumen Docker `whatsapp-auth`
- ✅ Backups automáticos con `./deploy.sh backup`

## 📊 Recursos del Contenedor

**Por defecto:**
- **CPU:** Sin límite (recomendado: 2 cores)
- **RAM:** Sin límite (recomendado: 2 GB)
- **Disco:** ~500 MB (imagen) + datos

**Para limitar recursos**, edita `docker-compose.yml`

## 🌐 Puertos Expuestos

- **3000** - Aplicación web

## 📁 Estructura de Volúmenes

```
./tickets.db              → Base de datos SQLite
whatsapp-auth (Docker)    → Sesión de WhatsApp Web
backups/                  → Backups automáticos
```

## 🔐 Variables de Entorno

Archivo: `.env` o `.env.docker`

```env
NODE_ENV=production
ADMIN_USERNAME=myiatech_admin
ADMIN_PASSWORD=MyI@T3ch2026!Secure#Prod
SESSION_SECRET=tu_secreto_largo
COMPANY_EMAIL=info@myiatech.xyz
COMPANY_PHONE=624620893
```

## 📱 WhatsApp en Docker

### Primera Conexión
1. Inicia: `./deploy.sh start`
2. Ve logs: `./deploy.sh logs`
3. Escanea el QR que aparece
4. Listo - la sesión persiste

### Reconectar WhatsApp
```bash
# Eliminar volumen y reconectar
docker volume rm servicios-informatica_whatsapp-auth
./deploy.sh restart
# Escanear nuevo QR
```

## 🔄 Actualizar la Aplicación

```bash
# 1. Detener
./deploy.sh stop

# 2. Actualizar código (git pull, etc.)
# ...

# 3. Reconstruir
./deploy.sh build

# 4. Iniciar
./deploy.sh start
```

## 💾 Backups

### Crear Backup
```bash
./deploy.sh backup
# Guarda en: backups/tickets_backup_YYYYMMDD_HHMMSS.db
```

### Restaurar Backup
```bash
./deploy.sh restore backups/tickets_backup_20260122_120000.db
./deploy.sh restart
```

## 🌍 Despliegue en Servidor

### 1. Preparar Servidor
```bash
# Instalar Docker y Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
```

### 2. Clonar Proyecto
```bash
git clone <tu-repositorio> app
cd app
```

### 3. Configurar
```bash
cp .env.docker .env
nano .env  # Editar credenciales
```

### 4. Ejecutar
```bash
chmod +x deploy.sh
./deploy.sh start
```

### 5. Configurar Nginx (Opcional)
```nginx
server {
    listen 80;
    server_name tudominio.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 📈 Monitoreo

### Health Check
```bash
# El contenedor incluye health check
docker ps  # Ver estado de salud

# Verificar manualmente
curl http://localhost:3000/api/health
```

### Logs
```bash
# Tiempo real
./deploy.sh logs

# Últimas 100 líneas
docker-compose logs --tail=100 app

# Desde fecha específica
docker-compose logs --since="2026-01-22T10:00:00" app
```

## ⚠️ Troubleshooting

### Puerto en uso
```bash
# Cambiar puerto en .env
PORT=3001
```

### Contenedor no inicia
```bash
# Ver logs detallados
./deploy.sh logs

# Verificar configuración
docker-compose config
```

### WhatsApp no conecta
```bash
# Ver logs
./deploy.sh logs

# Limpiar sesión
docker volume rm servicios-informatica_whatsapp-auth
./deploy.sh restart
```

### Base de datos corrupta
```bash
# Restaurar backup
./deploy.sh restore backups/tickets_backup_<fecha>.db
```

## 📚 Documentación Completa

- [DOCKER.md](DOCKER.md) - Guía detallada de Docker
- [README.md](README.md) - Documentación general
- [DESPLIEGUE.md](DESPLIEGUE.md) - Opciones de despliegue
- [SEGURIDAD.md](SEGURIDAD.md) - Configuración de seguridad
- [WHATSAPP.md](WHATSAPP.md) - Integración WhatsApp

## 🎯 Próximos Pasos

1. ✅ Prueba local: `./deploy.sh start`
2. ✅ Escanea QR de WhatsApp
3. ✅ Verifica que funcione: http://localhost:3000
4. ✅ Configura credenciales de producción
5. ✅ Despliega en servidor
6. ✅ Configura HTTPS (Let's Encrypt)
7. ✅ Configura backups automáticos

## ✨ Características Destacadas

- 🐳 Contenedor optimizado con Alpine Linux
- 🔒 Ejecución segura como usuario no-root
- 💬 WhatsApp Web completamente funcional
- 📊 Health checks automáticos
- 💾 Persistencia de datos garantizada
- 🔄 Fácil actualización y rollback
- 📱 Responsive y listo para producción

---

**¡Tu aplicación está lista para producción con Docker!** 🚀
