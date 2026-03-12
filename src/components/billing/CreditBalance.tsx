'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Zap } from 'lucide-react';

export function CreditBalance() {
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      const { data } = await supabase
        .from('credits')
        .select('balance')
        .eq('user_id', user.id)
        .single();
      if (data) {
        setBalance(data.balance as number);
      } else {
        // No credits row yet — seed welcome credits then re-fetch
        try {
          await fetch('/api/auth/welcome', { method: 'POST' });
          const { data: seeded } = await supabase
            .from('credits')
            .select('balance')
            .eq('user_id', user.id)
            .single();
          if (seeded) setBalance(seeded.balance as number);
        } catch { /* non-fatal */ }
      }
    });
  }, []);

  if (balance === null) return null;

  return (
    <div className="flex items-center gap-1.5 text-sm font-medium text-yellow-600 dark:text-yellow-400">
      <Zap className="w-3.5 h-3.5" />
      <span>{balance.toLocaleString()} credits</span>
    </div>
  );
}
