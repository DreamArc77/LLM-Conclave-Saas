import type { ProviderId } from '@/types/config';

export interface PresetDefinition {
  id: string;
  providerId: ProviderId;
  modelId: string;
  displayName: string;
  baseUrl?: string;
  apiKey: string;
}

/**
 * Preset models — edit this array to add models that all visitors can use.
 * This file is server-side only; API keys are never sent to browsers.
 *
 * For production deployments (e.g. Vercel), set API keys as environment variables
 * in the dashboard instead of hardcoding them here.
 */
export const PRESET_DEFINITIONS: PresetDefinition[] = [
  // === Add your preset models here ===
  //
  // Example:
  // {
  //   id: 'preset-deepseek-chat',
  //   providerId: 'deepseek',
  //   modelId: 'deepseek-chat',
  //   displayName: 'DeepSeek Chat (体验版)',
  //   baseUrl: 'https://api.deepseek.com/v1',   // optional, defaults to provider default
  //   apiKey: process.env.DEEPSEEK_API_KEY || '',
  // },
  {
    id: 'Gemini',
    providerId: 'custom',
    modelId: 'google/gemini-3-flash-preview',
    displayName: 'Gemini3.2',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY || '',
  },
  {
    id: 'Claude',
    providerId: 'custom',
    modelId: 'anthropic/claude-sonnet-4.6',
    displayName: 'Claude Sonnet 4.6',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY || '',
  },
  {
    id: 'openai',
    providerId: 'custom',
    modelId: 'openai/gpt-5.2',
    displayName: 'gpt-5.2',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY || '',
  },
  {
    id: 'Deepseek',
    providerId: 'doubao',
    modelId: 'ep-20260303150100-r95bk',
    displayName: 'DeepseekV3.2',
    apiKey: process.env.DOUBAO_API_KEY || '',
  },
  {
    id: 'Doubao',
    providerId: 'doubao',
    modelId: 'ep-20260225125500-8ljmw',
    displayName: '豆包2.0pro',
    apiKey: process.env.DOUBAO_API_KEY || '',
  },
    {
    id: 'Doubao',
    providerId: 'doubao',
    modelId: 'ep-20260225125500-8ljmw',
    displayName: '豆包2.0pro',
    apiKey: process.env.DOUBAO_API_KEY || '',
  },
  {
    id: 'Zhipu',
    providerId: 'doubao',
    modelId: 'ep-20260305173450-22cv5',
    displayName: 'GLM4.7',
    apiKey: process.env.DOUBAO_API_KEY || '',
  },
    {
    id: 'Qwen',
    providerId: 'custom',
    modelId: 'qwen/qwen3.5-flash-02-23',
    displayName: 'qwen3.5',
    baseUrl: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY || '',
  },
];
