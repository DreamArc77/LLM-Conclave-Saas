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
    modelId: 'google/gemini-3-flash-preview',
    displayName: 'Gemini3',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY || '',
    creditsPerRound: 60,
    defaultEnabled: true,
    badge: 'Balance',
    agentMeta: { strengths: ['analytical', 'creative', 'balanced'], tier: 'standard' },
  },
  {
    id: 'openai',
    providerId: 'custom',
    modelId: 'openai/gpt-5.4',
    displayName: 'gpt-5.4',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY || '',
    creditsPerRound: 250,
    defaultEnabled: true,
    badge: 'Flagship',
    agentMeta: { strengths: ['reasoning', 'coding', 'instruction-following'], tier: 'pro' },
  },

  {
    id: 'deepseek',
    providerId: 'custom',
    modelId: 'deepseek/deepseek-v3.2',
    displayName: 'deepseek-v3.2',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY || '',
    creditsPerRound: 15,
    defaultEnabled: true,
    badge: 'Lite',
    agentMeta: { strengths: ['logical', 'concise', 'fast'], tier: 'lite' },
  },

  {
    id: 'claude',
    providerId: 'custom',
    modelId: 'anthropic/claude-sonnet-4.6',
    displayName: 'Claude Sonnet 4.6',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY || '',
    creditsPerRound: 250,
    defaultEnabled: false,
    badge: 'Flagship',
    agentMeta: { strengths: ['nuanced-reasoning', 'writing', 'safety'], tier: 'pro' },
  },

  {
    id: 'xAI',
    providerId: 'custom',
    modelId: 'x-ai/grok-4.20-beta',
    displayName: 'grok-4.2-beta',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY || '',
    creditsPerRound: 200,
    defaultEnabled: false,
    badge: 'Flagship',
    agentMeta: { strengths: ['real-time-knowledge', 'wit', 'systems-thinking'], tier: 'pro' },
  },
  {
    id: 'minimax',
    providerId: 'custom',
    modelId: 'minimax/minimax-m2.5',
    displayName: 'minimax-m2.5',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY || '',
    creditsPerRound: 60,
    defaultEnabled: false,
    badge: 'Balance',
    agentMeta: { strengths: ['multimodal', 'creative', 'chinese'], tier: 'standard' },
  },
  {
    id: 'kimi',
    providerId: 'custom',
    modelId: 'moonshotai/kimi-k2.5',
    displayName: 'kimi-k2.5',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY || '',
    creditsPerRound: 60,
    defaultEnabled: false,
    badge: 'Balance',
    agentMeta: { strengths: ['long-context', 'research', 'chinese'], tier: 'standard' },
  },

  {
    id: 'Qwen',
    providerId: 'custom',
    modelId: 'qwen/qwen3.5-flash-02-23',
    displayName: 'qwen3.5',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY || '',
    creditsPerRound: 40,
    defaultEnabled: false,
    badge: 'Lite',
    agentMeta: { strengths: ['fast', 'chinese', 'efficient'], tier: 'lite' },
  },
];
