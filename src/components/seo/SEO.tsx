type SEOProps = {
  title: string;
  description: string;
  path?: string;
  jsonLd?: Record<string, any>;
};

const CANONICAL_BASE = "https://hawthorneducation.com";

export const SEO = ({ title, description, path = "/", jsonLd }: SEOProps) => {
  // Update title
  if (typeof document !== 'undefined') {
    document.title = title;

    // description
    let desc = document.querySelector('meta[name="description"]');
    if (!desc) {
      desc = document.createElement('meta');
      desc.setAttribute('name', 'description');
      document.head.appendChild(desc);
    }
    desc.setAttribute('content', description);

    // canonical
    const canonicalHref = `${CANONICAL_BASE}${path}`;
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', canonicalHref);

    // JSON-LD
    const scriptId = 'seo-json-ld';
    let json = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!json && jsonLd) {
      json = document.createElement('script');
      json.type = 'application/ld+json';
      json.id = scriptId;
      document.head.appendChild(json);
    }
    if (json) {
      json.text = jsonLd ? JSON.stringify(jsonLd) : '';
    }
  }
  return null;
};

export const orgJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Hawthorn Education Strategies",
  url: CANONICAL_BASE,
  logo: "/lovable-uploads/e6e3ee93-8f42-4152-bf4a-573230035433.png",
};
