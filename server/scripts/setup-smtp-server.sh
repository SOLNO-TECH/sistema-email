#!/bin/bash

# Script completo para configurar servidor SMTP propio con Postfix y Dovecot
# Uso: sudo ./setup-smtp-server.sh

set -e

echo "🚀 Configurando Servidor SMTP Propio con Postfix y Dovecot"
echo "=========================================================="
echo ""

# Verificar si es root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Por favor ejecuta como root (sudo)"
    exit 1
fi

# Solicitar dominio
read -p "📧 Ingresa tu dominio (ej: fylomail.es): " DOMAIN
if [ -z "$DOMAIN" ]; then
    echo "❌ Dominio requerido"
    exit 1
fi

# Solicitar hostname del servidor
read -p "🖥️  Ingresa el hostname del servidor (ej: mail.$DOMAIN) [mail.$DOMAIN]: " HOSTNAME
HOSTNAME=${HOSTNAME:-mail.$DOMAIN}

echo ""
echo "📦 Instalando Postfix y Dovecot..."
apt update
apt install -y postfix dovecot-core dovecot-imapd dovecot-pop3d mailutils

# Crear directorio para correos virtuales
VIRTUAL_MAIL_DIR="/var/mail/virtual"
echo "📁 Creando directorio para correos virtuales: $VIRTUAL_MAIL_DIR"
mkdir -p $VIRTUAL_MAIL_DIR

# Crear usuario virtual
if ! id "vmail" &>/dev/null; then
    echo "👤 Creando usuario virtual 'vmail'..."
    useradd -r -u 5000 -g mail -d $VIRTUAL_MAIL_DIR -s /sbin/nologin -c "Virtual Mailbox" vmail
fi
chown -R vmail:mail $VIRTUAL_MAIL_DIR
chmod -R 750 $VIRTUAL_MAIL_DIR

# Backup de configuración
echo "💾 Creando backups..."
cp /etc/postfix/main.cf /etc/postfix/main.cf.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true

# Configurar Postfix
echo "⚙️ Configurando Postfix..."

cat > /etc/postfix/main.cf <<EOF
# Identificación del servidor
myhostname = $HOSTNAME
mydomain = $DOMAIN
myorigin = \$mydomain
inet_interfaces = all
inet_protocols = ipv4

# Virtual Mailboxes
virtual_mailbox_domains = hash:/etc/postfix/virtual_domains
virtual_mailbox_maps = hash:/etc/postfix/virtual_mailbox
virtual_alias_maps = hash:/etc/postfix/virtual
virtual_minimum_uid = 5000
virtual_uid_maps = static:5000
virtual_gid_maps = static:5000
virtual_mailbox_base = /var/mail/virtual

# Redes permitidas
mynetworks = 127.0.0.0/8 [::ffff:127.0.0.1]/104 [::1]/128

# Autenticación SASL
smtpd_sasl_type = dovecot
smtpd_sasl_path = private/auth
smtpd_sasl_auth_enable = yes
smtpd_sasl_security_options = noanonymous
smtpd_sasl_local_domain = \$myhostname

# Restricciones
smtpd_sender_restrictions = permit_mynetworks, permit_sasl_authenticated, reject_unknown_sender_domain
smtpd_recipient_restrictions = permit_mynetworks, permit_sasl_authenticated, reject_unauth_destination
smtpd_relay_restrictions = permit_mynetworks, permit_sasl_authenticated, reject_unauth_destination

# Permitir enviar desde cualquier dirección autenticada
smtpd_sender_login_maps = hash:/etc/postfix/virtual_mailbox

# TLS
smtpd_tls_cert_file = /etc/ssl/certs/ssl-cert-snakeoil.pem
smtpd_tls_key_file = /etc/ssl/private/ssl-cert-snakeoil.key
smtpd_use_tls = yes
smtpd_tls_auth_only = yes
smtpd_tls_security_level = may
EOF

# Configurar master.cf para submission
echo "⚙️ Configurando master.cf para puerto 587..."
if ! grep -q "^submission" /etc/postfix/master.cf; then
    cat >> /etc/postfix/master.cf <<'MASTEREOF'

submission inet n       -       y       -       -       smtpd
  -o syslog_name=postfix/submission
  -o smtpd_tls_security_level=encrypt
  -o smtpd_sasl_auth_enable=yes
  -o smtpd_tls_auth_only=yes
  -o smtpd_reject_unlisted_recipient=no
  -o smtpd_client_restrictions=$mua_client_restrictions
  -o smtpd_helo_restrictions=$mua_helo_restrictions
  -o smtpd_sender_restrictions=$mua_sender_restrictions
  -o smtpd_recipient_restrictions=permit_sasl_authenticated,reject
  -o milter_macro_daemon_name=ORIGINATING
MASTEREOF
fi

# Crear archivos virtuales
echo "📝 Creando archivos de configuración virtual..."
echo "$DOMAIN" > /etc/postfix/virtual_domains
touch /etc/postfix/virtual_mailbox
touch /etc/postfix/virtual

# Compilar mapas
postmap /etc/postfix/virtual_domains
postmap /etc/postfix/virtual_mailbox
postmap /etc/postfix/virtual

# Configurar Dovecot
echo "⚙️ Configurando Dovecot..."

# Mail location
if [ -f /etc/dovecot/conf.d/10-mail.conf ]; then
    sed -i 's|^mail_location =.*|mail_location = maildir:/var/mail/virtual/%d/%n|' /etc/dovecot/conf.d/10-mail.conf
fi

# Auth
if [ -f /etc/dovecot/conf.d/10-auth.conf ]; then
    sed -i 's/^disable_plaintext_auth =.*/disable_plaintext_auth = no/' /etc/dovecot/conf.d/10-auth.conf
    sed -i 's/^auth_mechanisms =.*/auth_mechanisms = plain login/' /etc/dovecot/conf.d/10-auth.conf
fi

# Master para Postfix
mkdir -p /etc/dovecot/conf.d
cat > /etc/dovecot/conf.d/10-master.conf <<'DOVECOTEOF'
service auth {
  unix_listener /var/spool/postfix/private/auth {
    mode = 0666
    user = postfix
    group = postfix
  }
}
DOVECOTEOF

# Crear directorio para auth socket
mkdir -p /var/spool/postfix/private
chown postfix:postfix /var/spool/postfix/private
chmod 750 /var/spool/postfix/private

# Reiniciar servicios
echo "🔄 Reiniciando servicios..."
systemctl restart postfix
systemctl restart dovecot
systemctl enable postfix
systemctl enable dovecot

# Obtener IP del servidor
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')

echo ""
echo "✅ Servidor SMTP configurado exitosamente!"
echo ""
echo "📋 Configuración para server/.env:"
echo "=================================="
echo "EMAIL_SMTP_HOST=$HOSTNAME"
echo "EMAIL_SMTP_PORT=587"
echo "EMAIL_SMTP_USER=admin@$DOMAIN"
echo "EMAIL_SMTP_PASSWORD=<tu_contraseña>"
echo ""
echo "VIRTUAL_MAIL_DIR=$VIRTUAL_MAIL_DIR"
echo "POSTFIX_VIRTUAL_FILE=/etc/postfix/virtual"
echo "POSTFIX_VIRTUAL_MAILBOX_FILE=/etc/postfix/virtual_mailbox"
echo ""
echo "📋 Registros DNS a agregar:"
echo "=========================="
echo "Tipo    Nombre              Valor"
echo "MX      @                   $HOSTNAME (prioridad 10)"
echo "A       mail                $SERVER_IP"
echo "TXT     @                   v=spf1 mx a:$HOSTNAME ~all"
echo ""
echo "📝 Para crear un usuario SMTP:"
echo "=============================="
echo "sudo ./create-smtp-user.sh email@$DOMAIN $DOMAIN contraseña"
echo ""
echo "🧪 Para probar el servidor:"
echo "==========================="
echo "echo 'Test' | mail -s 'Test' admin@$DOMAIN"
echo ""

