import { HomePage } from '@/components/home/HomePage';
import { ja } from '@/i18n/messages/ja';
import { homeMetadata } from '@/lib/seo';

export const metadata = homeMetadata('ja');

export default function MarketingHomeJa() {
  return <HomePage locale="ja" t={ja.home} />;
}
