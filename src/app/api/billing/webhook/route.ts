import { getStripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/server';
import { addCreditsAtomic } from '@/lib/credits/deduct';

export const dynamic = 'force-dynamic';

export async function POST(req: Request): Promise<Response> {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) {
    return new Response('Missing signature', { status: 400 });
  }

  const stripe = getStripe();
  let event: import('stripe').Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Webhook error';
    return new Response(`Webhook Error: ${msg}`, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as import('stripe').Stripe.Checkout.Session;
    const { userId, credits } = session.metadata ?? {};

    if (userId && credits) {
      const creditsNum = parseInt(credits, 10);
      const supabase = createAdminClient();

      const result = await addCreditsAtomic({
        userId,
        amount: creditsNum,
        type: 'purchase',
        description: `Purchased ${creditsNum} credits`,
        stripePaymentIntentId: typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id ?? null,
        supabase,
      });

      if (!result.ok) {
        console.error('[billing/webhook] addCreditsAtomic failed for user', userId);
      }
    }
  }

  return new Response('ok');
}
