# 🚀 Instalación Final - VPS (Puerto 3001)

## ✅ Configuración Verificada
- ✅ Backend: Puerto **3001**
- ✅ Frontend: Puerto **3000**
- ✅ Prisma y migraciones configurados
- ✅ Todas las configuraciones sincronizadas

## 📋 Instalación Completa Paso a Paso

### Paso 1: Limpiar Todo

```bash
# Conectarse a tu VPS
ssh root@TU_IP_VPS

# Limpiar procesos anteriores
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
pm2 kill 2>/dev/null || true
sudo lsof -ti:3000 | xargs sudo kill -9 2>/dev/null || true
sudo lsof -ti:3001 | xargs sudo kill -9 2>/dev/null || true
sleep 2
echo "✅ Limpieza completada"
```

### Paso 2: Actualizar Código desde GitHub

```bash
cd /root/sistema-email
git pull origin main

# Verificar que se actualizó
git log --oneline -1
echo "✅ Código actualizado"
```

### Paso 3: Configurar MySQL

```bash
# Crear base de datos y usuario
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

### Paso 4: Configurar Backend (.env)

```bash
cd /root/sistema-email/server

# Generar JWT_SECRET seguro
JWT_SECRET=$(openssl rand -base64 32)

# Crear archivo .env completo
cat > .env <<ENVFILE
# Base de datos MySQL
DATABASE_URL="mysql://sistema_email_user:PasswordSeguro123!@localhost:3306/sistema_email"

# JWT Secret
JWT_SECRET="${JWT_SECRET}"

# Puertos
PORT=3001
BACKEND_PORT=3001
FRONTEND_PORT=3000
NODE_ENV=production

# Frontend URL (para CORS)
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

# Sincronización automática
ENABLE_EMAIL_SYNC="true"
EMAIL_SYNC_INTERVAL="5"
ENVFILE

echo "✅ Archivo .env creado"
cat .env | grep -v "PASSWORD\|SECRET"  # Mostrar sin contraseñas
```

### Paso 5: Instalar Dependencias y Prisma

```bash
cd /root/sistema-email/server

# Instalar dependencias
echo "📦 Instalando dependencias del backend..."
npm install

# Generar Prisma Client (con más memoria)
echo "🔨 Generando Prisma Client..."
export NODE_OPTIONS="--max-old-space-size=4096"
npx prisma generate

# Verificar que se generó
if [ -d "node_modules/.prisma/client" ]; then
    echo "✅ Prisma Client generado correctamente"
else
    echo "❌ Error generando Prisma Client"
    exit 1
fi
```

### Paso 6: Ejecutar Migraciones

```bash
cd /root/sistema-email/server

# Ejecutar migraciones
echo "🗄️ Ejecutando migraciones de Prisma..."
npx prisma migrate deploy

# Si migrate deploy falla, usar push (solo primera vez)
# npx prisma db push --accept-data-loss

# Verificar que las tablas se crearon
echo "📋 Verificando tablas creadas..."
mysql -u sistema_email_user -p'PasswordSeguro123!' -e "USE sistema_email; SHOW TABLES;" && echo "✅ Tablas creadas correctamente"
```

### Paso 7: Inicializar Datos (Planes)

```bash
cd /root/sistema-email/server

# Inicializar planes en la base de datos
echo "📋 Inicializando planes..."
npm run init-plans

echo "✅ Planes inicializados"
```

### Paso 8: Verificar Puerto y Iniciar Backend

```bash
cd /root/sistema-email/server

# Verificar que el puerto 3001 está libre
sudo lsof -i :3001 || echo "✅ Puerto 3001 libre"

# Si está ocupado, matarlo
# sudo lsof -ti:3001 | xargs sudo kill -9

# Iniciar backend con PM2
echo "🚀 Iniciando backend en puerto 3001..."
pm2 start npm --name "fylo-backend" -- start
pm2 save

# Esperar a que inicie
sleep 5

# Ver logs
echo "📊 Logs del Backend:"
pm2 logs fylo-backend --lines 20 --nostream

# Verificar estado
pm2 status
```

### Paso 9: Configurar Frontend

```bash
cd /root/sistema-email/client

# Obtener IP del servidor
IP=$(curl -s ifconfig.me || echo "localhost")
echo "🌐 IP del servidor: $IP"

# Crear archivo .env.local
cat > .env.local <<EOF
NEXT_PUBLIC_API_URL=http://${IP}:3001
EOF

echo "✅ Archivo .env.local creado"
echo "   NEXT_PUBLIC_API_URL=http://${IP}:3001"

# Instalar dependencias
echo "📦 Instalando dependencias del frontend..."
npm install

# Construir el frontend
echo "🏗️ Construyendo frontend (esto puede tardar unos minutos)..."
npm run build

# Verificar que se construyó
if [ -d ".next" ]; then
    echo "✅ Frontend construido correctamente"
else
    echo "❌ Error construyendo frontend"
    exit 1
fi
```

### Paso 10: Iniciar Frontend

```bash
cd /root/sistema-email/client

# Verificar que el puerto 3000 está libre
sudo lsof -i :3000 || echo "✅ Puerto 3000 libre"

# Iniciar frontend con PM2
echo "🚀 Iniciando frontend..."
pm2 start npm --name "fylo-frontend" -- start
pm2 save

# Esperar a que inicie
sleep 5

# Ver logs
echo "📊 Logs del Frontend:"
pm2 logs fylo-frontend --lines 20 --nostream

# Verificar estado
pm2 status
```

### Paso 11: Verificación Final

```bash
# Ver estado de todos los procesos
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Estado de PM2:"
pm2 status

# Probar API del backend
echo ""
echo "🧪 Probando API del backend:"
curl -s http://localhost:3001/api/auth/me | head -c 200
echo ""

# Verificar tablas
echo ""
echo "🗄️ Tablas en la base de datos:"
mysql -u sistema_email_user -p'PasswordSeguro123!' -e "USE sistema_email; SHOW TABLES;"

# Información de acceso
IP=$(curl -s ifconfig.me || echo "localhost")
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Instalación completada!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🌐 Frontend: http://${IP}:3000"
echo "🔧 Backend:  http://${IP}:3001"
echo ""
echo "📝 Comandos útiles:"
echo "   pm2 status              - Ver estado"
echo "   pm2 logs                - Ver logs"
echo "   pm2 restart all         - Reiniciar todo"
echo "   pm2 logs fylo-backend   - Logs del backend"
echo "   pm2 logs fylo-frontend  - Logs del frontend"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
```

## 🚀 Script Todo-en-Uno (Copia y Pega)

```bash
#!/bin/bash
set -e  # Salir si hay error

echo "🚀 Instalación Completa del Sistema"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Paso 1: Limpiar
echo "🧹 [1/11] Limpiando procesos anteriores..."
pm2 stop all 2>/dev/null || true
pm2 delete all 2>/dev/null || true
pm2 kill 2>/dev/null || true
sudo lsof -ti:3000 | xargs sudo kill -9 2>/dev/null || true
sudo lsof -ti:3001 | xargs sudo kill -9 2>/dev/null || true
sleep 2

# Paso 2: Actualizar código
echo "📥 [2/11] Actualizando código desde GitHub..."
cd /root/sistema-email
git pull origin main

# Paso 3: MySQL
echo "📦 [3/11] Configurando MySQL..."
sudo mysql -u root <<MYSQL
CREATE DATABASE IF NOT EXISTS sistema_email CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
DROP USER IF EXISTS 'sistema_email_user'@'localhost';
CREATE USER 'sistema_email_user'@'localhost' IDENTIFIED BY 'PasswordSeguro123!';
GRANT ALL PRIVILEGES ON sistema_email.* TO 'sistema_email_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
MYSQL
mysql -u sistema_email_user -p'PasswordSeguro123!' -e "USE sistema_email; SELECT 1;" >/dev/null 2>&1 || { echo "❌ Error en MySQL"; exit 1; }

# Paso 4: Backend .env
echo "⚙️  [4/11] Configurando backend..."
cd /root/sistema-email/server
JWT_SECRET=$(openssl rand -base64 32)
cat > .env <<EOF
DATABASE_URL="mysql://sistema_email_user:PasswordSeguro123!@localhost:3306/sistema_email"
JWT_SECRET="${JWT_SECRET}"
PORT=3001
BACKEND_PORT=3001
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

# Paso 5: Dependencias Backend
echo "📚 [5/11] Instalando dependencias del backend..."
npm install
export NODE_OPTIONS="--max-old-space-size=4096"
npx prisma generate || { echo "❌ Error generando Prisma"; exit 1; }

# Paso 6: Migraciones
echo "🗄️  [6/11] Ejecutando migraciones..."
npx prisma migrate deploy || npx prisma db push --accept-data-loss || { echo "❌ Error en migraciones"; exit 1; }

# Paso 7: Inicializar planes
echo "📋 [7/11] Inicializando planes..."
npm run init-plans || echo "⚠️  Warning: Error inicializando planes (puede continuar)"

# Paso 8: Iniciar Backend
echo "🚀 [8/11] Iniciando backend..."
sudo lsof -ti:3001 | xargs sudo kill -9 2>/dev/null || true
pm2 start npm --name "fylo-backend" -- start
pm2 save
sleep 5

# Paso 9: Frontend .env
echo "🌐 [9/11] Configurando frontend..."
cd /root/sistema-email/client
IP=$(curl -s ifconfig.me || echo "localhost")
echo "NEXT_PUBLIC_API_URL=http://${IP}:3001" > .env.local

# Paso 10: Construir Frontend
echo "🏗️  [10/11] Construyendo frontend..."
npm install
npm run build || { echo "❌ Error construyendo frontend"; exit 1; }

# Paso 11: Iniciar Frontend
echo "🚀 [11/11] Iniciando frontend..."
sudo lsof -ti:3000 | xargs sudo kill -9 2>/dev/null || true
pm2 start npm --name "fylo-frontend" -- start
pm2 save
sleep 5

# Verificación
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Instalación completada!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
pm2 status
echo ""
IP=$(curl -s ifconfig.me || echo "localhost")
echo "🌐 Frontend: http://${IP}:3000"
echo "🔧 Backend:  http://${IP}:3001"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
```

## 🔍 Troubleshooting

### Si Prisma falla:
```bash
cd /root/sistema-email/server
export NODE_OPTIONS="--max-old-space-size=4096"
rm -rf node_modules/.prisma
npm install
npx prisma generate
npx prisma db push --accept-data-loss
```

### Si el puerto está ocupado:
```bash
# Ver qué usa el puerto
sudo lsof -i :3001

# Matarlo
sudo lsof -ti:3001 | xargs sudo kill -9
```

### Si MySQL falla:
```bash
sudo systemctl status mysql
sudo systemctl restart mysql
mysql -u sistema_email_user -p'PasswordSeguro123!' -e "SELECT 1;"
```

### Si el build del frontend falla:
```bash
cd /root/sistema-email/client
rm -rf .next node_modules package-lock.json
npm install
npm run build
```

## 📝 Comandos Útiles Post-Instalación

```bash
# Ver estado
pm2 status

# Ver logs
pm2 logs

# Reiniciar todo
pm2 restart all

# Detener todo
pm2 stop all

# Ver logs específicos
pm2 logs fylo-backend --lines 50
pm2 logs fylo-frontend --lines 50

# Reiniciar específico
pm2 restart fylo-backend
pm2 restart fylo-frontend
```

## ✅ Checklist de Verificación

- [ ] MySQL configurado y funcionando
- [ ] Archivo `.env` del backend creado
- [ ] Prisma Client generado
- [ ] Migraciones ejecutadas (tablas creadas)
- [ ] Planes inicializados
- [ ] Backend corriendo en puerto 3001
- [ ] Archivo `.env.local` del frontend creado
- [ ] Frontend construido (carpeta `.next` existe)
- [ ] Frontend corriendo en puerto 3000
- [ ] Ambos procesos visibles en `pm2 status`
- [ ] API del backend responde en `/api/auth/me`

