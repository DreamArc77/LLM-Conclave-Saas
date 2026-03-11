/** Server-side feature flag — use in Route Handlers, Server Components, middleware */
export const isSaas = process.env.SAAS_MODE === 'true';

/** Client-side feature flag — inlined at build time by Next.js bundler */
export const isSaasClient = process.env.NEXT_PUBLIC_SAAS_MODE === 'true';
