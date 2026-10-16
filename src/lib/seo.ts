import type { Metadata } from 'next';

export const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://llmconclave.com';

export type HomeLocale = 'en' | 'zh' | 'ja';

const HOME_PATH: Record<HomeLocale, string> = {
  en: '/',
  zh: '/zh',
  ja: '/ja',
};

const HOME_TITLE: Record<HomeLocale, string> = {
  en: 'LLM Conclave — Multi-AI Debate & Decision Platform',
  zh: 'LLM Conclave — 多模型 AI 辩论与决策平台',
  ja: 'LLM Conclave — マルチAIディベート&意思決定プラットフォーム',
};

const HOME_DESCRIPTION: Record<HomeLocale, string> = {
  en: 'LLM Conclave lets GPT, Claude, Gemini and more debate your questions in rounds and deliver structured consensus reports for better decisions. Free to start.',
  zh: '让 GPT、Claude、Gemini 等多个顶级 AI 模型围绕你的问题展开多轮辩论，输出结构化共识报告，为研究、工作与生活决策提供更均衡的洞察。免费开始。',
  ja: 'GPT、Claude、Gemini など複数の主要 AI モデルがあなたの質問を多ラウンドで討論し、構造化された合意レポートをお届け。より良い意思決定を、無料で始められます。',
};

const OG_LOCALE: Record<HomeLocale, string> = {
  en: 'en_US',
  zh: 'zh_CN',
  ja: 'ja_JP',
};

/**
 * Metadata for the three marketing homepage locales.
 * English owns the root URL; hreflang ties "/", "/zh" and "/ja" together.
 */
export function homeMetadata(locale: HomeLocale): Metadata {
  const path = HOME_PATH[locale];
  return {
    title: { absolute: HOME_TITLE[locale] },
    description: HOME_DESCRIPTION[locale],
    alternates: {
      canonical: path,
      languages: {
        en: '/',
        'zh-CN': '/zh',
        ja: '/ja',
        'x-default': '/',
      },
    },
    openGraph: {
      title: HOME_TITLE[locale],
      description: HOME_DESCRIPTION[locale],
      url: path,
      siteName: 'LLM Conclave',
      type: 'website',
      locale: OG_LOCALE[locale],
    },
    twitter: {
      card: 'summary_large_image',
      title: HOME_TITLE[locale],
      description: HOME_DESCRIPTION[locale],
    },
  };
}
