import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createServerClient, createAdminClient } from '@/lib/supabase/server';
import { BuyCreditsPanel } from '@/components/billing/BuyCreditsPanel';
import { TransactionHistory } from '@/components/billing/TransactionHistory';
import { SignOutButton } from '@/components/auth/SignOutButton';
import { ArrowLeft, Zap } from 'lucide-react';

export default async function AccountPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/signin');
  }

  const admin = await createAdminClient();
  const { data: credits } = await admin
    .from('credits')
    .select('balance')
    .eq('user_id', user.id)
    .maybeSingle();

  const balance = (credits?.balance as number) ?? 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to App
          </Link>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Account</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{user.email}</p>
        </div>

        {/* Credits balance */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-5 h-5 text-yellow-500" />
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Credits</h2>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{balance.toLocaleString()}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">≈ {(balance * 1000).toLocaleString()} tokens</p>
        </div>

        {/* Buy credits */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <BuyCreditsPanel />
        </div>

        {/* Transaction history */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">Transaction History</h2>
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
