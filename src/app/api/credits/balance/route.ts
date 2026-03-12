import { createServerClient, createAdminClient } from '@/lib/supabase/server';

export async function GET(): Promise<Response> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from('credits')
    .select('balance')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!data) {
    // Seed welcome credits for first-time users
    const { addWelcomeCredits } = await import('@/lib/credits/deduct');
    const { WELCOME_CREDITS } = await import('@/config/credit-packages');
    await addWelcomeCredits({ userId: user.id, supabase: admin, amount: WELCOME_CREDITS });
    // Re-query to confirm the write succeeded
    const { data: seeded } = await admin
      .from('credits')
      .select('balance')
      .eq('user_id', user.id)
      .maybeSingle();
    return Response.json({ balance: seeded ? (seeded.balance as number) : WELCOME_CREDITS });
  }

  return Response.json({ balance: data.balance as number });
}
