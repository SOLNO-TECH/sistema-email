# 📧 Configuración Completa: Envío y Recepción de Correos

Esta guía completa te permitirá tener un servidor de correo **completamente funcional** que puede:
- ✅ **Enviar correos** desde Xstar Mail
- ✅ **Recibir correos** de cualquier remitente externo
- ✅ **Usar clientes externos** (Outlook, Thunderbird, Gmail, etc.) para enviar/recibir

## 🎯 Lo que ya tienes configurado

Con el script `setup-smtp-server.sh` ya tienes:
- ✅ Postfix configurado para **enviar** correos
- ✅ Dovecot instalado (pero necesita más configuración)
- ✅ Virtual mailboxes configurados

## 🔧 Lo que falta para recepción completa

Para que puedas **recibir correos** de cualquier remitente externo, necesitas:

### 1. Configurar Dovecot completamente para IMAP

Dovecot ya está instalado, pero necesita configuración adicional para recibir correos.

### 2. Configurar Postfix para recibir correos entrantes

Postfix necesita saber dónde almacenar los correos recibidos.

### 3. Configurar DNS correctamente

Los registros MX deben apuntar a tu servidor.

## 📝 Configuración Completa Paso a Paso

### Paso 1: Completar Configuración de Dovecot

Ejecuta este script después de `setup-smtp-server.sh`:

```bash
sudo nano /etc/dovecot/conf.d/10-mail.conf
```

Asegúrate de que tenga:

```conf
mail_location = maildir:/var/mail/virtual/%d/%n
mail_privileged_group = mail
first_valid_uid = 5000
last_valid_uid = 5000
```

### Paso 2: Configurar Autenticación de Dovecot

```bash
sudo nano /etc/dovecot/conf.d/10-auth.conf
```

Configura:

```conf
disable_plaintext_auth = no
auth_mechanisms = plain login
auth_username_format = %n
!include auth-system.conf.ext
```

### Paso 3: Configurar Postfix para Almacenar Correos Recibidos

Edita `/etc/postfix/main.cf` y asegúrate de tener:

```conf
# Virtual mailboxes (ya configurado)
virtual_mailbox_domains = hash:/etc/postfix/virtual_domains
virtual_mailbox_maps = hash:/etc/postfix/virtual_mailbox
virtual_alias_maps = hash:/etc/postfix/virtual
virtual_mailbox_base = /var/mail/virtual

# Transport para entregar correos recibidos
virtual_transport = virtual
```

### Paso 4: Configurar Transport Virtual

Crea o edita `/etc/postfix/master.cf` y asegúrate de tener:

```
virtual      unix  -       n       n       -       -       virtual
```

### Paso 5: Configurar DNS (CRÍTICO)

Para que puedas **recibir correos de cualquier remitente**, necesitas estos registros DNS:

```
Tipo    Nombre              Valor                    Prioridad/TTL
MX      @                    mail.tudominio.com      10
A       mail                 TU_IP_DEL_SERVIDOR      3600
TXT     @                    v=spf1 mx a:mail.tudominio.com ~all
TXT     _dmarc               v=DMARC1; p=none; rua=mailto:admin@tudominio.com
```

**Importante**: Sin el registro MX, los correos externos NO llegarán a tu servidor.

### Paso 6: Abrir Puertos en el Firewall

```bash
# Puerto 25 (SMTP - recepción de correos)
sudo ufw allow 25/tcp

# Puerto 587 (SMTP Submission - envío)
sudo ufw allow 587/tcp

# Puerto 993 (IMAPS - recepción con cliente)
sudo ufw allow 993/tcp

# Puerto 995 (POP3S - recepción con cliente)
sudo ufw allow 995/tcp
```

### Paso 7: Verificar que Postfix Escucha en Todos los Interfaces

En `/etc/postfix/main.cf`:

```conf
inet_interfaces = all
```

## 🧪 Probar Recepción de Correos

### Prueba 1: Enviar desde Gmail/Outlook a tu correo

1. Desde cualquier cuenta de Gmail, Outlook, etc.
2. Envía un correo a: `admin@tudominio.com`
3. El correo debería llegar a: `/var/mail/virtual/tudominio.com/admin/new/`

### Prueba 2: Verificar con Telnet

```bash
# Conectar al servidor
telnet mail.tudominio.com 25

# Comandos:
EHLO test.com
MAIL FROM: test@gmail.com
RCPT TO: admin@tudominio.com
DATA
Subject: Test
Este es un correo de prueba
.
QUIT
```

### Prueba 3: Verificar Logs

```bash
# Ver logs de Postfix
sudo tail -f /var/log/mail.log

# Buscar correos recibidos
sudo grep "admin@tudominio.com" /var/log/mail.log
```

## 📱 Usar con Clientes Externos (Outlook, Thunderbird, Gmail)

### Configuración para Outlook/Thunderbird

**Servidor de correo entrante (IMAP):**
- Servidor: `mail.tudominio.com`
- Puerto: `993`
- Seguridad: SSL/TLS
- Usuario: `admin@tudominio.com`
- Contraseña: `tu_contraseña`

**Servidor de correo saliente (SMTP):**
- Servidor: `mail.tudominio.com`
- Puerto: `587`
- Seguridad: STARTTLS
- Autenticación: Sí
- Usuario: `admin@tudominio.com`
- Contraseña: `tu_contraseña`

### Configuración para Gmail (Importar correo)

En Gmail, ve a Configuración → Cuentas e importar → Agregar cuenta de correo:

- Email: `admin@tudominio.com`
- Contraseña: `tu_contraseña`
- Servidor POP: `mail.tudominio.com`
- Puerto: `995`
- SSL: Sí

## ⚠️ Problemas Comunes y Soluciones

### Problema: No recibo correos externos

**Solución:**
1. Verifica registros DNS (especialmente MX)
2. Verifica que el puerto 25 esté abierto: `sudo netstat -tlnp | grep 25`
3. Verifica logs: `sudo tail -f /var/log/mail.log`
4. Verifica que Postfix esté escuchando: `sudo systemctl status postfix`

### Problema: Correos van a spam

**Solución:**
1. Configura SPF correctamente
2. Configura DKIM (avanzado)
3. Configura DMARC
4. Usa una IP limpia (no en listas negras)

### Problema: No puedo conectar desde cliente externo

**Solución:**
1. Verifica que Dovecot esté corriendo: `sudo systemctl status dovecot`
2. Verifica puertos abiertos: `sudo ufw status`
3. Verifica certificados SSL
4. Verifica usuario y contraseña

## ✅ Checklist de Funcionalidad Completa

- [ ] Postfix configurado y corriendo
- [ ] Dovecot configurado y corriendo
- [ ] DNS configurado (MX, A, SPF)
- [ ] Puertos abiertos (25, 587, 993, 995)
- [ ] Usuarios SMTP creados
- [ ] Puedo enviar correos desde Xstar Mail
- [ ] Puedo recibir correos de Gmail/Outlook
- [ ] Puedo usar Outlook/Thunderbird para enviar/recibir
- [ ] Correos no van a spam

## 🚀 Script de Verificación

Crea este script para verificar que todo funciona:

```bash
#!/bin/bash
# verify-email-server.sh

echo "🔍 Verificando servidor de correo..."
echo ""

# Verificar servicios
echo "📦 Servicios:"
systemctl is-active postfix > /dev/null && echo "✅ Postfix: Activo" || echo "❌ Postfix: Inactivo"
systemctl is-active dovecot > /dev/null && echo "✅ Dovecot: Activo" || echo "❌ Dovecot: Inactivo"

# Verificar puertos
echo ""
echo "🔌 Puertos:"
netstat -tlnp | grep :25 > /dev/null && echo "✅ Puerto 25 (SMTP): Abierto" || echo "❌ Puerto 25: Cerrado"
netstat -tlnp | grep :587 > /dev/null && echo "✅ Puerto 587 (Submission): Abierto" || echo "❌ Puerto 587: Cerrado"
netstat -tlnp | grep :993 > /dev/null && echo "✅ Puerto 993 (IMAPS): Abierto" || echo "❌ Puerto 993: Cerrado"

# Verificar DNS
echo ""
echo "🌐 DNS:"
DOMAIN=$(hostname -d 2>/dev/null || echo "tudominio.com")
dig +short MX $DOMAIN | head -1 > /dev/null && echo "✅ Registro MX: Configurado" || echo "❌ Registro MX: No encontrado"

echo ""
echo "✅ Verificación completa"
```

## 📚 Resumen

**Para ENVIAR correos:**
- ✅ Ya está configurado con Postfix
- ✅ Funciona desde Xstar Mail
- ✅ Funciona desde clientes externos (con autenticación)

**Para RECIBIR correos:**
- ✅ Postfix recibe correos en puerto 25
- ✅ Almacena en `/var/mail/virtual/`
- ✅ Dovecot permite acceder vía IMAP
- ⚠️ **Requiere DNS configurado correctamente**

**Para usar clientes externos:**
- ✅ IMAP: `mail.tudominio.com:993` (SSL)
- ✅ SMTP: `mail.tudominio.com:587` (STARTTLS)
- ✅ Usuario: `email@tudominio.com`
- ✅ Contraseña: la que configuraste

---

**Conclusión**: Con la configuración completa, tus correos funcionarán como cualquier servicio de correo profesional (Gmail, Outlook, etc.), permitiendo enviar y recibir desde cualquier lugar.

