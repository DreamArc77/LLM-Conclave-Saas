import { PRESET_DEFINITIONS } from '@/config/preset-models';
import { SKILL_VERSION, skillVersionHeaders } from '@/lib/agent-skill-version';

export const dynamic = 'force-dynamic';

export async function GET() {
  const models = PRESET_DEFINITIONS
    .filter((p) => p.apiKey)
    .map((p) => ({
      id: p.id,
      name: p.displayName,
      creditsPerRound: p.creditsPerRound,
      strengths: p.agentMeta?.strengths ?? [],
      tier: p.agentMeta?.tier ?? 'standard',
    }));

  return Response.json({ skillVersion: SKILL_VERSION, models }, { headers: skillVersionHeaders() });
}
