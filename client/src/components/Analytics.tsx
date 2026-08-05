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

/** Fire a custom GA4 event through the site's single analytics implementation.
 *  No-op when GA isn't configured (VITE_GA_MEASUREMENT_ID unset) or before the
 *  gtag script has loaded, so it's always safe to call from any component. */
export function trackEvent(action: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", action, params);
}

export default function Analytics() {
  const [location] = useLocation();

  useEffect(() => {
    if (!GA_ID || gaReady) return;
    gaReady = true;

    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(s);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_ID, { send_page_view: false });
  }, []);

  useEffect(() => {
    if (!GA_ID || !window.gtag) return;
    window.gtag('event', 'page_view', { page_path: location });
  }, [location]);

  return null;
}
