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
  /**
   * Whether the model is usable with welcome/free credits. The free-tier set is
   * the default trio (DeepSeek + Gemini + GPT-6 Luna) plus MiniMax M3.1 Flash;
   * every other preset requires a credit purchase. Locked models are also
   * rejected server-side.
   */
  freeTier?: boolean;
  /** Hard completion-token cap per debate turn (provider length cap). */
  maxOutputTokens?: number;
  /** Prompt-token budget before older debate context is trimmed. */
  maxInputTokens?: number;
  /** OpenRouter reasoning-token cap for reasoning-heavy models. */
  reasoningMaxTokens?: number;
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
 *   freeTier         — whether welcome/free credits may use this model (paid unlocks the rest)
 *
 * Pricing audit (2026-11-16, OpenRouter list prices in USD per 1M tokens):
 *   blended = (4 × input + 1 × output) / 5
 *   Gemini 3.8 Flash ($0.825 / $4.125) is the anchor at 80 credits → 53.87 credits per blended $/1M.
 *   Every slot below sits at or above that anchor-derived floor. GPT-6.1 Sol Pro was below
 *   cost at 90 credits (floor ≈ 194) and Claude Opus 5.5 was marginally below at 335 (floor ≈ 388),
 *   so both were raised. DeepSeek/MiniMax/Grok/Kimi/Qwen keep their existing (above-floor) prices.
 */
export const PRESET_DEFINITIONS: PresetDefinition[] = [
  {
    id: 'deepseek',
    providerId: 'custom',
    modelId: 'deepseek/deepseek-v4.1-flash',
    displayName: 'DeepSeek V4.1 Flash',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY || '',
    creditsPerRound: 45, // $0.14 / $0.42 per 1M — floor ≈ 11
    defaultEnabled: true,
    freeTier: true,
    maxOutputTokens: 16000,
    badge: 'Lite',
    agentMeta: { strengths: ['logical', 'concise', 'fast'], tier: 'lite' },
  },
  {
    id: 'gemini',
    providerId: 'custom',
    modelId: 'google/gemini-3.8-flash',
    displayName: 'Gemini 3.8 Flash',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY || '',
    creditsPerRound: 80, // pricing anchor: $0.825 / $4.125 per 1M
    defaultEnabled: true,
    freeTier: true,
    maxOutputTokens: 12000,
    badge: 'Balance',
    agentMeta: { strengths: ['analytical', 'creative', 'balanced'], tier: 'standard' },
  },
  {
    id: 'gpt-luna',
    providerId: 'custom',
    modelId: 'openai/gpt-6-luna',
    displayName: 'GPT-6 Luna',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY || '',
    creditsPerRound: 10, // $0.10 / $0.50 per 1M — floor ≈ 10
    defaultEnabled: true,
    freeTier: true,
    maxOutputTokens: 12000,
    badge: 'Balance',
    agentMeta: { strengths: ['balanced', 'instruction-following', 'fast'], tier: 'standard' },
  },
  {
    id: 'gemini-argon',
    providerId: 'custom',
    modelId: 'google/gemini-4-argon',
    displayName: 'Gemini 4 Argon',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY || '',
    creditsPerRound: 195, // $2 / $10 per 1M — floor ≈ 194
    defaultEnabled: false,
    maxOutputTokens: 16000,
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
    creditsPerRound: 194, // $2 / $10 per 1M — floor ≈ 194 (raised from 90, which was below cost)
    defaultEnabled: false,
    maxOutputTokens: 16000,
    maxInputTokens: 40000,
    badge: 'Flagship',
    agentMeta: { strengths: ['reasoning', 'coding', 'instruction-following'], tier: 'pro' },
  },
  {
    id: 'claude',
    providerId: 'custom',
    modelId: 'anthropic/claude-opus-5.5',
    displayName: 'Claude Opus 5.5',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY || '',
    creditsPerRound: 388, // $4 / $20 per 1M — floor ≈ 388 (raised from 335, which was below cost)
    defaultEnabled: false,
    maxOutputTokens: 12000,
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
    creditsPerRound: 375, // $2 / $6 per 1M — floor ≈ 151
    defaultEnabled: false,
    maxOutputTokens: 24000,
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
    creditsPerRound: 28, // $0.15 / $0.60 per 1M — floor ≈ 13
    defaultEnabled: false,
    freeTier: true,
    maxOutputTokens: 12000,
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
    creditsPerRound: 308, // $0.2403 / $8.4023 per 1M — floor ≈ 101
    defaultEnabled: false,
    maxOutputTokens: 16000,
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
    creditsPerRound: 330, // $4 / $12 per 1M — floor ≈ 302
    defaultEnabled: false,
    maxOutputTokens: 12000,
    maxInputTokens: 60000,
    reasoningMaxTokens: 4096,
    badge: 'Flagship',
    agentMeta: { strengths: ['agentic', 'coding', 'chinese'], tier: 'pro' },
  },
];
