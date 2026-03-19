import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import { getOrCreateInviteCode } from '@/lib/credits/invite';

export async function GET(): Promise<Response> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();

  try {
    const result = await getOrCreateInviteCode(user.id, admin);
    return Response.json(result);
  } catch (err) {
    console.error('[invite] getOrCreateInviteCode failed:', err);
    return Response.json({ error: 'Failed to get invite code' }, { status: 500 });
  }
}
