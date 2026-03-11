import { PRESET_DEFINITIONS } from '@/config/preset-models';
import { PROVIDER_REGISTRY } from '@/lib/providers/registry';

export const dynamic = 'force-dynamic';

export async function GET() {
  const available = PRESET_DEFINITIONS
    .filter((p) => !!p.apiKey)
    .map((p) => ({
      id: p.id,
      providerId: p.providerId,
      modelId: p.modelId,
      displayName: p.displayName,
      baseUrl: p.baseUrl ?? PROVIDER_REGISTRY[p.providerId].defaultBaseUrl,
    }));
  return Response.json(available);
}
