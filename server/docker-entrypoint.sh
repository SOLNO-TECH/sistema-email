#!/bin/sh
set -e

mkdir -p /app/data /app/uploads

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
echo "Sincronizando base de datos SQLite..."
if ! npx prisma migrate deploy; then
  echo "migrate deploy fallo, usando db push..."
  npx prisma db push --skip-generate
fi

echo "Iniciando servidor backend en 0.0.0.0:${PORT:-3001}..."
exec node dist/src/app.js
