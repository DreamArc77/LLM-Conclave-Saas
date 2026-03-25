/**
 * Maps OpenRouter-style model IDs (e.g. "google/gemini-3-flash")
 * to local SVG logo filenames in /public/provider-logos/.
 */
const PREFIX_MAP: Record<string, string> = {
  'google': 'gemini',
  'openai': 'openai',
  'anthropic': 'anthropic',
  'deepseek': 'deepseek',
  'x-ai': 'xai',
  'minimax': 'minimax',
  'moonshotai': 'kimi',
  'qwen': 'qwen',
};

export function getLogoPath(modelId: string): string | null {
  if (!modelId) return null;
  const prefix = modelId.split('/')[0].toLowerCase();
  const name = PREFIX_MAP[prefix];
  return name ? `/provider-logos/${name}.svg` : null;
}
