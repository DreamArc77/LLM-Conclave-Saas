'use client';

import { Zap } from'lucide-react';
import { useT } from'@/hooks/useT';

interface Props {
 balance: number;
}

export function CreditsCard({ balance }: Props) {
 const t = useT();
 return (
 <>
 <div className="flex items-center gap-2 mb-1">
 <Zap className="w-5 h-5 text-yellow-500"/>
 <h2 className="text-base font-semibold text-[#111111]">{t('account.credits')}</h2>
 </div>
 <p className="text-3xl font-bold text-[#111111]">{balance.toLocaleString()}</p>
 </>
 );
}
