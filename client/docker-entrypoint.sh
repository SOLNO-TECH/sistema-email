#!/bin/sh
set -e

if [ -f "/app/server.js" ]; then
  cd /app
  exec node server.js
fi

if [ -f "/app/client/server.js" ]; then
  cd /app/client
  if [ ! -d ".next/static" ] && [ -d "/app/.next/static" ]; then
    mkdir -p .next
    ln -sf /app/.next/static .next/static
  fi
  if [ ! -d "public" ] && [ -d "/app/public" ]; then
    ln -sf /app/public public
  fi
  exec node server.js
fi

echo "ERROR: No se encontro server.js de Next.js standalone"
find /app -name "server.js" 2>/dev/null || true
exit 1
