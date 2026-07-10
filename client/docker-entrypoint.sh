#!/bin/sh
set -e

if [ -f "/app/server.js" ]; then
  exec node /app/server.js
fi

if [ -f "/app/client/server.js" ]; then
  exec node /app/client/server.js
fi

echo "ERROR: No se encontro server.js de Next.js standalone"
find /app -name "server.js" 2>/dev/null || true
exit 1
