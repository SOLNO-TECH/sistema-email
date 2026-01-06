# 🔧 Arreglo Rápido del Error TypeScript en VPS

## Opción 1: Si usas Git (MÁS RÁPIDO)

```bash
# 1. Conectarte a tu VPS
ssh root@tu-ip-vps

# 2. Ir al directorio del proyecto
cd sistema-email

# 3. Actualizar código desde Git
git pull origin main
# o si tu rama es diferente:
# git pull origin master

# 4. Ir al directorio del cliente
cd client

# 5. Reconstruir el frontend
npm run build

# 6. Reiniciar el proceso con PM2
pm2 restart fylo-frontend

# 7. Verificar que funciona
pm2 logs fylo-frontend --lines 50
```

## Opción 2: Editar directamente en el VPS

Si no usas Git o quieres aplicar el fix manualmente:

```bash
# 1. Conectarte a tu VPS
ssh root@tu-ip-vps

# 2. Ir al directorio del cliente
cd sistema-email/client/app/account

# 3. Editar el archivo
nano page.tsx
```

**Busca esta sección (alrededor de la línea 113-129):**

```typescript
const loadSecurityData = async () => {
  try {
    const data = await apiClient.getUserPreferences();
    if (data.security) {
      setTwoPasswordMode(data.security.twoPasswordMode || false);
      setTwoFactorEnabled(data.security.twoFactorEnabled || false);
      // Validar que twoFactorMethod sea uno de los valores permitidos
      const method = data.security.twoFactorMethod;
      const validMethod: "app" | "security_key" | null = 
        method === "app" || method === "security_key" ? method : null;
      setTwoFactorMethod(validMethod);
      setAuthAppEnabled(data.security.twoFactorEnabled && method === "app");
      setSecurityKeyEnabled(data.security.twoFactorEnabled && method === "security_key");
    }
  } catch (error: any) {
    console.error("Error loading security data:", error);
  }
};
```

**Cambia las líneas donde dice `setTwoFactorMethod(...)` para que quede así:**

- Reemplaza cualquier línea que tenga `setTwoFactorMethod(data.security.twoFactorMethod || null);`
- Por las líneas con la validación que se muestran arriba

**Luego:**

```bash
# 4. Guardar (Ctrl+X, luego Y, luego Enter)
# 5. Ir al directorio client
cd ../../

# 6. Reconstruir
npm run build

# 7. Reiniciar PM2
pm2 restart fylo-frontend

# 8. Verificar
pm2 logs fylo-frontend --lines 50
```

## Opción 3: Comando todo-en-uno (si usas Git)

```bash
ssh root@tu-ip-vps && \
cd sistema-email && \
git pull && \
cd client && \
npm run build && \
pm2 restart fylo-frontend && \
pm2 logs fylo-frontend --lines 20
```

## ✅ Verificar que se arregló

```bash
# Ver si hay errores en los logs
pm2 logs fylo-frontend --err --lines 50

# Ver estado
pm2 status

# Si todo está bien, deberías ver:
# - fylo-frontend: online
# - Sin errores de TypeScript en los logs
```

## 🆘 Si sigue fallando

```bash
# Limpiar cache y reinstalar dependencias
cd sistema-email/client
rm -rf .next node_modules package-lock.json
npm install
npm run build
pm2 restart fylo-frontend
```

