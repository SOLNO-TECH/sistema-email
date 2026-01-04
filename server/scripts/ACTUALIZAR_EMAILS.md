# 📧 Actualizar Emails a @xstarmail.es

Este script actualiza todos los emails de usuarios existentes en la base de datos para que terminen en `@xstarmail.es`.

## 🚀 Cómo Ejecutar

### Desde la carpeta `server`:

```bash
cd server
npx ts-node scripts/update-emails-to-xstarmail.ts
```

### O si estás en la raíz del proyecto:

```bash
cd server && npx ts-node scripts/update-emails-to-xstarmail.ts
```

## ⚙️ Qué Hace el Script

1. **Busca todos los usuarios** en la base de datos
2. **Extrae el nombre de usuario** (parte antes del `@`)
3. **Actualiza el email** a `nombre@xstarmail.es`
4. **Maneja conflictos** si ya existe un usuario con ese email
5. **Muestra un resumen** detallado de los cambios

## 📊 Ejemplo de Salida

```
🔄 Iniciando actualización de emails a @xstarmail.es...

📊 Total de usuarios encontrados: 5

✅ Actualizado: juan@gmail.com → juan@xstarmail.es
✅ Actualizado: maria@hotmail.com → maria@xstarmail.es
⏭️  Saltando: admin@xstarmail.es (ya tiene @xstarmail.es)
✅ Actualizado: pedro@yahoo.com → pedro@xstarmail.es
⚠️  Conflicto: luis@gmail.com → luis@xstarmail.es (ya existe otro usuario)

============================================================
📊 RESUMEN DE ACTUALIZACIÓN
============================================================
✅ Actualizados: 3
⏭️  Saltados: 2
❌ Errores: 0
📊 Total: 5

📝 USUARIOS ACTUALIZADOS:
------------------------------------------------------------
  Juan Pérez
    juan@gmail.com → juan@xstarmail.es
  María García
    maria@hotmail.com → maria@xstarmail.es
  Pedro López
    pedro@yahoo.com → pedro@xstarmail.es

⏭️  USUARIOS SALTADOS:
------------------------------------------------------------
  admin@xstarmail.es
    Razón: Ya tiene @xstarmail.es
  luis@gmail.com
    Razón: El email luis@xstarmail.es ya está en uso por otro usuario

============================================================
✅ Actualización completada
============================================================
```

## ⚠️ Notas Importantes

1. **Haz un backup** de tu base de datos antes de ejecutar el script (recomendado)
2. El script **NO elimina usuarios**, solo actualiza emails
3. Si hay **conflictos** (dos usuarios con el mismo nombre de usuario), el script los saltará y te mostrará cuáles son
4. Los usuarios que **ya tienen @xstarmail.es** serán saltados automáticamente
5. El script es **seguro** y muestra un resumen detallado de todos los cambios

## 🔄 Después de Ejecutar

Una vez ejecutado el script:

1. Todos los usuarios podrán hacer login usando solo su nombre de usuario
2. El sistema agregará automáticamente `@xstarmail.es` al hacer login
3. Los usuarios existentes mantendrán sus datos, solo cambiará su email

## 🆘 Solución de Problemas

### Error: "Cannot find module"
```bash
# Asegúrate de estar en la carpeta server y tener las dependencias instaladas
cd server
npm install
```

### Error: "DATABASE_URL is not set"
```bash
# Verifica que el archivo .env existe y tiene DATABASE_URL configurado
cd server
cat .env | grep DATABASE_URL
```

### Conflictos de emails
Si hay conflictos, el script te mostrará cuáles son. Puedes:
1. Cambiar manualmente el nombre de usuario de uno de los usuarios en conflicto
2. O eliminar uno de los usuarios duplicados (si es necesario)

