import { useEffect } from 'react';
import { useLocation } from 'wouter';

declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
  }
}

const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;
let gaReady = false;

const CONSENT_STORAGE_KEY = 'lbs_analytics_consent';

/** GA4 is the only tracker this site loads (no ad pixels, no remarketing) —
 *  confirmed by audit. Default is "granted" so existing analytics behavior
 *  is unchanged for visitors who never open Cookie Preferences; a visitor
 *  who explicitly opts out gets that choice persisted and respected on every
 *  later visit. This is an opt-out model (appropriate for a Texas business
 *  site under the Texas Data Privacy and Security Act), not a EU-style
 *  opt-in consent banner. */
export function getAnalyticsConsent(): boolean {
  if (typeof window === 'undefined') return true;
  return window.localStorage.getItem(CONSENT_STORAGE_KEY) !== 'denied';
}

/** Sets the visitor's analytics preference and applies it immediately via
 *  Google's Consent Mode API when gtag is already loaded, or on next load
 *  otherwise. Safe to call before Analytics has mounted. */
export function setAnalyticsConsent(granted: boolean) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(CONSENT_STORAGE_KEY, granted ? 'granted' : 'denied');
  if (window.gtag) {
    window.gtag('consent', 'update', { analytics_storage: granted ? 'granted' : 'denied' });
  }
}

/** Fire a custom GA4 event through the site's single analytics implementation.
 *  No-op when GA isn't configured (VITE_GA_MEASUREMENT_ID unset), before the
 *  gtag script has loaded, or when the visitor has opted out — so it's always
 *  safe to call from any component without an extra consent check. */
export function trackEvent(action: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", action, params);
}

export default function Analytics() {
  const [location] = useLocation();

  useEffect(() => {
    if (!GA_ID || gaReady) return;
    gaReady = true;

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    // Google Consent Mode: declare the visitor's stored preference before
    // 'config' fires, so a returning opted-out visitor is never measured
    // even for the page view that loads the script.
    window.gtag('consent', 'default', { analytics_storage: getAnalyticsConsent() ? 'granted' : 'denied' });

    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(s);

    window.gtag('js', new Date());
    window.gtag('config', GA_ID, { send_page_view: false });
  }, []);

  useEffect(() => {
    if (!GA_ID || !window.gtag) return;
    window.gtag('event', 'page_view', { page_path: location });
  }, [location]);

  return null;
}
