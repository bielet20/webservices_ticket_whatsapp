# 🚀 Guía de Despliegue en Producción

## Diferencias entre Desarrollo y Producción

### 🔧 DESARROLLO (por defecto)
- **Entorno:** `NODE_ENV=development`
- **Credenciales permitidas:**
  - Usuario: `admin` / Contraseña: `admin123` ✅
  - Usuario: `myiatech_admin` / Contraseña: `MyI@T3ch2026!Secure#Prod` ✅
- **Mensajes:** "✓ Login exitoso - Entorno de Desarrollo"

### 🔒 PRODUCCIÓN
- **Entorno:** `NODE_ENV=production`
- **Credenciales bloqueadas:**
  - Usuario: `admin` / Contraseña: `admin123` ❌ BLOQUEADO
- **Credenciales permitidas:**
  - Usuario: `myiatech_admin` / Contraseña: `MyI@T3ch2026!Secure#Prod` ✅
- **Mensajes:** 
  - Login exitoso: "✓ Acceso autorizado - Entorno de Producción"
  - Credenciales bloqueadas: "🔒 PRODUCCIÓN: Las credenciales por defecto están deshabilitadas..."

## 📋 Pasos para Desplegar en Producción

### 1. Preparar archivos de configuración

```bash
# Copiar archivo de producción
cp .env.production .env
```

### 2. Verificar configuración

Abrir `.env` y confirmar:
```env
NODE_ENV=production  ← DEBE estar en "production"
ADMIN_USERNAME=myiatech_admin
ADMIN_PASSWORD=MyI@T3ch2026!Secure#Prod
```

### 3. Instalar dependencias

```bash
npm install --production
```

### 4. Iniciar servidor en producción

**Opción 1: Directamente**
```bash
NODE_ENV=production node server.js
```

**Opción 2: Con PM2 (recomendado)**
```bash
# Instalar PM2 globalmente
npm install -g pm2

# Iniciar aplicación
pm2 start server.js --name "myiatech-app" --env production

# Configurar inicio automático
pm2 startup
pm2 save

# Ver logs
pm2 logs myiatech-app

# Reiniciar
pm2 restart myiatech-app

# Detener
pm2 stop myiatech-app
```

### 5. Verificar seguridad

Probar que admin/admin123 está bloqueado:
```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

Debería retornar:
```json
{
  "success": false,
  "message": "🔒 PRODUCCIÓN: Las credenciales por defecto están deshabilitadas...",
  "environment": "production",
  "blocked": true
}
```

## 🔄 Volver a Desarrollo

```bash
# Restaurar archivo de desarrollo
cp .env .env.backup
# Editar .env y cambiar:
NODE_ENV=development

# Reiniciar servidor
```

## 🔐 Credenciales Actuales

### Desarrollo
- Usuario: `admin`
- Contraseña: `admin123`

### Producción
- Usuario: `myiatech_admin`
- Contraseña: `MyI@T3ch2026!Secure#Prod`

## ⚡ Comandos Rápidos

```bash
# Desarrollo
NODE_ENV=development node server.js

# Producción
NODE_ENV=production node server.js
```

## 📊 Verificación del Entorno

Cuando inicies sesión correctamente, el sistema mostrará:

**Desarrollo:**
```json
{
  "success": true,
  "message": "✓ Login exitoso - Entorno de Desarrollo",
  "environment": "development"
}
```

**Producción:**
```json
{
  "success": true,
  "message": "✓ Acceso autorizado - Entorno de Producción",
  "environment": "production"
}
```

## 🛡️ Seguridad en Producción

✅ Credenciales por defecto bloqueadas
✅ Mensajes específicos por entorno
✅ Solo credenciales seguras permitidas
✅ Sesiones con tiempo de expiración
✅ Todas las rutas protegidas con autenticación

---

**Última actualización:** 22 de enero de 2026
