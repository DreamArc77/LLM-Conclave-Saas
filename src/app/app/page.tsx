import type { Metadata } from 'next';
import { AppShell } from '@/components/layout/AppShell';

// The chat console physically lives at /app. The middleware rewrites "/" to
// this route for logged-in users (and Capacitor webviews) when
// MARKETING_HOME is enabled, so the URL keeps showing "/" for them.
export const metadata: Metadata = {
  title: { absolute: 'LLM Conclave' },
  robots: { index: false, follow: false },
};

export default function ChatConsole() {
  return <AppShell />;
}
