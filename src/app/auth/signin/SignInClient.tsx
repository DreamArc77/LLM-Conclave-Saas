'use client';

import dynamic from 'next/dynamic';

const SignInForm = dynamic(() => import('./SignInForm'), { ssr: false });

export function SignInClient() {
  return <SignInForm />;
}
