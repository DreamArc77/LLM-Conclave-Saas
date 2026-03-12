import { getStripe } from '@/lib/stripe';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import { CREDIT_PACKAGES } from '@/config/credit-packages';

export async function POST(req: Request): Promise<Response> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let packageId: string;
  try {
    const body = await req.json();
    packageId = body.packageId;
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
    const admin = await createAdminClient();
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

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'payment',
      success_url: `${appUrl}/account?payment=success`,
      cancel_url: `${appUrl}/account?payment=cancelled`,
      metadata: {
        userId: user.id,
        packageId: pkg.id,
        credits: String(pkg.credits),
      },
    });

    return Response.json({ url: session.url });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Stripe error';
    return Response.json({ error: message }, { status: 500 });
  }
}
