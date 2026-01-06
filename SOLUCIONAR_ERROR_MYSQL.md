# 🔧 Solucionar Error de Acceso a MySQL

## Error
```
ERROR 28000 (1698): Access denied for user 'root'@'localhost'
```

## Solución

El problema es que MySQL está rechazando el acceso del usuario 'root'. Necesitas crear un usuario específico para la aplicación.

### Opción 1: Usar el usuario creado por setup-database.sh (Recomendado)

Si ya ejecutaste `setup-database.sh`, deberías tener un usuario `sistema_email_user`. Verifica y actualiza el `.env`:

```bash
# 1. Ir al directorio del servidor
cd /root/sistema-email/server

# 2. Verificar el archivo .env
nano .env

# 3. Asegúrate de que DATABASE_URL tenga este formato:
# DATABASE_URL="mysql://sistema_email_user:TU_PASSWORD@localhost:3306/sistema_email"
# 
# Reemplaza TU_PASSWORD con la contraseña que configuraste al ejecutar setup-database.sh
```

### Opción 2: Crear un nuevo usuario manualmente

Si no tienes un usuario específico, créalo así:

```bash
# 1. Conectarte a MySQL como root
sudo mysql -u root

# 2. Crear el usuario y la base de datos (si no existe)
CREATE DATABASE IF NOT EXISTS sistema_email CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

# 3. Crear el usuario (reemplaza 'tu_password_seguro' con una contraseña segura)
CREATE USER 'sistema_email_user'@'localhost' IDENTIFIED BY 'tu_password_seguro';

# 4. Dar permisos
GRANT ALL PRIVILEGES ON sistema_email.* TO 'sistema_email_user'@'localhost';

# 5. Aplicar los cambios
FLUSH PRIVILEGES;

# 6. Salir de MySQL
EXIT;
```

### Opción 3: Configurar root para autenticación por contraseña (Alternativa)

Si prefieres usar root, configura MySQL para permitir autenticación por contraseña:

```bash
# 1. Conectarte a MySQL
sudo mysql -u root

# 2. Cambiar el método de autenticación
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'tu_password_seguro';

# 3. Aplicar los cambios
FLUSH PRIVILEGES;

# 4. Salir
EXIT;
```

**⚠️ IMPORTANTE:** Usar root no es recomendado para producción. Es mejor usar un usuario específico.

## Actualizar el archivo .env

Después de crear el usuario, actualiza el archivo `.env`:

```bash
cd /root/sistema-email/server
nano .env
```

Asegúrate de que `DATABASE_URL` tenga este formato:

```bash
DATABASE_URL="mysql://sistema_email_user:tu_password_seguro@localhost:3306/sistema_email"
```

**Ejemplo:**
```bash
DATABASE_URL="mysql://sistema_email_user:MiPassword123!@localhost:3306/sistema_email"
```

## Verificar la conexión

Después de configurar, prueba la conexión:

```bash
# 1. Reiniciar el backend
pm2 restart fylo-backend

# 2. Ver los logs
pm2 logs fylo-backend --lines 50

# 3. Si todo está bien, deberías ver:
# "Backend corriendo en http://localhost:3001"
# Sin errores de acceso a la base de datos
```

## Ejecutar migraciones de Prisma

Si es la primera vez que configuras la base de datos, necesitas ejecutar las migraciones:

```bash
cd /root/sistema-email/server

# 1. Generar Prisma Client
npx prisma generate

# 2. Ejecutar migraciones
npx prisma migrate deploy

# 3. (Opcional) Inicializar planes
npm run init-plans
```

## Verificar que todo funciona

```bash
# Ver estado de PM2
pm2 status

# Ver logs del backend
pm2 logs fylo-backend --lines 20

# Probar la API
curl http://localhost:3001/api/auth/me
```

## Solución rápida (Copia y pega)

```bash
# Conectarse a MySQL y crear usuario
sudo mysql -u root <<EOF
CREATE DATABASE IF NOT EXISTS sistema_email CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'sistema_email_user'@'localhost' IDENTIFIED BY 'CambiaEstaPassword123!';
GRANT ALL PRIVILEGES ON sistema_email.* TO 'sistema_email_user'@'localhost';
FLUSH PRIVILEGES;
EOF

# Actualizar .env (edita la contraseña si la cambiaste)
cd /root/sistema-email/server
sed -i 's|DATABASE_URL=.*|DATABASE_URL="mysql://sistema_email_user:CambiaEstaPassword123!@localhost:3306/sistema_email"|' .env

# Ejecutar migraciones
npx prisma generate
npx prisma migrate deploy

# Reiniciar backend
pm2 restart fylo-backend

# Ver logs
pm2 logs fylo-backend --lines 30
```

