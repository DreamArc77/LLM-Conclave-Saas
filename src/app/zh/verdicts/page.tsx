import { VerdictsHub } from '@/components/verdicts/VerdictsHub';
import { LangFix } from '@/components/common/LangFix';
import { listVerdicts } from '@/lib/content';
import { zhCN } from '@/i18n/messages/zh-CN';
import { pageMetadata } from '@/lib/content-seo';

export const metadata = pageMetadata({
  title: zhCN.verdicts.hubTitle,
  description: zhCN.verdicts.hubIntro,
  path: '/zh/verdicts',
  alternates: { en: '/verdicts', zh: '/zh/verdicts', ja: '/ja/verdicts' },
  index: true,
});

export default async function VerdictsPageZh() {
  const verdicts = await listVerdicts('zh');
  return (
    <>
      <LangFix lang="zh-CN" />
      <VerdictsHub verdicts={verdicts} t={zhCN.verdicts} otherHref="/zh" />
    </>
  );
}
