'use client';

import Image from 'next/image';
import type { ProviderId } from '@/types/config';
import { PROVIDER_REGISTRY } from '@/lib/providers/registry';

interface ProviderLogoProps {
  providerId: ProviderId;
  size?: number;
  className?: string;
}

export function ProviderLogo({
  providerId,
  size = 24,
  className = '',
}: ProviderLogoProps) {
  const provider = PROVIDER_REGISTRY[providerId];
  if (!provider) return null;

  return (
    <Image
      src={provider.logoPath}
      alt={provider.name}
      width={size}
      height={size}
      className={`rounded ${className}`}
    />
  );
}
