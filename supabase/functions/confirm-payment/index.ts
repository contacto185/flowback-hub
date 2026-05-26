// ─────────────────────────────────────────────────────────────────────────
//  confirm-payment — Supabase Edge Function (Deno runtime)
//
//  Verifica server-side que un PayPal order capturado por el cliente
//  exista, esté COMPLETED, y que el monto coincida con el plan elegido
//  (leído de la tabla `plans` en Supabase, no del cliente). Solo si todo
//  cuadra, actualiza `profiles.tier` usando service_role.
//
//  POST body:  { orderID: string, userID: string, planID: string }
//  Response :  { success: true,  tier: string, alreadyProcessed?: boolean }
//           |  { success: false, error: string,  paypalStatus?: string }
//
//  Variables de entorno requeridas:
//    PAYPAL_CLIENT_ID
//    PAYPAL_CLIENT_SECRET
//    PAYPAL_MODE             ('sandbox' | 'live', default 'live')
//    SUPABASE_URL            (auto-inyectada por Supabase)
//    SUPABASE_SERVICE_ROLE_KEY (auto-inyectada por Supabase)
// ─────────────────────────────────────────────────────────────────────────

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Tier hierarchy — must match the frontend's TIER_RANK
const TIER_RANK: Record<string, number> = { free: 0, basica: 1, vip: 2, premium: 3 };

interface PayPalOrder {
  id: string;
  status: string;
  purchase_units?: Array<{
    amount?: { currency_code: string; value: string };
    payments?: {
      captures?: Array<{
        id: string;
        status: string;
        amount: { currency_code: string; value: string };
      }>;
    };
  }>;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

async function getPaypalAccessToken(
  clientId: string,
  clientSecret: string,
  baseUrl: string,
): Promise<string> {
  const auth = btoa(`${clientId}:${clientSecret}`);
  const res = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`PayPal oauth failed (${res.status}): ${txt}`);
  }
  const data = await res.json();
  return data.access_token as string;
}

async function getPaypalOrder(
  orderId: string,
  accessToken: string,
  baseUrl: string,
): Promise<PayPalOrder> {
  const res = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`PayPal order GET failed (${res.status}): ${txt}`);
  }
  return await res.json() as PayPalOrder;
}

serve(async (req: Request) => {
  // ── CORS preflight ─────────────────────────────────────────────────
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }
  if (req.method !== "POST") {
    return json({ success: false, error: "Method not allowed" }, 405);
  }

  try {
    // ── 1. Validate JWT ─────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ success: false, error: "Missing Authorization header" }, 401);
    }
    const callerJwt = authHeader.slice("Bearer ".length);

    // ── 2. Parse body ───────────────────────────────────────────────
    const body = await req.json().catch(() => ({}));
    const orderID = String(body.orderID || "").trim();
    const userID  = String(body.userID  || "").trim();
    const planID  = String(body.planID  || "").toLowerCase().trim();

    if (!orderID || !userID || !planID) {
      return json({
        success: false,
        error: "Missing required field(s): orderID, userID, planID",
      }, 400);
    }
    if (!(planID in TIER_RANK) || planID === "free") {
      return json({ success: false, error: `Invalid planID '${planID}'` }, 400);
    }

    // ── 3. Env ──────────────────────────────────────────────────────
    const PAYPAL_CLIENT_ID     = Deno.env.get("PAYPAL_CLIENT_ID");
    const PAYPAL_CLIENT_SECRET = Deno.env.get("PAYPAL_CLIENT_SECRET");
    const PAYPAL_MODE          = (Deno.env.get("PAYPAL_MODE") || "live").toLowerCase();
    const SUPABASE_URL         = Deno.env.get("SUPABASE_URL");
    const SERVICE_ROLE_KEY     = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
      return json({ success: false, error: "PayPal credentials not configured on the server" }, 500);
    }
    if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
      return json({ success: false, error: "Supabase service role not configured on the server" }, 500);
    }

    const paypalBase = PAYPAL_MODE === "sandbox"
      ? "https://api-m.sandbox.paypal.com"
      : "https://api-m.paypal.com";

    // ── 4. Supabase admin client (service_role bypasses RLS) ────────
    const supa = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // ── 5. Confirm caller's JWT matches userID ──────────────────────
    const { data: callerData, error: jwtErr } = await supa.auth.getUser(callerJwt);
    if (jwtErr || !callerData?.user) {
      return json({ success: false, error: "Invalid or expired JWT" }, 401);
    }
    if (callerData.user.id !== userID) {
      return json({
        success: false,
        error: "userID does not match authenticated user",
      }, 403);
    }

    // ── 6. Fetch expected amount from `plans` table (no client trust) ──
    const { data: plan, error: planErr } = await supa
      .from("plans")
      .select("tier, price_usd, is_active")
      .eq("tier", planID)
      .single();

    if (planErr || !plan) {
      return json({ success: false, error: `Plan '${planID}' not found in plans table` }, 400);
    }
    if (plan.is_active === false) {
      return json({ success: false, error: `Plan '${planID}' is inactive` }, 400);
    }
    const expectedAmount = Number(plan.price_usd);
    if (!Number.isFinite(expectedAmount) || expectedAmount <= 0) {
      return json({ success: false, error: `Plan '${planID}' has invalid price_usd` }, 500);
    }

    // ── 7. Idempotency: has this orderID been processed? ────────────
    const { data: existingPayment } = await supa
      .from("payments")
      .select("id, status, user_id")
      .eq("reference_code", orderID)
      .maybeSingle();

    if (existingPayment?.status === "confirmed") {
      // Same orderID reused → return current tier without re-processing.
      if (existingPayment.user_id && existingPayment.user_id !== userID) {
        return json({
          success: false,
          error: "Order already confirmed under a different user",
        }, 409);
      }
      const { data: prof } = await supa
        .from("profiles").select("tier").eq("user_id", userID).single();
      return json({
        success: true,
        tier: prof?.tier || planID,
        alreadyProcessed: true,
      });
    }

    // ── 8. Talk to PayPal: get token + order ────────────────────────
    const ppToken = await getPaypalAccessToken(PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, paypalBase);
    const order   = await getPaypalOrder(orderID, ppToken, paypalBase);

    if (order.status !== "COMPLETED") {
      return json({
        success:      false,
        error:        `PayPal order status is '${order.status}', expected COMPLETED`,
        paypalStatus: order.status,
      }, 400);
    }

    // ── 9. Validate amount + currency from the capture, not from purchase_unit
    //       (capture is the actual amount that moved money)
    const capture = order.purchase_units?.[0]?.payments?.captures?.[0];
    if (!capture || capture.status !== "COMPLETED") {
      return json({
        success: false,
        error:   `No completed capture found on order (capture status: ${capture?.status ?? "missing"})`,
      }, 400);
    }
    const paidAmount  = Number(capture.amount.value);
    const paidCurrency = capture.amount.currency_code;

    if (paidCurrency !== "USD") {
      return json({
        success: false,
        error:   `Currency mismatch: capture is ${paidCurrency}, expected USD`,
      }, 400);
    }
    if (Math.abs(paidAmount - expectedAmount) > 0.01) {
      return json({
        success: false,
        error:   `Amount mismatch: paid ${paidAmount} USD, plan '${planID}' costs ${expectedAmount} USD`,
      }, 400);
    }

    // ── 10. Anti-downgrade: never lower the tier if the user already has a higher one
    //        (defends against an old completed order replaying after an upgrade) ──
    const { data: currentProfile } = await supa
      .from("profiles").select("tier").eq("user_id", userID).single();
    const currentTier = (currentProfile?.tier || "free").toLowerCase();
    const currentRank = TIER_RANK[currentTier] ?? 0;
    const newRank     = TIER_RANK[planID]     ?? 0;
    const finalTier   = newRank >= currentRank ? planID : currentTier;

    // ── 11. Record payment (insert or update) ───────────────────────
    const paymentRow = {
      user_id:        userID,
      amount:         paidAmount,
      currency:       paidCurrency,
      method:         "paypal",
      status:         "confirmed",
      reference_code: orderID,
      confirmed_at:   new Date().toISOString(),
    };
    if (existingPayment) {
      await supa.from("payments").update(paymentRow).eq("id", existingPayment.id);
    } else {
      await supa.from("payments").insert(paymentRow);
    }

    // ── 12. Update tier ─────────────────────────────────────────────
    if (finalTier !== currentTier) {
      const { error: updErr } = await supa
        .from("profiles").update({ tier: finalTier }).eq("user_id", userID);
      if (updErr) {
        console.error("[confirm-payment] tier update failed:", updErr);
        return json({
          success: false,
          error:   `Payment recorded but tier update failed: ${updErr.message}`,
        }, 500);
      }
    }

    console.log(`[confirm-payment] ok · user=${userID} · order=${orderID} · plan=${planID} · finalTier=${finalTier}`);
    return json({ success: true, tier: finalTier });
  } catch (err) {
    const msg = (err instanceof Error) ? err.message : String(err);
    console.error("[confirm-payment] exception:", msg);
    return json({ success: false, error: msg }, 500);
  }
});
