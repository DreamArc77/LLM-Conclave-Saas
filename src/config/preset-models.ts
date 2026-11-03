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
    /** 'lite' = budget | 'standard' = balanced | 'pro' = flagship */
    tier: 'lite' | 'standard' | 'pro';
  };
}

/**
 * Preset models — edit this array to configure models available to all visitors.
 * This file is server-side only; API keys are never sent to browsers.
 *
 * Pricing config (operator-editable):
 *   creditsPerRound  — fixed credit cost per model per round. When swapping in a
 *                      newer model, scale it by the OpenRouter price ratio of the
 *                      two models (4:1 input:output token blend) so each slot's
 *                      credit/price multiple stays constant.
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
    id: 'gemini-argon',
    providerId: 'custom',
    modelId: 'google/gemini-4-argon',
    displayName: 'Gemini 4 Argon',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY || '',
    // $2/$10 per 1M, priced at the same credit/price multiple as Gemini 3.8 Flash
    creditsPerRound: 195,
    defaultEnabled: false,
    badge: 'Flagship',
    agentMeta: { strengths: ['deep-reasoning', 'multimodal', 'long-context'], tier: 'pro' },
  },
  {
    id: 'openai',
    providerId: 'custom',
    modelId: 'openai/gpt-6.1-sol-pro',
    displayName: 'GPT-6.1 Sol Pro',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY || '',
    creditsPerRound: 90,
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
    modelId: 'anthropic/claude-opus-5.5',
    displayName: 'Claude Opus 5.5',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY || '',
    creditsPerRound: 335,
    defaultEnabled: false,
    badge: 'Flagship',
    agentMeta: { strengths: ['nuanced-reasoning', 'writing', 'safety'], tier: 'pro' },
  },

  {
    id: 'xAI',
    providerId: 'custom',
    modelId: 'x-ai/grok-4.7',
    displayName: 'Grok 4.7',
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
    modelId: 'minimax/minimax-m3.1-flash',
    displayName: 'MiniMax M3.1 Flash',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY || '',
    creditsPerRound: 28,
    defaultEnabled: false,
    badge: 'Balance',
    agentMeta: { strengths: ['multi-agent', 'coding', 'chinese'], tier: 'standard' },
  },
  {
    id: 'kimi',
    providerId: 'custom',
    modelId: 'moonshotai/kimi-k3.1-pro',
    displayName: 'Kimi K3.1 Pro',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY || '',
    creditsPerRound: 308,
    defaultEnabled: false,
    badge: 'Balance',
    agentMeta: { strengths: ['long-context', 'research', 'coding'], tier: 'standard' },
  },

  {
    id: 'Qwen',
    providerId: 'custom',
    modelId: 'qwen/qwen3.8-max-prime',
    displayName: 'Qwen 3.8 Max Prime',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY || '',
    creditsPerRound: 330,
    defaultEnabled: false,
    badge: 'Flagship',
    agentMeta: { strengths: ['agentic', 'coding', 'chinese'], tier: 'pro' },
  },
];
