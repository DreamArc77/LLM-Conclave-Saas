'use client';

import { useEffect, useState, useCallback } from 'react';
import { Zap } from 'lucide-react';

interface CreditBalanceProps {
  compact?: boolean;
}

export function CreditBalance({ compact }: CreditBalanceProps) {
  const [balance, setBalance] = useState<number | null>(null);

  const refresh = useCallback(() => {
    fetch('/api/credits/balance')
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.balance != null) setBalance(d.balance as number); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener('credits-changed', refresh);
    window.addEventListener('focus', refresh);
    return () => {
      window.removeEventListener('credits-changed', refresh);
      window.removeEventListener('focus', refresh);
    };
  }, [refresh]);

  if (balance === null) return null;

  if (compact) {
    return <span className="font-medium text-yellow-600 dark:text-yellow-400">{balance.toLocaleString()}</span>;
  }

  return (
    <div className="flex items-center gap-1.5 text-sm font-medium text-yellow-600 dark:text-yellow-400">
      <Zap className="w-3.5 h-3.5" />
      <span>{balance.toLocaleString()} credits</span>
    </div>
  );
}
