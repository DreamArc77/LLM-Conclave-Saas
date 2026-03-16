import { createAdminClient } from '@/lib/supabase/server';
import crypto from 'crypto';

export function hashApiKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

export async function verifyAgentApiKey(req: Request): Promise<string | null> {
  const auth = req.headers.get('authorization');
  if (!auth?.startsWith('Bearer llmc_')) return null;
  const key = auth.slice(7); // remove "Bearer "
  const hash = hashApiKey(key);
  const admin = createAdminClient();
  const { data } = await admin
    .from('agent_api_keys')
    .select('user_id')
    .eq('key_hash', hash)
    .single();
  if (!data) return null;
  // fire-and-forget: update last_used_at
  admin
    .from('agent_api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('key_hash', hash)
    .then(() => {});
  return data.user_id as string;
}
