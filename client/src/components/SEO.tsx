import { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  noIndex?: boolean;
  schema?: object;
}

const BASE_URL = 'https://www.lbs4.com';
const DEFAULT_IMAGE = `${BASE_URL}/images/hero-testing-center.webp`;
const SITE_SUFFIX = 'LBS Business Services Center';

export default function SEO({ title, description, canonical, ogImage, noIndex, schema }: SEOProps) {
  const fullTitle = title
    ? `${title} | ${SITE_SUFFIX}`
    : `${SITE_SUFFIX} Houston TX | Notary, Testing & More`;
  const canonicalUrl = `${BASE_URL}${canonical ?? '/'}`;
  const image = ogImage ?? DEFAULT_IMAGE;

  // server/seoMeta.ts injects a <link rel="canonical" data-ssr-canonical>
  // into the raw HTML for known routes (so non-JS crawlers and link-preview
  // bots see a correct canonical without waiting on React). Helmet's own
  // reconciliation only tracks tags it rendered itself, so it can't see that
  // one and would otherwise leave it in place alongside its own — two
  // canonical links is an ambiguous signal search engines advise against.
  // Strip it once Helmet's version is about to take over; a no-op on routes
  // that never had one.
  useEffect(() => {
    document.querySelectorAll('link[rel="canonical"][data-ssr-canonical]').forEach((el) => el.remove());
  }, [canonicalUrl]);

  return (
    <Helmet>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      <link rel="canonical" href={canonicalUrl} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={image} />
      <meta property="og:type" content="website" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      {description && <meta name="twitter:description" content={description} />}
      <meta name="twitter:image" content={image} />

      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
    </Helmet>
  );
}
