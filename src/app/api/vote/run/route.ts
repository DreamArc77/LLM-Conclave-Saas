import { PRESET_DEFINITIONS } from '@/config/preset-models';
import { PROVIDER_REGISTRY } from '@/lib/providers/registry';
import { streamFromOpenAI } from '@/lib/providers/openai-adapter';
import { streamFromAnthropic } from '@/lib/providers/anthropic-adapter';
import { streamFromGemini } from '@/lib/providers/gemini-adapter';
import type { ProviderId } from '@/types/config';
import type { Locale } from '@/i18n';

export const dynamic = 'force-dynamic';

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

interface ModelInput {
  id: string;
  modelId: string;
  providerId: string;
  displayName: string;
  apiKey?: string;
  isPreset?: boolean;
  baseUrl?: string;
}

interface VoteRunRequest {
  models: ModelInput[];
  alternatives: string[];
  context: Array<{ role: 'user' | 'assistant'; content: string; displayName?: string }>;
  locale?: Locale;
  sessionId?: string;
}

function getVotePrompt(locale: Locale, alternatives: string[], displayName: string): string {
  const optionLines = alternatives
    .map((alt, i) => `${OPTION_LETTERS[i]}: ${alt}`)
    .join('\n');

  switch (locale) {
    case 'en':
      return `You are ${displayName} and you have participated in the discussion above.

Now it's time to vote. Choose the best option from the following candidate solutions:

${optionLines}

Instructions:
- Start your response with "Vote: [letter]" on the first line (e.g., "Vote: A")
- Then write 1-2 sentences explaining your choice
- Be concise and direct`;

    case 'ja':
      return `あなたは${displayName}として上記の議論に参加しました。

次の候補から最良の選択肢に投票してください：

${optionLines}

指示：
- 最初の行に「投票：[文字]」と書いてください（例：「投票：A」）
- 次に1〜2文で選択の理由を説明してください
- 簡潔に答えてください`;

    default: // zh-CN
      return `你是${displayName}，你已参与了上述讨论。

现在请从以下备选方案中投票选出最优方案：

${optionLines}

要求：
- 第一行写"投票：[字母]"（例如："投票：A"）
- 然后用 1-2 句话说明你的选择理由
- 保持简洁直接`;
  }
}

/** Parse "Vote: A" / "投票：A" patterns from model output */
function parseVoteChoice(text: string, alternatives: string[]): { choice: string; statement: string } {
  const letters = OPTION_LETTERS.slice(0, alternatives.length);

  // Match: "Vote: A" / "投票: A" / "投票：A" / "vote: a" etc.
  const pattern = new RegExp(`(?:vote|投票)[：:\\s]*([${letters.join('')}${letters.join('').toLowerCase()}])`, 'i');
  const match = text.match(pattern);
  const choice = match ? match[1].toUpperCase() : letters[0]; // fallback to first option

  // Statement: everything after the first newline, or after the vote line
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const statementLines = lines.filter((l) => !pattern.test(l)).slice(0, 3);
  const statement = statementLines.join(' ').slice(0, 200).trim() || text.slice(0, 100).trim();

  return { choice, statement };
}

export async function POST(req: Request): Promise<Response> {
  let body: VoteRunRequest;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { models, alternatives, context, locale = 'zh-CN' } = body;
  if (!models?.length || !alternatives?.length || alternatives.length < 2) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const enc = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(enc.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      for (let i = 0; i < models.length; i++) {
        const model = models[i];
        send({ type: 'vote_start', modelIndex: i, displayName: model.displayName });

        const provider = PROVIDER_REGISTRY[model.providerId as ProviderId];
        if (!provider) {
          send({ type: 'error', message: `Unknown provider: ${model.providerId}` });
          continue;
        }

        // Resolve API key
        let apiKey: string;
        if (model.isPreset) {
          const preset = PRESET_DEFINITIONS.find((p) => p.id === model.id);
          if (!preset?.apiKey) {
            send({ type: 'error', message: `No API key for preset: ${model.id}` });
            continue;
          }
          apiKey = preset.apiKey;
        } else {
          if (!model.apiKey) {
            send({ type: 'error', message: `No API key for ${model.displayName}` });
            continue;
          }
          apiKey = model.apiKey;
        }

        const baseUrl = model.baseUrl || provider.defaultBaseUrl;
        const votePrompt = getVotePrompt(locale, alternatives, model.displayName);

        // Build messages: conversation context + voting prompt as final user message
        const userLabel = locale === 'en' ? 'User' : locale === 'ja' ? 'ユーザー' : '用户';
        const historyText = context
          .map((m) => `${m.role === 'user' ? userLabel : (m.displayName || 'AI')}:\n${m.content}`)
          .join('\n\n');

        const messages: Array<{ role: 'user' | 'assistant'; content: string }> = [
          {
            role: 'user',
            content: historyText ? `${historyText}\n\n---\n\n${votePrompt}` : votePrompt,
          },
        ];

        let fullContent = '';
        const writeSSE = async (data: { type: string; content?: string }) => {
          if (data.type === 'chunk' && data.content) {
            fullContent += data.content;
            send({ type: 'content', text: data.content });
          }
        };

        try {
          switch (provider.protocol) {
            case 'openai-compatible':
              await streamFromOpenAI({ apiKey, baseUrl, model: model.modelId, messages, writeSSE });
              break;
            case 'anthropic':
              await streamFromAnthropic({ apiKey, baseUrl, model: model.modelId, messages, writeSSE });
              break;
            case 'google-gemini':
              await streamFromGemini({ apiKey, baseUrl, model: model.modelId, messages, writeSSE });
              break;
            default:
              send({ type: 'error', message: `Unknown protocol: ${provider.protocol}` });
              continue;
          }
        } catch (err) {
          console.error(`[vote/run] Model error (${model.displayName}):`, err);
          send({ type: 'error', message: err instanceof Error ? err.message : 'Model error' });
          // Continue with other models even if one fails
          send({
            type: 'vote_done',
            modelIndex: i,
            modelId: model.modelId,
            providerId: model.providerId,
            displayName: model.displayName,
            choice: OPTION_LETTERS[0],
            statement: '(error)',
          });
          continue;
        }

        const { choice, statement } = parseVoteChoice(fullContent, alternatives);
        send({
          type: 'vote_done',
          modelIndex: i,
          modelId: model.modelId,
          providerId: model.providerId,
          displayName: model.displayName,
          choice,
          statement,
        });
      }

      send({ type: 'voting_complete' });
      send({ type: 'done' });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
