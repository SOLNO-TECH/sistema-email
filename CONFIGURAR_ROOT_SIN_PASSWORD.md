# 🔧 Configurar MySQL con root sin contraseña

## Situación
- Usuario root sin contraseña
- Base de datos vacía (sin tablas)
- Prisma no puede conectarse

## Solución

### Paso 1: Verificar acceso a MySQL

```bash
# Probar conexión
sudo mysql -u root -e "SHOW DATABASES;"
```

### Paso 2: Crear la base de datos (si no existe)

```bash
sudo mysql -u root <<EOF
CREATE DATABASE IF NOT EXISTS sistema_email CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
SHOW DATABASES;
EXIT;
EOF
```

### Paso 3: Configurar DATABASE_URL sin contraseña

```bash
cd /root/sistema-email/server
nano .env
```

En el editor, configura `DATABASE_URL` así:
```bash
DATABASE_URL="mysql://root@localhost:3306/sistema_email"
```

**Nota:** Sin contraseña, solo `root@localhost`, no `root:@localhost`

Guarda con: `Ctrl+X`, luego `Y`, luego `Enter`

### Paso 4: Verificar que Prisma puede conectarse

```bash
cd /root/sistema-email/server

# Probar conexión con Prisma
npx prisma db pull --schema=./prisma/schema.prisma
```

Si esto funciona, continuar. Si falla, ve al paso de solución de problemas.

### Paso 5: Generar Prisma Client

```bash
npx prisma generate
```

### Paso 6: Ejecutar migraciones (crear tablas)

```bash
# Opción 1: Si hay migraciones en la carpeta migrations/
npx prisma migrate deploy

# Opción 2: Si no hay migraciones, crear el esquema directamente
npx prisma db push
```

### Paso 7: Verificar que las tablas se crearon

```bash
sudo mysql -u root -e "USE sistema_email; SHOW TABLES;"
```

Deberías ver tablas como: `User`, `Domain`, `Plan`, `EmailAccount`, etc.

### Paso 8: Inicializar planes

```bash
npm run init-plans
```

### Paso 9: Iniciar el backend

```bash
# Asegurarse de que el puerto 3001 esté libre
sudo lsof -ti:3001 | xargs sudo kill -9 2>/dev/null || true

# Iniciar con PM2
pm2 start npm --name "fylo-backend" -- start
pm2 save

# Ver logs
pm2 logs fylo-backend --lines 30
```

## Solución de Problemas

### Si Prisma sigue fallando con SIGKILL:

**Problema:** Falta de memoria o permisos

**Solución 1: Verificar memoria**
```bash
free -h
# Si hay menos de 1GB disponible, podría ser el problema
```

**Solución 2: Ejecutar con más tiempo**
```bash
export NODE_OPTIONS="--max-old-space-size=4096"
npx prisma generate
npx prisma migrate deploy
```

**Solución 3: Usar db push en lugar de migrate**
```bash
# Si migrate falla, usar push (solo para desarrollo/primera vez)
npx prisma db push --accept-data-loss
```

### Si la conexión falla:

**Verificar formato de DATABASE_URL:**
```bash
cd /root/sistema-email/server
cat .env | grep DATABASE_URL
# Debe ser exactamente: DATABASE_URL="mysql://root@localhost:3306/sistema_email"
```

**Probar conexión manual:**
```bash
mysql -u root -e "USE sistema_email; SELECT 1;"
```

### Si las tablas no se crean:

**Crear manualmente el esquema:**
```bash
cd /root/sistema-email/server

# 1. Ver el schema
cat prisma/schema.prisma

# 2. Usar db push para crear las tablas directamente
npx prisma db push --accept-data-loss --skip-generate

# 3. Generar el cliente
npx prisma generate
```

## Script Todo-en-Uno

```bash
# 1. Crear base de datos
sudo mysql -u root <<EOF
CREATE DATABASE IF NOT EXISTS sistema_email CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
EOF

# 2. Configurar .env
cd /root/sistema-email/server
echo 'DATABASE_URL="mysql://root@localhost:3306/sistema_email"' > .env.temp
grep -v "DATABASE_URL" .env >> .env.temp 2>/dev/null || true
mv .env.temp .env

# 3. Verificar conexión
mysql -u root -e "USE sistema_email; SELECT 1;" || echo "ERROR: No se puede conectar"

# 4. Generar Prisma Client (con más memoria)
export NODE_OPTIONS="--max-old-space-size=4096"
npx prisma generate

# 5. Crear tablas (usar push si migrate falla)
npx prisma migrate deploy || npx prisma db push --accept-data-loss

# 6. Verificar tablas
sudo mysql -u root -e "USE sistema_email; SHOW TABLES;"

# 7. Inicializar planes
npm run init-plans

# 8. Liberar puerto 3001 e iniciar
sudo lsof -ti:3001 | xargs sudo kill -9 2>/dev/null || true
pm2 stop all
pm2 delete all
pm2 start npm --name "fylo-backend" -- start
pm2 save

# 9. Verificar
pm2 status
pm2 logs fylo-backend --lines 20
```

## Nota de Seguridad

⚠️ **Usar root sin contraseña NO es recomendado para producción.**

Para producción, deberías:
1. Crear un usuario específico con contraseña
2. Dar solo los permisos necesarios
3. Usar ese usuario en el DATABASE_URL

Pero para desarrollo/pruebas, root sin contraseña funciona.

