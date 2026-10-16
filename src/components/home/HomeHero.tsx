import type { Messages } from '@/i18n/messages/en';
import { DebatePromptBox } from './DebatePromptBox';

type HomeMessages = Messages['home'];

const PROVIDERS = [
  { slug: 'openai', name: 'OpenAI GPT' },
  { slug: 'anthropic', name: 'Anthropic Claude' },
  { slug: 'gemini', name: 'Google Gemini' },
  { slug: 'xai', name: 'xAI Grok' },
  { slug: 'deepseek', name: 'DeepSeek' },
  { slug: 'qwen', name: 'Qwen' },
  { slug: 'glm', name: 'GLM' },
  { slug: 'kimi', name: 'Kimi' },
  { slug: 'minimax', name: 'MiniMax' },
  { slug: 'doubao', name: 'Doubao' },
  { slug: 'groq', name: 'Groq' },
  { slug: 'google', name: 'Google' },
];

export function HomeHero({ t }: { t: HomeMessages }) {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden bg-white">
      {/* Geometric Network Pattern Background matching the Logo (Lines and Nodes) */}
      <div
        className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M0 0l100 100M100 0L0 100\' stroke=\'%23000\' stroke-width=\'1\' fill=\'none\'/%3E%3Ccircle cx=\'50\' cy=\'50\' r=\'4\' fill=\'%23000\'/%3E%3C/svg%3E")',
          backgroundSize: '120px 120px',
        }}
      />

      {/* Ambient glow orbs (pure CSS, no heavy images) */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-300/10 rounded-full blur-[100px] pointer-events-none z-0" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-300/10 rounded-full blur-[100px] pointer-events-none z-0" />

      <div className="relative z-10 max-w-4xl mx-auto px-6 w-full flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-cyan-200 bg-cyan-50/80 text-cyan-700 text-sm md:text-base font-bold tracking-wide uppercase mb-8 shadow-sm shadow-cyan-100/50 backdrop-blur-sm">
          {t.hero.badge}
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-gray-900 mb-8">
          {t.hero.title}{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-500">
            {t.hero.titleAccent}
          </span>
        </h1>

        <p className="max-w-2xl text-lg text-gray-500 mb-10 leading-relaxed">{t.hero.subtitle}</p>

        <DebatePromptBox
          placeholder={t.hero.promptPlaceholder}
          cta={t.hero.promptCta}
          note={t.hero.promptNote}
        />

        {/* Provider logo strip */}
        <p className="mt-14 text-xs font-bold tracking-widest uppercase text-gray-400 mb-5">
          {t.hero.modelsCaption}
        </p>
        <ul className="flex flex-wrap justify-center gap-2.5 max-w-3xl" aria-label="Supported AI models">
          {PROVIDERS.map((p) => (
            <li
              key={p.slug}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-gray-200 bg-white text-xs font-medium text-gray-600"
            >
              <img
                src={`/provider-logos/${p.slug}.svg`}
                alt={p.name}
                width={16}
                height={16}
                loading="lazy"
                className="w-4 h-4 object-contain"
              />
              {p.name}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
