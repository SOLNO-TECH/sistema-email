#!/bin/bash

# Script hook para Postfix que procesa correos recibidos y los guarda en la BD
# Este script se ejecuta cuando Postfix recibe un correo
# Configurar en /etc/postfix/master.cf como transport

# Variables de entorno (configurar en .env del servidor)
DB_HOST="${DB_HOST:-localhost}"
DB_USER="${DB_USER:-root}"
DB_PASS="${DB_PASSWORD:-}"
DB_NAME="${DB_NAME:-sistema_email}"
NODE_APP_DIR="${NODE_APP_DIR:-/ruta/al/proyecto/server}"

# Email recibido (Postfix pasa el email como entrada estándar)
EMAIL_FILE="${1:-/dev/stdin}"

# Parsear el email usando mailparser o similar
# Por ahora, solo logueamos - la sincronización IMAP se encarga de esto

echo "📧 Correo recibido procesado: $(date)" >> /var/log/postfix-to-db.log

# La sincronización IMAP automática se encargará de leer estos correos
# desde /var/mail/virtual/ y guardarlos en la BD

exit 0

