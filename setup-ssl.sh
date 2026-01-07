#!/bin/bash

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# Script de Instalación SSL (Let's Encrypt) para mail.fylo.es
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

set -e

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🔒 Instalación SSL para mail.fylo.es${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Verificar que se ejecuta como root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}❌ Por favor ejecuta como root (sudo ./setup-ssl.sh)${NC}"
    exit 1
fi

# Configuración
DOMAIN="mail.fylo.es"
EMAIL="admin@fylo.es"  # Email para notificaciones de Let's Encrypt

echo -e "${YELLOW}📋 Configuración:${NC}"
echo "   Dominio: $DOMAIN"
echo "   Email:   $EMAIL"
echo ""

# Paso 1: Verificar que el dominio apunta al servidor
echo -e "${BLUE}🔍 [1/7] Verificando DNS del dominio...${NC}"
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null || echo "")

if [ -z "$SERVER_IP" ]; then
    echo -e "${RED}❌ No se pudo detectar la IP del servidor${NC}"
    exit 1
fi

echo "   IP del servidor: $SERVER_IP"

# Verificar que el dominio apunta a este servidor
DOMAIN_IP=$(dig +short $DOMAIN 2>/dev/null | head -n 1 || echo "")

if [ -z "$DOMAIN_IP" ]; then
    echo -e "${YELLOW}⚠️  No se pudo resolver $DOMAIN${NC}"
    echo -e "${YELLOW}   Asegúrate de que el registro DNS A apunte a $SERVER_IP${NC}"
    read -p "¿Deseas continuar de todos modos? (s/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        exit 1
    fi
elif [ "$DOMAIN_IP" != "$SERVER_IP" ]; then
    echo -e "${YELLOW}⚠️  El dominio $DOMAIN apunta a $DOMAIN_IP pero este servidor es $SERVER_IP${NC}"
    echo -e "${YELLOW}   Actualiza tu DNS antes de continuar${NC}"
    read -p "¿Deseas continuar de todos modos? (s/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        exit 1
    fi
else
    echo -e "${GREEN}✅ DNS configurado correctamente ($DOMAIN → $SERVER_IP)${NC}"
fi
echo ""

# Paso 2: Instalar Certbot
echo -e "${BLUE}📦 [2/7] Instalando Certbot...${NC}"
if command -v certbot &> /dev/null; then
    echo -e "${GREEN}✅ Certbot ya está instalado${NC}"
else
    apt update
    apt install -y certbot python3-certbot-nginx
    echo -e "${GREEN}✅ Certbot instalado${NC}"
fi
echo ""

# Paso 3: Crear directorio para validación
echo -e "${BLUE}📁 [3/7] Creando directorio para validación...${NC}"
mkdir -p /var/www/certbot
chown -R www-data:www-data /var/www/certbot
chmod -R 755 /var/www/certbot
echo -e "${GREEN}✅ Directorio creado${NC}"
echo ""

# Paso 4: Configurar Nginx (sin SSL primero)
echo -e "${BLUE}⚙️  [4/7] Configurando Nginx...${NC}"

# Copiar configuración si no existe
if [ ! -f /etc/nginx/sites-available/fylo-mail ]; then
    if [ -f nginx.conf.example ]; then
        cp nginx.conf.example /etc/nginx/sites-available/fylo-mail
        echo "✅ Configuración copiada"
    else
        echo -e "${RED}❌ No se encontró nginx.conf.example${NC}"
        exit 1
    fi
fi

# Habilitar sitio
if [ ! -L /etc/nginx/sites-enabled/fylo-mail ]; then
    ln -s /etc/nginx/sites-available/fylo-mail /etc/nginx/sites-enabled/
    echo "✅ Sitio habilitado"
fi

# Eliminar configuración default si existe
if [ -L /etc/nginx/sites-enabled/default ]; then
    rm /etc/nginx/sites-enabled/default
    echo "✅ Configuración default eliminada"
fi

# Verificar configuración
if nginx -t 2>/dev/null; then
    echo -e "${GREEN}✅ Configuración de Nginx válida${NC}"
    systemctl reload nginx
else
    echo -e "${RED}❌ Error en la configuración de Nginx${NC}"
    nginx -t
    exit 1
fi
echo ""

# Paso 5: Obtener certificado SSL
echo -e "${BLUE}🔒 [5/7] Obteniendo certificado SSL de Let's Encrypt...${NC}"
echo "   Esto puede tardar unos segundos..."
echo ""

# Obtener certificado usando el método webroot
certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    --force-renewal \
    -d $DOMAIN

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Certificado SSL obtenido exitosamente${NC}"
else
    echo -e "${RED}❌ Error al obtener el certificado SSL${NC}"
    echo ""
    echo -e "${YELLOW}Posibles causas:${NC}"
    echo "   1. El dominio $DOMAIN no apunta a la IP de este servidor ($SERVER_IP)"
    echo "   2. El puerto 80 está bloqueado en el firewall"
    echo "   3. Nginx no está corriendo correctamente"
    echo ""
    echo -e "${YELLOW}Comandos de diagnóstico:${NC}"
    echo "   sudo systemctl status nginx"
    echo "   sudo ufw status"
    echo "   dig +short $DOMAIN"
    exit 1
fi
echo ""

# Paso 6: Habilitar redirección HTTPS en Nginx
echo -e "${BLUE}⚙️  [6/7] Habilitando redirección HTTPS...${NC}"

# Descomentar la línea de redirección HTTP -> HTTPS
sed -i 's/# return 301 https:\/\/\$server_name\$request_uri;/return 301 https:\/\/$server_name$request_uri;/g' /etc/nginx/sites-available/fylo-mail

# Comentar las rutas temporales HTTP
sed -i '/# Mientras obtienes el certificado/,/}/s/^/#/' /etc/nginx/sites-available/fylo-mail

# Verificar y recargar
if nginx -t 2>/dev/null; then
    systemctl reload nginx
    echo -e "${GREEN}✅ Redirección HTTPS habilitada${NC}"
else
    echo -e "${RED}❌ Error en la configuración de Nginx${NC}"
    nginx -t
    exit 1
fi
echo ""

# Paso 7: Configurar renovación automática
echo -e "${BLUE}🔄 [7/7] Configurando renovación automática...${NC}"

# Certbot instala automáticamente un timer de systemd
if systemctl is-enabled certbot.timer &>/dev/null; then
    echo -e "${GREEN}✅ Renovación automática ya configurada${NC}"
else
    # Intentar habilitar el timer
    systemctl enable certbot.timer 2>/dev/null || true
    systemctl start certbot.timer 2>/dev/null || true
    echo -e "${GREEN}✅ Renovación automática configurada${NC}"
fi

# Verificar próxima renovación
NEXT_RENEWAL=$(certbot renew --dry-run 2>&1 | grep -i "certificate will not be renewed" || echo "")
if [ -z "$NEXT_RENEWAL" ]; then
    echo "   Los certificados se renovarán automáticamente antes de expirar"
else
    echo "   Certificado recién obtenido, renovación automática configurada"
fi
echo ""

# Actualizar URLs en .env a HTTPS (después de configurar SSL)
echo -e "${BLUE}🔄 Actualizando URLs a HTTPS...${NC}"
if [ -f "server/.env" ]; then
    # Obtener puertos del .env actual o usar valores por defecto
    BACKEND_PORT=$(grep "^BACKEND_PORT=" server/.env 2>/dev/null | cut -d'=' -f2 | tr -d '"' || echo "3001")
    FRONTEND_PORT=$(grep "^FRONTEND_PORT=" server/.env 2>/dev/null | cut -d'=' -f2 | tr -d '"' || echo "3000")
    
    # Actualizar FRONTEND_URL y ALLOWED_ORIGINS a HTTPS
    sed -i "s|FRONTEND_URL=\"http://|FRONTEND_URL=\"https://|g" server/.env
    sed -i "s|ALLOWED_ORIGINS=\"http://|ALLOWED_ORIGINS=\"https://|g" server/.env
    
    # Asegurarse de que usen el dominio correcto (no IP)
    sed -i "s|FRONTEND_URL=.*|FRONTEND_URL=\"https://$DOMAIN\"|g" server/.env
    sed -i "s|ALLOWED_ORIGINS=.*|ALLOWED_ORIGINS=\"https://$DOMAIN\"|g" server/.env
    
    echo "✅ URLs actualizadas a HTTPS en server/.env"
fi

# Actualizar .env.local del cliente con HTTPS
if [ -f "client/.env.local" ]; then
    # Actualizar NEXT_PUBLIC_API_URL a HTTPS
    BACKEND_PORT=$(grep "^BACKEND_PORT=" server/.env 2>/dev/null | cut -d'=' -f2 | tr -d '"' || echo "3001")
    if [ -n "$BACKEND_PORT" ]; then
        echo "NEXT_PUBLIC_API_URL=https://$DOMAIN:$BACKEND_PORT" > client/.env.local
    else
        echo "NEXT_PUBLIC_API_URL=https://$DOMAIN:3001" > client/.env.local
    fi
    echo "✅ URL del backend actualizada a HTTPS en client/.env.local"
    
    # Reiniciar frontend para cargar nueva configuración
    echo "   Reiniciando frontend para aplicar cambios..."
    pm2 restart fylo-frontend 2>/dev/null || true
fi

echo ""

# Verificación final
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ SSL configurado exitosamente!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}📋 Información del certificado:${NC}"
certbot certificates -d $DOMAIN 2>/dev/null || true
echo ""
echo -e "${BLUE}🌐 Accede a tu aplicación en:${NC}"
echo "   https://$DOMAIN"
echo ""
echo -e "${BLUE}🔧 Comandos útiles:${NC}"
echo "   sudo certbot renew --dry-run    # Probar renovación"
echo "   sudo certbot certificates       # Ver certificados"
echo "   sudo systemctl status nginx     # Estado de Nginx"
echo "   sudo nginx -t                   # Verificar configuración"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANTE:${NC}"
echo "   • El certificado se renovará automáticamente cada 60 días"
echo "   • Verifica que el firewall permita los puertos 80 y 443"
echo "   • Monitorea los logs: tail -f /var/log/nginx/fylo-mail-error.log"
echo ""
echo -e "${GREEN}🎉 ¡Todo listo! Tu sitio ahora tiene HTTPS${NC}"
echo ""

