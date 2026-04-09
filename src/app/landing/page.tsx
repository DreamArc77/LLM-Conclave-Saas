import { LandingNavbar } from '@/components/landing/LandingNavbar';
import { LandingHero } from '@/components/landing/LandingHero';
import { LandingFeatures } from '@/components/landing/LandingFeatures';
import { LandingTrust } from '@/components/landing/LandingTrust';
import { LandingFooter } from '@/components/landing/LandingFooter';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900 selection:bg-blue-100 font-sans overflow-x-hidden">
      <LandingNavbar />
      <LandingHero />
      <LandingFeatures />
      <LandingTrust />
      <LandingFooter />
    </main>
  );
}
