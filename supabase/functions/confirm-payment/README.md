# confirm-payment — Supabase Edge Function

Valida server-side un capture de PayPal antes de actualizar `profiles.tier`.
Cierra el hueco de seguridad por el cual cualquier user logueado podía
hacer en consola `sb.from('profiles').update({tier:'premium'}).eq(...)` y
volverse premium sin pagar.

## Flujo

```
Frontend (PayPal onApprove → actions.order.capture())
   │
   ▼
POST /functions/v1/confirm-payment
   { orderID, userID, planID }
   Authorization: Bearer <user JWT>
   │
   ├─ Verifica JWT, valida que userID == jwt.sub
   ├─ Lee precio del plan desde `plans` (no del cliente)
   ├─ Idempotencia: si `payments.reference_code = orderID` ya está
   │  'confirmed', retorna el tier actual sin reprocesar
   ├─ PayPal /v1/oauth2/token  → access_token
   ├─ PayPal GET /v2/checkout/orders/{orderID}
   │   - status debe ser COMPLETED
   │   - capture.amount.value debe coincidir con plans.price_usd
   │   - currency debe ser USD
   ├─ Anti-downgrade: solo aplica el cambio si el nuevo rank >= actual
   ├─ INSERT/UPDATE en `payments` (registro)
   └─ UPDATE `profiles.tier` (service_role bypass RLS)
   │
   ▼
   { success: true, tier: 'premium' }
```

## Deploy

### Una sola vez — instalar la CLI

```bash
npm install -g supabase
supabase login   # abre browser, te pide token
supabase link --project-ref wvxcqavtjtgvxdvtuvvd
```

### Setear secrets (una sola vez)

```bash
supabase secrets set PAYPAL_CLIENT_ID="AU_R4Y-BTzQ..."
supabase secrets set PAYPAL_CLIENT_SECRET="EL_secret_del_dashboard_PayPal"
supabase secrets set PAYPAL_MODE="live"   # o 'sandbox' para tests
```

`SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` ya están auto-inyectadas
por Supabase, no hay que setearlas.

### Deploy de la función

```bash
supabase functions deploy confirm-payment
```

Para redeployar después de cambios: el mismo comando.

### Verificar logs

```bash
supabase functions logs confirm-payment --follow
```

O desde el dashboard: Project → Edge Functions → confirm-payment → Logs.

## Cómo llamarla desde el frontend

Ejemplo de integración en `onPaypalSuccess` (reemplaza el insert+update
inseguro que hace hoy directamente desde el cliente):

```js
async function onPaypalSuccess(plan, orderID, amount, details) {
  if (!currentUser) { showToast('Sesión expirada', true); return; }

  const { data, error } = await sb.functions.invoke('confirm-payment', {
    body: { orderID, userID: currentUser.id, planID: plan },
  });

  if (error || !data?.success) {
    console.error('[confirm-payment]', error || data);
    showToast('Pago recibido pero no pudimos confirmarlo. Contactá a soporte.', true);
    return;
  }

  if (userProfile) userProfile.tier = data.tier;
  showToast('¡Bienvenido a la Tribu!');
  updateHeader();
  updateUIForLoggedInUser();
}
```

El cliente Supabase JS le agrega solo el `Authorization: Bearer <JWT>` —
la función valida que ese JWT corresponda al userID enviado.

## Endpoints PayPal usados

- `POST {base}/v1/oauth2/token` — client_credentials grant
- `GET  {base}/v2/checkout/orders/{orderID}` — fetch order + captures

Donde `{base}` = `https://api-m.sandbox.paypal.com` si `PAYPAL_MODE=sandbox`,
o `https://api-m.paypal.com` para live.

## Errores comunes

| HTTP | error | Causa probable |
|------|-------|----------------|
| 400  | `Invalid planID '…'`              | planID no está en TIER_RANK o es 'free' |
| 400  | `Plan '…' not found in plans table` | No existe en Supabase con ese tier |
| 400  | `PayPal order status is '…'`       | Order no está COMPLETED (CREATED, VOIDED, etc.) |
| 400  | `Currency mismatch`                | Capture vino en moneda ≠ USD |
| 400  | `Amount mismatch`                  | Lo capturado ≠ plans.price_usd |
| 401  | `Missing/Invalid JWT`              | Header Authorization mal o caducado |
| 403  | `userID does not match…`           | userID enviado ≠ user del JWT |
| 409  | `Order already confirmed under…`   | Reuso de orderID con otro userID |
| 500  | `PayPal credentials not configured`| Falta setear secrets PAYPAL_CLIENT_ID/SECRET |
| 500  | Otro                                | Revisar logs |

## Tabla `payments` esperada

```sql
-- columnas usadas por la función
payments (
  id              uuid    -- pk
  user_id         uuid
  amount          numeric
  currency        text
  method          text    -- 'paypal'
  status          text    -- 'confirmed'
  reference_code  text    -- PayPal orderID (idealmente con UNIQUE)
  confirmed_at    timestamptz
)
```

Recomendación: agregar índice/constraint UNIQUE en `reference_code`
para garantizar a nivel DB que un mismo orderID no se procesa dos veces:

```sql
CREATE UNIQUE INDEX IF NOT EXISTS payments_reference_code_unique
  ON public.payments(reference_code);
```
