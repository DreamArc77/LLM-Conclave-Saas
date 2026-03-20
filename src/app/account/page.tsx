import { redirect } from 'next/navigation';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import { BuyCreditsPanel } from '@/components/billing/BuyCreditsPanel';
import { InvitePanel } from '@/components/billing/InvitePanel';
import { TransactionHistory } from '@/components/billing/TransactionHistory';
import { ApiKeyPanel } from '@/components/billing/ApiKeyPanel';
import { SignOutButton } from '@/components/auth/SignOutButton';
import { AccountHeader } from '@/components/account/AccountHeader';
import { CreditsCard } from '@/components/account/CreditsCard';

export default async function AccountPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/signin');
  }

  const admin = createAdminClient();
  let { data: credits } = await admin
    .from('credits')
    .select('balance')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!credits) {
    const { addWelcomeCredits } = await import('@/lib/credits/deduct');
    const { WELCOME_CREDITS } = await import('@/config/credit-packages');
    await addWelcomeCredits({ userId: user.id, supabase: admin, amount: WELCOME_CREDITS });
    const { data: seeded } = await admin
      .from('credits')
      .select('balance')
      .eq('user_id', user.id)
      .maybeSingle();
    credits = seeded;
  }

  const balance = (credits?.balance as number) ?? 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <AccountHeader email={user.email ?? ''} />

        {/* Credits balance */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <CreditsCard balance={balance} />
        </div>

        {/* Buy credits */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <BuyCreditsPanel />
        </div>

        {/* Invite friends */}
        <div id="invite" className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <InvitePanel />
        </div>

        {/* Agent API Key */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <ApiKeyPanel />
        </div>

        {/* Transaction history */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <TransactionHistory />
        </div>

        {/* Sign out */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6 pb-2">
          <SignOutButton />
        </div>
      </div>
    </div>
  );
}
