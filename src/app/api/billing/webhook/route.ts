import { getStripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/server';

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

      // Upsert credits (add to existing balance)
      const { data: existing } = await supabase
        .from('credits')
        .select('balance')
        .eq('user_id', userId)
        .maybeSingle();

      const currentBalance = (existing?.balance as number) ?? 0;
      await supabase.from('credits').upsert(
        {
          user_id: userId,
          balance: currentBalance + creditsNum,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id' }
      );

      await supabase.from('credit_transactions').insert({
        user_id: userId,
        amount: creditsNum,
        type: 'purchase',
        description: `Purchased ${creditsNum} credits`,
        stripe_payment_intent_id: typeof session.payment_intent === 'string'
          ? session.payment_intent
          : session.payment_intent?.id,
      });
    }
  }

  return new Response('ok');
}
