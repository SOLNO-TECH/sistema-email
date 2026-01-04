# 🚀 Instalación Rápida en VPS - Guía Simplificada

Esta es la forma **más fácil** de instalar todo desde cero en tu VPS.

## ⚡ Pasos Rápidos (5 minutos)

### 1. Conectarte a tu VPS

```bash
ssh root@tu-ip-vps
# o
ssh usuario@tu-ip-vps
```

### 2. Subir el proyecto

```bash
# Opción A: Si tienes Git
git clone <tu-repositorio> sistema-email
cd sistema-email

# Opción B: Si no tienes Git, sube los archivos por SFTP/FTP
# Luego:
cd sistema-email
```

### 3. Ejecutar instalación automática

```bash
# Dar permisos
chmod +x install-vps.sh
chmod +x setup-database.sh
chmod +x server/scripts/*.sh

# Ejecutar instalación (esto instala Node.js, MySQL, Postfix, etc.)
sudo ./install-vps.sh
```

### 4. Configurar Base de Datos

```bash
# El script te pedirá información, o ejecuta manualmente:
sudo ./setup-database.sh
```

**Copia el `DATABASE_URL` que te muestra** (lo necesitarás después)

### 5. Configurar Variables de Entorno

```bash
cd server
cp DEPLOY_ENV.example .env
nano .env
```

**Configura estas líneas importantes:**

```env
# Base de datos (del paso anterior)
DATABASE_URL="mysql://usuario:password@localhost:3306/sistema_email"

# JWT (genera uno aleatorio)
JWT_SECRET="cambia-este-secret-por-uno-aleatorio-y-seguro"

# SMTP (servidor propio - localhost)
EMAIL_SMTP_HOST="localhost"
EMAIL_SMTP_PORT="587"
EMAIL_SMTP_USER="admin@fylomail.es"
EMAIL_SMTP_PASSWORD="tu_contraseña_segura"

# IMAP
IMAP_HOST="localhost"
IMAP_PORT="993"
IMAP_SECURE="true"

# Sincronización automática
ENABLE_EMAIL_SYNC="true"
EMAIL_SYNC_INTERVAL="5"

# Producción
NODE_ENV="production"
FRONTEND_URL="https://tu-dominio.com"
```

Guarda con `Ctrl+X`, luego `Y`, luego `Enter`

### 6. Configurar Prisma

```bash
# Generar cliente
npx prisma generate

# Ejecutar migraciones
npx prisma migrate deploy
```

### 7. Configurar Postfix (Servidor de Correo)

```bash
cd scripts
sudo ./setup-smtp-server.sh
```

**Cuando te pregunte:**
- Dominio: `fylomail.es` (o tu dominio)
- Hostname: `mail.fylomail.es` (o tu hostname)

Luego:

```bash
sudo ./complete-email-setup.sh
```

### 8. Crear Usuario Admin SMTP

```bash
sudo ./create-smtp-user.sh admin@fylomail.es fylomail.es tu_contraseña_segura
```

**Guarda esta contraseña** - la necesitarás para el `.env`

### 9. Configurar Firewall

```bash
sudo ufw allow 25/tcp    # SMTP - Recepción
sudo ufw allow 587/tcp   # SMTP Submission - Envío
sudo ufw allow 993/tcp   # IMAPS - Clientes
sudo ufw allow 995/tcp   # POP3S - Clientes
sudo ufw allow 3000/tcp  # Frontend
sudo ufw allow 3001/tcp  # Backend
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### 10. Construir y Iniciar

```bash
cd ../..  # Volver a la raíz
npm run build

# Iniciar con PM2 (recomendado)
sudo npm install -g pm2
cd server && pm2 start npm --name "fylo-backend" -- start
cd ../client && pm2 start npm --name "fylo-frontend" -- start
pm2 save
pm2 startup  # Sigue las instrucciones
```

### 11. Configurar DNS (IMPORTANTE)

En tu proveedor de DNS, agrega estos registros:

```
Tipo    Nombre              Valor                    Prioridad/TTL
MX      @                    mail.tu-dominio.com      10
A       mail                 TU_IP_VPS                3600
TXT     @                    v=spf1 mx a:mail.tu-dominio.com ~all
TXT     _dmarc               v=DMARC1; p=none; rua=mailto:admin@tu-dominio.com
```

**Sin estos registros DNS, NO podrás recibir correos externos.**

## ✅ Verificar que Funciona

```bash
# Ver servicios
sudo systemctl status postfix
sudo systemctl status dovecot
sudo systemctl status mysql
pm2 status

# Ver logs
pm2 logs fylo-backend
sudo tail -f /var/log/mail.log

# Probar envío
echo "Test" | mail -s "Test" admin@fylomail.es
```

## 🎯 Resumen de Comandos (Copia y Pega)

```bash
# 1. Instalación
chmod +x install-vps.sh setup-database.sh server/scripts/*.sh
sudo ./install-vps.sh

# 2. Base de datos
sudo ./setup-database.sh
# Copia el DATABASE_URL

# 3. Configurar .env
cd server
cp DEPLOY_ENV.example .env
nano .env
# Edita DATABASE_URL, JWT_SECRET, EMAIL_SMTP_*

# 4. Prisma
npx prisma generate
npx prisma migrate deploy

# 5. Postfix
cd scripts
sudo ./setup-smtp-server.sh
sudo ./complete-email-setup.sh
sudo ./create-smtp-user.sh admin@fylomail.es fylomail.es tu_contraseña

# 6. Firewall
sudo ufw allow 25,587,993,995,3000,3001,80,443/tcp
sudo ufw enable

# 7. Iniciar
cd ../..
npm run build
sudo npm install -g pm2
cd server && pm2 start npm --name "fylo-backend" -- start
cd ../client && pm2 start npm --name "fylo-frontend" -- start
pm2 save
pm2 startup
```

## 🆘 Problemas Comunes

### Error: "Port already in use"
```bash
# Ver qué usa el puerto
sudo netstat -tlnp | grep :3001
# Matar proceso
sudo kill -9 <PID>
```

### Error: "Cannot connect to MySQL"
```bash
# Verificar que MySQL esté corriendo
sudo systemctl status mysql
# Reiniciar si es necesario
sudo systemctl restart mysql
```

### Error: "SMTP connection failed"
```bash
# Verificar Postfix
sudo systemctl status postfix
sudo postfix check
# Ver logs
sudo tail -f /var/log/mail.log
```

### Correos no llegan
1. Verifica registros DNS (especialmente MX)
2. Espera 5-10 minutos para propagación DNS
3. Verifica puerto 25 abierto: `sudo netstat -tlnp | grep :25`
4. Verifica logs: `sudo tail -f /var/log/mail.log`

## 📚 Documentación Completa

Para más detalles, consulta:
- `INSTALACION_VPS.md` - Guía completa detallada
- `server/CONFIGURACION_SMTP.md` - Configuración SMTP
- `server/SMTP_SERVER_SETUP.md` - Setup de Postfix

---

**¡Listo!** Tu sistema debería estar funcionando. 🎉

