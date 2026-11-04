import type { Messages } from '@/i18n/messages/en';
import { en } from '@/i18n/messages/en';
import { zhCN } from '@/i18n/messages/zh-CN';
import { ja } from '@/i18n/messages/ja';
import { listVerdicts } from '@/lib/content';
import { HomeNavbar } from './HomeNavbar';
import { HomeHero } from './HomeHero';
import { HowItWorks } from './HowItWorks';
import { HomeFeatures } from './HomeFeatures';
import { Comparison } from './Comparison';
import { HomeAbout } from './HomeAbout';
import { HomeFAQ } from './HomeFAQ';
import { HomeFooter } from './HomeFooter';
import { HomeVerdicts } from './HomeVerdicts';
import { JsonLd } from './JsonLd';

type HomeMessages = Messages['home'];

const HTML_LANG: Record<'zh' | 'ja', string> = {
  zh: 'zh-CN',
  ja: 'ja',
};

const MESSAGES = { en, zh: zhCN, ja };

export async function HomePage({ locale, t }: { locale: 'en' | 'zh' | 'ja'; t: HomeMessages }) {
  const m = MESSAGES[locale];
  const verdicts = await listVerdicts(locale);

  return (
    <main className="min-h-screen bg-white text-gray-900 selection:bg-blue-100 font-sans overflow-x-hidden">
      {locale !== 'en' && (
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.lang='${HTML_LANG[locale]}';`,
          }}
        />
      )}
      <HomeNavbar locale={locale} t={t} />
      <HomeHero t={t} />
      <HowItWorks t={t} />
      <HomeFeatures t={t} />
      <Comparison t={t} />
      {verdicts.length > 0 && (
        <HomeVerdicts locale={locale} verdicts={verdicts} t={m.verdicts} tp={m.predictions} />
      )}
      <HomeAbout t={t} />
      <HomeFAQ t={t} />
      <HomeFooter locale={locale} t={t} />
      <JsonLd t={t} />
    </main>
  );
}
