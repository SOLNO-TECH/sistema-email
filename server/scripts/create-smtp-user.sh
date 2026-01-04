#!/bin/bash

# Script para crear usuarios SMTP automáticamente
# Uso: sudo ./create-smtp-user.sh email@dominio.com dominio.com contraseña

set -e

if [ "$EUID" -ne 0 ]; then 
    echo "❌ Por favor ejecuta como root (sudo)"
    exit 1
fi

EMAIL=$1
DOMAIN=$2
PASSWORD=$3

if [ -z "$EMAIL" ] || [ -z "$DOMAIN" ] || [ -z "$PASSWORD" ]; then
    echo "Uso: create-smtp-user.sh email@dominio.com dominio.com contraseña"
    echo ""
    echo "Ejemplo:"
    echo "  sudo ./create-smtp-user.sh admin@fylomail.es fylomail.es mi_contraseña"
    exit 1
fi

# Validar formato de email
if [[ ! "$EMAIL" =~ ^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$ ]]; then
    echo "❌ Formato de email inválido: $EMAIL"
    exit 1
fi

USERNAME=$(echo $EMAIL | cut -d'@' -f1)
VIRTUAL_MAIL_DIR="/var/mail/virtual"
POSTFIX_VIRTUAL_FILE="/etc/postfix/virtual"
POSTFIX_VIRTUAL_MAILBOX_FILE="/etc/postfix/virtual_mailbox"

echo "📧 Creando usuario SMTP: $EMAIL"
echo ""

# Verificar que el dominio existe en virtual_domains
if ! grep -q "^$DOMAIN$" /etc/postfix/virtual_domains 2>/dev/null; then
    echo "⚠️  Dominio $DOMAIN no encontrado en virtual_domains. Agregándolo..."
    echo "$DOMAIN" >> /etc/postfix/virtual_domains
    postmap /etc/postfix/virtual_domains
fi

# Crear directorio del dominio
DOMAIN_DIR="$VIRTUAL_MAIL_DIR/$DOMAIN"
mkdir -p "$DOMAIN_DIR"
chown -R vmail:mail "$DOMAIN_DIR"
chmod -R 750 "$DOMAIN_DIR"

# Crear directorio del usuario
USER_DIR="$DOMAIN_DIR/$USERNAME"
if [ -d "$USER_DIR" ]; then
    echo "⚠️  El directorio del usuario ya existe: $USER_DIR"
else
    mkdir -p "$USER_DIR"
    chown -R vmail:mail "$USER_DIR"
    chmod -R 750 "$USER_DIR"
    echo "✅ Directorio creado: $USER_DIR"
fi

# Agregar a virtual_mailbox si no existe
if ! grep -q "^$EMAIL" "$POSTFIX_VIRTUAL_MAILBOX_FILE" 2>/dev/null; then
    echo "$EMAIL $DOMAIN/$USERNAME/" >> "$POSTFIX_VIRTUAL_MAILBOX_FILE"
    echo "✅ Agregado a virtual_mailbox"
else
    echo "⚠️  El usuario ya existe en virtual_mailbox"
fi

# Agregar a virtual (alias) si no existe
if ! grep -q "^$EMAIL" "$POSTFIX_VIRTUAL_FILE" 2>/dev/null; then
    echo "$EMAIL $EMAIL" >> "$POSTFIX_VIRTUAL_FILE"
    echo "✅ Agregado a virtual (alias)"
else
    echo "⚠️  El usuario ya existe en virtual"
fi

# Recompilar mapas de Postfix
postmap "$POSTFIX_VIRTUAL_MAILBOX_FILE"
postmap "$POSTFIX_VIRTUAL_FILE"

# Reiniciar Postfix
systemctl reload postfix

# 🔐 CONFIGURAR DOVECOT PARA AUTENTICACIÓN
echo "🔐 Configurando Dovecot para IMAP/POP3..."

# Crear hash de contraseña para Dovecot
PASSWORD_HASH=$(echo "$PASSWORD" | doveadm pw -s SHA512-CRYPT)

# Crear archivo de usuarios de Dovecot si no existe
DOVECOT_USERS_FILE="/etc/dovecot/users"
DOVECOT_PASSWD_FILE="/etc/dovecot/passwd"

# Crear archivos si no existen
touch "$DOVECOT_USERS_FILE"
touch "$DOVECOT_PASSWD_FILE"

# Agregar entrada en formato userdb
USERDB_ENTRY="$USERNAME:$PASSWORD_HASH:5000:5000::/var/mail/virtual/$DOMAIN/$USERNAME::"
if ! grep -q "^$USERNAME:" "$DOVECOT_USERS_FILE" 2>/dev/null; then
    echo "$USERDB_ENTRY" >> "$DOVECOT_USERS_FILE"
    echo "✅ Agregado a Dovecot users"
else
    echo "⚠️  El usuario ya existe en Dovecot users"
fi

# Agregar entrada en formato passwd
PASSWD_ENTRY="$EMAIL:$PASSWORD_HASH:5000:5000::/var/mail/virtual/$DOMAIN/$USERNAME::"
if ! grep -q "^$EMAIL:" "$DOVECOT_PASSWD_FILE" 2>/dev/null; then
    echo "$PASSWD_ENTRY" >> "$DOVECOT_PASSWD_FILE"
    echo "✅ Agregado a Dovecot passwd"
else
    echo "⚠️  El usuario ya existe en Dovecot passwd"
fi

# Reiniciar Dovecot
systemctl reload dovecot 2>/dev/null || systemctl restart dovecot 2>/dev/null

echo ""
echo "✅ Usuario SMTP y Dovecot creado exitosamente: $EMAIL"
echo ""
echo "📋 Configuración para la cuenta:"
echo "  SMTP Host: $(hostname -f 2>/dev/null || echo 'mail.$DOMAIN')"
echo "  SMTP Port: 587"
echo "  SMTP User: $EMAIL"
echo "  SMTP Password: $PASSWORD"
echo ""
echo "  IMAP Host: $(hostname -f 2>/dev/null || echo 'mail.$DOMAIN')"
echo "  IMAP Port: 993"
echo "  IMAP User: $EMAIL"
echo "  IMAP Password: $PASSWORD"
echo ""
echo "✅ El usuario puede enviar y recibir correos ahora."

