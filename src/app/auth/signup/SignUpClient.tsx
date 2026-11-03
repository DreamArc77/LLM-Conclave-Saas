'use client';

import dynamic from 'next/dynamic';

const SignUpForm = dynamic(() => import('./SignUpForm'), { ssr: false });

export function SignUpClient() {
  return <SignUpForm />;
}
