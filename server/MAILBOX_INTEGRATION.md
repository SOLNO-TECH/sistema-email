# 🔗 Integración Completa: Servidor SMTP Propio → Mailbox

Esta guía explica qué falta para que los correos recibidos en tu servidor SMTP propio aparezcan automáticamente en el mailbox de Xstar Mail.

## ✅ Lo que YA está conectado

1. **Envío de correos**: ✅ Funciona completamente
   - Puedes enviar desde Xstar Mail
   - Los correos se guardan en la BD automáticamente

2. **Sincronización manual**: ✅ Funciona
   - Al cargar el mailbox con `sync=true`, sincroniza correos
   - El botón de refresh sincroniza manualmente

3. **Sincronización automática**: ✅ Existe pero necesita configuración
   - Hay un servicio `EmailSyncService` que sincroniza cada 5 minutos
   - Necesita estar activado en las variables de entorno

## ⚠️ Lo que FALTA configurar

### 1. Variables de Entorno para IMAP

En `server/.env`, agrega estas variables:

```env
# IMAP para sincronización (debe apuntar a tu servidor SMTP propio)
IMAP_HOST=mail.tudominio.com
IMAP_PORT=993
IMAP_SECURE=true

# Activar sincronización automática
ENABLE_EMAIL_SYNC=true
EMAIL_SYNC_INTERVAL=5  # minutos

# Contraseña para sincronización (la misma que usas para SMTP)
EMAIL_SYNC_PASSWORD=tu_contraseña_smtp
```

### 2. Asegurar que la Sincronización Automática esté Activa

El servicio ya existe en `server/src/app.ts` y se activa automáticamente si `ENABLE_EMAIL_SYNC=true`.

### 3. Configurar Contraseñas Correctamente

**Problema actual**: Las contraseñas están hasheadas en la BD, pero IMAP necesita la contraseña en texto plano.

**Solución**: Guardar la contraseña SMTP en `smtpPassword` de la cuenta (ya se hace al crear usuarios).

### 4. Verificar que Dovecot esté Configurado Correctamente

Dovecot debe estar configurado para que IMAP funcione. Ejecuta:

```bash
sudo ./server/scripts/complete-email-setup.sh
```

## 🔄 Cómo Funciona la Sincronización

### Flujo Completo:

1. **Correo llega a Postfix** → Se almacena en `/var/mail/virtual/dominio/usuario/`

2. **Sincronización Automática** (cada 5 minutos):
   - `EmailSyncService` se conecta vía IMAP a Dovecot
   - Lee correos nuevos desde `/var/mail/virtual/`
   - Los guarda en la base de datos
   - Aparecen en el mailbox

3. **Sincronización Manual**:
   - Al cargar el mailbox con `sync=true`
   - Al hacer clic en el botón de refresh

## 📋 Checklist de Configuración

- [ ] Servidor SMTP configurado (`setup-smtp-server.sh`)
- [ ] Recepción configurada (`complete-email-setup.sh`)
- [ ] DNS configurado (MX, A, SPF)
- [ ] Variables IMAP en `.env`:
  - [ ] `IMAP_HOST=mail.tudominio.com`
  - [ ] `IMAP_PORT=993`
  - [ ] `IMAP_SECURE=true`
- [ ] Sincronización automática activada:
  - [ ] `ENABLE_EMAIL_SYNC=true`
  - [ ] `EMAIL_SYNC_INTERVAL=5`
  - [ ] `EMAIL_SYNC_PASSWORD=tu_contraseña`
- [ ] Usuarios SMTP creados con contraseñas guardadas
- [ ] Servidor reiniciado después de cambios

## 🧪 Probar que Todo Funciona

### Paso 1: Verificar que la Sincronización Automática está Activa

Al iniciar el servidor, deberías ver en los logs:

```
🔄 Iniciando sincronización automática cada 5 minutos
✅ Sincronización automática de correos activada (cada 5 minutos)
```

### Paso 2: Enviar un Correo de Prueba

Desde Gmail/Outlook, envía un correo a `admin@tudominio.com`

### Paso 3: Esperar Sincronización

Espera máximo 5 minutos (o haz clic en refresh en el mailbox)

### Paso 4: Verificar en el Mailbox

El correo debería aparecer en el mailbox de Xstar Mail

## 🔍 Verificar Logs

```bash
# Logs del servidor Node.js
tail -f server/logs/app.log  # o donde estén tus logs

# Logs de Postfix (correos recibidos)
sudo tail -f /var/log/mail.log

# Logs de Dovecot (acceso IMAP)
sudo tail -f /var/log/dovecot.log
```

## ⚙️ Configuración Avanzada

### Cambiar Intervalo de Sincronización

En `server/.env`:
```env
EMAIL_SYNC_INTERVAL=1  # Sincronizar cada 1 minuto (más frecuente)
```

### Sincronización en Tiempo Real (Opcional)

Para sincronización en tiempo real, podrías usar:
- **Inotify**: Monitorear cambios en `/var/mail/virtual/`
- **Webhook**: Postfix puede llamar a un endpoint cuando recibe correo
- **Polling más frecuente**: Reducir `EMAIL_SYNC_INTERVAL` a 1 minuto

## 🚨 Problemas Comunes

### Problema: Los correos no aparecen en el mailbox

**Solución:**
1. Verifica que `ENABLE_EMAIL_SYNC=true` en `.env`
2. Verifica que `EMAIL_SYNC_PASSWORD` esté configurada
3. Verifica que `IMAP_HOST` apunte a tu servidor
4. Revisa logs del servidor para errores de sincronización
5. Verifica que Dovecot esté corriendo: `sudo systemctl status dovecot`

### Problema: Error de autenticación IMAP

**Solución:**
1. Verifica que la contraseña en `EMAIL_SYNC_PASSWORD` sea correcta
2. Verifica que el usuario exista en Dovecot
3. Verifica permisos en `/var/mail/virtual/`

### Problema: Sincronización muy lenta

**Solución:**
1. Reduce `EMAIL_SYNC_INTERVAL` a 1-2 minutos
2. Usa sincronización manual (botón refresh) para pruebas inmediatas

## ✅ Resumen

**Para que TODO funcione automáticamente, solo necesitas:**

1. ✅ Configurar variables IMAP en `.env`
2. ✅ Activar sincronización automática (`ENABLE_EMAIL_SYNC=true`)
3. ✅ Configurar contraseña de sincronización (`EMAIL_SYNC_PASSWORD`)
4. ✅ Asegurar que los usuarios SMTP tengan contraseñas guardadas

**Con esto, los correos recibidos aparecerán automáticamente en el mailbox cada 5 minutos (o el intervalo que configures).**

