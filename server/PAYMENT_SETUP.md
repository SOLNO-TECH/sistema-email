# 💳 Configuración de Métodos de Pago

Este documento explica cómo configurar los métodos de pago reales (Stripe y PayPal) para que el dinero llegue a tu cuenta.

## 📋 Requisitos Previos

1. Cuenta de Stripe (para tarjetas de crédito/débito)
2. Cuenta de PayPal Business (para pagos con PayPal)
3. Acceso a las credenciales de API de ambas plataformas

---

## 🔵 Stripe - Tarjetas de Crédito/Débito

### 1. Crear cuenta en Stripe

1. Ve a https://stripe.com y crea una cuenta
2. Completa la verificación de tu negocio
3. Activa tu cuenta (puede tomar 1-2 días)

### 2. Obtener las claves de API

1. Ve a https://dashboard.stripe.com/apikeys
2. En **Claves de API**, encontrarás:
   - **Clave secreta** (empieza con `sk_test_` en modo prueba, `sk_live_` en producción)
   - **Clave publicable** (empieza con `pk_test_` en modo prueba, `pk_live_` en producción)

### 3. Configurar Webhook

1. Ve a https://dashboard.stripe.com/webhooks
2. Click en **"Agregar endpoint"**
3. URL del endpoint: `https://tu-dominio.com/api/payments/webhook`
4. Selecciona los eventos:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `payment_intent.succeeded`
5. Copia el **Signing secret** (empieza con `whsec_`)

### 4. Configurar variables de entorno

Agrega a tu archivo `.env` en el servidor:

```env
# Stripe - Claves de API
STRIPE_SECRET_KEY="sk_test_..." # En producción usa sk_live_...
STRIPE_PUBLISHABLE_KEY="pk_test_..." # En producción usa pk_live_...
STRIPE_WEBHOOK_SECRET="whsec_..." # Secret del webhook
```

### 5. Probar en modo Sandbox

Stripe proporciona tarjetas de prueba:
- **Tarjeta exitosa**: `4242 4242 4242 4242`
- **CVV**: Cualquier 3 dígitos (ej: `123`)
- **Fecha**: Cualquier fecha futura (ej: `12/25`)
- **Código postal**: Cualquier 5 dígitos

### 6. Activar modo Producción

1. En el dashboard de Stripe, cambia de "Modo prueba" a "Modo activo"
2. Actualiza las claves en tu `.env`:
   - Cambia `sk_test_` por `sk_live_`
   - Cambia `pk_test_` por `pk_live_`
3. Actualiza el webhook con la URL de producción

**💰 El dinero llegará a tu cuenta de Stripe y podrás retirarlo a tu cuenta bancaria.**

---

## 🟠 PayPal - Pagos con PayPal

### 1. Crear cuenta de PayPal Business

1. Ve a https://www.paypal.com/business y crea una cuenta Business
2. Completa la verificación de tu negocio
3. Activa tu cuenta

### 2. Obtener credenciales de API

1. Ve a https://developer.paypal.com/dashboard/
2. Inicia sesión con tu cuenta Business
3. Crea una nueva aplicación o usa la predeterminada
4. En **"Credenciales"**, encontrarás:
   - **Client ID**
   - **Client Secret**

### 3. Configurar variables de entorno

Agrega a tu archivo `.env` en el servidor:

```env
# PayPal - Credenciales de API
PAYPAL_CLIENT_ID="tu_client_id_de_paypal"
PAYPAL_CLIENT_SECRET="tu_client_secret_de_paypal"
PAYPAL_MODE="sandbox" # Cambia a "live" en producción
```

### 4. Probar en modo Sandbox

1. Crea una cuenta de prueba en https://developer.paypal.com/dashboard/
2. Usa las credenciales de Sandbox para pruebas
3. Puedes crear cuentas de prueba de comprador/vendedor

### 5. Activar modo Producción

1. En el dashboard de PayPal Developer, cambia a modo "Live"
2. Obtén las credenciales de producción (Client ID y Secret)
3. Actualiza tu `.env`:
   - Cambia `PAYPAL_MODE` de `"sandbox"` a `"live"`
   - Actualiza `PAYPAL_CLIENT_ID` y `PAYPAL_CLIENT_SECRET` con las credenciales de producción

**💰 El dinero llegará a tu cuenta de PayPal Business y podrás retirarlo a tu cuenta bancaria.**

---

## 🔄 Transferencia Bancaria

La transferencia bancaria no requiere integración con APIs externas. El sistema:

1. Genera una referencia única para cada pago
2. Muestra los datos bancarios al usuario
3. El usuario realiza la transferencia manualmente
4. Debes verificar manualmente el pago y activar la suscripción

**Configuración de cuenta bancaria:**

Edita `server/controllers/payments.controller.ts` y actualiza los datos bancarios en la función `createBankTransferSubscription`:

```typescript
bankDetails: {
  bank: "Tu Banco",
  accountHolder: "Tu Nombre o Empresa",
  iban: "ES91 2100 0418 4502 0005 1332", // Tu IBAN
  swift: "CAIXESBBXXX", // Tu código SWIFT/BIC
  reference: `XSTAR-${user.id}-${Date.now()}`,
}
```

**💰 El dinero llegará directamente a tu cuenta bancaria.**

---

## ✅ Verificación

### Verificar que Stripe funciona:

1. Haz una prueba con una tarjeta de prueba
2. Revisa en https://dashboard.stripe.com/payments que el pago aparezca
3. Verifica que la suscripción se creó en tu base de datos

### Verificar que PayPal funciona:

1. Haz una prueba con una cuenta de PayPal de prueba
2. Revisa en https://www.paypal.com/businessmanage/account/home que el pago aparezca
3. Verifica que la suscripción se creó en tu base de datos

---

## 🚨 Notas Importantes

1. **Seguridad**: Nunca compartas tus claves secretas. Solo úsalas en el servidor (backend).

2. **Modo Prueba vs Producción**:
   - En modo prueba (sandbox), no se procesan pagos reales
   - En producción, se procesan pagos reales y el dinero llega a tu cuenta

3. **Comisiones**:
   - **Stripe**: 2.9% + $0.30 por transacción (tarjetas de crédito)
   - **PayPal**: 2.9% + $0.30 por transacción (pagos en línea)

4. **Webhooks**: Son importantes para confirmar pagos automáticamente. Asegúrate de configurarlos correctamente.

5. **Soporte**: Si tienes problemas, contacta el soporte de Stripe o PayPal según corresponda.

---

## 📞 Soporte

- **Stripe**: https://support.stripe.com
- **PayPal**: https://www.paypal.com/support
- **Documentación Stripe**: https://stripe.com/docs
- **Documentación PayPal**: https://developer.paypal.com/docs

