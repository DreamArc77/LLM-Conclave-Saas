'use client';

import Image from'next/image';
import { getLogoPath } from'@/lib/utils/model-logo';

interface ModelLogoProps {
 modelId?: string;
 displayName: string;
 size?: number;
 className?: string;
}

const COLORS = [
'bg-violet-500','bg-sky-500','bg-emerald-500','bg-amber-500',
'bg-rose-500','bg-indigo-500',
];

/**
 * Shows a provider logo (local SVG) when available for a modelId,
 * falls back to a colored initial badge.
 */
export function ModelLogo({ modelId, displayName, size = 24, className =''}: ModelLogoProps) {
 const logoPath = modelId ? getLogoPath(modelId) : null;

 if (logoPath) {
 return (
 <Image
 src={logoPath}
 alt={displayName}
 width={size}
 height={size}
 className={`rounded-md flex-shrink-0 ${className}`}
 />
 );
 }

 const colorIdx = displayName.charCodeAt(0) % COLORS.length;
 const px =`${size}px`;
 return (
 <div
 className={`rounded-md flex items-center justify-center text-[#111111] font-bold flex-shrink-0 ${COLORS[colorIdx]} ${className}`}
 style={{ width: px, height: px, fontSize:`${Math.round(size * 0.45)}px`}}
 >
 {displayName.charAt(0).toUpperCase()}
 </div>
 );
}
