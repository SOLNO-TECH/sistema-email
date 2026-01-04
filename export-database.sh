#!/bin/bash

# Script para exportar la base de datos fácilmente
# Uso: ./export-database.sh [nombre_bd] [usuario]

set -e

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Valores por defecto
DB_NAME=${1:-sistema_email}
DB_USER=${2:-sistema_email_user}

# Verificar que MySQL está instalado
if ! command -v mysqldump &> /dev/null; then
    echo -e "${RED}❌ mysqldump no está instalado${NC}"
    echo "Instala MySQL client: sudo apt install mysql-client"
    exit 1
fi

# Crear directorio de backups si no existe
BACKUP_DIR="backups"
mkdir -p $BACKUP_DIR

# Generar nombre de archivo con timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_${DB_NAME}_${TIMESTAMP}.sql"

echo -e "${YELLOW}📦 Exportando base de datos: $DB_NAME${NC}"
echo -e "${YELLOW}👤 Usuario: $DB_USER${NC}"
echo ""

# Exportar base de datos
mysqldump -u $DB_USER -p $DB_NAME > $BACKUP_FILE

if [ $? -eq 0 ]; then
    # Comprimir backup
    echo -e "${YELLOW}📦 Comprimiendo backup...${NC}"
    gzip -f $BACKUP_FILE
    BACKUP_FILE="${BACKUP_FILE}.gz"
    
    # Obtener tamaño
    SIZE=$(du -h $BACKUP_FILE | cut -f1)
    
    echo ""
    echo -e "${GREEN}✅ Backup creado exitosamente${NC}"
    echo -e "${GREEN}📁 Archivo: $BACKUP_FILE${NC}"
    echo -e "${GREEN}📊 Tamaño: $SIZE${NC}"
    echo ""
    echo -e "${YELLOW}💡 Para importar:${NC}"
    echo -e "${YELLOW}   gunzip < $BACKUP_FILE | mysql -u $DB_USER -p $DB_NAME${NC}"
else
    echo -e "${RED}❌ Error al crear backup${NC}"
    exit 1
fi

