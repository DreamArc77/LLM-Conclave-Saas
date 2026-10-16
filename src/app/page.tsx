import { HomePage } from '@/components/home/HomePage';
import { en } from '@/i18n/messages/en';
import { homeMetadata } from '@/lib/seo';

export const metadata = homeMetadata('en');

export default function MarketingHome() {
  return <HomePage locale="en" t={en.home} />;
}
