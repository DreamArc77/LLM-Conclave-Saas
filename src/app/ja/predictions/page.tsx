import { PredictionsHub } from '@/components/predictions/PredictionsHub';
import { LangFix } from '@/components/common/LangFix';
import { ja } from '@/i18n/messages/ja';
import { pageMetadata } from '@/lib/content-seo';

export const metadata = pageMetadata({
  title: ja.predictions.hubTitle,
  description: ja.predictions.hubIntro,
  path: '/ja/predictions',
  alternates: { en: '/predictions', zh: '/zh/predictions', ja: '/ja/predictions' },
  index: true,
});

export default function PredictionsPageJa() {
  return (
    <>
      <LangFix lang="ja" />
      <PredictionsHub locale="ja" t={ja.predictions} homeHref="/ja" />
    </>
  );
}
