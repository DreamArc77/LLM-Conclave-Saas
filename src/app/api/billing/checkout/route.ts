import type Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import { CREDIT_PACKAGES, totalCredits } from '@/config/credit-packages';

export async function POST(req: Request): Promise<Response> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let packageId: string;
  let paymentMethod: string | undefined;
  try {
    const body = await req.json();
    packageId = body.packageId;
    paymentMethod = typeof body.paymentMethod === 'string' ? body.paymentMethod : undefined;
  } catch {
    return Response.json({ error: 'Invalid body' }, { status: 400 });
  }

  const pkg = CREDIT_PACKAGES.find((p) => p.id === packageId);
  if (!pkg) {
    return Response.json({ error: 'Invalid package' }, { status: 400 });
  }

  const priceId = process.env[pkg.stripePriceEnvKey];
  if (!priceId) {
    return Response.json({ error: 'Price not configured' }, { status: 500 });
  }

  let stripe: ReturnType<typeof getStripe>;
  try {
    stripe = getStripe();
  } catch {
    return Response.json({ error: 'Stripe not configured' }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  try {
    // Find or create Stripe customer
    const admin = createAdminClient();
    const { data: existing } = await admin
      .from('stripe_customers')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .single();

    let customerId: string;
    if (existing?.stripe_customer_id) {
      customerId = existing.stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
      await admin.from('stripe_customers').insert({
        user_id: user.id,
        stripe_customer_id: customerId,
      });
    }

    const params: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'payment',
      // `{CHECKOUT_SESSION_ID}` is expanded by Stripe — lets /account verify the
      // real outcome instead of trusting the redirect alone.
      success_url: `${appUrl}/account?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/account?payment=cancelled&session_id={CHECKOUT_SESSION_ID}`,
      metadata: {
        userId: user.id,
        packageId: pkg.id,
        credits: String(totalCredits(pkg)),
      },
    };

    // Optional: restrict to card only. UnionPay cards are accepted by Stripe's
    // card method, so this is the reliable fallback when Alipay / WeChat Pay are
    // declined for cross-border reasons.
    if (paymentMethod === 'card') {
      params.payment_method_types = ['card'];
    }

    const session = await stripe.checkout.sessions.create(params);

    return Response.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Stripe error';
    return Response.json({ error: message }, { status: 500 });
  }
}
