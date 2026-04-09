'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ArrowUpCircle, ArrowDownCircle, Gift } from 'lucide-react';
import { useT } from '@/hooks/useT';

interface Transaction {
  id: string;
  amount: number;
  type: 'purchase' | 'relay_spend' | 'bonus';
  description: string | null;
  created_at: string;
}

export function TransactionHistory() {
  const t = useT();
  const [txns, setTxns] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setLoading(false); return; }
      const { data } = await supabase
        .from('credit_transactions')
        .select('id, amount, type, description, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (data) setTxns(data as Transaction[]);
      setLoading(false);
    });
  }, []);

  if (loading) return (
    <>
      <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('account.transactionHistory')}</h2>
      <div className="text-xs text-gray-400">{t('billing.txLoading')}</div>
    </>
  );
  if (txns.length === 0) return (
    <>
      <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('account.transactionHistory')}</h2>
      <div className="text-xs text-gray-400">{t('billing.txNone')}</div>
    </>
  );

  const icons = {
    purchase: <ArrowUpCircle className="w-4 h-4 text-green-500" />,
    relay_spend: <ArrowDownCircle className="w-4 h-4 text-red-400" />,
    bonus: <Gift className="w-4 h-4 text-purple-500" />,
  };

  return (
    <div className="space-y-2">
      <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">{t('account.transactionHistory')}</h2>
      {txns.map((t) => (
        <div key={t.id} className="flex items-center justify-between text-sm py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
          <div className="flex items-center gap-2">
            {icons[t.type]}
            <span className="text-gray-700 dark:text-gray-300">{t.description ?? t.type}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className={t.amount > 0 ? 'text-green-600 font-medium' : 'text-red-500 font-medium'}>
              {t.amount > 0 ? '+' : ''}{t.amount}
            </span>
            <span className="text-xs text-gray-400">
              {new Date(t.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
