import type { Metadata } from 'next';
import { SignUpClient } from './SignUpClient';

// Server wrapper so the page can export metadata — the client form itself is
// still rendered client-only via the dynamic import in SignUpClient.
export const metadata: Metadata = {
  title: 'Create Account',
  description:
    'Create your free LLM Conclave account and let GPT, Claude, Gemini and more debate your questions into consensus reports.',
};

export default function SignUpPage() {
  return <SignUpClient />;
}
