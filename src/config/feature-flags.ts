/**
 * Feature flags — operator-controlled via Railway environment variables.
 * Change NEXT_PUBLIC_* vars in Railway → redeploy to take effect.
 */

/**
 * When false, hides the "Add Custom Model" button in settings.
 * In SaaS mode: defaults to false (must set NEXT_PUBLIC_ALLOW_CUSTOM_MODELS=true to enable).
 * In self-host mode: defaults to true (set NEXT_PUBLIC_ALLOW_CUSTOM_MODELS=false to disable).
 */
export const ALLOW_CUSTOM_MODELS =
  process.env.NEXT_PUBLIC_SAAS_MODE === 'true'
    ? process.env.NEXT_PUBLIC_ALLOW_CUSTOM_MODELS === 'true'
    : process.env.NEXT_PUBLIC_ALLOW_CUSTOM_MODELS !== 'false';
