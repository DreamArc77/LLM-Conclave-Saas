// Export is now handled client-side (html2canvas + jsPDF).
// This endpoint is kept for backwards compatibility but is no longer used.
export async function POST(): Promise<Response> {
  return new Response('Export is now handled client-side. This endpoint is deprecated.', { status: 410 });
}
