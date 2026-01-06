# 🔧 Liberar Puerto 3001

## Problema
```
Error: listen EADDRINUSE: address already in use :::3001
```

El puerto 3001 ya está siendo usado por otro proceso.

## Solución Rápida

### Paso 1: Ver qué proceso está usando el puerto 3001

```bash
# Opción 1: Usando lsof
sudo lsof -i :3001

# Opción 2: Usando netstat
sudo netstat -tlnp | grep :3001

# Opción 3: Usando fuser
sudo fuser 3001/tcp
```

### Paso 2: Detener el proceso

```bash
# Opción A: Si es un proceso de PM2, detenerlo
pm2 stop all
pm2 delete all

# Opción B: Matar el proceso directamente (reemplaza PID con el número que apareció)
sudo kill -9 <PID>

# Opción C: Matar todos los procesos que usan el puerto 3001
sudo lsof -ti:3001 | xargs sudo kill -9
```

### Paso 3: Verificar que el puerto está libre

```bash
sudo lsof -i :3001
# No debería mostrar nada

# O
sudo netstat -tlnp | grep :3001
# No debería mostrar nada
```

### Paso 4: Iniciar el backend

```bash
cd /root/sistema-email/server
pm2 start npm --name "fylo-backend" -- start
pm2 save
pm2 status
```

## Script Todo-en-Uno

```bash
# Detener todos los procesos de PM2
pm2 stop all
pm2 delete all

# Matar cualquier proceso que use el puerto 3001
sudo lsof -ti:3001 | xargs sudo kill -9 2>/dev/null || echo "Puerto ya está libre"

# Verificar
sudo lsof -i :3001 || echo "✅ Puerto 3001 está libre"

# Esperar un segundo
sleep 2

# Iniciar el backend
cd /root/sistema-email/server
pm2 start npm --name "fylo-backend" -- start
pm2 save

# Verificar
pm2 status
pm2 logs fylo-backend --lines 20
```

## Si el problema persiste

### Ver todos los procesos de Node.js

```bash
ps aux | grep node
```

### Detener todos los procesos de Node.js (CUIDADO)

```bash
# Ver procesos
ps aux | grep node

# Matar todos los procesos de node (solo si es necesario)
pkill -9 node

# O específicamente los que usan el puerto
sudo fuser -k 3001/tcp
```

### Verificar que no hay otro PM2 corriendo

```bash
# Ver todos los procesos de PM2
pm2 list

# Si hay procesos "zombie" o detenidos, eliminarlos
pm2 delete all
pm2 kill  # Mata el daemon de PM2
pm2 resurrect  # Reinicia el daemon
```

## Prevención

Para evitar este problema en el futuro:

1. **Siempre detén PM2 antes de reiniciar:**
   ```bash
   pm2 stop all
   pm2 delete all
   ```

2. **Verifica el puerto antes de iniciar:**
   ```bash
   sudo lsof -i :3001 || echo "Puerto libre"
   ```

3. **Usa PM2 para gestionar procesos:**
   ```bash
   pm2 stop fylo-backend  # Detener sin eliminar
   pm2 restart fylo-backend  # Reiniciar
   ```

