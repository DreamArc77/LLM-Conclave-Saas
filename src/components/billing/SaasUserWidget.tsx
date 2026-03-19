'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Gift, LogIn, LogOut, User } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useT } from '@/hooks/useT';
import { CreditBalance } from './CreditBalance';

type UserInfo = { email: string; initial: string };

export function SaasUserWidget() {
  const [user, setUser] = useState<UserInfo | null | undefined>(undefined); // undefined = loading
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
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
      setUser(null); // createClient() throws synchronously when env vars missing
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSignOut = async () => {
    try {
      await createClient().auth.signOut();
    } catch { /* ignore */ }
    setOpen(false);
    setUser(null);
    router.refresh();
  };

  if (user === undefined) return null; // loading

  if (!user) {
    return (
      <Link
        href="/auth/signin"
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
      >
        <LogIn className="w-4 h-4" />
        Sign In
      </Link>
    );
  }

  return (
    <div ref={ref} className="relative">
      <div className="flex items-center gap-1.5 p-1">
        <CreditBalance />
        <Link
          href="/account#invite"
          className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400 hover:opacity-75 transition-opacity"
          title={t('invite.menuItem')}
        >
          <Gift className="w-3.5 h-3.5 animate-bounce" />
        </Link>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors p-0.5"
          title={user.email}
        >
          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-xs font-bold text-white select-none">
            {user.initial}
          </div>
        </button>
      </div>

      {open && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
          <div className="px-3 py-2.5 border-b border-gray-100 dark:border-gray-700">
            <p className="text-xs font-medium text-gray-900 dark:text-gray-100 truncate">{user.email}</p>
            <Link
              href="/account"
              onClick={() => setOpen(false)}
              className="block mt-1 hover:opacity-70 transition-opacity"
            >
              <CreditBalance />
            </Link>
          </div>

          <Link
            href="/account"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <User className="w-4 h-4" />
            Account
          </Link>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
