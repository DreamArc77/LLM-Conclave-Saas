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
    creditsPerRound: 50,
    defaultEnabled: true,
  },
  {
    id: 'claude',
    providerId: 'custom',
    modelId: 'anthropic/claude-sonnet-4.6',
    displayName: 'Claude Sonnet 4.6',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY || '',
    creditsPerRound: 260,
    defaultEnabled: false,
  },
  {
    id: 'openai',
    providerId: 'custom',
    modelId: 'openai/gpt-5.2',
    displayName: 'gpt-5.2',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY || '',
    creditsPerRound: 220,
    defaultEnabled: true,
  },
  {
    id: 'deepseek',
    providerId: 'custom',
    modelId: 'deepseek/deepseek-v3.2',
    displayName: 'deepseek-v3.2',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY || '',
    creditsPerRound: 40,
    defaultEnabled: true,
  },
   {
    id: 'xAI',
    providerId: 'custom',
    modelId: 'x-ai/grok-4.1-fast',
    displayName: 'grok-4.1',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY || '',
    creditsPerRound: 180,
    defaultEnabled: false,
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
  },
];
