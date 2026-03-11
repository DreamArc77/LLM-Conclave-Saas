'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { User } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { CreditBalance } from './CreditBalance';

export function SaasUserWidget() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setLoggedIn(!!data.user));
  }, []);

  if (loggedIn === null) return null;

  if (!loggedIn)
    return (
      <Link
        href="/auth/signin"
        className="text-sm text-gray-500 hover:text-gray-800 dark:hover:text-gray-200"
      >
        Sign in
      </Link>
    );

  return (
    <div className="flex items-center gap-3">
      <CreditBalance />
      <Link
        href="/account"
        className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        title="Account"
      >
        <User className="w-5 h-5" />
      </Link>
    </div>
  );
}
