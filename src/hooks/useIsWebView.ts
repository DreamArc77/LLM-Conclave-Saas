'use client';

import { useMemo } from 'react';

/**
 * Detects embedded webviews where Google OAuth is blocked (error 403 disallowed_useragent).
 * Covers WeChat, WeCom, Weibo, DingTalk, TikTok, and generic Android/iOS WebViews.
 */
export function useIsWebView(): boolean {
  return useMemo(() => {
    if (typeof navigator === 'undefined') return false;
    const ua = navigator.userAgent;
    return /MicroMessenger|WeChat|WeCom|Weibo|DingTalk|BytedanceWebview|TikTok|FBAV|Instagram|Line\/|wv\)|\.0; wv\)|WebView/i.test(ua);
  }, []);
}

/**
 * Detects the LLM Conclave Capacitor wrapper (our own iOS/Android app).
 * Used to hide Google OAuth (blocked in WKWebView) and adapt UI for native app context.
 */
export function useIsCapacitor(): boolean {
  return useMemo(() => {
    if (typeof navigator === 'undefined') return false;
    return (
      /LLMConclaveCapacitor/i.test(navigator.userAgent) ||
      !!(window as any).Capacitor?.isNativePlatform?.() ||
      document.cookie.includes('capacitor=')
    );
  }, []);
}
