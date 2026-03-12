/**
 * Feature flags — operator-controlled via Railway environment variables.
 * Change NEXT_PUBLIC_* vars in Railway → redeploy to take effect.
 */

/**
 * When false, hides the "Add Custom Model" button in settings.
 * Set NEXT_PUBLIC_ALLOW_CUSTOM_MODELS=false in Railway to disable.
 */
export const ALLOW_CUSTOM_MODELS =
  process.env.NEXT_PUBLIC_ALLOW_CUSTOM_MODELS !== 'false';
