import { permanentRedirect } from 'next/navigation';

// The marketing content now lives at "/" (anonymous visitors get the
// trilingual homepage). Consolidate the old orphaned route's signals
// with a single permanent redirect.
export default function LandingRedirect() {
  permanentRedirect('/');
}
