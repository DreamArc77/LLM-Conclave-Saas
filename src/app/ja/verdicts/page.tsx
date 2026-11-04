import { VerdictsHub } from '@/components/verdicts/VerdictsHub';
import { LangFix } from '@/components/common/LangFix';
import { listVerdicts } from '@/lib/content';
import { ja } from '@/i18n/messages/ja';
import { pageMetadata } from '@/lib/content-seo';

export const metadata = pageMetadata({
  title: ja.verdicts.hubTitle,
  description: ja.verdicts.hubIntro,
  path: '/ja/verdicts',
  alternates: { en: '/verdicts', zh: '/zh/verdicts', ja: '/ja/verdicts' },
  index: true,
});

export default async function VerdictsPageJa() {
  const verdicts = await listVerdicts('ja');
  return (
    <>
      <LangFix lang="ja" />
      <VerdictsHub verdicts={verdicts} t={ja.verdicts} otherHref="/ja" />
    </>
  );
}
