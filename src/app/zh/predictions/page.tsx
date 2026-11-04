import { PredictionsHub } from '@/components/predictions/PredictionsHub';
import { LangFix } from '@/components/common/LangFix';
import { zhCN } from '@/i18n/messages/zh-CN';
import { pageMetadata } from '@/lib/content-seo';

export const metadata = pageMetadata({
  title: zhCN.predictions.hubTitle,
  description: zhCN.predictions.hubIntro,
  path: '/zh/predictions',
  alternates: { en: '/predictions', zh: '/zh/predictions', ja: '/ja/predictions' },
  index: true,
});

export default function PredictionsPageZh() {
  return (
    <>
      <LangFix lang="zh-CN" />
      <PredictionsHub locale="zh" t={zhCN.predictions} homeHref="/zh" />
    </>
  );
}
