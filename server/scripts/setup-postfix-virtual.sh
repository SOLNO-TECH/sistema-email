#!/bin/bash

# Script para configurar Postfix con virtual mailboxes
# Permite crear usuarios SMTP automáticamente para cada dominio/correo

echo "🚀 Configurando Postfix con Virtual Mailboxes..."
echo ""

# Verificar si es root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Por favor ejecuta como root (sudo)"
    exit 1
fi

# Instalar Postfix y Dovecot
echo "📦 Instalando Postfix y Dovecot..."
apt update
apt install -y postfix dovecot-core dovecot-imapd dovecot-pop3d mailutils

# Crear directorio para correos virtuales
VIRTUAL_MAIL_DIR="/var/mail/virtual"
echo "📁 Creando directorio para correos virtuales: $VIRTUAL_MAIL_DIR"
mkdir -p $VIRTUAL_MAIL_DIR
chown -R postfix:postfix $VIRTUAL_MAIL_DIR
chmod -R 750 $VIRTUAL_MAIL_DIR

# Crear usuario virtual
if ! id "vmail" &>/dev/null; then
    echo "👤 Creando usuario virtual 'vmail'..."
    useradd -r -u 5000 -g mail -d $VIRTUAL_MAIL_DIR -s /sbin/nologin -c "Virtual Mailbox" vmail
    chown -R vmail:mail $VIRTUAL_MAIL_DIR
fi

# Configurar Postfix
echo "⚙️ Configurando Postfix..."

# Backup
cp /etc/postfix/main.cf /etc/postfix/main.cf.backup

# Configuración principal
cat > /etc/postfix/main.cf <<'EOF'
# Configuración básica
myhostname = mail.example.com
mydomain = example.com
myorigin = $mydomain
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

# Directorio de correos
virtual_mailbox_limit = 0
virtual_mailbox_lock = fcntl, dotlock

# Redes permitidas
mynetworks = 127.0.0.0/8 [::ffff:127.0.0.1]/104 [::1]/128

# Autenticación SASL
smtpd_sasl_type = dovecot
smtpd_sasl_path = private/auth
smtpd_sasl_auth_enable = yes
smtpd_sasl_security_options = noanonymous
smtpd_sasl_local_domain = $myhostname

# Restricciones
smtpd_sender_restrictions = permit_mynetworks, permit_sasl_authenticated, reject_unknown_sender_domain
smtpd_recipient_restrictions = permit_mynetworks, permit_sasl_authenticated, reject_unauth_destination
smtpd_relay_restrictions = permit_mynetworks, permit_sasl_authenticated, reject_unauth_destination

# TLS
smtpd_tls_cert_file = /etc/ssl/certs/ssl-cert-snakeoil.pem
smtpd_tls_key_file = /etc/ssl/private/ssl-cert-snakeoil.key
smtpd_use_tls = yes
smtpd_tls_auth_only = yes
smtpd_tls_security_level = may

# Permitir enviar desde cualquier dirección del dominio autenticado
smtpd_sender_login_maps = hash:/etc/postfix/virtual_mailbox
EOF

# Crear archivos virtuales vacíos
touch /etc/postfix/virtual_domains
touch /etc/postfix/virtual_mailbox
touch /etc/postfix/virtual

# Compilar mapas
postmap /etc/postfix/virtual_domains
postmap /etc/postfix/virtual_mailbox
postmap /etc/postfix/virtual

# Configurar Dovecot
echo "⚙️ Configurando Dovecot..."

cat > /etc/dovecot/conf.d/10-mail.conf <<'EOF'
mail_location = maildir:/var/mail/virtual/%d/%n
namespace inbox {
  inbox = yes
}
EOF

cat > /etc/dovecot/conf.d/10-auth.conf <<'EOF'
disable_plaintext_auth = no
auth_mechanisms = plain login
!include auth-system.conf.ext
EOF

# Crear script para crear usuarios SMTP
echo "📝 Creando script para crear usuarios SMTP..."

cat > /usr/local/bin/create-smtp-user.sh <<'SCRIPT'
#!/bin/bash
# Script para crear usuario SMTP automáticamente
# Uso: create-smtp-user.sh email@dominio.com dominio.com contraseña

EMAIL=$1
DOMAIN=$2
PASSWORD=$3

if [ -z "$EMAIL" ] || [ -z "$DOMAIN" ] || [ -z "$PASSWORD" ]; then
    echo "Uso: create-smtp-user.sh email@dominio.com dominio.com contraseña"
    exit 1
fi

VIRTUAL_MAIL_DIR="/var/mail/virtual"
USERNAME=$(echo $EMAIL | cut -d'@' -f1)

# Crear directorio del dominio
mkdir -p $VIRTUAL_MAIL_DIR/$DOMAIN
chown -R vmail:mail $VIRTUAL_MAIL_DIR/$DOMAIN

# Crear directorio del usuario
mkdir -p $VIRTUAL_MAIL_DIR/$DOMAIN/$USERNAME
chown -R vmail:mail $VIRTUAL_MAIL_DIR/$DOMAIN/$USERNAME
chmod -R 750 $VIRTUAL_MAIL_DIR/$DOMAIN/$USERNAME

# Agregar dominio a virtual_domains si no existe
if ! grep -q "^$DOMAIN" /etc/postfix/virtual_domains; then
    echo "$DOMAIN" >> /etc/postfix/virtual_domains
    postmap /etc/postfix/virtual_domains
fi

# Agregar usuario a virtual_mailbox
if ! grep -q "^$EMAIL" /etc/postfix/virtual_mailbox; then
    echo "$EMAIL $DOMAIN/$USERNAME/" >> /etc/postfix/virtual_mailbox
    postmap /etc/postfix/virtual_mailbox
fi

# Agregar alias
if ! grep -q "^$EMAIL" /etc/postfix/virtual; then
    echo "$EMAIL $EMAIL" >> /etc/postfix/virtual
    postmap /etc/postfix/virtual
fi

# Crear usuario en Dovecot (usando contraseña)
echo "$EMAIL:{PLAIN}$PASSWORD:5000:5000::/var/mail/virtual/$DOMAIN/$USERNAME::" >> /etc/dovecot/users

# Reiniciar servicios
systemctl reload postfix
systemctl reload dovecot

echo "✅ Usuario SMTP creado: $EMAIL"
SCRIPT

chmod +x /usr/local/bin/create-smtp-user.sh

# Crear script para eliminar usuarios SMTP
cat > /usr/local/bin/delete-smtp-user.sh <<'SCRIPT'
#!/bin/bash
# Script para eliminar usuario SMTP
# Uso: delete-smtp-user.sh email@dominio.com

EMAIL=$1

if [ -z "$EMAIL" ]; then
    echo "Uso: delete-smtp-user.sh email@dominio.com"
    exit 1
fi

DOMAIN=$(echo $EMAIL | cut -d'@' -f2)
USERNAME=$(echo $EMAIL | cut -d'@' -f1)
VIRTUAL_MAIL_DIR="/var/mail/virtual"

# Eliminar de virtual_mailbox
sed -i "/^$EMAIL/d" /etc/postfix/virtual_mailbox
postmap /etc/postfix/virtual_mailbox

# Eliminar de virtual
sed -i "/^$EMAIL/d" /etc/postfix/virtual
postmap /etc/postfix/virtual

# Eliminar de Dovecot
sed -i "/^$EMAIL/d" /etc/dovecot/users

# Eliminar directorio (opcional - comentar si quieres conservar correos)
# rm -rf $VIRTUAL_MAIL_DIR/$DOMAIN/$USERNAME

# Reiniciar servicios
systemctl reload postfix
systemctl reload dovecot

echo "✅ Usuario SMTP eliminado: $EMAIL"
SCRIPT

chmod +x /usr/local/bin/delete-smtp-user.sh

# Reiniciar servicios
echo "🔄 Reiniciando servicios..."
systemctl restart postfix
systemctl restart dovecot
systemctl enable postfix
systemctl enable dovecot

echo ""
echo "✅ Postfix configurado con Virtual Mailboxes!"
echo ""
echo "📋 Para crear un usuario SMTP:"
echo "  sudo /usr/local/bin/create-smtp-user.sh email@dominio.com dominio.com contraseña"
echo ""
echo "📋 Para eliminar un usuario SMTP:"
echo "  sudo /usr/local/bin/delete-smtp-user.sh email@dominio.com"
echo ""
echo "📋 Configuración para server/.env:"
echo "  EMAIL_SMTP_HOST=localhost (o IP del servidor)"
echo "  EMAIL_SMTP_PORT=587"
echo "  EMAIL_SMTP_USER=<email-del-usuario>"
echo "  EMAIL_SMTP_PASSWORD=<contraseña-del-usuario>"
echo ""

