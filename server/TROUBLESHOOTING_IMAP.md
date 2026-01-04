# 🔧 Solución de Problemas: Error "Invalid credentials" en IMAP

## ❌ Error Actual

```
Error recibiendo correos: Error: Invalid credentials (Failure)
⚠️ Error sincronizando correos para admin@xstarmail.es: Invalid credentials (Failure)
```

## 🔍 Causas Posibles

### 1. Contraseña SMTP no guardada

El sistema necesita la contraseña en texto plano para conectarse a IMAP, pero puede que no esté guardada.

**Solución:**
- Verifica que al crear la cuenta SMTP, la contraseña se guarde en `smtpPassword`
- O configura `EMAIL_SYNC_PASSWORD` en `.env`

### 2. Usuario no existe en Dovecot

El usuario debe existir tanto en Postfix como en Dovecot.

**Solución:**
```bash
# Verificar que el usuario existe
sudo doveadm auth test admin@xstarmail.es
# Debería pedirte la contraseña y autenticar correctamente
```

### 3. Host IMAP incorrecto

El sistema está intentando conectarse a un servidor IMAP que no existe o no es accesible.

**Solución:**
- Configura `IMAP_HOST=localhost` en `.env` si el servidor está en la misma máquina
- O `IMAP_HOST=mail.tudominio.com` si es remoto

### 4. Dovecot no está corriendo

**Solución:**
```bash
sudo systemctl status dovecot
sudo systemctl start dovecot
sudo systemctl enable dovecot
```

## ✅ Solución Paso a Paso

### Paso 1: Verificar que Dovecot esté corriendo

```bash
sudo systemctl status dovecot
```

Si no está corriendo:
```bash
sudo systemctl start dovecot
sudo systemctl enable dovecot
```

### Paso 2: Verificar que el usuario existe en Dovecot

```bash
# Probar autenticación manual
sudo doveadm auth test admin@xstarmail.es
# Ingresa la contraseña cuando te la pida
```

Si falla, el usuario no existe. Crea el usuario:

```bash
sudo ./server/scripts/create-smtp-user.sh admin@xstarmail.es xstarmail.es tu_contraseña
```

### Paso 3: Configurar Variables de Entorno

En `server/.env`:

```env
# IMAP (servidor propio)
IMAP_HOST=localhost
IMAP_PORT=993
IMAP_SECURE=true

# Contraseña para sincronización (la misma que usas para SMTP)
EMAIL_SYNC_PASSWORD=tu_contraseña_smtp
```

### Paso 4: Verificar que la Contraseña SMTP esté Guardada

Ejecuta este script SQL para verificar:

```sql
SELECT id, address, smtpPassword, smtpHost, smtpUser 
FROM EmailAccount 
WHERE address = 'admin@xstarmail.es';
```

Si `smtpPassword` es NULL, actualiza la cuenta:

```sql
UPDATE EmailAccount 
SET smtpPassword = 'tu_contraseña' 
WHERE address = 'admin@xstarmail.es';
```

### Paso 5: Reiniciar Servidor

```bash
# Reiniciar el servidor Node.js para cargar nuevas variables
npm run dev
```

## 🧪 Probar Conexión IMAP Manualmente

```bash
# Conectar a IMAP local
openssl s_client -connect localhost:993

# O con telnet (sin SSL)
telnet localhost 143
```

## 📋 Checklist de Verificación

- [ ] Dovecot está corriendo: `sudo systemctl status dovecot`
- [ ] Usuario existe en Dovecot: `sudo doveadm auth test admin@xstarmail.es`
- [ ] Variables IMAP configuradas en `.env`
- [ ] `EMAIL_SYNC_PASSWORD` configurada en `.env`
- [ ] `smtpPassword` guardada en la BD para la cuenta
- [ ] Servidor Node.js reiniciado
- [ ] Puertos 993 y 143 abiertos

## 🔄 Alternativa: Usar Contraseña Global

Si no quieres configurar contraseñas por cuenta, usa una contraseña global:

En `server/.env`:
```env
EMAIL_SYNC_PASSWORD=tu_contraseña_maestra
```

Esta contraseña se usará para todas las cuentas si no tienen `smtpPassword` configurada.

---

**Nota**: El error "Invalid credentials" generalmente significa que:
1. La contraseña es incorrecta
2. El usuario no existe en Dovecot
3. El servidor IMAP no está accesible

Sigue los pasos arriba para resolverlo.

