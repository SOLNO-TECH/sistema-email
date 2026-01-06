# 🔧 Solución Completa: Puerto en Uso + MySQL + Migraciones

## Problemas detectados:
1. ✅ Puerto 3001 ya está en uso
2. ✅ Error de acceso a MySQL (usuario root sin permisos)
3. ✅ Las tablas no existen (necesitas ejecutar migraciones)

## Solución Completa (Ejecuta en orden):

### Paso 1: Detener el proceso que usa el puerto 3001

```bash
# Ver qué proceso está usando el puerto 3001
sudo lsof -i :3001
# O
sudo netstat -tlnp | grep :3001

# Detener todos los procesos de PM2
pm2 stop all
pm2 delete all

# Si hay otro proceso usando el puerto, matarlo:
# sudo kill -9 <PID>
# (reemplaza <PID> con el número que apareció en el comando anterior)
```

### Paso 2: Configurar MySQL correctamente

```bash
# 1. Conectarse a MySQL como root
sudo mysql -u root

# 2. Crear base de datos y usuario (en MySQL):
CREATE DATABASE IF NOT EXISTS sistema_email CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'sistema_email_user'@'localhost' IDENTIFIED BY 'PasswordSeguro123!';
GRANT ALL PRIVILEGES ON sistema_email.* TO 'sistema_email_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# 3. Ir al directorio del servidor
cd /root/sistema-email/server

# 4. Editar el archivo .env
nano .env
```

**En el editor, asegúrate de que esta línea esté correcta:**
```bash
DATABASE_URL="mysql://sistema_email_user:PasswordSeguro123!@localhost:3306/sistema_email"
```

**Guarda con:** `Ctrl+X`, luego `Y`, luego `Enter`

### Paso 3: Generar Prisma Client

```bash
cd /root/sistema-email/server
npx prisma generate
```

### Paso 4: Ejecutar migraciones (crear las tablas)

```bash
# Esto creará todas las tablas necesarias
npx prisma migrate deploy
```

Si obtienes error, prueba:
```bash
# Verificar que la conexión funciona
npx prisma db pull

# Si funciona, ejecutar migraciones
npx prisma migrate deploy
```

### Paso 5: Inicializar planes

```bash
npm run init-plans
```

### Paso 6: Verificar que el puerto 3001 esté libre

```bash
# Verificar que no hay nada en el puerto
sudo lsof -i :3001
# No debería mostrar nada

# Si hay algo, detenerlo:
pm2 stop all
pm2 delete all
```

### Paso 7: Iniciar el backend con PM2

```bash
cd /root/sistema-email/server
pm2 start npm --name "fylo-backend" -- start
pm2 save
```

### Paso 8: Verificar que todo funciona

```bash
# Ver estado
pm2 status

# Ver logs
pm2 logs fylo-backend --lines 30

# Deberías ver:
# "Backend corriendo en http://localhost:3001"
# Sin errores de base de datos
```

## Script Todo-en-Uno (Copia y pega)

```bash
# 1. Detener todos los procesos
pm2 stop all
pm2 delete all

# 2. Matar cualquier proceso en puerto 3001
sudo lsof -ti:3001 | xargs sudo kill -9 2>/dev/null || true

# 3. Configurar MySQL
sudo mysql -u root <<EOF
CREATE DATABASE IF NOT EXISTS sistema_email CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'sistema_email_user'@'localhost' IDENTIFIED BY 'PasswordSeguro123!';
GRANT ALL PRIVILEGES ON sistema_email.* TO 'sistema_email_user'@'localhost';
FLUSH PRIVILEGES;
EOF

# 4. Ir al servidor y configurar .env
cd /root/sistema-email/server

# 5. Verificar/actualizar DATABASE_URL
grep DATABASE_URL .env || echo 'DATABASE_URL="mysql://sistema_email_user:PasswordSeguro123!@localhost:3306/sistema_email"' >> .env
sed -i 's|DATABASE_URL=.*|DATABASE_URL="mysql://sistema_email_user:PasswordSeguro123!@localhost:3306/sistema_email"|' .env

# 6. Generar Prisma Client
npx prisma generate

# 7. Ejecutar migraciones
npx prisma migrate deploy

# 8. Inicializar planes
npm run init-plans

# 9. Iniciar backend
pm2 start npm --name "fylo-backend" -- start
pm2 save

# 10. Verificar
pm2 status
pm2 logs fylo-backend --lines 20
```

## Si sigue fallando

### Verificar conexión a MySQL manualmente:

```bash
mysql -u sistema_email_user -p'PasswordSeguro123!' sistema_email
# Si esto funciona, la conexión está bien
EXIT;
```

### Verificar que las tablas se crearon:

```bash
mysql -u sistema_email_user -p'PasswordSeguro123!' sistema_email -e "SHOW TABLES;"
# Deberías ver tablas como: User, Domain, EmailAccount, Plan, etc.
```

### Si las tablas no existen, crear manualmente:

```bash
cd /root/sistema-email/server
npx prisma migrate reset  # CUIDADO: Esto borra todos los datos
npx prisma migrate deploy
```

