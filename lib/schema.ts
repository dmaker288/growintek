import { site } from "@/lib/site";

/**
 * Structured data. One @graph per page rather than several disconnected
 * <script> blocks, so entities can reference each other by @id — which is what
 * Google's crawlers and LLM retrievers both use to resolve "who is this".
 *
 * No rating data is emitted unless real reviews exist. Emitting an
 * AggregateRating without visible reviews on the page is a manual-action risk.
 */

const BASE = site.url.replace(/\/$/, "");

export const ORG_ID = `${BASE}/#organization`;
export const WEBSITE_ID = `${BASE}/#website`;
export const PERSON_ID = `${BASE}/about#person`;

type Json = Record<string, unknown>;

export function organizationNode(): Json {
  return {
    "@type": ["Organization", "ProfessionalService"],
    "@id": ORG_ID,
    name: site.name,
    legalName: site.legalName,
    url: BASE,
    logo: { "@type": "ImageObject", url: `${BASE}/images/logo-wide.webp` },
    image: `${BASE}/images/hero-bg.webp`,
    email: site.email,
    description: site.description,
    foundingDate: site.founded,
    areaServed: [
      { "@type": "Country", name: "United States" },
      { "@type": "Country", name: "United Kingdom" },
      { "@type": "Country", name: "Canada" },
      { "@type": "Country", name: "Australia" },
      { "@type": "Country", name: "Ireland" },
    ],
    knowsAbout: [
      "AI-Powered Web Development",
      "Next.js High Performance Engineering",
      "Autonomous AI Agents",
      "AEO Answer Engine Optimization",
      "GEO Generative Engine Optimization",
      "Technical SEO & Schema Graph",
      "Revenue & Business Process Automation",
      "Google Ads & Meta Ads Management",
      "Cloud Infrastructure & Security SLA",
    ],
    sameAs: [
      site.social.linkedin,
      site.social.instagram,
      site.social.youtube,
      site.social.facebook,
    ],
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "sales",
        email: site.email,
        availableLanguage: ["en"],
        areaServed: ["GB", "AU", "IE"],
      },
    ],
    founder: { "@id": PERSON_ID },
  };
}

export function websiteNode(): Json {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: BASE,
    name: site.name,
    publisher: { "@id": ORG_ID },
    inLanguage: "en-GB",
  };
}

export function personNode(): Json {
  return {
    "@type": "Person",
    "@id": PERSON_ID,
    name: "Ijtiba Rana",
    jobTitle: "Founder",
    worksFor: { "@id": ORG_ID },
    url: `${BASE}/about`,
    knowsAbout: ["Next.js", "AI agents", "workflow automation", "technical SEO"],
  };
}

export function breadcrumbNode(items: { name: string; path: string }[]): Json {
  return {
    "@type": "BreadcrumbList",
    "@id": `${BASE}${items[items.length - 1]?.path ?? "/"}#breadcrumb`,
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${BASE}${item.path}`,
    })),
  };
}

export function serviceNode(input: {
  name: string;
  description: string;
  slug: string;
  fromPrice?: number | null;
  currency?: string;
}): Json {
  const node: Json = {
    "@type": "Service",
    "@id": `${BASE}/services/${input.slug}#service`,
    name: input.name,
    description: input.description,
    serviceType: input.name,
    provider: { "@id": ORG_ID },
    areaServed: ["GB", "AU", "IE"],
    url: `${BASE}/services/${input.slug}`,
  };

  if (input.fromPrice) {
    node.offers = {
      "@type": "Offer",
      priceCurrency: input.currency ?? "GBP",
      price: (input.fromPrice / 100).toFixed(2),
      priceSpecification: {
        "@type": "PriceSpecification",
        price: (input.fromPrice / 100).toFixed(2),
        priceCurrency: input.currency ?? "GBP",
        valueAddedTaxIncluded: false,
      },
      availability: "https://schema.org/InStock",
      url: `${BASE}/pricing`,
    };
  }

  return node;
}

export function articleNode(input: {
  title: string;
  description: string;
  slug: string;
  published?: Date | null;
  modified: Date;
  imageUrl?: string | null;
  keywords?: string[];
}): Json {
  return {
    "@type": "BlogPosting",
    "@id": `${BASE}/journal/${input.slug}#article`,
    headline: input.title.slice(0, 110),
    description: input.description,
    datePublished: input.published?.toISOString(),
    dateModified: input.modified.toISOString(),
    author: { "@id": PERSON_ID },
    publisher: { "@id": ORG_ID },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${BASE}/journal/${input.slug}` },
    ...(input.imageUrl ? { image: input.imageUrl.startsWith("http") ? input.imageUrl : `${BASE}${input.imageUrl}` } : {}),
    ...(input.keywords?.length ? { keywords: input.keywords.join(", ") } : {}),
    inLanguage: "en-GB",
    isAccessibleForFree: true,
  };
}

export function faqNode(items: { q: string; a: string }[], path: string): Json {
  return {
    "@type": "FAQPage",
    "@id": `${BASE}${path}#faq`,
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export function reviewsNode(
  reviews: { authorName: string; rating: number; text: string; reviewedAt: Date }[],
  score: number | null,
  total: number,
  profileUrl: string | null
): Json | null {
  if (reviews.length === 0) return null;

  return {
    "@type": "Organization",
    "@id": ORG_ID,
    ...(score !== null && total > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: score,
            reviewCount: total,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
    review: reviews.slice(0, 5).map((r) => ({
      "@type": "Review",
      author: { "@type": "Person", name: r.authorName },
      reviewRating: {
        "@type": "Rating",
        ratingValue: r.rating,
        bestRating: 5,
        worstRating: 1,
      },
      reviewBody: r.text,
      datePublished: r.reviewedAt.toISOString(),
      ...(profileUrl ? { url: profileUrl } : {}),
    })),
  };
}

export function localBusinessNode(input: {
  streetAddress?: string;
  city?: string;
  region?: string;
  postcode?: string;
  country?: string;
  telephone?: string;
}): Json {
  return {
    "@type": "ProfessionalService",
    "@id": ORG_ID,
    name: site.name,
    url: BASE,
    image: `${BASE}/opengraph-image.png`,
    email: site.email,
    ...(input.telephone ? { telephone: input.telephone } : {}),
    address: {
      "@type": "PostalAddress",
      ...(input.streetAddress ? { streetAddress: input.streetAddress } : {}),
      ...(input.city ? { addressLocality: input.city } : {}),
      ...(input.region ? { addressRegion: input.region } : {}),
      ...(input.postcode ? { postalCode: input.postcode } : {}),
      addressCountry: input.country ?? "GB",
    },
    areaServed: ["GB", "AU", "IE"],
    priceRange: "££",
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "09:00",
        closes: "18:00",
      },
    ],
  };
}

/** Wraps nodes into a single @graph document. */
export function graph(nodes: (Json | null)[]): Json {
  return {
    "@context": "https://schema.org",
    "@graph": nodes.filter(Boolean),
  };
}

export const canonical = (path: string): string => `${BASE}${path === "/" ? "" : path}`;
