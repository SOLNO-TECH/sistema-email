#!/bin/bash

# Script para crear el archivo .env desde el ejemplo
# Uso: bash setup-env.sh

if [ -f ".env" ]; then
    echo "⚠️  El archivo .env ya existe."
    read -p "¿Deseas sobrescribirlo? (s/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Ss]$ ]]; then
        echo "Operación cancelada."
        exit 1
    fi
fi

cp DEPLOY_ENV.example .env
echo "✅ Archivo .env creado desde DEPLOY_ENV.example"
echo ""
echo "📝 IMPORTANTE: Edita el archivo .env y completa las siguientes variables:"
echo "   - DATABASE_URL"
echo "   - JWT_SECRET"
echo "   - STRIPE_SECRET_KEY (opcional, para pagos con tarjeta)"
echo "   - STRIPE_PUBLISHABLE_KEY (opcional)"
echo "   - STRIPE_WEBHOOK_SECRET (opcional)"
echo "   - PAYPAL_CLIENT_ID (opcional, para pagos con PayPal)"
echo "   - PAYPAL_CLIENT_SECRET (opcional)"
echo "   - PAYPAL_MODE (sandbox o live)"
echo "   - FRONTEND_URL"
echo ""
echo "💡 Ver PAYMENT_SETUP.md para instrucciones detalladas sobre Stripe y PayPal"

