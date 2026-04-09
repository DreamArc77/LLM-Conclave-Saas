'use client';

import { useRouter } from'next/navigation';
import { LogOut } from'lucide-react';
import { createClient } from'@/lib/supabase/client';

export function SignOutButton() {
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
 className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
 >
 <LogOut className="w-4 h-4"/>
 Sign Out
 </button>
 );
}
