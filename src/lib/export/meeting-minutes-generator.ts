import { parseSSEStream } from '@/lib/relay/stream-parser';
import { PROVIDER_REGISTRY } from '@/lib/providers/registry';
import type { ChatMessage } from '@/types/chat';
import type { ModelConfig } from '@/types/config';

export async function generateMeetingMinutes(
  messages: ChatMessage[],
  model: ModelConfig,
  elapsedSec: number,
  estimatedTokens: number
): Promise<string> {
  const provider = PROVIDER_REGISTRY[model.providerId];
  const apiKey = model.apiKey;
  const baseUrl = model.baseUrl || provider.defaultBaseUrl;

  const conversation = formatConversation(messages);

  const templateRes = await fetch('/api/report-template');
  if (!templateRes.ok) throw new Error('Failed to load report template (ReportTemplate.md)');
  const templateContent = await templateRes.text();

  const prompt = buildPrompt(conversation, messages, elapsedSec, estimatedTokens, templateContent);

  const authHeaders: Record<string, string> = model.isPreset
    ? { 'x-preset-id': model.id }
    : { 'x-api-key': apiKey };

  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
      'x-base-url': baseUrl,
    },
    body: JSON.stringify({
      provider: provider.protocol,
      model: model.modelId,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API error ${response.status}: ${errorText}`);
  }

  if (!response.body) {
    throw new Error('No response body');
  }

  return parseSSEStream(response.body, () => {});
}

function formatConversation(messages: ChatMessage[]): string {
  return messages
    .filter((m) => !m.isError && !m.isSystem)
    .map((m) => {
      const label = m.role === 'user' ? '用户' : (m.displayName || m.modelId || 'AI');
      return `${label}:\n${m.content}`;
    })
    .join('\n\n');
}

function buildPrompt(
  conversation: string,
  messages: ChatMessage[],
  elapsedSec: number,
  estimatedTokens: number,
  templateContent: string
): string {
  const participatingModels = [
    ...new Set(
      messages
        .filter((m) => m.role === 'assistant' && !m.isError && !m.isSystem)
        .map((m) => m.displayName || m.modelId || 'AI')
    ),
  ].join('、');

  const firstTimestamp = messages[0]?.timestamp;
  const dateStr = firstTimestamp
    ? new Date(firstTimestamp).toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    : new Date().toLocaleString('zh-CN');

  return `请将以下AI智囊团辩论记录整理成专题研讨报告，严格按照模板的章节结构和Markdown格式输出，不要输出任何模板以外的内容。

规则：
1. 将模板中所有方括号 [xxx] 内的占位说明替换为根据辩论记录提炼的真实内容
2. 将模板顶部的元数据替换为以下实际数据：
   日期：${dateStr}
   参与模型：${participatingModels}
   讨论过程：合计讨论耗时 ${elapsedSec} 秒，总消耗Token约 ${estimatedTokens}
3. 保持所有Markdown格式完全一致（标题级别、表格、引用块、列表符号）

模板：

${templateContent}

辩论记录：

${conversation}`;
}
