# 🚀 Iniciar Backend en Producción

## Problema
Solo ves el frontend en `pm2 status`, pero el backend no está corriendo.

## Solución Rápida

Ejecuta estos comandos en tu VPS:

```bash
# 1. Ir al directorio del servidor
cd /root/sistema-email/server

# 2. Verificar que existe el archivo .env
ls -la .env

# 3. Si no existe, crearlo desde el ejemplo
cp DEPLOY_ENV.example .env
nano .env
# Configura las variables necesarias (DATABASE_URL, JWT_SECRET, etc.)

# 4. Verificar que las dependencias estén instaladas
npm install

# 5. Generar Prisma Client (si es necesario)
npx prisma generate

# 6. Iniciar el backend con PM2
pm2 start npm --name "fylo-backend" -- start

# 7. Guardar la configuración de PM2
pm2 save

# 8. Verificar que ambos estén corriendo
pm2 status
```

## Verificación

Después de iniciar, deberías ver algo como:

```
┌─────┬──────────────────────┬─────────────┬─────────┬─────────┬──────────┐
│ id  │ name                 │ mode        │ ↺       │ status  │ cpu      │
├─────┼──────────────────────┼─────────────┼─────────┼─────────┼──────────┤
│ 0   │ fylo-backend         │ fork        │ 0       │ online  │ 0%       │
│ 1   │ sistema-email-client │ fork        │ 0       │ online  │ 0%       │
└─────┴──────────────────────┴─────────────┴─────────┴─────────┴──────────┘
```

## Ver Logs

```bash
# Ver logs del backend
pm2 logs fylo-backend

# Ver logs de ambos
pm2 logs

# Ver solo errores
pm2 logs fylo-backend --err

# Ver en tiempo real
pm2 logs fylo-backend --lines 50
```

## Si el Backend No Inicia

### Verificar errores:
```bash
pm2 logs fylo-backend --err --lines 100
```

### Problemas comunes:

1. **Error: "Cannot find module"**
   ```bash
   cd /root/sistema-email/server
   npm install
   ```

2. **Error: "Prisma Client"**
   ```bash
   cd /root/sistema-email/server
   npx prisma generate
   ```

3. **Error: "Cannot connect to database"**
   - Verifica que MySQL esté corriendo: `sudo systemctl status mysql`
   - Verifica el `DATABASE_URL` en `server/.env`

4. **Error: "Port 3001 already in use"**
   ```bash
   # Ver qué usa el puerto
   sudo netstat -tlnp | grep :3001
   # O
   sudo lsof -i :3001
   # Matar el proceso si es necesario
   sudo kill -9 <PID>
   ```

## Reiniciar Todo

```bash
# Detener todo
pm2 stop all

# Reiniciar todo
pm2 restart all

# O solo el backend
pm2 restart fylo-backend
```

