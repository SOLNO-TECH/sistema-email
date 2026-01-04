# 📧 Guía de Configuración SMTP para Fylo Mail

Esta guía explica cómo obtener y configurar las credenciales SMTP para el archivo `.env`.

## 🎯 Opción Recomendada: Servidor Propio (Postfix)

Si ya tienes Postfix configurado en tu servidor, usa tu propio servidor SMTP:

### Configuración para Servidor Local (mismo servidor donde corre Node.js):

```env
EMAIL_SMTP_HOST=localhost
EMAIL_SMTP_PORT=587
EMAIL_SMTP_USER=admin@fylomail.es
EMAIL_SMTP_PASSWORD=tu_contraseña_del_admin
```

### Configuración para Servidor Remoto:

```env
EMAIL_SMTP_HOST=mail.fylomail.es  # o la IP de tu servidor (ej: 192.168.1.100)
EMAIL_SMTP_PORT=587
EMAIL_SMTP_USER=admin@fylomail.es
EMAIL_SMTP_PASSWORD=tu_contraseña
```

**Ventajas:**
- ✅ Envío ilimitado
- ✅ Control total
- ✅ No depende de servicios externos
- ✅ Los correos creados automáticamente ya funcionan

---

## 📮 Opción 2: Gmail (Gratis - 500 emails/día)

### Pasos para obtener las credenciales:

1. **Activa verificación en 2 pasos:**
   - Ve a: https://myaccount.google.com/security
   - Activa "Verificación en 2 pasos"

2. **Genera contraseña de aplicación:**
   - Ve a: https://myaccount.google.com/apppasswords
   - Selecciona "Correo" y "Otro (nombre personalizado)"
   - Escribe "Fylo Mail" y genera la contraseña
   - **Copia la contraseña de 16 caracteres** (ej: `abcd efgh ijkl mnop`)

3. **Configura en `.env`:**
```env
EMAIL_SMTP_HOST=smtp.gmail.com
EMAIL_SMTP_PORT=587
EMAIL_SMTP_USER=tu-email@gmail.com
EMAIL_SMTP_PASSWORD=abcdefghijklmnop  # Sin espacios, los 16 caracteres juntos
```

**Límites:** 500 emails por día

---

## 📬 Opción 3: SendGrid (Gratis - 100 emails/día)

### Pasos para obtener las credenciales:

1. **Regístrate:**
   - Ve a: https://signup.sendgrid.com/
   - Crea una cuenta gratuita

2. **Crea una API Key:**
   - Ve a Settings > API Keys
   - Crea una nueva API Key con permisos "Full Access"
   - **Copia la API Key** (solo se muestra una vez)

3. **Configura en `.env`:**
```env
EMAIL_SMTP_HOST=smtp.sendgrid.net
EMAIL_SMTP_PORT=587
EMAIL_SMTP_USER=apikey
EMAIL_SMTP_PASSWORD=tu-api-key-de-sendgrid
```

**Límites:** 100 emails por día

---

## 📨 Opción 4: Brevo (Gratis - 300 emails/día)

### Pasos para obtener las credenciales:

1. **Regístrate:**
   - Ve a: https://www.brevo.com/
   - Crea una cuenta gratuita

2. **Obtén credenciales SMTP:**
   - Ve a SMTP & API > SMTP
   - Copia el servidor, usuario y contraseña

3. **Configura en `.env`:**
```env
EMAIL_SMTP_HOST=smtp-relay.brevo.com
EMAIL_SMTP_PORT=587
EMAIL_SMTP_USER=tu-email@brevo.com
EMAIL_SMTP_PASSWORD=tu-password-de-brevo
```

**Límites:** 300 emails por día

---

## 🔍 Cómo Verificar que Funciona

Después de configurar, reinicia el servidor y verifica en los logs:

```bash
# Reiniciar servidor
npm run dev  # o npm start en producción

# Verificar logs - deberías ver:
# ✅ Usando SMTP propio global para cuenta...
# ✅ Correo enviado desde...
```

---

## ⚠️ Nota Importante

- **Si usas servidor propio:** Los correos creados automáticamente ya tienen su configuración SMTP
- **Si usas Gmail/SendGrid/etc:** Solo podrás enviar desde direcciones verificadas
- **Recomendación:** Usa servidor propio si ya lo tienes configurado, es más flexible

---

## 🆘 Problemas Comunes

### Error: "SMTP no configurado"
- Verifica que las 4 variables estén en `.env`
- Reinicia el servidor después de cambiar `.env`

### Error: "Invalid credentials"
- Verifica que la contraseña sea correcta
- En Gmail, usa la contraseña de aplicación, no tu contraseña normal

### Error: "Connection timeout"
- Verifica que el puerto 587 esté abierto
- Si es servidor remoto, verifica la IP/hostname

