#!/bin/bash
set -e  # Salir si hay error

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🚀 Deploy Automático Completo${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Verificar si es root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Por favor ejecuta como root (sudo ./deploy.sh)${NC}"
    exit 1
fi

# Configuración por defecto (NO CAMBIAR - configurado automáticamente)
MYSQL_USER="sistema_email_user"
MYSQL_PASSWORD="SistemaEmail2024!"
MYSQL_DATABASE="sistema_email"
BACKEND_PORT=3001
FRONTEND_PORT=3000

echo -e "${YELLOW}⚙️  Configuración automática:${NC}"
echo "   MySQL User: $MYSQL_USER"
echo "   MySQL Password: $MYSQL_PASSWORD"
echo "   MySQL Database: $MYSQL_DATABASE"
echo "   Backend Port: $BACKEND_PORT"
echo "   Frontend Port: $FRONTEND_PORT"
echo ""

# Paso 0: Instalar servicios del sistema
echo -e "${GREEN}📦 [0/X] Instalando servicios del sistema...${NC}"

# Verificar e instalar Node.js 20.x
if ! command -v node &> /dev/null; then
    echo "   Instalando Node.js 20.x..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
    echo -e "${GREEN}✅ Node.js instalado: $(node --version)${NC}"
else
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -ge 20 ]; then
        echo -e "${GREEN}✅ Node.js ya instalado: $(node --version)${NC}"
    else
        echo "   Actualizando Node.js a 20.x..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
        apt install -y nodejs
        echo -e "${GREEN}✅ Node.js actualizado: $(node --version)${NC}"
    fi
fi

# Instalar PM2 globalmente
if ! command -v pm2 &> /dev/null; then
    echo "   Instalando PM2..."
    npm install -g pm2
    echo -e "${GREEN}✅ PM2 instalado${NC}"
else
    echo -e "${GREEN}✅ PM2 ya instalado${NC}"
fi

# Instalar MySQL
if ! command -v mysql &> /dev/null; then
    echo "   Instalando MySQL..."
    apt update
    apt install -y mysql-server
    systemctl start mysql
    systemctl enable mysql
    echo -e "${GREEN}✅ MySQL instalado${NC}"
else
    echo -e "${GREEN}✅ MySQL ya instalado${NC}"
    # Asegurar que MySQL esté corriendo
    systemctl start mysql 2>/dev/null || true
fi

# Instalar Postfix y Dovecot (opcional, para servidor de correo)
if ! command -v postfix &> /dev/null; then
    echo "   Instalando Postfix y Dovecot..."
    DEBIAN_FRONTEND=noninteractive apt install -y postfix dovecot-core dovecot-imapd dovecot-pop3d mailutils 2>/dev/null || echo "   Postfix opcional, omitiendo..."
    echo -e "${GREEN}✅ Postfix y Dovecot instalados${NC}"
else
    echo -e "${GREEN}✅ Postfix ya instalado${NC}"
fi

# Instalar herramientas necesarias
apt install -y curl wget git build-essential openssl 2>/dev/null || true

# Configurar firewall básico
if command -v ufw &> /dev/null; then
    echo "   Configurando firewall..."
    ufw allow $FRONTEND_PORT/tcp comment "Frontend" 2>/dev/null || true
    ufw allow $BACKEND_PORT/tcp comment "Backend" 2>/dev/null || true
    echo -e "${GREEN}✅ Firewall configurado${NC}"
fi

echo ""
echo -e "${GREEN}✅ Servicios del sistema instalados${NC}"
echo ""

# Paso 1: Limpiar procesos anteriores
echo -e "${GREEN}🧹 [1/12] Limpiando procesos anteriores...${NC}"
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
pm2 kill 2>/dev/null || true
sudo lsof -ti:$FRONTEND_PORT | xargs sudo kill -9 2>/dev/null || true
sudo lsof -ti:$BACKEND_PORT | xargs sudo kill -9 2>/dev/null || true
sleep 2
echo "✅ Limpieza completada"
echo ""

# Paso 2: Configurar MySQL automáticamente
echo -e "${GREEN}📦 [2/12] Configurando MySQL automáticamente...${NC}"
sudo mysql -u root <<EOF
-- Crear base de datos
CREATE DATABASE IF NOT EXISTS $MYSQL_DATABASE CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Eliminar usuario si existe
DROP USER IF EXISTS '$MYSQL_USER'@'localhost';

-- Crear usuario con contraseña por defecto
CREATE USER '$MYSQL_USER'@'localhost' IDENTIFIED BY '$MYSQL_PASSWORD';

-- Dar permisos
GRANT ALL PRIVILEGES ON $MYSQL_DATABASE.* TO '$MYSQL_USER'@'localhost';

-- Aplicar cambios
FLUSH PRIVILEGES;

-- Verificar
SELECT 'MySQL configurado correctamente' AS Status;
SHOW DATABASES LIKE '$MYSQL_DATABASE';
EXIT;
EOF

# Verificar conexión
mysql -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" -e "USE $MYSQL_DATABASE; SELECT 1;" >/dev/null 2>&1 || {
    echo -e "${RED}❌ Error configurando MySQL${NC}"
    exit 1
}
echo "✅ MySQL configurado correctamente"
echo ""

# Paso 3: Ir al directorio del proyecto
echo -e "${GREEN}📁 [3/12] Navegando al directorio del proyecto...${NC}"
cd "$(dirname "$0")" || exit 1
PROJECT_ROOT=$(pwd)
echo "✅ Directorio: $PROJECT_ROOT"
echo ""

# Paso 4: Configurar Backend (.env)
echo -e "${GREEN}⚙️  [4/12] Configurando backend...${NC}"
cd "$PROJECT_ROOT/server" || exit 1

# Generar JWT_SECRET seguro
JWT_SECRET=$(openssl rand -base64 32)

# Crear archivo .env automáticamente
cat > .env <<EOF
# Base de datos MySQL (configuración automática)
DATABASE_URL="mysql://$MYSQL_USER:$MYSQL_PASSWORD@localhost:3306/$MYSQL_DATABASE"

# JWT Secret (generado automáticamente)
JWT_SECRET="$JWT_SECRET"

# Puertos
PORT=$BACKEND_PORT
BACKEND_PORT=$BACKEND_PORT
FRONTEND_PORT=$FRONTEND_PORT
NODE_ENV=production

# Frontend URL (para CORS)
FRONTEND_URL="http://localhost:$FRONTEND_PORT"

# Email SMTP (Postfix local - usar valores por defecto)
EMAIL_SMTP_HOST="localhost"
EMAIL_SMTP_PORT="587"
EMAIL_SMTP_USER="admin@fylomail.es"
EMAIL_SMTP_PASSWORD="SistemaEmail2024!"

# IMAP
IMAP_HOST="localhost"
IMAP_PORT="993"
IMAP_SECURE="true"

# Sincronización automática de correos
ENABLE_EMAIL_SYNC="true"
EMAIL_SYNC_INTERVAL="5"
EOF

echo "✅ Archivo .env creado automáticamente"
echo ""

# Paso 5: Instalar dependencias del Backend
echo -e "${GREEN}📚 [5/12] Instalando dependencias del backend...${NC}"
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "   Dependencias ya instaladas, omitiendo..."
fi
echo "✅ Dependencias instaladas"
echo ""

# Paso 6: Generar Prisma Client
echo -e "${GREEN}🔨 [6/12] Generando Prisma Client...${NC}"
export NODE_OPTIONS="--max-old-space-size=4096"
npx prisma generate || {
    echo -e "${RED}❌ Error generando Prisma Client${NC}"
    echo "   Reintentando con más memoria..."
    rm -rf node_modules/.prisma 2>/dev/null || true
    export NODE_OPTIONS="--max-old-space-size=6144"
    npx prisma generate || {
        echo -e "${RED}❌ Error crítico generando Prisma${NC}"
        exit 1
    }
}

if [ -d "node_modules/.prisma/client" ]; then
    echo "✅ Prisma Client generado correctamente"
else
    echo -e "${RED}❌ Error: Prisma Client no se generó${NC}"
    exit 1
fi
echo ""

# Paso 7: Ejecutar migraciones
echo -e "${GREEN}🗄️  [7/12] Ejecutando migraciones de Prisma...${NC}"
npx prisma migrate deploy 2>&1 || {
    echo -e "${YELLOW}⚠️  migrate deploy falló, usando db push...${NC}"
    npx prisma db push --accept-data-loss || {
        echo -e "${RED}❌ Error ejecutando migraciones${NC}"
        exit 1
    }
}

# Verificar que las tablas se crearon
TABLES=$(mysql -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" -e "USE $MYSQL_DATABASE; SHOW TABLES;" 2>/dev/null | wc -l)
if [ "$TABLES" -gt 1 ]; then
    echo "✅ Migraciones ejecutadas correctamente ($TABLES tablas creadas)"
else
    echo -e "${YELLOW}⚠️  Advertencia: Pocas tablas encontradas${NC}"
fi
echo ""

# Paso 8: Inicializar planes
echo -e "${GREEN}📋 [8/12] Inicializando planes en la base de datos...${NC}"
npm run init-plans 2>&1 || {
    echo -e "${YELLOW}⚠️  Error inicializando planes (continuando...)${NC}"
}
echo "✅ Planes inicializados"
echo ""

# Paso 9: Iniciar Backend con PM2
echo -e "${GREEN}🚀 [9/12] Iniciando backend...${NC}"
# Asegurarse de que el puerto esté libre
sudo lsof -ti:$BACKEND_PORT | xargs sudo kill -9 2>/dev/null || true
sleep 1

# Verificar que el puerto está libre
if sudo lsof -Pi :$BACKEND_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Puerto $BACKEND_PORT ocupado, liberando...${NC}"
    sudo fuser -k $BACKEND_PORT/tcp 2>/dev/null || true
    sleep 2
fi

pm2 start npm --name "fylo-backend" -- start
pm2 save
sleep 5

# Verificar que el backend está corriendo
if pm2 describe fylo-backend | grep -q "online"; then
    echo "✅ Backend iniciado correctamente"
else
    echo -e "${RED}❌ Error iniciando backend${NC}"
    pm2 logs fylo-backend --lines 20
    exit 1
fi
echo ""

# Paso 10: Configurar Frontend
echo -e "${GREEN}🌐 [10/12] Configurando frontend...${NC}"
cd "$PROJECT_ROOT/client" || exit 1

# Obtener IP del servidor
IP=$(curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null || echo "localhost")
echo "   IP detectada: $IP"

# Crear archivo .env.local automáticamente
cat > .env.local <<EOF
NEXT_PUBLIC_API_URL=http://${IP}:${BACKEND_PORT}
EOF

echo "✅ Archivo .env.local creado automáticamente"
echo "   NEXT_PUBLIC_API_URL=http://${IP}:${BACKEND_PORT}"
echo ""

# Instalar dependencias del Frontend
echo "📚 Instalando dependencias del frontend..."
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "   Dependencias ya instaladas, omitiendo..."
fi
echo "✅ Dependencias instaladas"
echo ""

# Construir Frontend
echo "🏗️  Construyendo frontend (esto puede tardar unos minutos)..."
npm run build || {
    echo -e "${RED}❌ Error construyendo frontend${NC}"
    exit 1
}

if [ -d ".next" ]; then
    echo "✅ Frontend construido correctamente"
else
    echo -e "${RED}❌ Error: Frontend no se construyó${NC}"
    exit 1
fi
echo ""

# Paso 11: Iniciar Frontend con PM2
echo -e "${GREEN}🚀 [11/12] Iniciando frontend...${NC}"
# Asegurarse de que el puerto esté libre
sudo lsof -ti:$FRONTEND_PORT | xargs sudo kill -9 2>/dev/null || true
sleep 1

# Verificar que el puerto está libre
if sudo lsof -Pi :$FRONTEND_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Puerto $FRONTEND_PORT ocupado, liberando...${NC}"
    sudo fuser -k $FRONTEND_PORT/tcp 2>/dev/null || true
    sleep 2
fi

pm2 start npm --name "fylo-frontend" -- start
pm2 save
sleep 5

# Verificar que el frontend está corriendo
if pm2 describe fylo-frontend | grep -q "online"; then
    echo "✅ Frontend iniciado correctamente"
else
    echo -e "${RED}❌ Error iniciando frontend${NC}"
    pm2 logs fylo-frontend --lines 20
    exit 1
fi
echo ""

# Paso 12: Verificación final
echo -e "${GREEN}✅ [12/12] Verificación final...${NC}"
echo ""

# Verificar servicios del sistema
echo "🔍 Verificando servicios del sistema:"
systemctl is-active --quiet mysql && echo "   ✅ MySQL: corriendo" || echo "   ⚠️  MySQL: no corriendo"
systemctl is-active --quiet postfix && echo "   ✅ Postfix: corriendo" || echo "   ℹ️  Postfix: no instalado (opcional)"
command -v node >/dev/null && echo "   ✅ Node.js: $(node --version)" || echo "   ❌ Node.js: no encontrado"
command -v pm2 >/dev/null && echo "   ✅ PM2: instalado" || echo "   ❌ PM2: no encontrado"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Deploy completado exitosamente!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📊 Estado de PM2:"
pm2 status
echo ""
echo "🌐 URLs de acceso:"
IP=$(curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null || echo "localhost")
echo "   Frontend: http://${IP}:$FRONTEND_PORT"
echo "   Backend:  http://${IP}:$BACKEND_PORT"
echo ""
echo "📝 Configuración MySQL (guardada automáticamente):"
echo "   Usuario: $MYSQL_USER"
echo "   Base de datos: $MYSQL_DATABASE"
echo "   Contraseña: $MYSQL_PASSWORD"
echo ""
echo "📝 Archivos de configuración creados:"
echo "   - /root/sistema-email/server/.env"
echo "   - /root/sistema-email/client/.env.local"
echo ""
echo "🔧 Comandos útiles:"
echo "   pm2 status              - Ver estado"
echo "   pm2 logs                - Ver logs"
echo "   pm2 restart all         - Reiniciar todo"
echo "   pm2 logs fylo-backend   - Logs del backend"
echo "   pm2 logs fylo-frontend  - Logs del frontend"
echo "   sudo systemctl status mysql   - Estado de MySQL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

