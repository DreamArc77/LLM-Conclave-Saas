const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !anonKey) {
  console.error('[supabase-keepalive] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const baseUrl = supabaseUrl.replace(/\/$/, '');
const url = `${baseUrl}/rest/v1/credits?select=user_id&limit=1`;
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 10_000);
const startedAt = Date.now();

try {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
    signal: controller.signal,
  });

  const elapsedMs = Date.now() - startedAt;
  if (!response.ok) {
    console.error(`[supabase-keepalive] failed status=${response.status} elapsedMs=${elapsedMs}`);
    process.exitCode = 1;
  } else {
    console.log(`[supabase-keepalive] ok status=${response.status} elapsedMs=${elapsedMs}`);
  }
} catch (error) {
  const elapsedMs = Date.now() - startedAt;
  const message = error instanceof Error && error.name === 'AbortError'
    ? 'timeout'
    : 'network error';
  console.error(`[supabase-keepalive] failed reason=${message} elapsedMs=${elapsedMs}`);
  process.exitCode = 1;
} finally {
  clearTimeout(timeout);
}
