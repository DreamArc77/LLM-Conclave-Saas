import { PRESET_DEFINITIONS } from '@/config/preset-models';

export const dynamic = 'force-dynamic';

export async function GET() {
  const models = PRESET_DEFINITIONS
    .filter((p) => p.apiKey) // only return models that have an API key configured
    .map((p) => ({
      id: p.id,
      name: p.displayName,
      creditsPerRound: p.creditsPerRound,
      strengths: p.agentMeta?.strengths ?? [],
      tier: p.agentMeta?.tier ?? 'standard',
    }));

  return Response.json(models);
}
