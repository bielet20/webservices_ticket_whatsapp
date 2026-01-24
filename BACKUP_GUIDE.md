# 📦 Copias de Seguridad (Backups)

## Hacer un Backup Manual

### Opción 1: Usando el script automático

```bash
node backup.js
```

Esto creará:
- Backup de la base de datos (`tickets.db`)
- Archivos de configuración
- Archivos públicos (HTML, CSS, JS)
- Código fuente
- Archivo comprimido `.tar.gz`

Ubicación: `./backups/backup_YYYY-MM-DD-HH-MM-SS.tar.gz`

### Opción 2: Backup manual de la base de datos

```bash
# Copiar solo la base de datos
cp tickets.db tickets.db.backup

# O con timestamp
cp tickets.db "tickets.db.backup.$(date +%Y%m%d_%H%M%S)"
```

### Opción 3: Backup completo en Docker/Coolify

```bash
# Si estás en Docker
docker exec <container-id> cp tickets.db /backups/tickets.db

# Descargar el backup
docker cp <container-id>:/backups ./backups_local
```

---

## Restaurar un Backup

### Desde archivo comprimido

```bash
node restore.js
```

Restaurará automáticamente el backup más reciente.

### Restaurar una base de datos específica

```bash
# Detener el servidor
npm stop

# Restaurar el backup
cp tickets.db.backup tickets.db

# Reiniciar
npm start
```

---

## Backups Automáticos Programados

### En Linux/Mac (usando cron)

```bash
# Editar crontab
crontab -e

# Agregar línea para backup diario a las 2:00 AM
0 2 * * * cd /path/to/app && node backup.js
```

### En Windows (Tarea Programada)

1. Abrir **Programador de tareas**
2. Crear nueva tarea
3. Acción: `node C:\path\to\backup.js`
4. Frecuencia: Diaria (2:00 AM recomendado)

### En Coolify (Docker)

Agregar en `docker-compose.yml`:

```yaml
services:
  app:
    # ... configuración normal ...
    volumes:
      - ./backups:/app/backups
      - ./tickets.db:/app/tickets.db
```

Luego ejecutar:

```bash
docker-compose exec app node backup.js
```

---

## Contenido del Backup

Cada backup incluye:

```
backup_2026-01-24-13-45-30/
├── tickets.db              (Base de datos SQLite)
├── backup_info.json        (Información del backup)
├── server.js              (Código servidor)
├── database.js            (Funciones BD)
├── email.js               (Configuración email)
├── package.json           (Dependencias)
├── .env.example           (Variables de entorno)
├── Dockerfile             (Configuración Docker)
└── public/                (Archivos web)
    ├── index.html
    ├── admin.html
    ├── login.html
    ├── styles.css
    ├── script.js
    └── favicon.ico
```

---

## Información del Backup

Cada backup crea un archivo `backup_info.json`:

```json
{
  "fecha": "2026-01-24T13:45:30.123Z",
  "timestamp": "2026-01-24-13-45-30",
  "version": "1.0.0",
  "tamaño": 2048576,
  "archivos": [...]
}
```

---

## Mejores Prácticas

✅ **Hacer backup:**
- Diariamente en producción
- Después de cambios importantes
- Antes de actualizar

✅ **Almacenar backups:**
- En servidor diferente
- En servicio cloud (Dropbox, Google Drive, AWS S3)
- Mínimo 30 días de historial

✅ **Probar restauración:**
- Hacer restore cada mes
- Verificar integridad de datos
- Documentar proceso

⚠️ **No:**
- Usar solo un backup
- Guardar en mismo servidor
- Olvidar contraseñas de acceso

---

## Comandos Útiles

```bash
# Ver tamaño de backups
du -sh backups/

# Ver lista de backups
ls -lh backups/*.tar.gz

# Buscar backup de fecha específica
ls backups/ | grep "2026-01-24"

# Eliminar backups antiguos (> 30 días)
find backups/ -name "*.tar.gz" -mtime +30 -delete

# Verificar integridad del backup
tar -tzf backups/backup_*.tar.gz | head

# Extraer solo la BD de un backup
tar -xzf backups/backup_*.tar.gz -C /tmp/ --strip-components=1 tickets.db
```

---

## Recuperación de Emergencia

Si la base de datos se corrompe:

```bash
# 1. Detener la aplicación
npm stop

# 2. Restaurar desde el backup más reciente
node restore.js

# 3. Reiniciar
npm start

# 4. Verificar logs
tail -f logs.txt
```

---

## Soporte de Coolify

En Coolify, los backups están en:

```
/app/backups/
```

Para acceder por SSH:

```bash
ssh user@coolify-server
cd /data/applications/your-app
ls backups/
```

---

**Última actualización:** 24 de enero de 2026
