# 📋 Migraciones de Prisma - Historial

## Migraciones Aplicadas

### 1. `20251124182352_init` (Inicial)
**Fecha:** 24 de noviembre 2025

**Cambios:**
- Crea tabla `User` básica (solo `id`, `email`, `name`)

**Estado:** ⚠️ Incompleta - Fue reemplazada por la siguiente

---

### 2. `20251125010735_sombra` (Principal)
**Fecha:** 25 de noviembre 2025

**Cambios:**
- ✅ Agrega `password` y `createdAt` a `User`
- ✅ Hace `name` requerido en `User`
- ✅ Crea tabla `Domain` (dominios vinculados)
- ✅ Crea tabla `EmailAccount` (cuentas de correo)
- ✅ Crea tabla `Plan` (planes de suscripción)
- ✅ Crea tabla `Subscription` (suscripciones de usuarios)
- ✅ Crea tabla `Invoice` (facturas)
- ✅ Crea todas las relaciones (Foreign Keys)

**Esta es la migración principal que crea toda la estructura base.**

---

### 3. `20251125013444_add_plan_limits` (Más Reciente)
**Fecha:** 25 de noviembre 2025

**Cambios:**
- ✅ Agrega `storageUsed` a `EmailAccount` (almacenamiento usado)
- ✅ Agrega `createdAt` a `EmailAccount`
- ✅ Agrega `maxStorageGB` a `Plan` (límite de almacenamiento)
- ✅ Agrega `maxDomains` a `Plan` (límite de dominios)
- ✅ Agrega `features` a `Plan` (características adicionales)
- ✅ Agrega `isActive` a `Plan` (plan activo/inactivo)
- ✅ Establece valores por defecto para `maxEmails`

**Esta es la migración más reciente que agrega el sistema de limitaciones.**

---

## 📊 Estado Actual

**Migración activa:** `20251125013444_add_plan_limits`

**Estructura completa de la base de datos:**

### Tablas:
1. **User** - Usuarios del sistema
2. **Domain** - Dominios vinculados
3. **EmailAccount** - Cuentas de correo
4. **Plan** - Planes de suscripción
5. **Subscription** - Suscripciones activas
6. **Invoice** - Facturas

### Campos importantes agregados:
- ✅ Sistema de limitaciones (maxEmails, maxStorageGB, maxDomains)
- ✅ Control de almacenamiento (storageUsed)
- ✅ Gestión de planes (isActive, features)

---

## 🔄 Para Aplicar Migraciones

```bash
cd server
npx prisma migrate deploy
```

Esto aplicará todas las migraciones en orden:
1. `20251124182352_init`
2. `20251125010735_sombra`
3. `20251125013444_add_plan_limits`

---

## 📝 Nota

Todas las migraciones se aplican en secuencia. La base de datos final tendrá todas las tablas y campos de las 3 migraciones combinadas.

