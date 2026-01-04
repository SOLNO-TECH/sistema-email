#!/bin/bash

# Script para configurar Postfix como servidor SMTP propio
# Permite enviar desde cualquier email del dominio sin verificación manual

echo "🚀 Configurando servidor SMTP propio (Postfix)..."
echo ""

# Verificar si es root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Por favor ejecuta como root (sudo)"
    exit 1
fi

# Instalar Postfix
echo "📦 Instalando Postfix..."
apt update
apt install -y postfix mailutils

# Solicitar dominio
read -p "Ingresa tu dominio (ej: midominio.com): " DOMAIN
if [ -z "$DOMAIN" ]; then
    echo "❌ Dominio requerido"
    exit 1
fi

# Solicitar usuario SMTP
read -p "Ingresa el usuario SMTP (ej: mailuser): " SMTP_USER
if [ -z "$SMTP_USER" ]; then
    SMTP_USER="mailuser"
fi

# Crear usuario si no existe
if ! id "$SMTP_USER" &>/dev/null; then
    echo "👤 Creando usuario $SMTP_USER..."
    adduser --disabled-password --gecos "" $SMTP_USER
    passwd $SMTP_USER
fi

# Configurar Postfix
echo "⚙️ Configurando Postfix..."

# Backup de configuración
cp /etc/postfix/main.cf /etc/postfix/main.cf.backup

# Configuración básica
cat > /etc/postfix/main.cf <<EOF
# Dominio
myhostname = mail.$DOMAIN
mydomain = $DOMAIN
myorigin = \$mydomain

# Redes permitidas
mynetworks = 127.0.0.0/8 [::ffff:127.0.0.1]/104 [::1]/128

# Destinos
mydestination = \$myhostname, localhost.\$mydomain, localhost, \$mydomain

# Permitir enviar desde cualquier dirección del dominio
smtpd_sender_restrictions = permit_mynetworks, permit_sasl_authenticated, reject_unknown_sender_domain
smtpd_recipient_restrictions = permit_mynetworks, permit_sasl_authenticated, reject_unauth_destination

# Autenticación SASL
smtpd_sasl_type = dovecot
smtpd_sasl_path = private/auth
smtpd_sasl_auth_enable = yes
smtpd_sasl_security_options = noanonymous
smtpd_sasl_local_domain = \$myhostname

# TLS
smtpd_tls_cert_file = /etc/ssl/certs/ssl-cert-snakeoil.pem
smtpd_tls_key_file = /etc/ssl/private/ssl-cert-snakeoil.key
smtpd_use_tls = yes
smtpd_tls_auth_only = yes

# Permitir relay desde autenticados
smtpd_relay_restrictions = permit_mynetworks, permit_sasl_authenticated, reject_unauth_destination

# Permitir enviar desde cualquier dirección del dominio
sender_canonical_maps = regexp:/etc/postfix/sender_canonical
EOF

# Configurar sender canonical
echo "📝 Configurando sender canonical..."
cat > /etc/postfix/sender_canonical <<EOF
/^.*@${DOMAIN//./\\.}\$/ ${SMTP_USER}@${DOMAIN}
EOF

# Compilar configuración
postmap /etc/postfix/sender_canonical

# Reiniciar Postfix
echo "🔄 Reiniciando Postfix..."
systemctl restart postfix
systemctl enable postfix

# Obtener IP del servidor
SERVER_IP=$(curl -s ifconfig.me)

echo ""
echo "✅ Postfix configurado exitosamente!"
echo ""
echo "📋 Configuración para server/.env:"
echo "---"
echo "EMAIL_SMTP_HOST=mail.$DOMAIN"
echo "EMAIL_SMTP_PORT=587"
echo "EMAIL_SMTP_USER=${SMTP_USER}@$DOMAIN"
echo "EMAIL_SMTP_PASSWORD=<contraseña-del-usuario>"
echo "---"
echo ""
echo "📋 Registros DNS a agregar:"
echo "---"
echo "MX: $DOMAIN → mail.$DOMAIN (prioridad 10)"
echo "A: mail.$DOMAIN → $SERVER_IP"
echo "TXT: $DOMAIN → v=spf1 mx a:mail.$DOMAIN ~all"
echo "---"
echo ""
echo "🧪 Para probar:"
echo "  cd server"
echo "  node scripts/test-email-send.js"
echo ""

