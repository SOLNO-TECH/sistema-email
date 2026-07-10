#!/bin/sh
set -e

mkdir -p /app/data /app/uploads

echo "Aplicando migraciones de Prisma..."
npx prisma migrate deploy

echo "Iniciando servidor backend..."
exec node dist/src/app.js
