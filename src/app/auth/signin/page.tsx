import type { Metadata } from 'next';
import { SignInClient } from './SignInClient';

// Server wrapper so the page can export metadata — the client form itself is
// still rendered client-only via the dynamic import in SignInClient.
export const metadata: Metadata = {
  title: 'Sign In',
  description:
    'Sign in to LLM Conclave and run multi-AI debates — multiple top models discuss your question and deliver a structured consensus report.',
};

export default function SignInPage() {
  return <SignInClient />;
}
