# 🚀 Guía de Deploy para Ubuntu 22.04

Instrucciones completas para desplegar **Fylo Mail** en un servidor Ubuntu 22.04 con SSL automático.

---

## 📋 Requisitos previos

1. **Servidor Ubuntu 22.04** (VPS o dedicado)
2. **Dominio configurado**: `mail.fylo.es` debe apuntar a la IP del servidor
   - Tipo A: `mail.fylo.es` → `IP_DEL_SERVIDOR`
3. **Acceso root** (o sudo)
4. **Puertos abiertos**:
   - `80` (HTTP - para validación SSL)
   - `443` (HTTPS)
   - `3000` (Frontend - temporal, se cerrará después)
   - `3001` (Backend - temporal, se cerrará después)

---

## 🔧 Paso 1: Clonar el repositorio

```bash
# Conectarse al servidor
ssh root@IP_DEL_SERVIDOR

# Ir al directorio de instalación
cd /root

# Clonar el repositorio (o subir el código por SFTP/rsync)
git clone https://github.com/tu-usuario/sistema-email.git
cd sistema-email
```

---

## 🚀 Paso 2: Ejecutar el script de deploy automático

Este script instala **Node.js 20**, **MySQL**, **PM2**, configura las bases de datos, compila el código y arranca los servicios:

```bash
# Dar permisos de ejecución
chmod +x deploy.sh setup-ssl.sh

# Ejecutar deploy
sudo ./deploy.sh
```

**El script hace TODO automáticamente:**
- ✅ Instala Node.js 20.x
- ✅ Instala PM2 globalmente
- ✅ Instala MySQL y crea base de datos
- ✅ Genera contraseña segura para MySQL
- ✅ Instala dependencias (npm ci)
- ✅ Compila backend (TypeScript → JavaScript)
- ✅ Compila frontend (Next.js)
- ✅ Ejecuta migraciones de Prisma
- ✅ Inicializa planes de suscripción
- ✅ Crea usuario admin por defecto
- ✅ Arranca backend y frontend con PM2

**Tiempo estimado:** 5-10 minutos

---

## 🔒 Paso 3: Instalar SSL con Let's Encrypt

Después de que `deploy.sh` termine exitosamente:

```bash
# Ejecutar script de SSL
sudo ./setup-ssl.sh
```

**El script hace:**
- ✅ Verifica que el dominio apunte al servidor
- ✅ Instala Certbot
- ✅ Configura Nginx como proxy inverso
- ✅ Obtiene certificado SSL (válido 90 días)
- ✅ Habilita renovación automática
- ✅ Configura redirección HTTP → HTTPS

**Tiempo estimado:** 2-3 minutos

---

## ✅ Paso 4: Verificar que todo funciona

### 1. Ver estado de los servicios

```bash
# Estado de PM2 (backend y frontend)
pm2 status

# Logs en tiempo real
pm2 logs

# Ver solo backend
pm2 logs fylo-backend

# Ver solo frontend
pm2 logs fylo-frontend
```

### 2. Probar en el navegador

Accede a: **https://mail.fylo.es**

- Deberías ver la página principal de Fylo Mail
- El candado SSL debe aparecer en la barra de direcciones

### 3. Probar login admin

- Usuario: `admin@fylomail.es`
- Contraseña: `admin123`

**⚠️ IMPORTANTE:** Cambia esta contraseña inmediatamente después del primer login.

---

## 🔐 Paso 5: Configurar firewall (opcional pero recomendado)

Cierra los puertos 3000 y 3001 ahora que Nginx hace de proxy:

```bash
# Habilitar firewall (si no está activo)
sudo ufw enable

# Permitir solo SSH, HTTP y HTTPS
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS

# Bloquear acceso directo a backend y frontend
sudo ufw deny 3000/tcp
sudo ufw deny 3001/tcp

# Ver reglas
sudo ufw status verbose
```

---

## 📧 Paso 6: Configurar servidor de correo (opcional)

Si quieres que Fylo Mail **envíe y reciba correos reales**, necesitas configurar Postfix/Dovecot:

```bash
cd server/scripts
sudo ./complete-email-setup.sh
```

**O usa un proveedor externo:**
- Gmail SMTP (gratis, 500 emails/día)
- SendGrid (gratis, 100 emails/día)
- Mailgun (gratis, 5,000 emails/mes)

Edita `server/.env` y configura:

```env
EMAIL_SMTP_HOST="smtp.gmail.com"
EMAIL_SMTP_PORT="587"
EMAIL_SMTP_USER="tu-email@gmail.com"
EMAIL_SMTP_PASSWORD="tu-contraseña-de-app"
```

Luego reinicia:

```bash
pm2 restart fylo-backend
```

---

## 🔄 Actualizaciones y mantenimiento

### Actualizar el código

```bash
cd /root/sistema-email

# Detener servicios
pm2 stop all

# Actualizar código
git pull origin main

# Reinstalar dependencias y recompilar
cd server && npm ci && npm run build && cd ..
cd client && npm ci && npm run build && cd ..

# Ejecutar migraciones (si hay cambios en BD)
cd server && npx prisma migrate deploy && cd ..

# Reiniciar servicios
pm2 restart all
```

### Ver logs

```bash
# Logs de PM2
pm2 logs

# Logs de Nginx
sudo tail -f /var/log/nginx/fylo-mail-error.log
sudo tail -f /var/log/nginx/fylo-mail-access.log

# Logs de MySQL
sudo tail -f /var/log/mysql/error.log
```

### Backup de base de datos

```bash
# Exportar base de datos
sudo mysqldump -u sistema_email_user -p sistema_email > backup_$(date +%Y%m%d_%H%M%S).sql

# O usar el script incluido
./export-database.sh
```

---

## 🛠️ Solución de problemas

### El sitio no carga

```bash
# Verificar que los servicios estén corriendo
pm2 status
sudo systemctl status nginx

# Verificar logs
pm2 logs --err
sudo nginx -t
```

### Error de SSL

```bash
# Verificar certificado
sudo certbot certificates

# Renovar manualmente
sudo certbot renew --force-renewal

# Verificar que el dominio apunte al servidor
dig +short mail.fylo.es
```

### Backend no conecta a MySQL

```bash
# Verificar MySQL
sudo systemctl status mysql

# Probar conexión
mysql -u sistema_email_user -p

# Ver .env
cat server/.env
```

### Puerto ocupado

```bash
# Ver qué proceso usa el puerto 3000
sudo lsof -ti:3000

# Matar proceso
sudo kill -9 $(sudo lsof -ti:3000)

# Reiniciar PM2
pm2 restart all
```

---

## 📞 Variables de entorno importantes

Edita `server/.env` para configurar:

```env
# Base de datos (generado automáticamente por deploy.sh)
DATABASE_URL="mysql://sistema_email_user:PASSWORD@localhost:3306/sistema_email"

# JWT (generado automáticamente)
JWT_SECRET="..."

# Puertos
PORT=3001
BACKEND_PORT=3001
FRONTEND_PORT=3000
NODE_ENV=production

# Frontend URL
FRONTEND_URL="https://mail.fylo.es"
ALLOWED_ORIGINS="https://mail.fylo.es"

# Email SMTP (opcional)
EMAIL_SMTP_HOST="smtp.gmail.com"
EMAIL_SMTP_PORT="587"
EMAIL_SMTP_USER="tu-email@gmail.com"
EMAIL_SMTP_PASSWORD="tu-password"

# Stripe (opcional, para pagos)
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# PayPal (opcional, para pagos)
PAYPAL_CLIENT_ID="..."
PAYPAL_CLIENT_SECRET="..."
PAYPAL_MODE="live"
```

---

## 🎯 Checklist final

- [ ] Servidor Ubuntu 22.04 con acceso root
- [ ] Dominio `mail.fylo.es` apunta a la IP del servidor
- [ ] Ejecutado `sudo ./deploy.sh` exitosamente
- [ ] Ejecutado `sudo ./setup-ssl.sh` exitosamente
- [ ] Sitio accesible en `https://mail.fylo.es`
- [ ] Login admin funciona (`admin@fylomail.es` / `admin123`)
- [ ] Contraseña admin cambiada
- [ ] Firewall configurado (opcional)
- [ ] SMTP configurado para envío de emails (opcional)
- [ ] Backup de base de datos configurado

---

## 🆘 Soporte

Si tienes problemas:

1. Revisa los logs: `pm2 logs --err`
2. Verifica Nginx: `sudo nginx -t`
3. Verifica MySQL: `sudo systemctl status mysql`
4. Consulta esta guía: [DEPLOY.md](./DEPLOY.md)

---

**¡Listo! Tu servidor Fylo Mail está en producción con SSL 🎉**

