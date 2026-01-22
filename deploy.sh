#!/bin/bash

# Script de despliegue en producción con Docker
# Uso: ./deploy.sh [start|stop|restart|logs|build|clean]

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir mensajes
print_message() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Verificar que Docker está instalado
check_docker() {
    if ! command -v docker &> /dev/null; then
        print_error "Docker no está instalado. Por favor, instala Docker primero."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose no está instalado. Por favor, instala Docker Compose primero."
        exit 1
    fi
}

# Verificar archivo .env.production
check_env() {
    if [ ! -f .env.production ]; then
        print_warning "No se encontró .env.production"
        print_message "Usando valores por defecto o variables de entorno actuales"
    else
        print_message "Usando configuración de .env.production"
        # Copiar .env.production a .env para docker-compose
        cp .env.production .env
    fi
}

# Construir imagen
build_image() {
    print_message "Construyendo imagen Docker..."
    docker-compose build --no-cache
    print_message "✅ Imagen construida exitosamente"
}

# Iniciar servicios
start_services() {
    print_message "Iniciando servicios..."
    docker-compose up -d
    print_message "✅ Servicios iniciados"
    print_message "📍 Aplicación disponible en: http://localhost:3000"
    print_message "📊 Panel Admin: http://localhost:3000/admin"
    echo ""
    print_message "Para ver logs en tiempo real, ejecuta: ./deploy.sh logs"
    echo ""
    print_warning "IMPORTANTE: Escanea el código QR de WhatsApp en los logs"
    print_message "Ver logs: docker-compose logs -f app"
}

# Detener servicios
stop_services() {
    print_message "Deteniendo servicios..."
    docker-compose down
    print_message "✅ Servicios detenidos"
}

# Reiniciar servicios
restart_services() {
    print_message "Reiniciando servicios..."
    docker-compose restart
    print_message "✅ Servicios reiniciados"
}

# Ver logs
show_logs() {
    print_message "Mostrando logs (Ctrl+C para salir)..."
    docker-compose logs -f app
}

# Ver estado
show_status() {
    print_message "Estado de los servicios:"
    docker-compose ps
}

# Limpiar todo (contenedores, volúmenes, imágenes)
clean_all() {
    print_warning "⚠️  ADVERTENCIA: Esto eliminará todos los contenedores, volúmenes e imágenes."
    print_warning "Se perderá la base de datos y la sesión de WhatsApp."
    read -p "¿Estás seguro? (yes/no): " confirm
    
    if [ "$confirm" = "yes" ]; then
        print_message "Limpiando..."
        docker-compose down -v --rmi all
        print_message "✅ Todo limpiado"
    else
        print_message "Cancelado"
    fi
}

# Backup de base de datos
backup_db() {
    print_message "Creando backup de la base de datos..."
    BACKUP_DIR="backups"
    mkdir -p $BACKUP_DIR
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    BACKUP_FILE="$BACKUP_DIR/tickets_backup_$TIMESTAMP.db"
    
    # Copiar desde el contenedor o archivo local
    if [ -f "tickets.db" ]; then
        cp tickets.db "$BACKUP_FILE"
        print_message "✅ Backup creado: $BACKUP_FILE"
    else
        print_error "No se encontró tickets.db"
    fi
}

# Restaurar base de datos
restore_db() {
    if [ -z "$2" ]; then
        print_error "Uso: ./deploy.sh restore <archivo_backup>"
        exit 1
    fi
    
    BACKUP_FILE="$2"
    if [ ! -f "$BACKUP_FILE" ]; then
        print_error "Archivo de backup no encontrado: $BACKUP_FILE"
        exit 1
    fi
    
    print_message "Restaurando base de datos desde: $BACKUP_FILE"
    cp "$BACKUP_FILE" tickets.db
    print_message "✅ Base de datos restaurada"
    print_message "Reinicia los servicios para aplicar cambios: ./deploy.sh restart"
}

# Menú principal
main() {
    check_docker
    
    case "$1" in
        start)
            check_env
            start_services
            ;;
        stop)
            stop_services
            ;;
        restart)
            restart_services
            ;;
        logs)
            show_logs
            ;;
        status)
            show_status
            ;;
        build)
            check_env
            build_image
            ;;
        clean)
            clean_all
            ;;
        backup)
            backup_db
            ;;
        restore)
            restore_db "$@"
            ;;
        *)
            echo "🐳 Sistema de Despliegue - Servicios Informáticos"
            echo ""
            echo "Uso: ./deploy.sh [comando]"
            echo ""
            echo "Comandos disponibles:"
            echo "  start      - Iniciar servicios"
            echo "  stop       - Detener servicios"
            echo "  restart    - Reiniciar servicios"
            echo "  logs       - Ver logs en tiempo real"
            echo "  status     - Ver estado de servicios"
            echo "  build      - Construir imagen Docker"
            echo "  clean      - Limpiar todo (⚠️  elimina datos)"
            echo "  backup     - Crear backup de base de datos"
            echo "  restore    - Restaurar backup de base de datos"
            echo ""
            echo "Ejemplos:"
            echo "  ./deploy.sh start     # Iniciar aplicación"
            echo "  ./deploy.sh logs      # Ver logs"
            echo "  ./deploy.sh backup    # Crear backup"
            echo "  ./deploy.sh restore backups/tickets_backup_20260122_120000.db"
            echo ""
            exit 1
            ;;
    esac
}

main "$@"
