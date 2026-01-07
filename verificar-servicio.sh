#!/bin/bash

# Script de verificación rápida del servicio

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 Verificación de Servicios"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}1. Estado de PM2:${NC}"
pm2 status
echo ""

echo -e "${BLUE}2. Verificando puertos:${NC}"
if lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Puerto 3000 (Frontend): Activo${NC}"
    lsof -Pi :3000 -sTCP:LISTEN | head -2
else
    echo -e "${RED}❌ Puerto 3000 (Frontend): No responde${NC}"
fi

if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Puerto 3001 (Backend): Activo${NC}"
    lsof -Pi :3001 -sTCP:LISTEN | head -2
else
    echo -e "${RED}❌ Puerto 3001 (Backend): No responde${NC}"
fi
echo ""

echo -e "${BLUE}3. Probando conexión local:${NC}"
HTTP_FRONTEND=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 2>/dev/null || echo "000")
HTTP_BACKEND=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001 2>/dev/null || echo "000")

if [ "$HTTP_FRONTEND" = "200" ]; then
    echo -e "${GREEN}✅ Frontend (http://localhost:3000): HTTP $HTTP_FRONTEND${NC}"
elif [ "$HTTP_FRONTEND" = "000" ]; then
    echo -e "${RED}❌ Frontend (http://localhost:3000): No responde${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend (http://localhost:3000): HTTP $HTTP_FRONTEND${NC}"
fi

if [ "$HTTP_BACKEND" = "200" ]; then
    echo -e "${GREEN}✅ Backend (http://localhost:3001): HTTP $HTTP_BACKEND${NC}"
elif [ "$HTTP_BACKEND" = "000" ]; then
    echo -e "${RED}❌ Backend (http://localhost:3001): No responde${NC}"
else
    echo -e "${YELLOW}⚠️  Backend (http://localhost:3001): HTTP $HTTP_BACKEND${NC}"
fi
echo ""

echo -e "${BLUE}4. IP del servidor:${NC}"
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null || hostname -I | awk '{print $1}')
echo "   IP: $SERVER_IP"
echo ""
echo -e "${YELLOW}Prueba acceder con:${NC}"
echo "   http://$SERVER_IP:3000"
echo "   http://mail.fylo.es:3000"
echo ""

echo -e "${BLUE}5. Verificando firewall:${NC}"
if command -v ufw &> /dev/null; then
    ufw status | grep -E "3000|3001" || echo "   No hay reglas específicas para 3000/3001"
else
    echo "   UFW no está instalado"
fi
echo ""

echo -e "${BLUE}6. Últimos logs del frontend (5 líneas):${NC}"
pm2 logs fylo-frontend --lines 5 --nostream || echo "   No se pudieron obtener logs"
echo ""

echo -e "${BLUE}7. Últimos logs del backend (5 líneas):${NC}"
pm2 logs fylo-backend --lines 5 --nostream || echo "   No se pudieron obtener logs"
echo ""

echo -e "${BLUE}8. Verificando DNS:${NC}"
DOMAIN_IP=$(dig +short mail.fylo.es 2>/dev/null || echo "")
if [ ! -z "$DOMAIN_IP" ]; then
    echo "   mail.fylo.es → $DOMAIN_IP"
    if [ "$DOMAIN_IP" = "$SERVER_IP" ]; then
        echo -e "${GREEN}✅ DNS apunta correctamente al servidor${NC}"
    else
        echo -e "${YELLOW}⚠️  DNS apunta a $DOMAIN_IP pero el servidor es $SERVER_IP${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  No se pudo resolver mail.fylo.es${NC}"
fi
echo ""

