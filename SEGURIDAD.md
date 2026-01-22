# 🔐 Documentación de Seguridad

## Protección del Sistema

Este sistema implementa medidas de seguridad para proteger la información confidencial de los tickets y clientes.

## ✅ Características de Seguridad Implementadas

### 1. **Autenticación Obligatoria**
- Todo acceso al panel de administración requiere login
- Credenciales almacenadas en variables de entorno (.env)
- Sesiones seguras con express-session

### 2. **Rutas Protegidas**

#### Rutas Públicas (sin autenticación):
- `GET /` - Página principal
- `GET /login` - Página de inicio de sesión
- `POST /api/tickets` - Creación de tickets (acceso público para clientes)
- `GET /api/health` - Health check del sistema

#### Rutas Protegidas (requieren autenticación):
- `GET /admin` - Panel de administración
- `GET /api/tickets` - Listar todos los tickets
- `GET /api/tickets/:id` - Ver detalles de un ticket
- `PATCH /api/tickets/:id/status` - Actualizar estado de ticket
- `POST /api/tickets/:id/notes` - Añadir notas internas
- `GET /api/tickets/:id/notes` - Ver notas internas
- `PATCH /api/tickets/:id/assign` - Asignar técnico
- `POST /api/tickets/:id/whatsapp` - Registrar contacto WhatsApp
- `GET /api/tickets/:id/whatsapp` - Ver historial de WhatsApp
- `GET /api/tickets/status/:estado` - Filtrar tickets por estado

### 3. **Middleware de Autenticación**

```javascript
const requireAuth = (req, res, next) => {
    if (req.session && req.session.authenticated) {
        return next();
    }
    
    // Peticiones API: error 401
    if (req.path.startsWith('/api/')) {
        return res.status(401).json({ 
            error: 'No autorizado',
            requiresAuth: true 
        });
    }
    
    // Páginas: redirigir a login
    res.redirect('/login');
};
```

### 4. **Sesiones Seguras**
- Cookie segura con tiempo de expiración (24 horas)
- Secret key configurable
- Auto-logout al cerrar navegador (opcional)

## 🔒 Configuración de Credenciales

### Archivo `.env`

```env
# Credenciales de Administración
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
SESSION_SECRET=mi_secreto_super_seguro_cambiar_en_produccion
```

### ⚠️ IMPORTANTE - Cambiar Credenciales

**Por seguridad, DEBE cambiar las credenciales por defecto:**

1. Edite el archivo `.env`
2. Cambie `ADMIN_USERNAME` a un nombre de usuario único
3. Cambie `ADMIN_PASSWORD` a una contraseña segura
4. Cambie `SESSION_SECRET` a un texto largo y aleatorio

**Ejemplo de contraseña segura:**
- Mínimo 12 caracteres
- Combinación de mayúsculas, minúsculas, números y símbolos
- Ejemplo: `Myi@T3ch2026!Secure#Pass`

**Ejemplo de SESSION_SECRET:**
```
SESSION_SECRET=k8Jd92mN$xP7qW3z!R5tY#vL1nB4fG6h
```

## 🛡️ Qué Información Está Protegida

### Información Sensible:
- ✅ Datos personales de clientes (nombre, email, teléfono)
- ✅ Descripciones detalladas de problemas
- ✅ Notas internas del equipo técnico
- ✅ Historial de comunicaciones
- ✅ Estado de tickets
- ✅ Asignación de técnicos
- ✅ Registros de contactos por WhatsApp

### Acceso Público:
- ❌ Solo el formulario de creación de tickets
- ❌ Información general de servicios
- ❌ Datos de contacto de la empresa

## 🔐 Niveles de Seguridad

### Nivel 1: Actual (Implementado)
- [x] Autenticación básica con usuario/contraseña
- [x] Sesiones seguras
- [x] Protección de rutas API
- [x] Middleware de autenticación
- [x] Detección de sesión expirada

### Nivel 2: Recomendado (Opcional)
- [ ] Hash de contraseñas con bcrypt
- [ ] Múltiples usuarios con roles
- [ ] Sistema de permisos
- [ ] Registro de auditoría (logs)
- [ ] Límite de intentos de login
- [ ] Autenticación de dos factores (2FA)

### Nivel 3: Empresarial (Futuro)
- [ ] OAuth 2.0
- [ ] HTTPS obligatorio
- [ ] JWT tokens
- [ ] Refresh tokens
- [ ] IP whitelisting
- [ ] Encriptación de datos sensibles

## 🚨 Detección de Acceso No Autorizado

### El sistema detecta:
1. **Intento de acceso sin login** → Redirección a /login
2. **Sesión expirada** → Alert y redirección automática
3. **Peticiones API sin autenticación** → Error 401
4. **Credenciales incorrectas** → Mensaje de error

### Respuestas del Sistema:
```javascript
// Acceso no autorizado a ruta protegida
Status: 401 Unauthorized
{
  "error": "No autorizado. Inicie sesión para acceder a esta información.",
  "requiresAuth": true
}

// Login exitoso
Status: 200 OK
{
  "success": true,
  "message": "Login exitoso"
}

// Credenciales incorrectas
Status: 401 Unauthorized
{
  "success": false,
  "message": "Usuario o contraseña incorrectos"
}
```

## 📋 Checklist de Seguridad

Antes de poner en producción:

- [ ] Cambiar ADMIN_USERNAME
- [ ] Cambiar ADMIN_PASSWORD a una contraseña segura
- [ ] Cambiar SESSION_SECRET a un valor aleatorio largo
- [ ] Verificar que .env NO esté en el repositorio git
- [ ] Configurar HTTPS si es accesible desde internet
- [ ] Revisar que todas las rutas sensibles tengan requireAuth
- [ ] Probar el logout y expiración de sesión
- [ ] Documentar credenciales de forma segura

## 🔍 Verificación de Seguridad

### Pruebas Manuales:
1. Intentar acceder a `/admin` sin login → Debe redirigir a `/login`
2. Intentar acceder a `/api/tickets` sin login → Debe retornar 401
3. Hacer login con credenciales incorrectas → Debe mostrar error
4. Hacer login con credenciales correctas → Debe acceder al panel
5. Cerrar sesión → Debe redirigir a login y no permitir acceso

### Comandos de Prueba:
```bash
# Intentar acceder sin autenticación
curl http://localhost:3000/api/tickets

# Debería retornar:
# {"error":"No autorizado. Inicie sesión para acceder a esta información.","requiresAuth":true}
```

## 📞 Contacto de Seguridad

Si detecta algún problema de seguridad:
- Email: info@myiatech.xyz
- WhatsApp: +34 624 620 893

---

**Última actualización:** 22 de enero de 2026
**Versión del sistema:** 1.0.0
