import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import { addWelcomeCredits } from '@/lib/credits/deduct';
import { WELCOME_CREDITS } from '@/config/credit-packages';

export async function POST(): Promise<Response> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();

  // Only grant welcome credits if user has no credits row yet
  const { data: existing } = await admin
    .from('credits')
    .select('user_id')
    .eq('user_id', user.id)
    .single();

  if (existing) {
    return Response.json({ ok: true, already: true });
  }

  await addWelcomeCredits({ userId: user.id, supabase: admin, amount: WELCOME_CREDITS });

  return Response.json({ ok: true, credits: WELCOME_CREDITS });
}
