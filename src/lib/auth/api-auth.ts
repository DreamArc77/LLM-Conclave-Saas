import { isSaas } from '@/lib/flags';
import { createServerClient } from '@/lib/supabase/server';

export type ApiAuthResult =
  | { ok: true; userId: string | null }
  | { ok: false; response: Response };

/**
 * Gate for model-spending API routes.
 * SaaS mode: a real Supabase session is required. Open-source/BYOK mode: no account exists,
 * so `ok: true` with a null userId is returned and the route keeps its original behavior.
 */
export async function requireApiUser(): Promise<ApiAuthResult> {
  if (!isSaas) {
    return { ok: true, userId: null };
  }

  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return {
      ok: false,
      response: Response.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  return { ok: true, userId: user.id };
}
