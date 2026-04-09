'use client';

import Link from'next/link';
import { ArrowLeft } from'lucide-react';
import { useT } from'@/hooks/useT';

interface Props {
 email: string;
}

export function AccountHeader({ email }: Props) {
 const t = useT();
 return (
 <div>
 <Link
 href="/"
 className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4 transition-colors"
 >
 <ArrowLeft className="w-4 h-4"/>
 {t('account.backToApp')}
 </Link>
 <h1 className="text-xl font-bold text-[#111111]">{t('account.title')}</h1>
 <p className="text-sm text-gray-500 mt-0.5">{email}</p>
 </div>
 );
}
