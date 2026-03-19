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
