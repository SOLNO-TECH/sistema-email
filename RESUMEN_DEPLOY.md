# 📦 Resumen: Deploy para mail.fylo.es

## ✅ Cambios aplicados

### 1. **Configuración de Nginx** (`nginx.conf.example`)
- ✅ Configurado para `mail.fylo.es` (sin subdominios adicionales)
- ✅ Proxy inverso para frontend (puerto 3000) y backend (puerto 3001)
- ✅ Configuración SSL/TLS moderna (A+ SSL Labs)
- ✅ Headers de seguridad optimizados
- ✅ Soporte para WebSockets (Next.js HMR)
- ✅ Configuración especial para webhook de Stripe (raw body)
- ✅ Caché optimizado para archivos estáticos
- ✅ OCSP Stapling habilitado
- ✅ Compresión y timeouts ajustados

### 2. **Script de instalación SSL** (`setup-ssl.sh`)
- ✅ Instalación automática de Certbot
- ✅ Verificación de DNS antes de obtener certificado
- ✅ Obtención automática de certificado Let's Encrypt
- ✅ Renovación automática cada 60 días
- ✅ Redirección HTTP → HTTPS automática
- ✅ Validación y diagnóstico de errores

### 3. **Script de deploy mejorado** (`deploy.sh`)
- ✅ Dominio por defecto: `mail.fylo.es`
- ✅ Contraseñas MySQL generadas aleatoriamente (seguras)
- ✅ Backend compila y ejecuta en modo producción (`npm run build` + `start:prod`)
- ✅ Frontend compila con Next.js optimizado (`npm run build`)
- ✅ SMTP/IMAP desactivado por defecto (evita errores si no está configurado)
- ✅ Instalación de dependencias del sistema más completa
- ✅ Verificación de puertos y servicios

### 4. **Ecosystem PM2** (`ecosystem.config.js`)
- ✅ Backend ejecuta JavaScript compilado (no `ts-node`)
- ✅ Logs en carpeta `logs/` en la raíz del proyecto
- ✅ Frontend con puerto explícito en `npm start`
- ✅ Reinicio automático en caso de crash
- ✅ Límite de memoria configurado

### 5. **Scripts auxiliares**
- ✅ `check-status.sh`: Verifica estado completo del sistema
- ✅ `DEPLOY.md`: Guía paso a paso completa
- ✅ Todos los scripts con permisos de ejecución

---

## 🚀 Pasos para instalar en el servidor

### 1️⃣ Preparar DNS (ANTES de empezar)

Asegúrate de que el dominio apunte al servidor:

```
Tipo: A
Nombre: mail.fylo.es
Valor: [IP_DEL_SERVIDOR]
TTL: 3600
```

Verifica con:
```bash
dig +short mail.fylo.es
```

### 2️⃣ Subir el código al servidor

```bash
# Opción 1: Git
ssh root@IP_SERVIDOR
cd /root
git clone https://github.com/tu-usuario/sistema-email.git
cd sistema-email

# Opción 2: SCP/SFTP
scp -r ./sistema-email root@IP_SERVIDOR:/root/
```

### 3️⃣ Ejecutar deploy

```bash
cd /root/sistema-email
chmod +x *.sh
sudo ./deploy.sh
```

**Tiempo:** 5-10 minutos

**Qué hace:**
- Instala Node.js 20.x, MySQL, PM2
- Crea base de datos con contraseña segura
- Instala dependencias
- Compila backend y frontend
- Ejecuta migraciones de Prisma
- Arranca servicios con PM2

### 4️⃣ Configurar SSL

```bash
sudo ./setup-ssl.sh
```

**Tiempo:** 2-3 minutos

**Qué hace:**
- Verifica DNS
- Instala Certbot
- Configura Nginx
- Obtiene certificado SSL
- Habilita redirección HTTPS
- Configura renovación automática

### 5️⃣ Verificar instalación

```bash
./check-status.sh
```

Accede a: **https://mail.fylo.es**

Login admin:
- Usuario: `admin@fylomail.es`
- Contraseña: `admin123`

---

## 📝 Variables de entorno importantes

El archivo `server/.env` se crea automáticamente con:

```env
# Base de datos (generado automáticamente)
DATABASE_URL="mysql://sistema_email_user:PASSWORD@localhost:3306/sistema_email"

# JWT (generado automáticamente)
JWT_SECRET="RANDOM_SECRET"

# Puertos
PORT=3001
BACKEND_PORT=3001
FRONTEND_PORT=3000
NODE_ENV=production

# URLs
FRONTEND_URL="http://mail.fylo.es:3000"  # Cambiar a https después de SSL
ALLOWED_ORIGINS="http://mail.fylo.es:3000"

# Email (desactivado por defecto para evitar errores)
EMAIL_SMTP_HOST=""
EMAIL_SMTP_PORT=""
EMAIL_SMTP_USER=""
EMAIL_SMTP_PASSWORD=""
ENABLE_EMAIL_SYNC="false"
```

### Configurar SMTP (opcional)

Para enviar emails reales, edita `server/.env`:

```env
# Gmail (gratis, 500 emails/día)
EMAIL_SMTP_HOST="smtp.gmail.com"
EMAIL_SMTP_PORT="587"
EMAIL_SMTP_USER="tu-email@gmail.com"
EMAIL_SMTP_PASSWORD="tu-contraseña-de-app"
EMAIL_FROM_NAME="Fylo Mail"
```

Luego reinicia:
```bash
pm2 restart fylo-backend
```

---

## 🔐 Seguridad

### Después de la instalación:

1. **Cambiar contraseña admin:**
   - Login → Configuración → Cambiar contraseña

2. **Configurar firewall:**
   ```bash
   sudo ufw enable
   sudo ufw allow 22/tcp   # SSH
   sudo ufw allow 80/tcp   # HTTP
   sudo ufw allow 443/tcp  # HTTPS
   sudo ufw deny 3000/tcp  # Bloquear acceso directo
   sudo ufw deny 3001/tcp  # Bloquear acceso directo
   ```

3. **Backup de base de datos:**
   ```bash
   ./export-database.sh
   ```

---

## 🛠️ Comandos útiles

```bash
# Ver estado
./check-status.sh

# Ver logs
pm2 logs
pm2 logs fylo-backend
pm2 logs fylo-frontend
sudo tail -f /var/log/nginx/fylo-mail-error.log

# Reiniciar servicios
pm2 restart all
sudo systemctl reload nginx

# Actualizar código
cd /root/sistema-email
git pull
cd server && npm ci && npm run build && cd ..
cd client && npm ci && npm run build && cd ..
pm2 restart all

# Verificar SSL
sudo certbot certificates
sudo certbot renew --dry-run
```

---

## ⚠️ Notas importantes

1. **Subdominio `mail.fylo.es`:**
   - La configuración está optimizada para subdominio
   - No incluye `www.mail.fylo.es` (no es necesario)
   - Certbot obtiene certificado solo para `mail.fylo.es`

2. **Primera vez:**
   - El sitio estará en HTTP (`http://mail.fylo.es:3000`) hasta ejecutar `setup-ssl.sh`
   - Después de SSL, accede por HTTPS (`https://mail.fylo.es`)
   - Nginx redirige automáticamente HTTP → HTTPS

3. **Puertos:**
   - Frontend: 3000 (interno, proxy por Nginx)
   - Backend: 3001 (interno, proxy por Nginx)
   - HTTP: 80 (público, redirige a HTTPS)
   - HTTPS: 443 (público, punto de entrada principal)

4. **Certificado SSL:**
   - Válido por 90 días
   - Renovación automática cada 60 días
   - Let's Encrypt es gratuito y confiable

---

## 🆘 Solución de problemas

### Error: "Dominio no resuelve"
```bash
# Verificar DNS
dig +short mail.fylo.es

# Esperar propagación DNS (puede tardar hasta 24h)
```

### Error: "Puerto ocupado"
```bash
# Ver qué proceso usa el puerto
sudo lsof -ti:3000

# Matar proceso
sudo kill -9 $(sudo lsof -ti:3000)

# Reiniciar PM2
pm2 restart all
```

### Error: "Certificado SSL falló"
```bash
# Verificar que Nginx está corriendo
sudo systemctl status nginx

# Verificar que el puerto 80 está abierto
sudo ufw allow 80/tcp

# Verificar DNS
dig +short mail.fylo.es

# Reintentar
sudo ./setup-ssl.sh
```

### Backend no conecta a MySQL
```bash
# Ver contraseña en .env
cat server/.env | grep DATABASE_URL

# Probar conexión manual
mysql -u sistema_email_user -p

# Reiniciar MySQL
sudo systemctl restart mysql
```

---

## ✅ Checklist de producción

- [ ] DNS configurado (`mail.fylo.es` → IP del servidor)
- [ ] Deploy ejecutado exitosamente (`./deploy.sh`)
- [ ] SSL configurado (`./setup-ssl.sh`)
- [ ] Sitio accesible en `https://mail.fylo.es`
- [ ] Login admin funciona
- [ ] Contraseña admin cambiada
- [ ] Firewall configurado
- [ ] SMTP configurado (opcional)
- [ ] Backup de BD configurado
- [ ] Monitoring configurado (opcional)

---

**¡Listo para producción! 🎉**

