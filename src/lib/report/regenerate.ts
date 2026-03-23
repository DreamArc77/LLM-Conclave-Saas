import fs from 'fs';
import path from 'path';
import { PRESET_DEFINITIONS } from '@/config/preset-models';
import { PROVIDER_REGISTRY } from '@/lib/providers/registry';
import { streamFromOpenAI } from '@/lib/providers/openai-adapter';
import { streamFromAnthropic } from '@/lib/providers/anthropic-adapter';
import { streamFromGemini } from '@/lib/providers/gemini-adapter';
import {
  getUserRoleLabel,
  getParticipantSeparator,
  getDateLocaleString,
  getReportTemplate,
  getResearchMethod,
  getTokensLabel,
  getCreditCostLabel,
  getSummaryPromptFull,
} from '@/i18n/prompts';
import type { Locale } from '@/i18n';
import type { ProviderId } from '@/types/config';

export interface ConvMessage {
  role: 'user' | 'assistant';
  content: string;
  displayName?: string;
}

/**
 * Regenerate a report in a given locale from raw conversation messages.
 * Uses the same model-selection and prompt logic as generateSummary in relay/route.ts.
 */
export async function generateReportMarkdown(
  fullContext: ConvMessage[],
  query: string,
  locale: Locale,
): Promise<string> {
  // Model selection: prefer Gemini Flash, fall back to first available preset
  let summaryApiKey: string | null = null;
  let summaryModelId = '';
  let summaryProviderId = '';
  let summaryBaseUrl: string | undefined;

  const geminiPreset = PRESET_DEFINITIONS.find((p) => p.id === 'Gemini');
  if (geminiPreset?.apiKey) {
    summaryApiKey = geminiPreset.apiKey;
    summaryModelId = geminiPreset.modelId;
    summaryProviderId = geminiPreset.providerId;
    summaryBaseUrl = geminiPreset.baseUrl;
  } else {
    for (const preset of PRESET_DEFINITIONS) {
      if (preset.apiKey) {
        summaryApiKey = preset.apiKey;
        summaryModelId = preset.modelId;
        summaryProviderId = preset.providerId;
        summaryBaseUrl = preset.baseUrl;
        break;
      }
    }
  }

  if (!summaryApiKey) throw new Error('No model available for report generation');

  const provider = PROVIDER_REGISTRY[summaryProviderId as ProviderId];
  if (!provider) throw new Error('Provider not found');

  const baseUrl = summaryBaseUrl || provider.defaultBaseUrl;

  // Load locale-specific template
  let templateContent: string;
  const inlineTemplate = getReportTemplate(locale);
  if (inlineTemplate) {
    templateContent = inlineTemplate;
  } else {
    const templatePath = path.join(process.cwd(), 'src', 'AI智囊团专题研讨交付MD.md');
    templateContent = fs.readFileSync(templatePath, 'utf-8');
  }

  const userLabel = getUserRoleLabel(locale);
  const separator = getParticipantSeparator(locale);
  const dateLocale = getDateLocaleString(locale);

  const conversation = fullContext
    .map((m) => `${m.role === 'user' ? userLabel : (m.displayName || 'AI')}:\n${m.content}`)
    .join('\n\n');

  const participatingModels = [
    ...new Set(fullContext.filter((m) => m.role === 'assistant').map((m) => m.displayName || 'AI')),
  ].join(separator);

  const totalChars = fullContext.reduce((sum, m) => sum + m.content.length, 0);
  const estimatedTokens = Math.round(totalChars / 2);

  const dateStr = new Date().toLocaleString(dateLocale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  const researchMethod = getResearchMethod(locale, participatingModels, 0);
  const topicShort = query.slice(0, 30) + (query.length > 30 ? '...' : '');

  const filledTemplate = templateContent
    .replace('{{会议简要主题}}', topicShort)
    .replace('{{会议主题}}', query)
    .replace('{{获取当前时间}}', dateStr)
    .replace('{{估算全场对话的总Token消耗}}', getTokensLabel(locale, estimatedTokens))
    .replace('{{本次credit消耗}}', getCreditCostLabel(locale, 0))
    .replace(/\{\{请根据全场对话记录进行提炼。[\s\S]*?\}\}/, researchMethod);

  const summaryPrompt = getSummaryPromptFull(locale, filledTemplate, conversation);

  // Accumulate streamed chunks into a string
  let markdown = '';
  const writeSSE = async (data: { type: string; content?: string }) => {
    if (data.type === 'chunk' && data.content) markdown += data.content;
  };

  switch (provider.protocol) {
    case 'openai-compatible':
      await streamFromOpenAI({
        apiKey: summaryApiKey, baseUrl, model: summaryModelId,
        messages: [{ role: 'user', content: summaryPrompt }], writeSSE,
      });
      break;
    case 'anthropic':
      await streamFromAnthropic({
        apiKey: summaryApiKey, baseUrl, model: summaryModelId,
        messages: [{ role: 'user', content: summaryPrompt }], writeSSE,
      });
      break;
    case 'google-gemini':
      await streamFromGemini({
        apiKey: summaryApiKey, baseUrl, model: summaryModelId,
        messages: [{ role: 'user', content: summaryPrompt }], writeSSE,
      });
      break;
    default:
      throw new Error('Unknown provider protocol');
  }

  return markdown.trim();
}
