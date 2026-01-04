# 🚀 Guía Completa de Instalación en VPS

Esta guía te permitirá instalar Fylo Mail completamente en una VPS con Postfix, MySQL y Node.js.

## 📋 Requisitos Previos

- VPS con Ubuntu 20.04+ o Debian 11+
- Acceso root o sudo
- Dominio configurado apuntando a tu VPS
- Puertos abiertos: 25, 587, 993, 995, 3000, 3001, 3306

## 🎯 Instalación Automática (Recomendado)

Ejecuta el script de instalación completo:

```bash
# Clonar o descargar el proyecto
git clone <tu-repositorio> sistema-email
cd sistema-email

# Dar permisos de ejecución
chmod +x install-vps.sh

# Ejecutar instalación
sudo ./install-vps.sh
```

El script instalará automáticamente:
- ✅ Node.js 20.x
- ✅ MySQL 8.0
- ✅ Postfix y Dovecot
- ✅ Todas las dependencias del proyecto
- ✅ Base de datos configurada
- ✅ Servidor SMTP/IMAP configurado
- ✅ Variables de entorno
- ✅ Servicios iniciados

## 📝 Instalación Manual Paso a Paso

### Paso 1: Actualizar Sistema

```bash
sudo apt update && sudo apt upgrade -y
```

### Paso 2: Instalar Node.js 20.x

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node --version  # Debe mostrar v20.x.x
```

### Paso 3: Instalar MySQL

```bash
sudo apt install -y mysql-server
sudo mysql_secure_installation
```

### Paso 4: Configurar Base de Datos

```bash
cd sistema-email
chmod +x setup-database.sh
sudo ./setup-database.sh
```

Sigue las instrucciones y copia el `DATABASE_URL` generado.

### Paso 5: Instalar Postfix y Dovecot

```bash
cd server/scripts
chmod +x setup-smtp-server.sh
chmod +x complete-email-setup.sh
chmod +x create-smtp-user.sh

# Configurar Postfix
sudo ./setup-smtp-server.sh

# Completar configuración para recepción
sudo ./complete-email-setup.sh
```

### Paso 6: Configurar Variables de Entorno

```bash
cd server
cp DEPLOY_ENV.example .env
nano .env
```

Configura estas variables importantes:

```env
# Base de datos (del paso 4)
DATABASE_URL="mysql://usuario:password@localhost:3306/sistema_email"

# JWT
JWT_SECRET="genera-un-secret-aleatorio-aqui"

# SMTP (servidor propio)
EMAIL_SMTP_HOST="localhost"
EMAIL_SMTP_PORT="587"
EMAIL_SMTP_USER="admin@fylomail.es"
EMAIL_SMTP_PASSWORD="tu_contraseña"

# IMAP
IMAP_HOST="localhost"
IMAP_PORT="993"
IMAP_SECURE="true"

# Sincronización automática
ENABLE_EMAIL_SYNC="true"
EMAIL_SYNC_INTERVAL="5"

# Frontend
FRONTEND_URL="https://tu-dominio.com"
BACKEND_PORT="3001"
FRONTEND_PORT="3000"
```

### Paso 7: Instalar Dependencias y Configurar Prisma

```bash
# Desde la raíz del proyecto
npm run install:all

# Generar cliente de Prisma
cd server
npx prisma generate

# Ejecutar migraciones
npx prisma migrate deploy
```

### Paso 8: Crear Usuario Admin SMTP

```bash
cd server/scripts
sudo ./create-smtp-user.sh admin@fylomail.es fylomail.es tu_contraseña_segura
```

### Paso 9: Configurar DNS

Agrega estos registros en tu proveedor de DNS:

```
Tipo    Nombre              Valor                    Prioridad/TTL
MX      @                    mail.tu-dominio.com      10
A       mail                 TU_IP_VPS                3600
TXT     @                    v=spf1 mx a:mail.tu-dominio.com ~all
TXT     _dmarc               v=DMARC1; p=none; rua=mailto:admin@tu-dominio.com
```

### Paso 10: Configurar Firewall

```bash
sudo ufw allow 25/tcp    # SMTP - Recepción
sudo ufw allow 587/tcp   # SMTP Submission - Envío
sudo ufw allow 993/tcp   # IMAPS - Clientes
sudo ufw allow 995/tcp   # POP3S - Clientes
sudo ufw allow 3000/tcp  # Frontend
sudo ufw allow 3001/tcp  # Backend
sudo ufw allow 3306/tcp  # MySQL (solo si necesitas acceso remoto)
sudo ufw enable
```

### Paso 11: Iniciar Servicios

```bash
# Desde la raíz del proyecto
npm run build

# Iniciar en producción (usa PM2 o systemd)
# Ver sección "Gestión de Procesos"
```

## 🔄 Gestión de Procesos

### Opción 1: PM2 (Recomendado)

```bash
# Instalar PM2
sudo npm install -g pm2

# Iniciar servicios
cd server
pm2 start npm --name "fylo-backend" -- start
cd ../client
pm2 start npm --name "fylo-frontend" -- start

# Guardar configuración
pm2 save
pm2 startup  # Sigue las instrucciones para iniciar en boot
```

### Opción 2: systemd

Crea estos archivos:

`/etc/systemd/system/fylo-backend.service`:
```ini
[Unit]
Description=Fylo Mail Backend
After=network.target mysql.service

[Service]
Type=simple
User=tu-usuario
WorkingDirectory=/ruta/a/sistema-email/server
ExecStart=/usr/bin/npm start
Restart=always

[Install]
WantedBy=multi-user.target
```

`/etc/systemd/system/fylo-frontend.service`:
```ini
[Unit]
Description=Fylo Mail Frontend
After=network.target

[Service]
Type=simple
User=tu-usuario
WorkingDirectory=/ruta/a/sistema-email/client
ExecStart=/usr/bin/npm start
Restart=always

[Install]
WantedBy=multi-user.target
```

Luego:
```bash
sudo systemctl daemon-reload
sudo systemctl enable fylo-backend fylo-frontend
sudo systemctl start fylo-backend fylo-frontend
```

## 💾 Exportar Base de Datos

### Exportar Completa

```bash
cd sistema-email
chmod +x export-database.sh
./export-database.sh
```

Esto creará un archivo `backup_sistema_email_YYYYMMDD_HHMMSS.sql`

### Exportar Manualmente

```bash
mysqldump -u sistema_email_user -p sistema_email > backup.sql
```

### Importar Base de Datos

```bash
mysql -u sistema_email_user -p sistema_email < backup.sql
```

## 🧪 Verificar Instalación

### Verificar Servicios

```bash
# Postfix
sudo systemctl status postfix

# Dovecot
sudo systemctl status dovecot

# MySQL
sudo systemctl status mysql

# Backend (PM2)
pm2 status

# Backend (systemd)
sudo systemctl status fylo-backend
```

### Probar Envío de Correo

```bash
# Desde el servidor
echo "Test email" | mail -s "Test Subject" admin@fylomail.es
```

### Probar Recepción

1. Envía un correo desde Gmail a `admin@fylomail.es`
2. Verifica logs: `sudo tail -f /var/log/mail.log`
3. Verifica en el buzón web

## 🔧 Solución de Problemas

### Error: "Cannot connect to MySQL"

```bash
# Verificar que MySQL esté corriendo
sudo systemctl status mysql

# Verificar credenciales en .env
cat server/.env | grep DATABASE_URL
```

### Error: "SMTP connection failed"

```bash
# Verificar Postfix
sudo systemctl status postfix
sudo tail -f /var/log/mail.log

# Verificar configuración
sudo postfix check
```

### Error: "IMAP connection failed"

```bash
# Verificar Dovecot
sudo systemctl status dovecot
sudo tail -f /var/log/dovecot.log

# Verificar puerto
sudo netstat -tlnp | grep 993
```

### Correos no llegan

1. Verifica registros DNS (MX, A)
2. Verifica puerto 25 abierto: `sudo netstat -tlnp | grep 25`
3. Verifica logs: `sudo tail -f /var/log/mail.log`
4. Verifica firewall: `sudo ufw status`

## 📊 Monitoreo

### Ver Logs en Tiempo Real

```bash
# Postfix
sudo tail -f /var/log/mail.log

# Dovecot
sudo tail -f /var/log/dovecot.log

# Backend (PM2)
pm2 logs fylo-backend

# Backend (systemd)
sudo journalctl -u fylo-backend -f
```

### Verificar Espacio en Disco

```bash
# Correos almacenados
du -sh /var/mail/virtual

# Base de datos
mysql -u root -p -e "SELECT table_schema AS 'Database', ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)' FROM information_schema.tables WHERE table_schema = 'sistema_email' GROUP BY table_schema;"
```

## ✅ Checklist de Instalación

- [ ] Node.js 20.x instalado
- [ ] MySQL instalado y configurado
- [ ] Base de datos creada y migraciones aplicadas
- [ ] Postfix instalado y configurado
- [ ] Dovecot instalado y configurado
- [ ] Usuario admin SMTP creado
- [ ] Variables de entorno configuradas
- [ ] DNS configurado (MX, A, SPF)
- [ ] Firewall configurado
- [ ] Servicios iniciados (PM2 o systemd)
- [ ] Prueba de envío exitosa
- [ ] Prueba de recepción exitosa
- [ ] Frontend accesible
- [ ] Backend accesible

## 🚀 Próximos Pasos

1. Configurar certificados SSL (Let's Encrypt)
2. Configurar backups automáticos
3. Configurar monitoreo y alertas
4. Optimizar rendimiento
5. Configurar DKIM para mejor deliverability

---

**¿Necesitas ayuda?** Revisa los logs y la sección de solución de problemas.

