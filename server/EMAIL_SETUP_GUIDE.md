# Guía de Configuración de Email Gratuita

Esta guía te muestra cómo configurar el envío de emails usando servicios **completamente gratuitos**, sin necesidad de comprar un servicio SMTP.

## Opción 1: Gmail (Recomendada - Más Fácil)

Gmail es la opción más sencilla y no requiere registrarse en servicios adicionales.

### Pasos:

1. **Activa la verificación en 2 pasos en tu cuenta de Gmail:**
   - Ve a: https://myaccount.google.com/security
   - Activa "Verificación en 2 pasos"

2. **Genera una contraseña de aplicación:**
   - Ve a: https://myaccount.google.com/apppasswords
   - Selecciona "Correo" y "Otro (nombre personalizado)"
   - Escribe "Xstar Mail" y genera la contraseña
   - **Copia la contraseña de 16 caracteres** (se verá algo como: `abcd efgh ijkl mnop`)

3. **Configura en tu archivo `.env`:**
   ```env
   EMAIL_SMTP_HOST=smtp.gmail.com
   EMAIL_SMTP_PORT=587
   EMAIL_SMTP_USER=tu-email@gmail.com
   EMAIL_SMTP_PASSWORD=abcdefghijklmnop
   EMAIL_FROM_NAME=Xstar Mail
   ```

### Límites de Gmail:
- **500 emails por día** (suficiente para la mayoría de casos)
- Gratis
- No requiere registro adicional

---

## Opción 2: SendGrid (100 emails/día gratis)

SendGrid ofrece 100 emails por día de forma gratuita.

### Pasos:

1. **Regístrate en SendGrid:**
   - Ve a: https://signup.sendgrid.com/
   - Crea una cuenta gratuita

2. **Crea una API Key:**
   - Ve a Settings > API Keys
   - Crea una nueva API Key con permisos "Full Access"
   - **Copia la API Key** (solo se muestra una vez)

3. **Verifica tu dominio o usa el dominio de SendGrid:**
   - Para producción: verifica tu dominio
   - Para desarrollo: puedes usar el dominio de SendGrid

4. **Configura en tu archivo `.env`:**
   ```env
   EMAIL_SMTP_HOST=smtp.sendgrid.net
   EMAIL_SMTP_PORT=587
   EMAIL_SMTP_USER=apikey
   EMAIL_SMTP_PASSWORD=tu-api-key-de-sendgrid
   EMAIL_FROM_NAME=Xstar Mail
   ```

### Límites de SendGrid:
- **100 emails por día** (plan gratuito)
- Requiere registro
- Ideal para desarrollo y pequeños proyectos

---

## Opción 3: Mailgun (5,000 emails/mes gratis)

Mailgun ofrece 5,000 emails por mes de forma gratuita.

### Pasos:

1. **Regístrate en Mailgun:**
   - Ve a: https://signup.mailgun.com/
   - Crea una cuenta gratuita

2. **Verifica tu dominio o usa el dominio de prueba:**
   - Para producción: verifica tu dominio
   - Para desarrollo: Mailgun te da un dominio de prueba (sandbox)

3. **Obtén tus credenciales SMTP:**
   - Ve a Sending > Domain Settings
   - Copia las credenciales SMTP

4. **Configura en tu archivo `.env`:**
   ```env
   EMAIL_SMTP_HOST=smtp.mailgun.org
   EMAIL_SMTP_PORT=587
   EMAIL_SMTP_USER=postmaster@tu-dominio.mailgun.org
   EMAIL_SMTP_PASSWORD=tu-password-de-mailgun
   EMAIL_FROM_NAME=Xstar Mail
   ```

### Límites de Mailgun:
- **5,000 emails por mes** (plan gratuito)
- Requiere registro
- Ideal para proyectos medianos

---

## Opción 4: Resend (3,000 emails/mes gratis)

Resend es moderno y fácil de usar.

### Pasos:

1. **Regístrate en Resend:**
   - Ve a: https://resend.com/signup
   - Crea una cuenta gratuita

2. **Obtén tu API Key:**
   - Ve a API Keys
   - Crea una nueva API Key
   - **Copia la API Key**

3. **Verifica tu dominio:**
   - Agrega y verifica tu dominio

4. **Configura en tu archivo `.env`:**
   ```env
   EMAIL_SMTP_HOST=smtp.resend.com
   EMAIL_SMTP_PORT=587
   EMAIL_SMTP_USER=resend
   EMAIL_SMTP_PASSWORD=tu-api-key-de-resend
   EMAIL_FROM_NAME=Xstar Mail
   ```

### Límites de Resend:
- **3,000 emails por mes** (plan gratuito)
- Requiere registro
- Interfaz moderna y fácil de usar

---

## Opción 5: Brevo (anteriormente Sendinblue) - 300 emails/día gratis

Brevo ofrece 300 emails por día de forma gratuita.

### Pasos:

1. **Regístrate en Brevo:**
   - Ve a: https://www.brevo.com/
   - Crea una cuenta gratuita

2. **Obtén tus credenciales SMTP:**
   - Ve a Settings > SMTP & API
   - Copia las credenciales SMTP

3. **Configura en tu archivo `.env`:**
   ```env
   EMAIL_SMTP_HOST=smtp-relay.brevo.com
   EMAIL_SMTP_PORT=587
   EMAIL_SMTP_USER=tu-email@brevo.com
   EMAIL_SMTP_PASSWORD=tu-password-de-brevo
   EMAIL_FROM_NAME=Xstar Mail
   ```

### Límites de Brevo:
- **300 emails por día** (plan gratuito)
- Requiere registro
- Buena opción para proyectos medianos

---

## Recomendación

Para empezar rápidamente sin registrarse en servicios adicionales:
- **Usa Gmail** (Opción 1) - Es la más rápida de configurar

Para proyectos que necesiten más volumen:
- **Usa Mailgun** (Opción 3) - 5,000 emails/mes es generoso

Para proyectos pequeños:
- **Usa SendGrid** (Opción 2) - 100 emails/día es suficiente para desarrollo

---

## Configuración en Desarrollo (Sin SMTP)

Si no quieres configurar nada ahora, el sistema funcionará igual pero mostrará el código en la consola del servidor. Esto es útil para desarrollo y pruebas.

El código aparecerá así en la consola:
```
📧 [DESARROLLO] Código de verificación para usuario@email.com: 123456
⏰ Expira en: 2024-01-01T12:00:00.000Z
```

---

## Solución de Problemas

### Gmail no funciona:
- Asegúrate de usar una **contraseña de aplicación**, no tu contraseña normal
- Verifica que la verificación en 2 pasos esté activada
- Revisa que no tengas bloqueado el acceso de aplicaciones menos seguras

### SendGrid/Mailgun no funciona:
- Verifica que tu dominio esté verificado
- Revisa que la API Key tenga los permisos correctos
- Asegúrate de usar el puerto correcto (587 para TLS)

### Error "SMTP no configurado":
- Verifica que todas las variables estén en el archivo `.env`
- Reinicia el servidor después de cambiar el `.env`
- Asegúrate de que no haya espacios en las variables

---

## Nota Importante

Todos estos servicios son **completamente gratuitos** para los límites mencionados. No necesitas pagar nada para empezar. Solo necesitas registrarte (excepto Gmail que usa tu cuenta existente).

