#!/bin/bash

# Script para configurar la base de datos MySQL desde cero
# Uso: sudo ./setup-database.sh

set -e

echo "========================================"
echo "Configurando Base de Datos MySQL"
echo "========================================"
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar que MySQL está instalado
if ! command -v mysql &> /dev/null; then
    echo -e "${RED}❌ MySQL no está instalado${NC}"
    echo "Instala MySQL con: sudo apt install mysql-server -y"
    exit 1
fi

echo -e "${YELLOW}📝 Configuración de la base de datos${NC}"
echo ""

# Solicitar información
read -p "Nombre de la base de datos [sistema_email]: " DB_NAME
DB_NAME=${DB_NAME:-sistema_email}

read -p "Usuario de MySQL [sistema_email_user]: " DB_USER
DB_USER=${DB_USER:-sistema_email_user}

read -sp "Contraseña del usuario MySQL: " DB_PASSWORD
echo ""

read -p "¿Crear la base de datos y usuario? (s/n) [s]: " CREATE_DB
CREATE_DB=${CREATE_DB:-s}

if [ "$CREATE_DB" = "s" ] || [ "$CREATE_DB" = "S" ]; then
    echo ""
    echo -e "${YELLOW}Creando base de datos y usuario...${NC}"
    
    # Crear base de datos y usuario
    sudo mysql <<EOF
CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
EOF

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Base de datos y usuario creados exitosamente${NC}"
    else
        echo -e "${RED}❌ Error al crear la base de datos${NC}"
        exit 1
    fi
fi

# Generar DATABASE_URL
DATABASE_URL="mysql://${DB_USER}:${DB_PASSWORD}@localhost:3306/${DB_NAME}"

echo ""
echo -e "${GREEN}========================================"
echo "✅ Configuración completada"
echo "========================================${NC}"
echo ""
echo "DATABASE_URL para server/.env:"
echo -e "${YELLOW}${DATABASE_URL}${NC}"
echo ""
echo "Copia esta línea a server/.env:"
echo "DATABASE_URL=\"${DATABASE_URL}\""
echo ""

