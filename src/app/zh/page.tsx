import { HomePage } from '@/components/home/HomePage';
import { zhCN } from '@/i18n/messages/zh-CN';
import { homeMetadata } from '@/lib/seo';

export const metadata = homeMetadata('zh');

export default function MarketingHomeZh() {
  return <HomePage locale="zh" t={zhCN.home} />;
}
