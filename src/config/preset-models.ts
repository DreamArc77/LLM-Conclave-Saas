import type { ProviderId } from '@/types/config';

export interface PresetDefinition {
  id: string;
  providerId: ProviderId;
  modelId: string;
  displayName: string;
  baseUrl?: string;
  apiKey: string;
  /** Fixed credit cost each time this model speaks in a debate round. Edit to adjust pricing. */
  creditsPerRound: number;
  /** Whether this model is enabled by default when first synced to a new user's config. */
  defaultEnabled?: boolean;
  /** Badge label shown on the model card (e.g. "官方", "精选"). Omit to show no badge. */
  badge?: string;
  /** Metadata for AI agents selecting models via /api/agent/models. */
  agentMeta?: {
    strengths: string[];
    /** 'lite' ≤40 cr/r | 'standard' ≤100 cr/r | 'pro' = flagship */
    tier: 'lite' | 'standard' | 'pro';
  };
}

/**
 * Preset models — edit this array to configure models available to all visitors.
 * This file is server-side only; API keys are never sent to browsers.
 *
 * Pricing config (operator-editable):
 *   creditsPerRound  — fixed credit cost per model per round
 *   defaultEnabled   — whether new users get this model turned on by default
 */
export const PRESET_DEFINITIONS: PresetDefinition[] = [
  {
    id: 'gemini',
    providerId: 'custom',
    modelId: 'google/gemini-3.8-flash',
    displayName: 'Gemini 3.8 Flash',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY || '',
    creditsPerRound: 80,
    defaultEnabled: true,
    badge: 'Balance',
    agentMeta: { strengths: ['analytical', 'creative', 'balanced'], tier: 'standard' },
  },
  {
    id: 'openai',
    providerId: 'custom',
    modelId: 'openai/gpt-6-astra',
    displayName: 'GPT-6 Astra',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY || '',
    creditsPerRound: 450,
    defaultEnabled: true,
    badge: 'Flagship',
    agentMeta: { strengths: ['reasoning', 'coding', 'instruction-following'], tier: 'pro' },
  },

  {
    id: 'deepseek',
    providerId: 'custom',
    modelId: 'deepseek/deepseek-v4.1-flash',
    displayName: 'DeepSeek V4.1 Flash',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY || '',
    creditsPerRound: 45,
    defaultEnabled: true,
    badge: 'Lite',
    agentMeta: { strengths: ['logical', 'concise', 'fast'], tier: 'lite' },
  },

  {
    id: 'claude',
    providerId: 'custom',
    modelId: 'anthropic/claude-fable-5.1',
    displayName: 'Claude Fable 5.1',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY || '',
    creditsPerRound: 835,
    defaultEnabled: false,
    badge: 'Flagship',
    agentMeta: { strengths: ['nuanced-reasoning', 'writing', 'safety'], tier: 'pro' },
  },

  {
    id: 'xAI',
    providerId: 'custom',
    modelId: 'x-ai/grok-4.6',
    displayName: 'Grok 4.6',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY || '',
    creditsPerRound: 375,
    defaultEnabled: false,
    badge: 'Flagship',
    agentMeta: { strengths: ['real-time-knowledge', 'wit', 'systems-thinking'], tier: 'pro' },
  },
  {
    id: 'minimax',
    providerId: 'custom',
    modelId: 'minimax/minimax-m3',
    displayName: 'MiniMax M3',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY || '',
    creditsPerRound: 55,
    defaultEnabled: false,
    badge: 'Balance',
    agentMeta: { strengths: ['multi-agent', 'coding', 'chinese'], tier: 'standard' },
  },
  {
    id: 'kimi',
    providerId: 'custom',
    modelId: 'moonshotai/kimi-k3',
    displayName: 'Kimi K3',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY || '',
    creditsPerRound: 270,
    defaultEnabled: false,
    badge: 'Balance',
    agentMeta: { strengths: ['long-context', 'research', 'coding'], tier: 'standard' },
  },

  {
    id: 'Qwen',
    providerId: 'custom',
    modelId: 'qwen/qwen3.8-max-0902',
    displayName: 'Qwen 3.8 Max (0902)',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY || '',
    creditsPerRound: 165,
    defaultEnabled: false,
    badge: 'Flagship',
    agentMeta: { strengths: ['agentic', 'coding', 'chinese'], tier: 'pro' },
  },
];
