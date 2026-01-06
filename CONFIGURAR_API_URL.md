# 🔧 Configurar URL de la API en Producción

## Problema
Si ves el error: `No se pudo conectar con el servidor. Verifica que el servidor esté corriendo en http://localhost:3001`

Esto significa que el frontend está intentando conectarse a `localhost:3001`, lo cual no funciona en producción.

## Solución

### Opción 1: Archivo .env.local (Recomendado)

1. **En tu VPS, ve al directorio del cliente:**
```bash
cd /root/sistema-email/client
```

2. **Crea un archivo `.env.local`:**
```bash
nano .env.local
```

3. **Agrega la URL de tu API:**
```bash
# Si el backend está en la misma IP pero puerto 3001
NEXT_PUBLIC_API_URL=http://TU_IP_VPS:3001

# O si tienes un dominio y el backend está en /api
NEXT_PUBLIC_API_URL=https://tu-dominio.com

# O si usas el mismo dominio pero diferente puerto
NEXT_PUBLIC_API_URL=http://tu-dominio.com:3001
```

**Reemplaza `TU_IP_VPS` con tu IP real o `tu-dominio.com` con tu dominio.**

4. **Guarda el archivo** (Ctrl+X, luego Y, luego Enter)

5. **Reconstruye y reinicia:**
```bash
npm run build
pm2 restart fylo-frontend
```

### Opción 2: Variable de entorno en PM2

1. **Edita el ecosistema de PM2:**
```bash
cd /root/sistema-email/client
pm2 delete fylo-frontend
```

2. **Inicia con la variable de entorno:**
```bash
NEXT_PUBLIC_API_URL=http://TU_IP_VPS:3001 pm2 start npm --name "fylo-frontend" -- start
pm2 save
```

### Opción 3: Usar el mismo dominio con proxy (Mejor para producción)

Si tienes un dominio configurado con Nginx, puedes crear un proxy reverso:

1. **Edita la configuración de Nginx** (si usas Nginx):
```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

2. **Configura el .env.local:**
```bash
NEXT_PUBLIC_API_URL=https://tu-dominio.com
```

## Verificar que funciona

1. **Verifica que el backend esté corriendo:**
```bash
pm2 status
# Deberías ver "fylo-backend" en estado "online"
```

2. **Prueba la conexión:**
```bash
curl http://TU_IP_VPS:3001/api/auth/me
# O si usas dominio:
curl https://tu-dominio.com/api/auth/me
```

3. **Revisa los logs:**
```bash
pm2 logs fylo-frontend
pm2 logs fylo-backend
```

## Solución rápida (Copia y pega)

Si tu backend está en la misma IP pero puerto 3001:

```bash
ssh root@TU_IP_VPS
cd sistema-email/client
echo "NEXT_PUBLIC_API_URL=http://TU_IP_VPS:3001" > .env.local
# Reemplaza TU_IP_VPS con tu IP real
npm run build
pm2 restart fylo-frontend
```

## Notas importantes

- Las variables de entorno que empiezan con `NEXT_PUBLIC_` se inyectan en el código del cliente
- Después de cambiar `.env.local`, **SIEMPRE** debes hacer `npm run build` y reiniciar
- Si usas HTTPS, asegúrate de usar `https://` en la URL
- Si el backend está en la misma máquina, puedes usar `http://localhost:3001` solo si el frontend también está en el servidor

