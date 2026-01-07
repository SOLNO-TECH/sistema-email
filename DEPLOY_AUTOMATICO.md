# 🚀 Deploy Automático - Sin Configuración Manual

## ✅ Todo Automático

El script `deploy.sh` hace **TODO automáticamente**:
- ✅ Crea usuario MySQL: `sistema_email_user` / `SistemaEmail2024!`
- ✅ Crea base de datos: `sistema_email`
- ✅ Configura Prisma y genera el cliente
- ✅ Ejecuta todas las migraciones
- ✅ Inicializa planes
- ✅ Configura backend y frontend
- ✅ Inicia todo con PM2

**No necesitas configurar NADA manualmente.**

## 📋 Instalación en VPS (3 Pasos)

### Paso 1: Actualizar código

```bash
ssh root@TU_IP_VPS
cd /root/sistema-email
git pull origin main
```

### Paso 2: Dar permisos al script

```bash
chmod +x deploy.sh
```

### Paso 3: Ejecutar deploy

```bash
./deploy.sh
```

**¡Eso es todo!** El script hace el resto automáticamente.

## 🎯 Configuración Automática

### MySQL (Configurado automáticamente)
- **Usuario:** `sistema_email_user`
- **Contraseña:** `SistemaEmail2024!`
- **Base de datos:** `sistema_email`

### Backend
- **Puerto:** 3001
- **JWT_SECRET:** Generado automáticamente
- **DATABASE_URL:** Configurado automáticamente

### Frontend
- **Puerto:** 3000
- **API_URL:** Detectado automáticamente (tu IP)

## 📊 Después del Deploy

El script te mostrará:
- ✅ Estado de PM2
- ✅ URLs de acceso (Frontend y Backend)
- ✅ Configuración MySQL (usuario y contraseña)
- ✅ Comandos útiles

## 🔍 Verificación

Después de ejecutar el script, verifica:

```bash
# Ver estado
pm2 status

# Ver logs
pm2 logs

# Probar API
curl http://localhost:3001/api/auth/me
```

## 🆘 Si algo falla

El script muestra errores detallados. Si algo falla:

1. **Error de Prisma:**
   ```bash
   cd /root/sistema-email/server
   export NODE_OPTIONS="--max-old-space-size=6144"
   npx prisma generate
   npx prisma db push --accept-data-loss
   ```

2. **Puerto ocupado:**
   ```bash
   sudo fuser -k 3000/tcp
   sudo fuser -k 3001/tcp
   ```

3. **Reintentar deploy:**
   ```bash
   ./deploy.sh
   ```

## 📝 Ejemplo de Salida

```
🚀 Deploy Automático del Sistema
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚙️  Configuración automática:
   MySQL User: sistema_email_user
   MySQL Database: sistema_email
   Backend Port: 3001
   Frontend Port: 3000

🧹 [1/11] Limpiando procesos anteriores...
✅ Limpieza completada

📦 [2/11] Configurando MySQL automáticamente...
✅ MySQL configurado correctamente

... (continúa automáticamente)

✅ Deploy completado exitosamente!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Estado de PM2:
┌─────┬──────────────────┬─────────┬─────────┐
│ id  │ name             │ status  │ cpu     │
├─────┼──────────────────┼─────────┼─────────┤
│ 0   │ fylo-backend     │ online  │ 0%      │
│ 1   │ fylo-frontend    │ online  │ 0%      │
└─────┴──────────────────┴─────────┴─────────┘

🌐 URLs de acceso:
   Frontend: http://TU_IP:3000
   Backend:  http://TU_IP:3001

📝 Configuración MySQL:
   Usuario: sistema_email_user
   Base de datos: sistema_email
   Contraseña: SistemaEmail2024!
```

## ⚡ Instalación Ultra-Rápida

```bash
ssh root@TU_IP_VPS && \
cd /root/sistema-email && \
git pull origin main && \
chmod +x deploy.sh && \
./deploy.sh
```

**¡Un solo comando y listo!**

