'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

interface SignOutButtonProps {
  fullWidth?: boolean;
}

export function SignOutButton({ fullWidth }: SignOutButtonProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    try {
      await createClient().auth.signOut();
    } catch { /* ignore */ }
    router.push('/');
  };

  return (
    <button
      onClick={handleSignOut}
      className={`flex items-center gap-2 text-sm text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors ${
        fullWidth
          ? 'w-full justify-center py-3 font-medium'
          : 'px-4 py-2'
      }`}
    >
      <LogOut className="w-4 h-4" />
      Sign Out
    </button>
  );
}
