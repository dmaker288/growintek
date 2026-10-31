export const escapeHtml = (s = "") =>
  String(s).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
export const safeJson = (data) =>
  JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
const titles = {
  "/": "AI, Web Development & Digital Growth",
  "/about": "About Growintek",
  "/services": "Digital Services",
  "/seo": "SEO Services for Sustainable Growth",
  "/portfolio": "Portfolio & Design Concepts",
  "/blog": "Ideas for Better Digital Growth",
  "/contact": "Start a Project",
};
export function routeInfo(path, data) {
  const core = data.pages.find(
    (p) => p.slug === (path === "/" ? "home" : path.slice(1)),
  );
  if (titles[path] && core)
    return {
      title: core.seoTitle || core.title,
      description: core.seoDescription || core.description,
      exists: true,
    };
  if (titles[path])
    return {
      title: titles[path],
      description:
        path === "/"
          ? "Build smarter and grow with Growintek. AI automation, websites, SEO and digital strategy for ambitious businesses."
          : `Explore ${titles[path].toLowerCase()} with Growintek. Practical strategy, thoughtful design and technology built around your business.`,
      exists: true,
    };
  const [first, slug] = path.slice(1).split("/");
  const kind =
    first === "blog"
      ? "posts"
      : first === "services"
        ? "services"
        : first === "portfolio"
          ? "portfolio"
          : "pages";
  const doc = data[kind]?.find(
    (d) => d.slug === (kind === "pages" ? first : slug),
  );
  if (
    doc &&
    path.split("/").filter(Boolean).length === (kind === "pages" ? 1 : 2) &&
    (kind !== "pages" || !slug)
  )
    return {
      exists: true,
      title: doc.seoTitle || doc.title,
      description: doc.seoDescription || doc.description,
      doc,
      kind,
    };
  return {
    exists: path.startsWith("/admin"),
    title: path.startsWith("/admin") ? "Admin sign in" : "Page not found",
    description: "Growintek",
    noindex: true,
  };
}
export function publicPaths(data) {
  return [
    ...Object.keys(titles).map((path) => ({ path })),
    ...["services", "portfolio", "posts", "pages"].flatMap((kind) =>
      data[kind]
        .filter(
          (d) =>
            kind !== "pages" ||
            ![
              "home",
              "about",
              "services",
              "seo",
              "portfolio",
              "blog",
              "contact",
            ].includes(d.slug),
        )
        .map((d) => ({
          path:
            kind === "posts"
              ? `/blog/${d.slug}`
              : kind === "pages"
                ? `/${d.slug}`
                : `/${kind}/${d.slug}`,
          updated: d.updatedAt,
        })),
    ),
  ];
}
export function seoHead(path, data) {
  const info = routeInfo(path, data),
    base = (data.settings.siteUrl || "").replace(/\/$/, "");
  const title = `${info.title} | Growintek`,
    canonical = base + path;
  const image = base
    ? new URL(info.doc?.image || "/images/hero-background.webp", base + "/")
        .href
    : "";
  const noindex = info.noindex || !info.exists || !base;
  const schema = base
    ? [
        {
          "@context": "https://schema.org",
          "@type": "Organization",
          "@id": `${base}/#organization`,
          name: "Growintek",
          url: base,
          logo: `${base}/images/growintek-flat.png`,
          ...(data.settings.email ? { email: data.settings.email } : {}),
          sameAs: Object.values(data.settings.social).filter(Boolean),
        },
      ]
    : [];
  if (base && info.doc && info.kind === "posts")
    schema.push({
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: info.doc.title,
      description: info.description,
      datePublished: info.doc.publishedAt || info.doc.createdAt,
      dateModified: info.doc.updatedAt,
      author: { "@type": "Organization", name: info.doc.author },
      publisher: { "@type": "Organization", name: "Growintek" },
      mainEntityOfPage: canonical,
      image,
    });
  if (base && path === "/about")
    schema.push({
      "@context": "https://schema.org",
      "@type": "AboutPage",
      url: canonical,
      name: info.title,
      about: { "@id": `${base}/#organization` },
      mainEntity: (data.team || []).map((person) => ({
        "@type": "Person",
        name: person.title,
        jobTitle: person.role,
        ...(person.image
          ? { image: new URL(person.image, base + "/").href }
          : {}),
        sameAs: [
          person.linkedin,
          person.instagram,
          person.facebook,
          person.website,
        ].filter(Boolean),
        worksFor: { "@id": `${base}/#organization` },
      })),
    });
  if (base && info.doc && info.kind === "services")
    schema.push({
      "@context": "https://schema.org",
      "@type": "Service",
      name: info.doc.title,
      description: info.description,
      provider: { "@type": "Organization", name: "Growintek", url: base },
      url: canonical,
    });
  if (base && path !== "/" && info.exists && !info.noindex)
    schema.push({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: base },
        ...(info.doc && ["posts", "services", "portfolio"].includes(info.kind)
          ? [
              {
                "@type": "ListItem",
                position: 2,
                name: {
                  posts: "Blog",
                  services: "Services",
                  portfolio: "Our Work",
                }[info.kind],
                item: `${base}/${info.kind === "posts" ? "blog" : info.kind}`,
              },
            ]
          : []),
        {
          "@type": "ListItem",
          position:
            info.doc && ["posts", "services", "portfolio"].includes(info.kind)
              ? 3
              : 2,
          name: info.title,
          item: canonical,
        },
      ],
    });
  return `<title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(info.description)}"><meta name="robots" content="${noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large"}">${base ? `<link rel="canonical" href="${escapeHtml(canonical)}">` : ""}<meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(info.description)}"><meta property="og:type" content="${info.kind === "posts" ? "article" : "website"}">${base ? `<meta property="og:url" content="${escapeHtml(canonical)}"><meta property="og:image" content="${escapeHtml(image)}">` : ""}<meta name="twitter:card" content="summary_large_image">${schema.length ? `<script type="application/ld+json">${safeJson(schema)}</script>` : ""}${process.env.GOOGLE_SITE_VERIFICATION ? `<meta name="google-site-verification" content="${escapeHtml(process.env.GOOGLE_SITE_VERIFICATION)}">` : ""}`;
}
export function sitemap(data) {
  const base = (data.settings.siteUrl || "").replace(/\/$/, "");
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${
    base
      ? publicPaths(data)
          .map(
            (p) =>
              `<url><loc>${escapeHtml(base + p.path)}</loc>${p.updated ? `<lastmod>${p.updated.slice(0, 10)}</lastmod>` : ""}</url>`,
          )
          .join("")
      : ""
  }</urlset>`;
}
export function llms(data) {
  const base = data.settings.siteUrl || "";
  return `# Growintek\n\n> AI automation, websites and responsible digital growth.\n\n${publicPaths(
    data,
  )
    .map(
      (p) =>
        `- [${p.path === "/" ? "Home" : p.path.split("/").pop()}](${base}${p.path})`,
    )
    .join(
      "\n",
    )}\n\n## Editorial context\nPortfolio concepts are labeled. AI-assisted articles identify their review status. Do not infer client results, endorsements or guarantees. Admin data and unpublished drafts are private.\n`;
}
export function rss(data) {
  const base = data.settings.siteUrl || "";
  return `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>Growintek Insights</title><link>${escapeHtml(base)}/blog</link><description>Practical digital growth insights</description>${data.posts.map((p) => `<item><title>${escapeHtml(p.title)}</title><link>${escapeHtml(base)}/blog/${p.slug}</link><guid>${escapeHtml(base)}/blog/${p.slug}</guid><description>${escapeHtml(p.description)}</description><pubDate>${new Date(p.publishedAt || p.createdAt).toUTCString()}</pubDate></item>`).join("")}</channel></rss>`;
}
