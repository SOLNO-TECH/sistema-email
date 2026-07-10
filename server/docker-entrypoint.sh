#!/bin/sh
set -e

mkdir -p /app/data /app/uploads

# SQLite: ruta absoluta dentro del volumen Docker
export DATABASE_URL="${DATABASE_URL:-file:/app/data/database.db}"

if [ -z "$JWT_SECRET" ] || [ "$JWT_SECRET" = "dev_secret" ]; then
  echo "============================================================"
  echo "ERROR: JWT_SECRET no esta configurado en Dokploy."
  echo "Ve a Environment y agrega:"
  echo "  JWT_SECRET=un-secreto-largo-y-aleatorio"
  echo "============================================================"
  exit 1
fi

echo "DATABASE_URL=$DATABASE_URL"
echo "Aplicando migraciones de Prisma..."
npx prisma migrate deploy

echo "Iniciando servidor backend en puerto ${PORT:-3001}..."
exec node dist/src/app.js
