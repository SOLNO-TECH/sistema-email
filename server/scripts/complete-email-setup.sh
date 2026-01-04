#!/bin/bash

# Script para completar la configuración de recepción de correos
# Ejecutar DESPUÉS de setup-smtp-server.sh
# Uso: sudo ./complete-email-setup.sh

set -e

echo "📧 Completando Configuración para Recepción de Correos"
echo "======================================================"
echo ""

if [ "$EUID" -ne 0 ]; then 
    echo "❌ Por favor ejecuta como root (sudo)"
    exit 1
fi

# Verificar que Postfix esté instalado
if ! command -v postfix &> /dev/null; then
    echo "❌ Postfix no está instalado. Ejecuta primero setup-smtp-server.sh"
    exit 1
fi

echo "⚙️ Configurando Postfix para recepción de correos..."

# Agregar transport virtual a master.cf si no existe
if ! grep -q "^virtual" /etc/postfix/master.cf; then
    echo "virtual      unix  -       n       n       -       -       virtual" >> /etc/postfix/master.cf
    echo "✅ Transport virtual agregado"
fi

# Verificar configuración en main.cf
if ! grep -q "^virtual_transport" /etc/postfix/main.cf; then
    echo "virtual_transport = virtual" >> /etc/postfix/main.cf
    echo "✅ Virtual transport configurado"
fi

# Asegurar que inet_interfaces esté en 'all'
sed -i 's/^inet_interfaces =.*/inet_interfaces = all/' /etc/postfix/main.cf

echo "⚙️ Configurando Dovecot completamente..."

# Configurar 10-mail.conf
if [ -f /etc/dovecot/conf.d/10-mail.conf ]; then
    # Asegurar mail_location
    if ! grep -q "^mail_location = maildir:/var/mail/virtual" /etc/dovecot/conf.d/10-mail.conf; then
        sed -i 's|^mail_location =.*|mail_location = maildir:/var/mail/virtual/%d/%n|' /etc/dovecot/conf.d/10-mail.conf
    fi
    
    # Agregar configuraciones adicionales
    if ! grep -q "^mail_privileged_group" /etc/dovecot/conf.d/10-mail.conf; then
        echo "mail_privileged_group = mail" >> /etc/dovecot/conf.d/10-mail.conf
    fi
    
    if ! grep -q "^first_valid_uid" /etc/dovecot/conf.d/10-mail.conf; then
        echo "first_valid_uid = 5000" >> /etc/dovecot/conf.d/10-mail.conf
        echo "last_valid_uid = 5000" >> /etc/dovecot/conf.d/10-mail.conf
    fi
fi

# Configurar 10-auth.conf
if [ -f /etc/dovecot/conf.d/10-auth.conf ]; then
    sed -i 's/^disable_plaintext_auth =.*/disable_plaintext_auth = no/' /etc/dovecot/conf.d/10-auth.conf
    sed -i 's/^auth_mechanisms =.*/auth_mechanisms = plain login/' /etc/dovecot/conf.d/10-auth.conf
    
    if ! grep -q "^auth_username_format" /etc/dovecot/conf.d/10-auth.conf; then
        echo "auth_username_format = %n" >> /etc/dovecot/conf.d/10-auth.conf
    fi
fi

# Configurar IMAP y POP3
if [ -f /etc/dovecot/conf.d/20-imap.conf ]; then
    if ! grep -q "^protocols" /etc/dovecot/conf.d/10-master.conf 2>/dev/null; then
        echo "protocols = imap pop3" >> /etc/dovecot/conf.d/10-master.conf 2>/dev/null || true
    fi
fi

echo "🔌 Configurando firewall..."

# Abrir puertos necesarios
if command -v ufw &> /dev/null; then
    ufw allow 25/tcp comment "SMTP - Recepción de correos"
    ufw allow 587/tcp comment "SMTP Submission - Envío"
    ufw allow 993/tcp comment "IMAPS - Clientes de correo"
    ufw allow 995/tcp comment "POP3S - Clientes de correo"
    echo "✅ Puertos abiertos en firewall"
else
    echo "⚠️  UFW no está instalado. Abre manualmente los puertos 25, 587, 993, 995"
fi

# Reiniciar servicios
echo "🔄 Reiniciando servicios..."
systemctl restart postfix
systemctl restart dovecot

# Verificar servicios
echo ""
echo "📊 Estado de servicios:"
systemctl is-active postfix > /dev/null && echo "✅ Postfix: Activo" || echo "❌ Postfix: Inactivo"
systemctl is-active dovecot > /dev/null && echo "✅ Dovecot: Activo" || echo "❌ Dovecot: Inactivo"

# Obtener IP del servidor
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')
DOMAIN=$(hostname -d 2>/dev/null || grep "^[^#]" /etc/postfix/virtual_domains 2>/dev/null | head -1 || echo "tudominio.com")
HOSTNAME=$(hostname -f 2>/dev/null || echo "mail.$DOMAIN")

echo ""
echo "✅ Configuración completada!"
echo ""
echo "📋 IMPORTANTE: Configura estos registros DNS:"
echo "=============================================="
echo "Tipo    Nombre              Valor"
echo "MX      @                   $HOSTNAME (prioridad 10)"
echo "A       mail                $SERVER_IP"
echo "TXT     @                   v=spf1 mx a:$HOSTNAME ~all"
echo ""
echo "📱 Configuración para clientes externos (Outlook, Thunderbird):"
echo "==============================================================="
echo "IMAP:"
echo "  Servidor: $HOSTNAME"
echo "  Puerto: 993"
echo "  Seguridad: SSL/TLS"
echo ""
echo "SMTP:"
echo "  Servidor: $HOSTNAME"
echo "  Puerto: 587"
echo "  Seguridad: STARTTLS"
echo ""
echo "🧪 Para probar recepción:"
echo "========================="
echo "1. Configura los registros DNS"
echo "2. Espera 5-10 minutos para propagación DNS"
echo "3. Envía un correo desde Gmail a: admin@$DOMAIN"
echo "4. Verifica logs: sudo tail -f /var/log/mail.log"
echo ""

