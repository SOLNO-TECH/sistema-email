# 💳 Configuración de Stripe para Pagos

## Estado Actual

El sistema de pagos está **simulado** para desarrollo. Para producción, necesitas integrar Stripe.

## Pasos para Integrar Stripe

### 1. Instalar Stripe

```bash
cd backend
npm install stripe
npm install --save-dev @types/stripe
```

### 2. Configurar Variables de Entorno

Agrega a tu archivo `.env`:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 3. Actualizar `payments.controller.ts`

Reemplaza el código simulado con la integración real de Stripe:

```typescript
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia',
});

// En createPaymentIntent:
const session = await stripe.checkout.sessions.create({
  payment_method_types: ['card'],
  line_items: [{
    price_data: {
      currency: 'usd',
      product_data: {
        name: plan.name,
        description: plan.description,
      },
      unit_amount: Math.round(amount * 100), // Stripe usa centavos
      recurring: {
        interval: billingPeriod === 'yearly' ? 'year' : 'month',
      },
    },
    quantity: 1,
  }],
  mode: 'subscription',
  success_url: `${process.env.FRONTEND_URL}/dashboard?success=true`,
  cancel_url: `${process.env.FRONTEND_URL}/plans?canceled=true`,
  metadata: {
    userId: user.id.toString(),
    planId: planId.toString(),
    billingPeriod,
  },
});

res.json({
  checkoutUrl: session.url,
  sessionId: session.id,
});
```

### 4. Configurar Webhook en Stripe Dashboard

1. Ve a https://dashboard.stripe.com/webhooks
2. Agrega endpoint: `https://tu-dominio.com/api/payments/webhook`
3. Selecciona eventos: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
4. Copia el `Signing secret` a tu `.env`

### 5. Actualizar Webhook Handler

```typescript
export async function stripeWebhook(req: Request, res: Response) {
  const sig = req.headers['stripe-signature'] as string;
  
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    // Crear suscripción usando metadata
    const { userId, planId, billingPeriod } = session.metadata;
    // ... crear suscripción
  }

  res.json({ received: true });
}
```

## Planes Iniciales

Los siguientes planes están configurados:

- **Gratis**: $0/mes - 1 correo, 1 dominio, 1GB
- **Básico**: $9.99/mes - 5 correos, 2 dominios, 10GB
- **Profesional**: $29.99/mes - 20 correos, 5 dominios, 50GB
- **Empresarial**: $99.99/mes - 100 correos, 20 dominios, 500GB

## Limitaciones Implementadas

✅ Límite de cuentas de correo por plan
✅ Límite de dominios por plan
✅ Límite de almacenamiento por buzón
✅ Verificación automática al crear recursos
✅ Mensajes de error cuando se alcanzan límites

