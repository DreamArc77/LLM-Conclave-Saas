'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LogIn, Settings } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useT } from '@/hooks/useT';
import { CreditBalance } from './CreditBalance';

type UserInfo = { email: string; initial: string };

export function SidebarAccountSection() {
  const [user, setUser] = useState<UserInfo | null | undefined>(undefined);
  const t = useT();

  useEffect(() => {
    try {
      createClient()
        .auth.getUser()
        .then(({ data }) => {
          if (data.user) {
            const email = data.user.email ?? '';
            setUser({ email, initial: email[0]?.toUpperCase() ?? 'U' });
          } else {
            setUser(null);
          }
        })
        .catch(() => setUser(null));
    } catch {
      setUser(null);
    }
  }, []);

  if (user === undefined) return null;

  if (!user) {
    return (
      <div className="px-3 py-3 border-t border-gray-200 dark:border-gray-700">
        <Link
          href="/auth/signin"
          className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          <LogIn className="w-4 h-4" />
          {t('auth.signIn')}
        </Link>
      </div>
    );
  }

  return (
    <div className="px-3 py-3 border-t border-gray-200 dark:border-gray-700">
      <Link
        href="/account"
        className="flex items-center gap-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg p-2.5 transition-colors"
      >
        <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white select-none flex-shrink-0">
          {user.initial}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">
            {user.email}
          </p>
          <CreditBalance />
        </div>
        <Settings className="w-5 h-5 text-gray-400 flex-shrink-0" />
      </Link>
    </div>
  );
}
