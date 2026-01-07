#!/bin/bash

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Script de verificación del estado del sistema Fylo Mail
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🔍 Estado del Sistema Fylo Mail${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Función para verificar servicios
check_service() {
    if systemctl is-active --quiet "$1"; then
        echo -e "${GREEN}✅ $1: Running${NC}"
        return 0
    else
        echo -e "${RED}❌ $1: Stopped${NC}"
        return 1
    fi
}

# Función para verificar puerto
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Puerto $1: Activo${NC}"
        return 0
    else
        echo -e "${RED}❌ Puerto $1: No responde${NC}"
        return 1
    fi
}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 1. Servicios del sistema
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo -e "${YELLOW}📦 Servicios del sistema:${NC}"
check_service nginx
check_service mysql
if command -v postfix &> /dev/null; then
    check_service postfix
else
    echo -e "${YELLOW}ℹ️  Postfix: No instalado (opcional)${NC}"
fi
if command -v dovecot &> /dev/null; then
    check_service dovecot
else
    echo -e "${YELLOW}ℹ️  Dovecot: No instalado (opcional)${NC}"
fi
echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 2. Aplicaciones PM2
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo -e "${YELLOW}🚀 Aplicaciones PM2:${NC}"
if command -v pm2 &> /dev/null; then
    pm2 status | tail -n +4 | head -n -1
    echo ""
    
    # Verificar si están online
    if pm2 describe fylo-backend 2>/dev/null | grep -q "online"; then
        echo -e "${GREEN}✅ Backend: Online${NC}"
    else
        echo -e "${RED}❌ Backend: Offline${NC}"
    fi
    
    if pm2 describe fylo-frontend 2>/dev/null | grep -q "online"; then
        echo -e "${GREEN}✅ Frontend: Online${NC}"
    else
        echo -e "${RED}❌ Frontend: Offline${NC}"
    fi
else
    echo -e "${RED}❌ PM2 no está instalado${NC}"
fi
echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 3. Puertos
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo -e "${YELLOW}🔌 Puertos:${NC}"
check_port 80   # HTTP
check_port 443  # HTTPS
check_port 3000 # Frontend
check_port 3001 # Backend
echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 4. Base de datos
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo -e "${YELLOW}🗄️  Base de datos:${NC}"
if command -v mysql &> /dev/null; then
    # Verificar si el servidor MySQL está corriendo
    if mysqladmin ping -h localhost >/dev/null 2>&1; then
        echo -e "${GREEN}✅ MySQL Server: Online${NC}"
        
        # Intentar conectar a la base de datos del proyecto
        if [ -f server/.env ]; then
            DB_URL=$(grep DATABASE_URL server/.env | cut -d '=' -f2 | tr -d '"')
            if [ ! -z "$DB_URL" ]; then
                DB_NAME=$(echo $DB_URL | sed 's/.*\/\([^?]*\).*/\1/')
                DB_USER=$(echo $DB_URL | sed 's/mysql:\/\/\([^:]*\).*/\1/')
                
                if mysql -u "$DB_USER" -e "USE $DB_NAME" 2>/dev/null; then
                    echo -e "${GREEN}✅ Base de datos '$DB_NAME': Accesible${NC}"
                    
                    # Contar tablas
                    TABLE_COUNT=$(mysql -u "$DB_USER" -e "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = '$DB_NAME'" 2>/dev/null | tail -n 1)
                    echo -e "   Tablas: $TABLE_COUNT"
                else
                    echo -e "${RED}❌ Base de datos '$DB_NAME': No accesible${NC}"
                fi
            fi
        fi
    else
        echo -e "${RED}❌ MySQL Server: Offline${NC}"
    fi
else
    echo -e "${RED}❌ MySQL no está instalado${NC}"
fi
echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 5. SSL/Certificados
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo -e "${YELLOW}🔒 SSL/Certificados:${NC}"
if command -v certbot &> /dev/null; then
    CERT_INFO=$(certbot certificates 2>/dev/null | grep -A 10 "mail.fylo.es" | head -n 5)
    if [ ! -z "$CERT_INFO" ]; then
        echo -e "${GREEN}✅ Certificado SSL: Instalado${NC}"
        EXPIRY=$(echo "$CERT_INFO" | grep "Expiry Date" | cut -d ':' -f2-)
        echo -e "   Expira: $EXPIRY"
    else
        echo -e "${YELLOW}⚠️  Certificado SSL: No encontrado${NC}"
        echo -e "   Ejecuta: sudo ./setup-ssl.sh"
    fi
else
    echo -e "${YELLOW}⚠️  Certbot: No instalado${NC}"
    echo -e "   Ejecuta: sudo ./setup-ssl.sh"
fi
echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 6. DNS
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo -e "${YELLOW}🌐 DNS:${NC}"
DOMAIN="mail.fylo.es"
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null || echo "")

if [ ! -z "$SERVER_IP" ]; then
    echo -e "   IP del servidor: $SERVER_IP"
    
    if command -v dig &> /dev/null; then
        DOMAIN_IP=$(dig +short $DOMAIN 2>/dev/null | head -n 1 || echo "")
        if [ ! -z "$DOMAIN_IP" ]; then
            if [ "$DOMAIN_IP" = "$SERVER_IP" ]; then
                echo -e "${GREEN}✅ DNS: $DOMAIN → $DOMAIN_IP (correcto)${NC}"
            else
                echo -e "${YELLOW}⚠️  DNS: $DOMAIN → $DOMAIN_IP (diferente del servidor)${NC}"
            fi
        else
            echo -e "${RED}❌ DNS: $DOMAIN no resuelve${NC}"
        fi
    else
        echo -e "${YELLOW}ℹ️  dig no está instalado, no se puede verificar DNS${NC}"
    fi
fi
echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 7. Acceso web
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo -e "${YELLOW}🌐 Acceso web:${NC}"

# Verificar HTTP
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Frontend (http://localhost:3000): Accesible (HTTP $HTTP_CODE)${NC}"
else
    echo -e "${RED}❌ Frontend (http://localhost:3000): No accesible (HTTP $HTTP_CODE)${NC}"
fi

# Verificar backend
BACKEND_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001 2>/dev/null || echo "000")
if [ "$BACKEND_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Backend (http://localhost:3001): Accesible (HTTP $BACKEND_CODE)${NC}"
else
    echo -e "${RED}❌ Backend (http://localhost:3001): No accesible (HTTP $BACKEND_CODE)${NC}"
fi

# Verificar HTTPS (si está configurado)
if [ -f /etc/letsencrypt/live/mail.fylo.es/fullchain.pem ]; then
    HTTPS_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://mail.fylo.es 2>/dev/null || echo "000")
    if [ "$HTTPS_CODE" = "200" ]; then
        echo -e "${GREEN}✅ Sitio público (https://mail.fylo.es): Accesible (HTTPS $HTTPS_CODE)${NC}"
    else
        echo -e "${YELLOW}⚠️  Sitio público (https://mail.fylo.es): No accesible (HTTPS $HTTPS_CODE)${NC}"
    fi
fi
echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# 8. Espacio en disco
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo -e "${YELLOW}💾 Espacio en disco:${NC}"
df -h / | tail -n 1 | awk '{print "   Usado: " $3 " / " $2 " (" $5 ")"}'
echo ""

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Resumen
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📋 Resumen${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Contar problemas
ISSUES=0

systemctl is-active --quiet nginx || ((ISSUES++))
systemctl is-active --quiet mysql || ((ISSUES++))

if command -v pm2 &> /dev/null; then
    pm2 describe fylo-backend 2>/dev/null | grep -q "online" || ((ISSUES++))
    pm2 describe fylo-frontend 2>/dev/null | grep -q "online" || ((ISSUES++))
else
    ISSUES=$((ISSUES+2))
fi

lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1 || ((ISSUES++))
lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1 || ((ISSUES++))

if [ $ISSUES -eq 0 ]; then
    echo -e "${GREEN}✅ Todo está funcionando correctamente${NC}"
    echo ""
    echo -e "${BLUE}🌐 Accede a tu aplicación en:${NC}"
    if [ -f /etc/letsencrypt/live/mail.fylo.es/fullchain.pem ]; then
        echo -e "   ${GREEN}https://mail.fylo.es${NC}"
    else
        echo -e "   ${YELLOW}http://mail.fylo.es:3000${NC} (sin SSL)"
        echo -e "   ${YELLOW}Ejecuta: sudo ./setup-ssl.sh${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Se encontraron $ISSUES problema(s)${NC}"
    echo ""
    echo -e "${YELLOW}Comandos útiles:${NC}"
    echo "   pm2 logs                    # Ver logs de aplicaciones"
    echo "   sudo systemctl status nginx # Ver estado de Nginx"
    echo "   sudo systemctl status mysql # Ver estado de MySQL"
    echo "   sudo nginx -t               # Verificar configuración Nginx"
    echo "   pm2 restart all             # Reiniciar aplicaciones"
fi

echo ""

