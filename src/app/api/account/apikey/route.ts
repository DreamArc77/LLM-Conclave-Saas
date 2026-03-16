import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import { hashApiKey } from '@/lib/agent-auth';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

async function getAuthenticatedUser() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/** GET: check if user has an existing key */
export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const { data } = await admin
    .from('agent_api_keys')
    .select('id, created_at, last_used_at')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!data) return Response.json({ hasKey: false });
  return Response.json({ hasKey: true, createdAt: data.created_at, lastUsedAt: data.last_used_at });
}

/** POST: generate a new API key (replaces existing) */
export async function POST() {
  const user = await getAuthenticatedUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  // Generate key: llmc_ + 32 random bytes hex = 64 chars
  const rawKey = `llmc_${crypto.randomBytes(32).toString('hex')}`;
  const hash = hashApiKey(rawKey);

  const admin = createAdminClient();

  // Delete any existing key for this user
  await admin.from('agent_api_keys').delete().eq('user_id', user.id);

  // Insert new key
  const { error } = await admin.from('agent_api_keys').insert({
    user_id: user.id,
    key_hash: hash,
  });

  if (error) {
    return Response.json({ error: 'Failed to generate API key' }, { status: 500 });
  }

  // Return plain-text key ONCE — never stored, only hash retained
  return Response.json({ apiKey: rawKey });
}

/** DELETE: revoke the current API key */
export async function DELETE() {
  const user = await getAuthenticatedUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  await admin.from('agent_api_keys').delete().eq('user_id', user.id);

  return Response.json({ ok: true });
}
