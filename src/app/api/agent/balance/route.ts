import { verifyAgentApiKey } from '@/lib/agent-auth';
import { createAdminClient } from '@/lib/supabase/server';
import { SKILL_VERSION, skillVersionHeaders } from '@/lib/agent-skill-version';

export const dynamic = 'force-dynamic';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://llmconclave.com';

export async function GET(req: Request) {
  const userId = await verifyAgentApiKey(req);
  if (!userId) {
    return Response.json({ error: 'Invalid or missing API key', skillVersion: SKILL_VERSION }, { status: 401, headers: skillVersionHeaders() });
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from('credits')
    .select('balance')
    .eq('user_id', userId)
    .maybeSingle();

  const balance = (data?.balance as number) ?? 0;

  return Response.json({
    skillVersion: SKILL_VERSION,
    balance,
    currency: 'credits',
    topUpUrl: `${APP_URL}/account`,
  }, { headers: skillVersionHeaders() });
}
