# 💬 WhatsApp Web - Guía de Uso

## ✅ Sistema de WhatsApp Embebido Instalado

Ahora puedes enviar y recibir mensajes de WhatsApp directamente desde el panel de administración.

## 📋 Funcionalidades

### ✨ Características Principales:
- ✅ Enviar mensajes desde la web
- ✅ Ver todos tus chats de WhatsApp
- ✅ Ver historial de conversaciones
- ✅ Recibir mensajes en tiempo real
- ✅ Interfaz integrada en el admin
- ✅ Conexión segura mediante QR

## 🚀 Cómo Conectar WhatsApp

### 1. Acceder al Panel de WhatsApp

1. Ve a http://localhost:3000/admin
2. Inicia sesión (admin / admin123)
3. Haz clic en el botón **"Abrir WhatsApp Web"**

### 2. Escanear el Código QR

**El código QR ya está visible en la terminal** donde iniciaste el servidor.

#### Pasos para escanear:

1. **Abre WhatsApp en tu teléfono**
2. Toca **Menú (⋮)** o **Configuración**
3. Toca **Dispositivos vinculados**
4. Toca **Vincular un dispositivo**
5. **Apunta tu cámara al QR** que aparece en:
   - La terminal del servidor
   - O en el panel web (cuando abras WhatsApp Web)

### 3. Una Vez Conectado

Cuando escanees el QR correctamente:
- ✅ Verás "Conectado" en el panel
- ✅ Aparecerá la lista de tus chats
- ✅ Podrás enviar y recibir mensajes

## 🎯 Cómo Usar el Sistema

### Ver Chats
1. Abre el panel de WhatsApp
2. Espera a que aparezca "Conectado"
3. Verás la lista de chats a la izquierda

### Enviar Mensaje
1. Haz clic en un chat de la lista
2. Verás el historial de mensajes
3. Escribe tu mensaje en el campo inferior
4. Haz clic en **"Enviar"**

### Enviar desde un Ticket
También puedes:
1. Abrir un ticket en el panel
2. Usar la sección de WhatsApp del ticket
3. El sistema abrirá el chat con ese número

## 🔧 API Endpoints Disponibles

### Para desarrolladores:

```javascript
// Ver estado de conexión
GET /api/whatsapp/status

// Enviar mensaje
POST /api/whatsapp/send
Body: { "phoneNumber": "34624620893", "message": "Hola" }

// Obtener todos los chats
GET /api/whatsapp/chats

// Obtener mensajes de un chat
GET /api/whatsapp/chats/:chatId/messages

// Obtener info de contacto
GET /api/whatsapp/contact/:phoneNumber
```

## ⚠️ Importante

### Mantener la Conexión
- El servidor debe estar ejecutándose constantemente
- Si detienes el servidor, deberás reconectar con QR
- La sesión se guarda en la carpeta `.wwebjs_auth`

### Primera Vez
- El primer escaneo puede tardar unos segundos
- Una vez conectado, las próximas veces será automático
- No necesitas volver a escanear el QR (a menos que cierres sesión)

### Cerrar Sesión
Para desconectar WhatsApp:
```javascript
// Llamar a la API (próximamente en interfaz)
POST /api/whatsapp/logout
```

## 🎨 Interfaz

### Indicadores de Estado:
- 🔴 **Punto Rojo**: Desconectado
- 🟢 **Punto Verde**: Conectado
- 🟡 **Parpadeante**: Esperando QR

### Panel Principal:
- **Izquierda**: Lista de chats
- **Derecha**: Conversación activa
- **Inferior**: Campo para escribir mensajes

## 📱 Números de Teléfono

### Formato Correcto:
- Con código de país: `34624620893`
- Sin espacios ni símbolos
- Ejemplo: `34612345678`

### El sistema acepta:
- `34624620893` ✅
- `+34624620893` ✅
- `624620893` (se añade 34 automáticamente)

## 🔐 Seguridad

- ✅ Requiere autenticación para acceder
- ✅ Solo usuarios autenticados pueden enviar mensajes
- ✅ Sesión persistente en `.wwebjs_auth`
- ✅ No se almacenan mensajes en la base de datos (privacidad)

## 🐛 Solución de Problemas

### El QR no aparece
- Espera 10-15 segundos
- Revisa la terminal del servidor
- El QR también aparece en la consola

### No se conecta
- Verifica que WhatsApp esté actualizado
- Intenta cerrar WhatsApp y volver a abrir
- Revisa que tengas conexión a internet

### Error "WhatsApp no está conectado"
- Escanea el código QR primero
- Espera a que el indicador se ponga verde

### Mensajes no se envían
- Verifica el formato del número
- Asegúrate de que el contacto tenga WhatsApp
- Revisa que estés conectado (punto verde)

## 📊 Estado del Sistema

Verifica el estado en cualquier momento:
```bash
# En la consola del servidor verás:
✅ WhatsApp Web está listo y conectado
📩 Mensaje recibido: 34XXXXXXXXX - Hola
```

## 🎉 ¡Listo para Usar!

Tu sistema de WhatsApp Web está completamente funcional. 

**Próximos pasos:**
1. Escanea el QR que ves en la terminal
2. Espera a ver "Conectado"
3. ¡Empieza a enviar mensajes!

---

**Desarrollado con:** whatsapp-web.js
**Última actualización:** 22 de enero de 2026
