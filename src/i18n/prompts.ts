import type { Locale } from './index';

// ─── Report templates ──────────────────────────────────────────────────────────
// Note: {{}} placeholders are identical to the zh-CN template file so the same
// replacement code in relay/route.ts works for all locales.

const EN_REPORT_TEMPLATE = `# LLM Conclave Research Brief: [{{会议简要主题}}]

\`\`\`markdown
**Meeting Time**: {{获取当前时间}}
**Token Consumption**: {{估算全场对话的总Token消耗}}
**Credit Consumption**: {{本次credit消耗}}
**Discussion Method**: {{请根据全场对话记录进行提炼。Format reference: "This session featured [Models A, B, etc.] engaging in [X] rounds of cross-debate and perspective sharing, with [Summary Model C] completing the convergence summary, with a total evaluation time of approximately [X] seconds."}}
\`\`\`

---

## 🎯 Our Direct Recommendations
_(For your question [{{会议主题}}], here are the think-tank's final decisions:)_

1. **Key Recommendation 1**: [Describe the most direct action point or conclusion in one or two sentences]
2. **Key Recommendation 2**: [If there's a second important recommendation, list it here]
> 💡 **Why this recommendation?** (Explain the core reasoning in one or two sentences, straight to the point.)

---

## 🗣️ Core Viewpoints at a Glance
_(Main perspectives from the participating AIs:)_

- **[Model A]**: [Summarize their core view or argument on this topic]
- **[Model B]**: [Summarize a different perspective or supplementary opinion they raised]
- **[Model C]**: [Summarize their assessment or trade-off analysis]

---

## 📝 Detailed Discussion (By Topic)
_(If you'd like to know the specifics of what we discussed, see below:)_

### 📌 Topic 1: [Sub-topic A Name]
- **Areas of consensus**: [Write the points all models agreed on]
- **Areas of disagreement**: [Write the diverging opinions, e.g. A thinks it's good, but B sees risks]

### 📌 Topic 2: [Sub-topic B Name]
- **Areas of consensus**: [Core consensus on this topic]
- **Areas of disagreement**: [Core disagreements on this topic]

---

🤖 _We hope this brief is helpful! If you have questions about any topic or want to challenge a conclusion, just let us know and we can start another round of discussion._`;

const JA_REPORT_TEMPLATE = `# LLM Conclave 研究ブリーフ：[{{会议简要主题}}]

\`\`\`markdown
**会議時間**：{{获取当前时间}}
**トークン消費**：{{估算全场对话的总Token消耗}}
**クレジット消費**：{{本次credit消耗}}
**討論方式**：{{请根据全场对话记录进行提炼。フォーマット参考："このセッションでは、[参加モデルA、Bなど]が[X]ラウンドの交差発言と視点補完を行い、最終的に[要約モデルC]が収束要約を完成させ、評価に要した合計時間は約[X]秒でした。"}}
\`\`\`

---

## 🎯 直接的な提言
_（あなたのご質問【{{会议主题}}】に対して、シンクタンクが検討した最終的な提案：）_

1. **主要提言 1**：[最も直接的な行動項目または結論を1〜2文で説明してください]
2. **主要提言 2**：[重要な2番目の提言がある場合はこちらに記載]
> 💡 **なぜこの提言なのか？**（核心的な理由を1〜2文で直接説明してください。）

---

## 🗣️ 各モデルの核心的見解
_（参加AIの主な見解：）_

- **[モデルA]**：[このテーマに関する核心的な見解または主張をまとめてください]
- **[モデルB]**：[提示された異なる視点または補足意見をまとめてください]
- **[モデルC]**：[評価またはトレードオフ分析をまとめてください]

---

## 📝 詳細討論内容（議題別）
_（何を具体的に議論したか知りたい場合はこちらをご覧ください：）_

### 📌 議題1：[サブ議題A名称]
- **全員が同意した点**：[全モデルが同意したポイントを記述]
- **意見が分かれた点**：[異なる意見を記述、例：Aは良いと思ったが、Bはリスクがあると考えた]

### 📌 議題2：[サブ議題B名称]
- **全員が同意した点**：[この議題のコアコンセンサス]
- **意見が分かれた点**：[この議題のコア対立]

---

🤖 _このブリーフがお役に立てることを願っています！何か議題についてご質問があるか、結論を覆したい場合は、いつでもお知らせください。次のラウンドの議論をすぐに開始できます。_`;

/** Returns locale-specific template string, or null for zh-CN (reads from disk). */
export function getReportTemplate(locale: Locale): string | null {
  switch (locale) {
    case 'en': return EN_REPORT_TEMPLATE;
    case 'ja': return JA_REPORT_TEMPLATE;
    default: return null;
  }
}

/** Locale-aware "research method" metadata line for the report header. */
export function getResearchMethod(locale: Locale, participants: string, elapsedSec: number): string {
  switch (locale) {
    case 'en':
      return `This session featured in-depth debate and logical analysis by ${participants}, with a total evaluation time of approximately ${elapsedSec} seconds.`;
    case 'ja':
      return `このセッションでは、${participants}が深度ある討論と論理的分析を行い、評価に要した合計時間は約${elapsedSec}秒でした。`;
    default:
      return `本次会议由 ${participants} 进行了深度辩论与逻辑拆解，评估总计耗时约 ${elapsedSec} 秒。`;
  }
}

/** Locale-aware token consumption label. */
export function getTokensLabel(locale: Locale, tokens: number): string {
  switch (locale) {
    case 'en': return `~${tokens} tokens`;
    case 'ja': return `約${tokens}トークン`;
    default: return `约 ${tokens}`;
  }
}

/** Locale-aware credit cost label for the report summary. */
export function getCreditCostLabel(locale: Locale, cost: number): string {
  switch (locale) {
    case 'en': return `${cost} credits`;
    case 'ja': return `${cost}クレジット`;
    default: return `${cost} credits`;
  }
}

/** Builds the full summary prompt combining instructions, template, and debate transcript. */
export function getSummaryPromptFull(locale: Locale, template: string, conversation: string): string {
  const instructions = getSummaryPromptInstructions(locale);
  switch (locale) {
    case 'en':
      return `${instructions}\n\nTemplate (title and metadata pre-filled):\n\n${template}\n\nDebate transcript:\n\n${conversation}`;
    case 'ja':
      return `${instructions}\n\nテンプレート（タイトルとメタデータは事前入力済み）：\n\n${template}\n\nディベートの記録：\n\n${conversation}`;
    default:
      return `${instructions}\n\n模板（标题和元数据已预填）：\n\n${template}\n\n辩论记录：\n\n${conversation}`;
  }
}

/** "Initial proposition" context label for debate rounds 2+. */
export function getInitialPropositionLabel(locale: Locale): string {
  switch (locale) {
    case 'en': return 'Initial Question';
    case 'ja': return '初期命題';
    default: return '初始命题';
  }
}

/** "Current discussion" context label for debate rounds 2+. */
export function getCurrentDiscussionLabel(locale: Locale): string {
  switch (locale) {
    case 'en': return 'Current Discussion';
    case 'ja': return '現在の議論内容';
    default: return '当前对话内容';
  }
}

/** Self-reference label when the current model is speaking. */
export function getSelfLabel(locale: Locale, displayName: string): string {
  switch (locale) {
    case 'en': return `You (${displayName})`;
    case 'ja': return `あなた（${displayName}）`;
    default: return `你（${displayName}）`;
  }
}

export function getDebateSystemPrompt(
  locale: Locale,
  query: string,
  modelName: string
): string {
  switch (locale) {
    case 'en':
      return `You are participating in a think-tank debate. Your role is "${modelName}".

Always align with the goal: Your arguments and counterarguments must serve to better answer the user's original question: ${query}

Global awareness: Read previous conversation history and do not repeat points already discussed.

Independent thinking: Don't blindly follow trends in the conversation. Think independently and contribute valuable perspectives.

Constructive conflict: Share different angles and viewpoints; don't hesitate to point out and explain disagreements with previous statements.

Don't facilitate: You are a speaker, not a moderator. Do not issue instructions or suggestions to the next speaker.

Exit mechanism: Read the conversation history. If you find that your next response cannot provide any new arguments, evidence, or perspectives—and would only repeat or paraphrase others—output [FINISH] and stop.`;

    case 'ja':
      return `あなたはシンクタンクディベートに参加しています。あなたの役割は「${modelName}」です。

常に目標に沿って：あなたの主張と反論は、ユーザーの最初の質問に完璧に答えるためのものでなければなりません：${query}

全体的な認識：以前の会話履歴を読み、すでに議論されたポイントを繰り返さないでください。

独立した思考：会話の傾向に盲目的に従わないでください。独立して考え、価値ある視点を提供してください。

建設的な対立：異なる角度や観点を共有し、以前の発言との不一致を指摘することをためらわないでください。

進行役にならない：あなたは発言者であり、司会者ではありません。次の発言者への指示や提案を行わないでください。

退出メカニズム：会話履歴を読んでください。新しい議論、証拠、視点を提供できず、他の人の意見を繰り返すだけになる場合は、[FINISH] を出力して発言を停止してください。`;

    default: // zh-CN
      return `你正在参与一场智囊团辩论。你的身份是「${modelName}」。

始终对齐目标：你的任何观点和反驳必须是为了更完美地回答用户的初始问题：${query}

全局意识：请阅读之前的对话记录，不要重复已经讨论过的观点。

独立思考：不要盲从对话记录中的趋势和方向，不要随大流，独立思考，输出有价值的观点

有效冲突：鼓励输出你不同的角度和观点，不避讳的指出对之前对话记录中不认可的观点和原因

不要引导：你是发言者，不是会议组织者，不要向下一个发言者下达任何建议或指令

退出机制：请阅读之前的对话记录。如果你发现自己接下来的回复无法提供任何新的论点、证据或视角，而仅仅是在重复或转述前人的观点，请输出 [FINISH] 并停止发言。`;
  }
}

export function getSummaryPromptInstructions(locale: Locale): string {
  switch (locale) {
    case 'en':
      return `IMPORTANT: Write ALL content (fill in every [xxx] placeholder) in ENGLISH.

Please organize the following LLM Conclave debate into a structured research report in English. Follow the template's section structure and Markdown format strictly. Output only what the template specifies.

Rules:
1. Replace all placeholders in square brackets [xxx] with content distilled from the debate, written in English
2. The title and top metadata (meeting time, token usage, discussion method) are pre-filled — keep them as-is
3. Maintain consistent Markdown formatting (heading levels, tables, blockquotes, list styles)`;

    case 'ja':
      return `重要：すべての内容（[xxx]のプレースホルダーを含む）を日本語で記述してください。

以下のAIカウンシルのディベートを、日本語の構造化されたリサーチレポートにまとめてください。テンプレートのセクション構造とMarkdown形式に厳密に従い、テンプレート以外の内容は出力しないでください。

ルール：
1. 角括弧 [xxx] 内のすべてのプレースホルダーを、ディベートから抽出した内容（日本語）で置き換えてください
2. タイトルと上部のメタデータ（会議時間、トークン消費、討論方式）はすでに記入されています — そのままにしてください
3. Markdownの書式を一貫して維持してください（見出しレベル、表、引用ブロック、リストスタイル）`;

    default: // zh-CN
      return `请将以下AI智囊团辩论记录整理成专题研讨报告，严格按照模板的章节结构和Markdown格式输出，不要输出任何模板以外的内容。

规则：
1. 将模板中所有方括号 [xxx] 内的占位说明替换为根据辩论记录提炼的真实内容
2. 标题和顶部元数据（会议时间、Token消耗、研讨方式）已经填写完毕，请保持原样，不要修改
3. 保持所有Markdown格式完全一致（标题级别、表格、引用块、列表符号）`;
  }
}

export function getUserRoleLabel(locale: Locale): string {
  switch (locale) {
    case 'en': return 'User';
    case 'ja': return 'ユーザー';
    default: return '用户';
  }
}

export function getParticipantSeparator(locale: Locale): string {
  return locale === 'zh-CN' || locale === 'ja' ? '、' : ', ';
}

export function getDateLocaleString(locale: Locale): string {
  switch (locale) {
    case 'en': return 'en-US';
    case 'ja': return 'ja-JP';
    default: return 'zh-CN';
  }
}
