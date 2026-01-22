# 🐳 Guía de Despliegue con Docker

## 📋 Requisitos Previos

- **Docker** instalado (versión 20.10 o superior)
- **Docker Compose** instalado (versión 1.29 o superior)
- Al menos **2 GB de RAM** disponible
- **Puerto 3000** libre

### Instalar Docker

#### macOS:
```bash
brew install docker docker-compose
```

#### Ubuntu/Debian:
```bash
sudo apt-get update
sudo apt-get install docker.io docker-compose
```

#### Verificar instalación:
```bash
docker --version
docker-compose --version
```

## 🚀 Despliegue Rápido

### 1. Preparar Configuración

```bash
# Copiar archivo de configuración de producción
cp .env.production .env

# O editar .env con tus credenciales
nano .env
```

### 2. Construir y Ejecutar

```bash
# Dar permisos al script de despliegue
chmod +x deploy.sh

# Iniciar la aplicación
./deploy.sh start
```

¡Eso es todo! La aplicación estará disponible en:
- **URL Principal:** http://localhost:3000
- **Panel Admin:** http://localhost:3000/admin

## 📜 Comandos Disponibles

### Gestión de Servicios

```bash
# Iniciar servicios
./deploy.sh start

# Detener servicios
./deploy.sh stop

# Reiniciar servicios
./deploy.sh restart

# Ver estado
./deploy.sh status
```

### Monitoreo

```bash
# Ver logs en tiempo real
./deploy.sh logs

# Ver logs específicos
docker-compose logs -f app

# Ver últimas 100 líneas
docker-compose logs --tail=100 app
```

### Mantenimiento

```bash
# Crear backup de base de datos
./deploy.sh backup

# Restaurar backup
./deploy.sh restore backups/tickets_backup_20260122_120000.db

# Reconstruir imagen (después de cambios en código)
./deploy.sh build

# Limpiar todo (⚠️ elimina datos)
./deploy.sh clean
```

## 🔧 Uso Manual con Docker Compose

Si prefieres usar Docker Compose directamente:

```bash
# Construir imagen
docker-compose build

# Iniciar en primer plano
docker-compose up

# Iniciar en segundo plano
docker-compose up -d

# Detener
docker-compose down

# Ver logs
docker-compose logs -f

# Reiniciar un servicio
docker-compose restart app
```

## 📱 Configurar WhatsApp

### Primera vez:

1. Inicia los servicios: `./deploy.sh start`
2. Ver logs: `./deploy.sh logs`
3. **Escanea el QR** que aparece en los logs con WhatsApp
4. Espera a ver: "✅ WhatsApp Web está listo y conectado"

### Sesión persistente:

La sesión de WhatsApp se guarda en un volumen Docker, por lo que:
- ✅ No necesitas escanear QR cada vez
- ✅ Sobrevive a reinicios del contenedor
- ⚠️ Se pierde si ejecutas `./deploy.sh clean`

## 🗄️ Persistencia de Datos

### Base de Datos
```bash
# La base de datos se guarda en:
./tickets.db

# Se monta automáticamente en el contenedor
```

### Sesión de WhatsApp
```bash
# Se guarda en volumen Docker:
whatsapp-auth

# Listar volúmenes
docker volume ls

# Inspeccionar volumen
docker volume inspect servicios-informatica_whatsapp-auth
```

## 🔐 Variables de Entorno

Edita `.env` o `.env.production`:

```env
NODE_ENV=production
PORT=3000

# Credenciales Admin
ADMIN_USERNAME=myiatech_admin
ADMIN_PASSWORD=MyI@T3ch2026!Secure#Prod
SESSION_SECRET=tu_secreto_largo_y_aleatorio

# Información de Empresa
COMPANY_NAME=Servicios Informáticos Profesionales
COMPANY_EMAIL=info@myiatech.xyz
COMPANY_PHONE=624620893

# Email (opcional)
EMAIL_USER=tu_email@gmail.com
EMAIL_PASS=tu_contraseña_de_aplicación
```

## 📊 Monitoreo y Salud

### Health Check Automático

El contenedor incluye un health check que verifica cada 30 segundos:

```bash
# Ver estado de salud
docker-compose ps

# Ver detalles del health check
docker inspect --format='{{.State.Health}}' servicios-informatica-app
```

### Verificar que está funcionando

```bash
# Desde el host
curl http://localhost:3000/api/health

# Desde dentro del contenedor
docker-compose exec app wget -O- http://localhost:3000/api/health
```

## 🔄 Actualizar la Aplicación

Cuando hagas cambios en el código:

```bash
# 1. Detener servicios
./deploy.sh stop

# 2. Reconstruir imagen
./deploy.sh build

# 3. Iniciar servicios
./deploy.sh start

# O todo en uno:
./deploy.sh stop && ./deploy.sh build && ./deploy.sh start
```

## 💾 Backup y Restauración

### Crear Backup

```bash
# Backup automático (fecha/hora en nombre)
./deploy.sh backup

# Los backups se guardan en:
# backups/tickets_backup_YYYYMMDD_HHMMSS.db
```

### Restaurar Backup

```bash
# Restaurar desde un backup específico
./deploy.sh restore backups/tickets_backup_20260122_120000.db

# Reiniciar para aplicar cambios
./deploy.sh restart
```

### Backup Manual

```bash
# Copiar base de datos desde contenedor
docker cp servicios-informatica-app:/app/tickets.db ./backup_manual.db

# Copiar al contenedor
docker cp ./backup_manual.db servicios-informatica-app:/app/tickets.db
```

## 🌐 Despliegue en Servidor Remoto

### 1. Preparar Servidor

```bash
# Conectar al servidor
ssh usuario@tu-servidor.com

# Clonar repositorio
git clone <tu-repositorio> app-servicios
cd app-servicios
```

### 2. Configurar

```bash
# Editar variables de entorno
nano .env

# Asegurarse de cambiar:
# - ADMIN_USERNAME
# - ADMIN_PASSWORD
# - SESSION_SECRET
```

### 3. Ejecutar

```bash
chmod +x deploy.sh
./deploy.sh start
```

### 4. Configurar Proxy Inverso (Nginx)

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

## 🐛 Solución de Problemas

### Puerto 3000 en uso

```bash
# Encontrar proceso usando el puerto
lsof -ti:3000

# Matar proceso
lsof -ti:3000 | xargs kill -9

# O cambiar puerto en .env
PORT=3001
```

### WhatsApp no conecta

```bash
# Ver logs
./deploy.sh logs

# Verificar que Chromium está instalado
docker-compose exec app chromium-browser --version

# Limpiar sesión de WhatsApp
docker volume rm servicios-informatica_whatsapp-auth
./deploy.sh restart
```

### Contenedor no arranca

```bash
# Ver logs detallados
docker-compose logs app

# Verificar configuración
docker-compose config

# Reconstruir desde cero
./deploy.sh clean
./deploy.sh build
./deploy.sh start
```

### Base de datos corrupta

```bash
# Restaurar desde backup
./deploy.sh restore backups/tickets_backup_<fecha>.db

# O crear nueva
rm tickets.db
./deploy.sh restart
```

## 📈 Rendimiento

### Recursos Recomendados

- **CPU:** 2 cores mínimo
- **RAM:** 2 GB mínimo (4 GB recomendado)
- **Disco:** 5 GB mínimo

### Limitar Recursos

Edita `docker-compose.yml`:

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

## 🔒 Seguridad en Producción

### ✅ Checklist

- [ ] Cambiar `ADMIN_USERNAME` y `ADMIN_PASSWORD`
- [ ] Cambiar `SESSION_SECRET` por valor aleatorio largo
- [ ] Usar HTTPS (con Nginx + Let's Encrypt)
- [ ] Configurar firewall (solo puerto 80/443)
- [ ] Backups automáticos diarios
- [ ] Monitoreo de logs
- [ ] Actualizar dependencias regularmente

### HTTPS con Let's Encrypt

```bash
# Instalar certbot
sudo apt-get install certbot python3-certbot-nginx

# Obtener certificado
sudo certbot --nginx -d tudominio.com

# Renovación automática ya está configurada
```

## 📞 Soporte

Si encuentras problemas:

1. Revisa los logs: `./deploy.sh logs`
2. Verifica el estado: `./deploy.sh status`
3. Consulta esta guía
4. Contacta: info@myiatech.xyz

---

**Última actualización:** 22 de enero de 2026
**Versión Docker:** 1.0.0
