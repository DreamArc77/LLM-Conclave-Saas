/**
 * Next.js instrumentation hook — runs once per server process at startup.
 * Starts the daily model-pipeline health check (see src/lib/health/pipeline-check.ts).
 * Only the Node.js runtime; route handlers are not touched (edge excluded).
 */
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  const { startPipelineScheduler } = await import('@/lib/health/pipeline-check');
  startPipelineScheduler();
}
