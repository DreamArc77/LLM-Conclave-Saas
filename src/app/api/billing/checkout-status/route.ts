import type Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Read-only status probe for a Checkout Session the current user started.
 *
 * Used by the account page to detect a declined / abandoned top-up (notably
 * Alipay & WeChat Pay cross-border declines) so we can guide the user to the
 * card method, which accepts UnionPay.
 *
 * Auth: requires a session, and the Checkout Session must belong to this user.
 */
export async function GET(req: Request): Promise<Response> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sessionId = new URL(req.url).searchParams.get('session_id') ?? '';
  if (!/^cs_(test_|live_)?[A-Za-z0-9]+$/.test(sessionId)) {
    return Response.json({ error: 'Invalid session id' }, { status: 400 });
  }

  let stripe: ReturnType<typeof getStripe>;
  try {
    stripe = getStripe();
  } catch {
    return Response.json({ error: 'Stripe not configured' }, { status: 500 });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent', 'payment_intent.payment_method'],
    });

    // Ownership check — never leak another user's checkout data.
    if (session.metadata?.userId !== user.id) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const paymentIntent =
      typeof session.payment_intent === 'object' && session.payment_intent !== null
        ? (session.payment_intent as Stripe.PaymentIntent)
        : null;

    const paymentMethod =
      paymentIntent &&
      typeof paymentIntent.payment_method === 'object' &&
      paymentIntent.payment_method !== null
        ? (paymentIntent.payment_method as Stripe.PaymentMethod)
        : null;

    const err = paymentIntent?.last_payment_error ?? null;

    return Response.json({
      id: session.id,
      status: session.status, // 'open' | 'complete' | 'expired'
      paymentStatus: session.payment_status, // 'paid' | 'unpaid' | 'no_payment_required'
      amountTotal: session.amount_total,
      currency: session.currency,
      packageId: session.metadata?.packageId ?? null,
      paymentMethodType: paymentMethod?.type ?? null,
      error: err
        ? {
            message: err.message ?? null,
            code: err.code ?? null,
            declineCode: err.decline_code ?? null,
            type: err.type ?? null,
          }
        : null,
    });
  } catch {
    return Response.json({ error: 'Unable to retrieve session' }, { status: 502 });
  }
}
