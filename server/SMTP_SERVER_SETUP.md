# 🚀 Guía Completa: Configurar Tu Propio Servidor SMTP

Esta guía te ayudará a configurar un servidor SMTP propio usando Postfix, permitiéndote enviar correos desde cualquier dirección de tu dominio sin depender de servicios externos.

## 📋 Requisitos Previos

- Servidor Linux (Ubuntu/Debian recomendado)
- Acceso root o sudo
- Dominio configurado y apuntando a tu servidor
- Puertos abiertos: 25 (SMTP), 587 (SMTP Submission), 993 (IMAP), 465 (SMTPS)

## 🔧 Paso 1: Instalar Postfix y Dovecot

```bash
sudo apt update
sudo apt install -y postfix dovecot-core dovecot-imapd dovecot-pop3d mailutils
```

Durante la instalación de Postfix, selecciona:
- **Internet Site**
- Ingresa tu dominio (ej: `fylomail.es`)

## 📝 Paso 2: Configurar Postfix

### 2.1 Configuración Principal

Edita `/etc/postfix/main.cf`:

```bash
sudo nano /etc/postfix/main.cf
```

Agrega o modifica las siguientes líneas:

```conf
# Identificación del servidor
myhostname = mail.tudominio.com
mydomain = tudominio.com
myorigin = $mydomain
inet_interfaces = all
inet_protocols = ipv4

# Virtual Mailboxes (para múltiples dominios)
virtual_mailbox_domains = hash:/etc/postfix/virtual_domains
virtual_mailbox_maps = hash:/etc/postfix/virtual_mailbox
virtual_alias_maps = hash:/etc/postfix/virtual
virtual_minimum_uid = 5000
virtual_uid_maps = static:5000
virtual_gid_maps = static:5000
virtual_mailbox_base = /var/mail/virtual

# Redes permitidas (localhost)
mynetworks = 127.0.0.0/8 [::ffff:127.0.0.1]/104 [::1]/128

# Autenticación SASL (Dovecot)
smtpd_sasl_type = dovecot
smtpd_sasl_path = private/auth
smtpd_sasl_auth_enable = yes
smtpd_sasl_security_options = noanonymous
smtpd_sasl_local_domain = $myhostname

# Restricciones de envío
smtpd_sender_restrictions = permit_mynetworks, permit_sasl_authenticated, reject_unknown_sender_domain
smtpd_recipient_restrictions = permit_mynetworks, permit_sasl_authenticated, reject_unauth_destination
smtpd_relay_restrictions = permit_mynetworks, permit_sasl_authenticated, reject_unauth_destination

# Permitir enviar desde cualquier dirección autenticada
smtpd_sender_login_maps = hash:/etc/postfix/virtual_mailbox

# TLS/SSL
smtpd_tls_cert_file = /etc/ssl/certs/ssl-cert-snakeoil.pem
smtpd_tls_key_file = /etc/ssl/private/ssl-cert-snakeoil.key
smtpd_use_tls = yes
smtpd_tls_auth_only = yes
smtpd_tls_security_level = may

# Submission (puerto 587)
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
```

### 2.2 Configurar Master.cf

Edita `/etc/postfix/master.cf` y descomenta la línea de submission:

```bash
sudo nano /etc/postfix/master.cf
```

Asegúrate de que estas líneas estén descomentadas:

```
submission inet n       -       y       -       -       smtpd
  -o syslog_name=postfix/submission
  -o smtpd_tls_security_level=encrypt
  -o smtpd_sasl_auth_enable=yes
  -o smtpd_tls_auth_only=yes
```

## 📁 Paso 3: Configurar Virtual Mailboxes

### 3.1 Crear Directorio para Correos

```bash
sudo mkdir -p /var/mail/virtual
sudo chown -R vmail:mail /var/mail/virtual
sudo chmod -R 750 /var/mail/virtual
```

### 3.2 Crear Usuario Virtual

```bash
sudo useradd -r -u 5000 -g mail -d /var/mail/virtual -s /sbin/nologin -c "Virtual Mailbox" vmail
```

### 3.3 Configurar Archivos Virtuales

Crea los archivos de configuración:

```bash
# Dominios virtuales
sudo touch /etc/postfix/virtual_domains
echo "tudominio.com" | sudo tee -a /etc/postfix/virtual_domains

# Mailboxes virtuales (formato: email@dominio.com dominio/usuario/)
sudo touch /etc/postfix/virtual_mailbox
echo "admin@tudominio.com tudominio.com/admin/" | sudo tee -a /etc/postfix/virtual_mailbox

# Alias virtuales
sudo touch /etc/postfix/virtual
echo "admin@tudominio.com admin@tudominio.com" | sudo tee -a /etc/postfix/virtual
```

Compila los mapas:

```bash
sudo postmap /etc/postfix/virtual_domains
sudo postmap /etc/postfix/virtual_mailbox
sudo postmap /etc/postfix/virtual
```

## 🔐 Paso 4: Configurar Dovecot para Autenticación

### 4.1 Configurar Mail Location

Edita `/etc/dovecot/conf.d/10-mail.conf`:

```bash
sudo nano /etc/dovecot/conf.d/10-mail.conf
```

Asegúrate de que tenga:

```conf
mail_location = maildir:/var/mail/virtual/%d/%n
```

### 4.2 Configurar Autenticación

Edita `/etc/dovecot/conf.d/10-auth.conf`:

```bash
sudo nano /etc/dovecot/conf.d/10-auth.conf
```

Modifica:

```conf
disable_plaintext_auth = no
auth_mechanisms = plain login
!include auth-system.conf.ext
```

### 4.3 Configurar Master para Postfix

Crea `/etc/dovecot/conf.d/10-master.conf`:

```bash
sudo nano /etc/dovecot/conf.d/10-master.conf
```

Agrega:

```conf
service auth {
  unix_listener /var/spool/postfix/private/auth {
    mode = 0666
    user = postfix
    group = postfix
  }
}
```

## 🔑 Paso 5: Crear Usuarios SMTP

Para cada cuenta de correo que quieras crear:

```bash
# Crear directorio del usuario
sudo mkdir -p /var/mail/virtual/tudominio.com/admin
sudo chown -R vmail:mail /var/mail/virtual/tudominio.com/admin

# Agregar a virtual_mailbox
echo "admin@tudominio.com tudominio.com/admin/" | sudo tee -a /etc/postfix/virtual_mailbox

# Agregar a virtual (alias)
echo "admin@tudominio.com admin@tudominio.com" | sudo tee -a /etc/postfix/virtual

# Recompilar
sudo postmap /etc/postfix/virtual_mailbox
sudo postmap /etc/postfix/virtual

# Reiniciar servicios
sudo systemctl reload postfix
sudo systemctl reload dovecot
```

## 🌐 Paso 6: Configurar DNS

Agrega estos registros DNS en tu proveedor de dominio:

```
Tipo    Nombre              Valor                    Prioridad
MX      @                    mail.tudominio.com      10
A       mail                 TU_IP_DEL_SERVIDOR
TXT     @                    v=spf1 mx a:mail.tudominio.com ~all
TXT     _dmarc               v=DMARC1; p=none; rua=mailto:admin@tudominio.com
```

## ⚙️ Paso 7: Configurar Variables de Entorno

En `server/.env`, agrega:

```env
# Servidor SMTP Propio
EMAIL_SMTP_HOST=mail.tudominio.com
EMAIL_SMTP_PORT=587
EMAIL_SMTP_USER=admin@tudominio.com
EMAIL_SMTP_PASSWORD=tu_contraseña

# Directorios para creación automática de usuarios
VIRTUAL_MAIL_DIR=/var/mail/virtual
POSTFIX_VIRTUAL_FILE=/etc/postfix/virtual
POSTFIX_VIRTUAL_MAILBOX_FILE=/etc/postfix/virtual_mailbox
```

## 🧪 Paso 8: Probar el Servidor

### 8.1 Probar Envío Local

```bash
echo "Test email" | mail -s "Test Subject" admin@tudominio.com
```

### 8.2 Probar con Telnet

```bash
telnet localhost 25
EHLO localhost
MAIL FROM: admin@tudominio.com
RCPT TO: admin@tudominio.com
DATA
Subject: Test
Test message
.
QUIT
```

### 8.3 Probar Autenticación

```bash
openssl s_client -connect mail.tudominio.com:587 -starttls smtp
```

## 🔒 Paso 9: Configurar Certificados SSL (Opcional pero Recomendado)

Para producción, usa Let's Encrypt:

```bash
sudo apt install certbot
sudo certbot certonly --standalone -d mail.tudominio.com
```

Luego actualiza `/etc/postfix/main.cf`:

```conf
smtpd_tls_cert_file = /etc/letsencrypt/live/mail.tudominio.com/fullchain.pem
smtpd_tls_key_file = /etc/letsencrypt/live/mail.tudominio.com/privkey.pem
```

## 📊 Paso 10: Monitoreo y Logs

Ver logs de Postfix:

```bash
sudo tail -f /var/log/mail.log
```

Ver logs de Dovecot:

```bash
sudo tail -f /var/log/dovecot.log
```

## 🚨 Solución de Problemas

### Error: "Relay access denied"
- Verifica que `mynetworks` incluya tu IP
- Verifica que la autenticación SASL esté funcionando

### Error: "Authentication failed"
- Verifica que Dovecot esté corriendo: `sudo systemctl status dovecot`
- Verifica permisos en `/var/spool/postfix/private/auth`

### Correos no se reciben
- Verifica registros DNS (MX, A)
- Verifica que el puerto 25 esté abierto
- Revisa logs: `sudo tail -f /var/log/mail.log`

## 📚 Recursos Adicionales

- [Documentación oficial de Postfix](http://www.postfix.org/documentation.html)
- [Documentación oficial de Dovecot](https://doc.dovecot.org/)
- [SPF Record Generator](https://www.spfrecord.com/)

## ✅ Checklist Final

- [ ] Postfix instalado y configurado
- [ ] Dovecot instalado y configurado
- [ ] Directorios virtuales creados
- [ ] Usuarios SMTP creados
- [ ] DNS configurado (MX, A, SPF)
- [ ] Variables de entorno configuradas
- [ ] Servicios reiniciados
- [ ] Pruebas de envío exitosas
- [ ] Certificados SSL configurados (opcional)

---

**Nota**: Esta configuración es para desarrollo/pruebas. Para producción, considera:
- Firewall configurado
- Certificados SSL válidos
- Monitoreo y alertas
- Backups regulares
- Configuración de DKIM y DMARC completos

