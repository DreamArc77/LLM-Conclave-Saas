export type ProviderId =
  | 'openai'
  | 'anthropic'
  | 'google'
  | 'deepseek'
  | 'groq'
  | 'doubao'
  | 'glm'
  | 'kimi'
  | 'custom';

export type ProviderProtocol = 'openai-compatible' | 'anthropic' | 'google-gemini';

export interface ProviderMeta {
  id: ProviderId;
  name: string;
  protocol: ProviderProtocol;
  defaultBaseUrl: string;
  logoPath: string;
  defaultModels: string[];
}

export interface ModelConfig {
  id: string;
  providerId: ProviderId;
  modelId: string;
  displayName: string;
  apiKey: string;
  baseUrl: string;
  enabled: boolean;
  order: number;
  isPreset?: boolean;
  /** Fixed credit cost per round (preset models only). Sourced from server-side PresetDefinition. */
  creditsPerRound?: number;
  /** Operator-configured badge label shown on the model card (e.g. "官方", "精选"). */
  badge?: string;
  /** Server-supplied default enabled state (used only during initial preset sync). */
  defaultEnabled?: boolean;
}
