#!/bin/bash

# Script de instalación completa para VPS
# Instala Node.js, MySQL, Postfix, Dovecot y configura todo el sistema
# Uso: sudo ./install-vps.sh

set -e

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}🚀 Instalación de Fylo Mail en VPS${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Verificar si es root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Por favor ejecuta como root (sudo)${NC}"
    exit 1
fi

# Verificar sistema operativo
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
    VER=$VERSION_ID
else
    echo -e "${RED}❌ No se pudo detectar el sistema operativo${NC}"
    exit 1
fi

echo -e "${YELLOW}📦 Sistema detectado: $OS $VER${NC}"
echo ""

# Paso 1: Actualizar sistema
echo -e "${YELLOW}📦 Actualizando sistema...${NC}"
apt update && apt upgrade -y
apt install -y curl wget git build-essential

# Paso 2: Instalar Node.js 20.x
echo ""
echo -e "${YELLOW}📦 Instalando Node.js 20.x...${NC}"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -ge 20 ]; then
        echo -e "${GREEN}✅ Node.js ya está instalado (versión $(node --version))${NC}"
    else
        echo -e "${YELLOW}⚠️  Node.js versión antigua, actualizando...${NC}"
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
        apt install -y nodejs
    fi
else
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
fi

echo -e "${GREEN}✅ Node.js $(node --version) instalado${NC}"
echo -e "${GREEN}✅ npm $(npm --version) instalado${NC}"

# Paso 3: Instalar MySQL
echo ""
echo -e "${YELLOW}📦 Instalando MySQL...${NC}"
if command -v mysql &> /dev/null; then
    echo -e "${GREEN}✅ MySQL ya está instalado${NC}"
else
    apt install -y mysql-server
    echo -e "${GREEN}✅ MySQL instalado${NC}"
    echo -e "${YELLOW}⚠️  Ejecuta 'sudo mysql_secure_installation' después de la instalación${NC}"
fi

# Paso 4: Instalar Postfix y Dovecot
echo ""
echo -e "${YELLOW}📦 Instalando Postfix y Dovecot...${NC}"
if command -v postfix &> /dev/null; then
    echo -e "${GREEN}✅ Postfix ya está instalado${NC}"
else
    # Instalar sin configuración interactiva
    DEBIAN_FRONTEND=noninteractive apt install -y postfix dovecot-core dovecot-imapd dovecot-pop3d mailutils
    echo -e "${GREEN}✅ Postfix y Dovecot instalados${NC}"
fi

# Paso 5: Configurar base de datos
echo ""
echo -e "${YELLOW}📝 Configurando base de datos...${NC}"
if [ -f "setup-database.sh" ]; then
    chmod +x setup-database.sh
    echo -e "${BLUE}Ejecuta manualmente: ./setup-database.sh${NC}"
else
    echo -e "${YELLOW}⚠️  Script setup-database.sh no encontrado${NC}"
fi

# Paso 6: Instalar dependencias del proyecto
echo ""
echo -e "${YELLOW}📦 Instalando dependencias del proyecto...${NC}"
if [ -f "package.json" ]; then
    npm install
    if [ -d "server" ] && [ -f "server/package.json" ]; then
        cd server && npm install && cd ..
    fi
    if [ -d "client" ] && [ -f "client/package.json" ]; then
        cd client && npm install && cd ..
    fi
    echo -e "${GREEN}✅ Dependencias instaladas${NC}"
else
    echo -e "${RED}❌ package.json no encontrado. Asegúrate de estar en el directorio correcto${NC}"
    exit 1
fi

# Paso 7: Configurar Prisma
echo ""
echo -e "${YELLOW}📦 Configurando Prisma...${NC}"
if [ -d "server" ] && [ -f "server/prisma/schema.prisma" ]; then
    cd server
    if [ ! -f ".env" ]; then
        if [ -f "DEPLOY_ENV.example" ]; then
            cp DEPLOY_ENV.example .env
            echo -e "${GREEN}✅ Archivo .env creado desde DEPLOY_ENV.example${NC}"
            echo -e "${YELLOW}⚠️  IMPORTANTE: Edita server/.env y configura DATABASE_URL y otras variables${NC}"
        fi
    fi
    
    if command -v npx &> /dev/null; then
        npx prisma generate
        echo -e "${GREEN}✅ Cliente de Prisma generado${NC}"
        echo -e "${YELLOW}⚠️  Ejecuta 'npx prisma migrate deploy' después de configurar DATABASE_URL${NC}"
    fi
    cd ..
else
    echo -e "${YELLOW}⚠️  Prisma no encontrado, saltando...${NC}"
fi

# Paso 8: Configurar scripts de Postfix
echo ""
echo -e "${YELLOW}📦 Configurando scripts de Postfix...${NC}"
if [ -d "server/scripts" ]; then
    chmod +x server/scripts/*.sh
    echo -e "${GREEN}✅ Scripts de Postfix configurados${NC}"
    echo -e "${YELLOW}⚠️  Ejecuta manualmente:${NC}"
    echo -e "${BLUE}   cd server/scripts${NC}"
    echo -e "${BLUE}   sudo ./setup-smtp-server.sh${NC}"
    echo -e "${BLUE}   sudo ./complete-email-setup.sh${NC}"
else
    echo -e "${YELLOW}⚠️  Scripts de Postfix no encontrados${NC}"
fi

# Paso 9: Configurar firewall
echo ""
echo -e "${YELLOW}🔌 Configurando firewall...${NC}"
if command -v ufw &> /dev/null; then
    ufw allow 25/tcp comment "SMTP - Recepción"
    ufw allow 587/tcp comment "SMTP Submission - Envío"
    ufw allow 993/tcp comment "IMAPS - Clientes"
    ufw allow 995/tcp comment "POP3S - Clientes"
    ufw allow 3000/tcp comment "Frontend"
    ufw allow 3001/tcp comment "Backend"
    echo -e "${GREEN}✅ Reglas de firewall agregadas${NC}"
    echo -e "${YELLOW}⚠️  Ejecuta 'sudo ufw enable' para activar el firewall${NC}"
else
    echo -e "${YELLOW}⚠️  UFW no está instalado. Instala y configura manualmente${NC}"
fi

# Paso 10: Crear script de exportación de BD
echo ""
echo -e "${YELLOW}📦 Creando script de exportación de base de datos...${NC}"
cat > export-database.sh <<'EOF'
#!/bin/bash
# Script para exportar base de datos

if [ -z "$1" ]; then
    DB_NAME="sistema_email"
else
    DB_NAME=$1
fi

if [ -z "$2" ]; then
    DB_USER="sistema_email_user"
else
    DB_USER=$2
fi

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="backup_${DB_NAME}_${TIMESTAMP}.sql"

echo "📦 Exportando base de datos $DB_NAME..."
mysqldump -u $DB_USER -p $DB_NAME > $BACKUP_FILE

if [ $? -eq 0 ]; then
    echo "✅ Backup creado: $BACKUP_FILE"
    ls -lh $BACKUP_FILE
else
    echo "❌ Error al crear backup"
    exit 1
fi
EOF

chmod +x export-database.sh
echo -e "${GREEN}✅ Script de exportación creado: export-database.sh${NC}"

# Resumen
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Instalación completada${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}📋 Próximos pasos:${NC}"
echo ""
echo -e "${BLUE}1. Configurar base de datos:${NC}"
echo -e "   ./setup-database.sh"
echo ""
echo -e "${BLUE}2. Configurar variables de entorno:${NC}"
echo -e "   nano server/.env"
echo -e "   (Configura DATABASE_URL, JWT_SECRET, EMAIL_SMTP_*)"
echo ""
echo -e "${BLUE}3. Ejecutar migraciones de Prisma:${NC}"
echo -e "   cd server && npx prisma migrate deploy && cd .."
echo ""
echo -e "${BLUE}4. Configurar Postfix:${NC}"
echo -e "   cd server/scripts"
echo -e "   sudo ./setup-smtp-server.sh"
echo -e "   sudo ./complete-email-setup.sh"
echo ""
echo -e "${BLUE}5. Crear usuario admin SMTP:${NC}"
echo -e "   cd server/scripts"
echo -e "   sudo ./create-smtp-user.sh admin@fylomail.es fylomail.es tu_contraseña"
echo ""
echo -e "${BLUE}6. Configurar DNS (MX, A, SPF, DMARC)${NC}"
echo ""
echo -e "${BLUE}7. Activar firewall:${NC}"
echo -e "   sudo ufw enable"
echo ""
echo -e "${BLUE}8. Iniciar servicios:${NC}"
echo -e "   npm run build"
echo -e "   # Usa PM2 o systemd para producción"
echo ""
echo -e "${GREEN}✅ ¡Instalación lista!${NC}"

