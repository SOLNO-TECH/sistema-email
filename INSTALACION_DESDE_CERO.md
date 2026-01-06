# 🚀 Instalación Completa desde Cero en VPS

## Limpiar Todo Primero

```bash
# 1. Detener y eliminar todos los procesos de PM2
pm2 stop all
pm2 delete all
pm2 kill

# 2. Matar cualquier proceso en puertos 3000 y 3001
sudo lsof -ti:3000 | xargs sudo kill -9 2>/dev/null || true
sudo lsof -ti:3001 | xargs sudo kill -9 2>/dev/null || true

# 3. Verificar que los puertos están libres
sudo lsof -i :3000 || echo "✅ Puerto 3000 libre"
sudo lsof -i :3001 || echo "✅ Puerto 3001 libre"
```

## Paso 1: Configurar MySQL

```bash
# 1. Conectarse a MySQL
sudo mysql -u root

# 2. En MySQL, ejecutar estos comandos:
CREATE DATABASE IF NOT EXISTS sistema_email CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
DROP USER IF EXISTS 'sistema_email_user'@'localhost';
CREATE USER 'sistema_email_user'@'localhost' IDENTIFIED BY 'PasswordSeguro123!';
GRANT ALL PRIVILEGES ON sistema_email.* TO 'sistema_email_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# 3. Verificar que funciona
mysql -u sistema_email_user -p'PasswordSeguro123!' -e "USE sistema_email; SELECT 1;" && echo "✅ MySQL configurado correctamente"
```

## Paso 2: Configurar Backend

```bash
# 1. Ir al directorio del servidor
cd /root/sistema-email/server

# 2. Crear archivo .env desde cero
cat > .env <<'EOF'
# Base de datos
DATABASE_URL="mysql://sistema_email_user:PasswordSeguro123!@localhost:3306/sistema_email"

# JWT
JWT_SECRET="$(openssl rand -base64 32)"

# Servidor
PORT=3001
BACKEND_PORT=3001
FRONTEND_PORT=3000
NODE_ENV=production

# Frontend URL
FRONTEND_URL="http://localhost:3000"

# Email SMTP (Postfix local)
EMAIL_SMTP_HOST="localhost"
EMAIL_SMTP_PORT="587"
EMAIL_SMTP_USER="admin@fylomail.es"
EMAIL_SMTP_PASSWORD="tu_contraseña_smtp"

# IMAP
IMAP_HOST="localhost"
IMAP_PORT="993"
IMAP_SECURE="true"

# Sincronización
ENABLE_EMAIL_SYNC="true"
EMAIL_SYNC_INTERVAL="5"
EOF

# 3. Instalar dependencias (si no están instaladas)
npm install

# 4. Generar Prisma Client
npx prisma generate

# 5. Ejecutar migraciones (crear tablas)
npx prisma migrate deploy

# 6. Si migrate falla, usar push
# npx prisma db push --accept-data-loss

# 7. Verificar que las tablas se crearon
mysql -u sistema_email_user -p'PasswordSeguro123!' -e "USE sistema_email; SHOW TABLES;"

# 8. Inicializar planes
npm run init-plans
```

## Paso 3: Iniciar Backend con PM2

```bash
# 1. Asegurarse de estar en el directorio del servidor
cd /root/sistema-email/server

# 2. Verificar que el puerto 3001 está libre
sudo lsof -i :3001 || echo "✅ Puerto 3001 libre"

# 3. Iniciar el backend
pm2 start npm --name "fylo-backend" -- start

# 4. Guardar configuración
pm2 save

# 5. Ver logs
pm2 logs fylo-backend --lines 30

# 6. Verificar que está corriendo
pm2 status
```

## Paso 4: Configurar Frontend

```bash
# 1. Ir al directorio del cliente
cd /root/sistema-email/client

# 2. Crear archivo .env.local
cat > .env.local <<'EOF'
NEXT_PUBLIC_API_URL=http://TU_IP_VPS:3001
EOF

# Reemplazar TU_IP_VPS con tu IP real
# Obtener IP: curl -s ifconfig.me
# O usar: http://localhost:3001 si frontend y backend están en la misma máquina

# 3. Instalar dependencias (si no están instaladas)
npm install

# 4. Construir el frontend
npm run build

# 5. Verificar que el puerto 3000 está libre
sudo lsof -i :3000 || echo "✅ Puerto 3000 libre"

# 6. Iniciar el frontend
pm2 start npm --name "fylo-frontend" -- start

# 7. Guardar configuración
pm2 save

# 8. Ver logs
pm2 logs fylo-frontend --lines 30

# 9. Verificar que está corriendo
pm2 status
```

## Paso 5: Verificar Todo

```bash
# 1. Ver estado de todos los procesos
pm2 status

# Deberías ver:
# - fylo-backend: online
# - fylo-frontend: online

# 2. Ver logs del backend
pm2 logs fylo-backend --lines 20

# Deberías ver:
# "Backend corriendo en http://localhost:3001"

# 3. Ver logs del frontend
pm2 logs fylo-frontend --lines 20

# 4. Probar la API
curl http://localhost:3001/api/auth/me

# 5. Verificar tablas en la base de datos
mysql -u sistema_email_user -p'PasswordSeguro123!' -e "USE sistema_email; SHOW TABLES;"
```

## Script Todo-en-Uno (Copia y Pega)

```bash
#!/bin/bash

echo "🧹 Limpiando procesos anteriores..."
pm2 stop all 2>/dev/null
pm2 delete all 2>/dev/null
pm2 kill 2>/dev/null
sudo lsof -ti:3000 | xargs sudo kill -9 2>/dev/null || true
sudo lsof -ti:3001 | xargs sudo kill -9 2>/dev/null || true
sleep 2

echo "📦 Configurando MySQL..."
sudo mysql -u root <<MYSQL
CREATE DATABASE IF NOT EXISTS sistema_email CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
DROP USER IF EXISTS 'sistema_email_user'@'localhost';
CREATE USER 'sistema_email_user'@'localhost' IDENTIFIED BY 'PasswordSeguro123!';
GRANT ALL PRIVILEGES ON sistema_email.* TO 'sistema_email_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
MYSQL

echo "🔧 Configurando Backend..."
cd /root/sistema-email/server

# Crear .env
cat > .env <<EOF
DATABASE_URL="mysql://sistema_email_user:PasswordSeguro123!@localhost:3306/sistema_email"
JWT_SECRET="$(openssl rand -base64 32)"
PORT=3001
NODE_ENV=production
FRONTEND_URL="http://localhost:3000"
EMAIL_SMTP_HOST="localhost"
EMAIL_SMTP_PORT="587"
IMAP_HOST="localhost"
IMAP_PORT="993"
IMAP_SECURE="true"
ENABLE_EMAIL_SYNC="true"
EMAIL_SYNC_INTERVAL="5"
EOF

echo "📚 Instalando dependencias del backend..."
npm install

echo "🔨 Generando Prisma Client..."
npx prisma generate

echo "🗄️ Ejecutando migraciones..."
npx prisma migrate deploy || npx prisma db push --accept-data-loss

echo "📋 Inicializando planes..."
npm run init-plans

echo "🚀 Iniciando Backend..."
pm2 start npm --name "fylo-backend" -- start
pm2 save

echo "🌐 Configurando Frontend..."
cd /root/sistema-email/client

# Obtener IP
IP=$(curl -s ifconfig.me || echo "localhost")
echo "NEXT_PUBLIC_API_URL=http://${IP}:3001" > .env.local

echo "📚 Instalando dependencias del frontend..."
npm install

echo "🏗️ Construyendo frontend..."
npm run build

echo "🚀 Iniciando Frontend..."
pm2 start npm --name "fylo-frontend" -- start
pm2 save

echo "✅ Verificando..."
sleep 3
pm2 status
echo ""
echo "📊 Logs del Backend:"
pm2 logs fylo-backend --lines 10 --nostream
echo ""
echo "📊 Logs del Frontend:"
pm2 logs fylo-frontend --lines 10 --nostream
echo ""
echo "✅ Instalación completada!"
echo "🌐 Frontend: http://${IP}:3000"
echo "🔧 Backend: http://${IP}:3001"
```

## Comandos Útiles

```bash
# Ver estado
pm2 status

# Ver logs en tiempo real
pm2 logs

# Reiniciar todo
pm2 restart all

# Detener todo
pm2 stop all

# Ver logs específicos
pm2 logs fylo-backend
pm2 logs fylo-frontend

# Reiniciar específico
pm2 restart fylo-backend
pm2 restart fylo-frontend
```

## Solución de Problemas

### Si Prisma falla:
```bash
cd /root/sistema-email/server
export NODE_OPTIONS="--max-old-space-size=4096"
npx prisma generate
npx prisma db push --accept-data-loss
```

### Si el puerto sigue ocupado:
```bash
sudo fuser -k 3000/tcp
sudo fuser -k 3001/tcp
pm2 kill
pm2 resurrect
```

### Si MySQL falla:
```bash
# Verificar que MySQL está corriendo
sudo systemctl status mysql

# Reiniciar MySQL
sudo systemctl restart mysql

# Probar conexión
mysql -u sistema_email_user -p'PasswordSeguro123!' -e "SELECT 1;"
```

