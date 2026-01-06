# 🚀 Instalación Completa - Puerto 3002

## ✅ Cambios Realizados

- ✅ Backend cambió de puerto 3001 → **3002**
- ✅ Todas las configuraciones actualizadas
- ✅ Prisma y migraciones preparados
- ✅ Configuración lista para producción

## 📋 Instalación Completa desde Cero

### Paso 1: Limpiar Todo

```bash
# Conectarse a tu VPS
ssh root@TU_IP_VPS

# Limpiar procesos anteriores
pm2 stop all 2>/dev/null
pm2 delete all 2>/dev/null
pm2 kill 2>/dev/null
sudo lsof -ti:3000 | xargs sudo kill -9 2>/dev/null || true
sudo lsof -ti:3002 | xargs sudo kill -9 2>/dev/null || true
sleep 2

echo "✅ Limpieza completada"
```

### Paso 2: Configurar MySQL

```bash
# Conectarse a MySQL y crear base de datos
sudo mysql -u root <<EOF
CREATE DATABASE IF NOT EXISTS sistema_email CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
DROP USER IF EXISTS 'sistema_email_user'@'localhost';
CREATE USER 'sistema_email_user'@'localhost' IDENTIFIED BY 'PasswordSeguro123!';
GRANT ALL PRIVILEGES ON sistema_email.* TO 'sistema_email_user'@'localhost';
FLUSH PRIVILEGES;
SHOW DATABASES;
EXIT;
EOF

# Verificar conexión
mysql -u sistema_email_user -p'PasswordSeguro123!' -e "USE sistema_email; SELECT 1;" && echo "✅ MySQL configurado correctamente"
```

### Paso 3: Configurar Backend

```bash
# Ir al directorio del servidor
cd /root/sistema-email/server

# Crear archivo .env completo
cat > .env <<'ENVFILE'
# Base de datos MySQL
DATABASE_URL="mysql://sistema_email_user:PasswordSeguro123!@localhost:3306/sistema_email"

# JWT Secret (generar uno seguro)
JWT_SECRET="$(openssl rand -base64 32)"

# Puertos del servidor
PORT=3002
BACKEND_PORT=3002
FRONTEND_PORT=3000
NODE_ENV=production

# URL del Frontend (para CORS)
FRONTEND_URL="http://localhost:3000"

# Email SMTP (Postfix local)
EMAIL_SMTP_HOST="localhost"
EMAIL_SMTP_PORT="587"
EMAIL_SMTP_USER="admin@fylomail.es"
EMAIL_SMTP_PASSWORD="tu_contraseña_smtp_aqui"

# IMAP
IMAP_HOST="localhost"
IMAP_PORT="993"
IMAP_SECURE="true"

# Sincronización automática de correos
ENABLE_EMAIL_SYNC="true"
EMAIL_SYNC_INTERVAL="5"
ENVFILE

# Generar JWT_SECRET
JWT_SECRET_GENERADO=$(openssl rand -base64 32)
sed -i "s|\$(openssl rand -base64 32)|${JWT_SECRET_GENERADO}|" .env

echo "✅ Archivo .env creado"
cat .env | grep -v "PASSWORD\|SECRET"  # Mostrar sin contraseñas
```

### Paso 4: Instalar Dependencias y Configurar Prisma

```bash
cd /root/sistema-email/server

# 1. Instalar dependencias
echo "📦 Instalando dependencias..."
npm install

# 2. Generar Prisma Client
echo "🔨 Generando Prisma Client..."
export NODE_OPTIONS="--max-old-space-size=4096"
npx prisma generate

# Verificar que se generó correctamente
if [ -d "node_modules/.prisma/client" ]; then
    echo "✅ Prisma Client generado correctamente"
else
    echo "❌ Error generando Prisma Client"
    exit 1
fi
```

### Paso 5: Ejecutar Migraciones (Crear Tablas)

```bash
cd /root/sistema-email/server

# Opción 1: Usar migrate deploy (recomendado para producción)
echo "🗄️ Ejecutando migraciones..."
npx prisma migrate deploy

# Si migrate deploy falla, usar db push:
# npx prisma db push --accept-data-loss

# Verificar que las tablas se crearon
mysql -u sistema_email_user -p'PasswordSeguro123!' -e "USE sistema_email; SHOW TABLES;" && echo "✅ Tablas creadas correctamente"
```

### Paso 6: Inicializar Datos (Planes)

```bash
cd /root/sistema-email/server

# Inicializar planes en la base de datos
echo "📋 Inicializando planes..."
npm run init-plans

echo "✅ Planes inicializados"
```

### Paso 7: Iniciar Backend con PM2

```bash
cd /root/sistema-email/server

# Verificar que el puerto 3002 está libre
sudo lsof -i :3002 || echo "✅ Puerto 3002 libre"

# Iniciar el backend
echo "🚀 Iniciando backend en puerto 3002..."
pm2 start npm --name "fylo-backend" -- start
pm2 save

# Esperar unos segundos
sleep 5

# Ver logs
echo "📊 Logs del Backend:"
pm2 logs fylo-backend --lines 20 --nostream

# Verificar estado
pm2 status
```

### Paso 8: Configurar Frontend

```bash
# Ir al directorio del cliente
cd /root/sistema-email/client

# Obtener IP del servidor
IP=$(curl -s ifconfig.me || echo "localhost")
echo "🌐 IP del servidor: $IP"

# Crear archivo .env.local
cat > .env.local <<EOF
NEXT_PUBLIC_API_URL=http://${IP}:3002
EOF

echo "✅ Archivo .env.local creado con: NEXT_PUBLIC_API_URL=http://${IP}:3002"

# Instalar dependencias
echo "📦 Instalando dependencias del frontend..."
npm install

# Construir el frontend
echo "🏗️ Construyendo frontend..."
npm run build

# Verificar que se construyó
if [ -d ".next" ]; then
    echo "✅ Frontend construido correctamente"
else
    echo "❌ Error construyendo frontend"
    exit 1
fi
```

### Paso 9: Iniciar Frontend con PM2

```bash
cd /root/sistema-email/client

# Verificar que el puerto 3000 está libre
sudo lsof -i :3000 || echo "✅ Puerto 3000 libre"

# Iniciar el frontend
echo "🚀 Iniciando frontend..."
pm2 start npm --name "fylo-frontend" -- start
pm2 save

# Esperar unos segundos
sleep 5

# Ver logs
echo "📊 Logs del Frontend:"
pm2 logs fylo-frontend --lines 20 --nostream

# Verificar estado
pm2 status
```

### Paso 10: Verificación Final

```bash
# Ver estado de todos los procesos
echo "📊 Estado de PM2:"
pm2 status

# Ver logs combinados
echo ""
echo "📊 Últimos logs:"
pm2 logs --lines 10 --nostream

# Probar la API
echo ""
echo "🧪 Probando API del backend:"
curl -s http://localhost:3002/api/auth/me | head -c 200
echo ""

# Verificar tablas en la base de datos
echo ""
echo "🗄️ Tablas en la base de datos:"
mysql -u sistema_email_user -p'PasswordSeguro123!' -e "USE sistema_email; SHOW TABLES;"

# Mostrar información de acceso
IP=$(curl -s ifconfig.me || echo "localhost")
echo ""
echo "✅ Instalación completada!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 Frontend: http://${IP}:3000"
echo "🔧 Backend:  http://${IP}:3002"
echo "📊 PM2 Status: pm2 status"
echo "📝 Logs Backend: pm2 logs fylo-backend"
echo "📝 Logs Frontend: pm2 logs fylo-frontend"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
```

## 🔧 Script Todo-en-Uno (Copia y Pega)

```bash
#!/bin/bash

set -e  # Salir si hay error

echo "🚀 Iniciando instalación completa..."
echo ""

# Paso 1: Limpiar
echo "🧹 Paso 1/10: Limpiando procesos anteriores..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
pm2 kill 2>/dev/null || true
sudo lsof -ti:3000 | xargs sudo kill -9 2>/dev/null || true
sudo lsof -ti:3002 | xargs sudo kill -9 2>/dev/null || true
sleep 2

# Paso 2: MySQL
echo "📦 Paso 2/10: Configurando MySQL..."
sudo mysql -u root <<MYSQL
CREATE DATABASE IF NOT EXISTS sistema_email CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
DROP USER IF EXISTS 'sistema_email_user'@'localhost';
CREATE USER 'sistema_email_user'@'localhost' IDENTIFIED BY 'PasswordSeguro123!';
GRANT ALL PRIVILEGES ON sistema_email.* TO 'sistema_email_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
MYSQL
mysql -u sistema_email_user -p'PasswordSeguro123!' -e "USE sistema_email; SELECT 1;" >/dev/null 2>&1 || { echo "❌ Error en MySQL"; exit 1; }

# Paso 3: Backend .env
echo "⚙️  Paso 3/10: Configurando backend..."
cd /root/sistema-email/server
JWT_SECRET=$(openssl rand -base64 32)
cat > .env <<EOF
DATABASE_URL="mysql://sistema_email_user:PasswordSeguro123!@localhost:3306/sistema_email"
JWT_SECRET="${JWT_SECRET}"
PORT=3002
BACKEND_PORT=3002
FRONTEND_PORT=3000
NODE_ENV=production
FRONTEND_URL="http://localhost:3000"
EMAIL_SMTP_HOST="localhost"
EMAIL_SMTP_PORT="587"
EMAIL_SMTP_USER="admin@fylomail.es"
EMAIL_SMTP_PASSWORD="tu_contraseña_smtp"
IMAP_HOST="localhost"
IMAP_PORT="993"
IMAP_SECURE="true"
ENABLE_EMAIL_SYNC="true"
EMAIL_SYNC_INTERVAL="5"
EOF

# Paso 4: Dependencias y Prisma
echo "📚 Paso 4/10: Instalando dependencias del backend..."
npm install
export NODE_OPTIONS="--max-old-space-size=4096"
npx prisma generate

# Paso 5: Migraciones
echo "🗄️  Paso 5/10: Ejecutando migraciones..."
npx prisma migrate deploy || npx prisma db push --accept-data-loss

# Paso 6: Inicializar planes
echo "📋 Paso 6/10: Inicializando planes..."
npm run init-plans

# Paso 7: Iniciar Backend
echo "🚀 Paso 7/10: Iniciando backend..."
pm2 start npm --name "fylo-backend" -- start
pm2 save
sleep 5

# Paso 8: Frontend .env
echo "🌐 Paso 8/10: Configurando frontend..."
cd /root/sistema-email/client
IP=$(curl -s ifconfig.me || echo "localhost")
echo "NEXT_PUBLIC_API_URL=http://${IP}:3002" > .env.local

# Paso 9: Construir Frontend
echo "🏗️  Paso 9/10: Construyendo frontend..."
npm install
npm run build

# Paso 10: Iniciar Frontend
echo "🚀 Paso 10/10: Iniciando frontend..."
pm2 start npm --name "fylo-frontend" -- start
pm2 save
sleep 5

# Verificación
echo ""
echo "✅ Instalación completada!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
pm2 status
echo ""
IP=$(curl -s ifconfig.me || echo "localhost")
echo "🌐 Frontend: http://${IP}:3000"
echo "🔧 Backend:  http://${IP}:3002"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
```

## 🔍 Verificación y Troubleshooting

### Verificar que todo funciona:

```bash
# 1. Ver estado
pm2 status

# 2. Ver logs
pm2 logs --lines 30

# 3. Probar API
curl http://localhost:3002/api/auth/me

# 4. Verificar tablas
mysql -u sistema_email_user -p'PasswordSeguro123!' -e "USE sistema_email; SHOW TABLES;"
```

### Si algo falla:

**Error de Prisma:**
```bash
cd /root/sistema-email/server
export NODE_OPTIONS="--max-old-space-size=4096"
rm -rf node_modules/.prisma
npx prisma generate
```

**Error de puerto ocupado:**
```bash
sudo lsof -i :3002
sudo kill -9 <PID>
```

**Error de MySQL:**
```bash
sudo systemctl status mysql
sudo systemctl restart mysql
mysql -u sistema_email_user -p'PasswordSeguro123!' -e "SELECT 1;"
```

**Reinstalar desde cero:**
```bash
pm2 delete all
cd /root/sistema-email/server
rm -rf node_modules .env
cd ../client
rm -rf node_modules .next .env.local
# Luego ejecutar el script de arriba
```

## 📝 Comandos Útiles

```bash
# Reiniciar todo
pm2 restart all

# Ver logs en tiempo real
pm2 logs

# Detener todo
pm2 stop all

# Reiniciar específico
pm2 restart fylo-backend
pm2 restart fylo-frontend

# Ver logs específicos
pm2 logs fylo-backend --lines 50
pm2 logs fylo-frontend --lines 50
```

