import type { ProviderId, ProviderMeta } from '@/types/config';

export const PROVIDER_REGISTRY: Record<ProviderId, ProviderMeta> = {
  openai: {
    id: 'openai',
    name: 'OpenAI',
    protocol: 'openai-compatible',
    defaultBaseUrl: 'https://api.openai.com/v1',
    logoPath: '/provider-logos/openai.svg',
    defaultModels: ['gpt-4o', 'gpt-4o-mini', 'o1', 'o3-mini'],
  },
  anthropic: {
    id: 'anthropic',
    name: 'Anthropic',
    protocol: 'anthropic',
    defaultBaseUrl: 'https://api.anthropic.com',
    logoPath: '/provider-logos/anthropic.svg',
    defaultModels: ['claude-sonnet-4-5-20250929', 'claude-3-5-haiku-20241022'],
  },
  google: {
    id: 'google',
    name: 'Google',
    protocol: 'google-gemini',
    defaultBaseUrl: '',
    logoPath: '/provider-logos/google.svg',
    defaultModels: ['gemini-2.5-flash', 'gemini-2.5-pro'],
  },
  deepseek: {
    id: 'deepseek',
    name: 'DeepSeek',
    protocol: 'openai-compatible',
    defaultBaseUrl: 'https://api.deepseek.com/v1',
    logoPath: '/provider-logos/deepseek.svg',
    defaultModels: ['deepseek-chat', 'deepseek-reasoner'],
  },
  groq: {
    id: 'groq',
    name: 'Groq',
    protocol: 'openai-compatible',
    defaultBaseUrl: 'https://api.groq.com/openai/v1',
    logoPath: '/provider-logos/groq.svg',
    defaultModels: ['llama-3.3-70b-versatile', 'mixtral-8x7b-32768'],
  },
  doubao: {
    id: 'doubao',
    name: '豆包',
    protocol: 'openai-compatible',
    defaultBaseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    logoPath: '/provider-logos/doubao.svg',
    defaultModels: ['doubao-seed-1-6'],
  },
  glm: {
    id: 'glm',
    name: '智谱 GLM',
    protocol: 'openai-compatible',
    defaultBaseUrl: 'https://open.bigmodel.cn/api/paas/v4',
    logoPath: '/provider-logos/glm.svg',
    defaultModels: ['glm-4-plus'],
  },
  kimi: {
    id: 'kimi',
    name: 'Kimi',
    protocol: 'openai-compatible',
    defaultBaseUrl: 'https://api.moonshot.cn/v1',
    logoPath: '/provider-logos/kimi.svg',
    defaultModels: ['moonshot-v1-128k'],
  },
  custom: {
    id: 'custom',
    name: 'Custom',
    protocol: 'openai-compatible',
    defaultBaseUrl: '',
    logoPath: '/provider-logos/openai.svg',
    defaultModels: [],
  },
};

export const PROVIDER_LIST = Object.values(PROVIDER_REGISTRY);
