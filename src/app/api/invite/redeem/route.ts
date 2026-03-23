import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import { redeemInviteCode } from '@/lib/credits/invite';

export async function POST(request: Request): Promise<Response> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const code = typeof body.code === 'string' ? body.code.trim() : '';
  if (!code) {
    return Response.json({ error: 'invalid_code' }, { status: 400 });
  }

  const admin = createAdminClient();
  const result = await redeemInviteCode(code, user.id, admin);

  if (!result.ok) {
    return Response.json({ error: result.reason }, { status: 400 });
  }

  return Response.json({ ok: true });
}
