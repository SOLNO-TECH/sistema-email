# ⚡ Configuración Rápida: Servidor SMTP → Mailbox

## ✅ Resumen: ¿Qué necesitas?

Solo **3 cosas** para que todo funcione automáticamente:

### 1. Variables de Entorno en `server/.env`

```env
# SMTP (ya configurado con setup-smtp-server.sh)
EMAIL_SMTP_HOST=mail.tudominio.com
EMAIL_SMTP_PORT=587
EMAIL_SMTP_USER=admin@tudominio.com
EMAIL_SMTP_PASSWORD=tu_contraseña

# IMAP (para sincronización - NUEVO)
IMAP_HOST=mail.tudominio.com
IMAP_PORT=993
IMAP_SECURE=true

# Sincronización Automática (NUEVO)
ENABLE_EMAIL_SYNC=true
EMAIL_SYNC_INTERVAL=5
```

### 2. Asegurar que las Contraseñas SMTP estén Guardadas

Cuando creas usuarios SMTP, las contraseñas se guardan automáticamente en `smtpPassword`. Esto ya está implementado.

### 3. Reiniciar el Servidor

```bash
# Reiniciar el servidor Node.js para que cargue las nuevas variables
npm run dev  # o como inicies tu servidor
```

## 🔄 Cómo Funciona

1. **Correo llega** → Postfix lo guarda en `/var/mail/virtual/`
2. **Sincronización automática** (cada 5 min) → Lee desde IMAP y guarda en BD
3. **Aparece en mailbox** → Automáticamente visible

## ✅ Checklist Rápido

- [ ] Ejecutaste `setup-smtp-server.sh`
- [ ] Ejecutaste `complete-email-setup.sh`
- [ ] Configuraste DNS (MX, A, SPF)
- [ ] Agregaste variables IMAP en `.env`
- [ ] Activaste `ENABLE_EMAIL_SYNC=true`
- [ ] Reiniciaste el servidor Node.js

## 🧪 Probar

1. Envía un correo desde Gmail a `admin@tudominio.com`
2. Espera máximo 5 minutos (o haz clic en refresh)
3. El correo debería aparecer en el mailbox

---

**Eso es todo. Con estas 3 configuraciones, los correos aparecerán automáticamente en el mailbox.**

