import { redirect } from 'next/navigation';
import { createServerClient } from '@/lib/supabase/server';
import { BuyCreditsPanel } from '@/components/billing/BuyCreditsPanel';
import { TransactionHistory } from '@/components/billing/TransactionHistory';
import { Zap } from 'lucide-react';

export default async function AccountPage() {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/signin');
  }

  const { data: credits } = await supabase
    .from('credits')
    .select('balance')
    .eq('user_id', user.id)
    .single();

  const balance = (credits?.balance as number) ?? 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
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
      </div>
    </div>
  );
}
