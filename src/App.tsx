import { lazy, Suspense, useEffect, useRef, useState } from "react";
import type { SiteData } from "./types";
import {
  Header,
  Footer,
  ConsentBanner,
  readConsent,
  track,
} from "./components/SiteChrome";
import type { Consent } from "./components/SiteChrome";
import Home from "./pages/Home";
import Markdown from "./components/Markdown";
import {
  About,
  Services,
  ServiceDetail,
  SEO,
  Portfolio,
  ProjectDetail,
  Blog,
  BlogPost,
  Contact,
  ContentPage,
  NotFound,
} from "./pages/PublicPages";
const Admin = lazy(() => import("./admin/Admin"));
export default function App({ path, data }: { path: string; data: SiteData }) {
  const [consent, setConsent] = useState<Consent | null>(null),
    [cookies, setCookies] = useState(false);
  const tracked = useRef(false);
  useEffect(() => {
    const c = readConsent();
    setConsent(c);
    if (!c && !path.startsWith("/admin")) setCookies(true);
    if (!tracked.current) {
      track(path);
      tracked.current = true;
    }
  }, [path]);
  useEffect(() => {
    if (!consent?.analytics || !data.settings.gaId || path.startsWith("/admin") || !data.settings.siteUrl || location.origin !== new URL(data.settings.siteUrl).origin)
      return;
    const w = window as unknown as {
      dataLayer: unknown[];
      gtag: (...args: unknown[]) => void;
    };
    w.dataLayer = w.dataLayer || [];
    w.gtag = function () {
      w.dataLayer.push(arguments);
    };
    w.gtag("js", new Date());
    w.gtag("config", data.settings.gaId, {
      anonymize_ip: true,
      cookie_domain: location.hostname,
    });
    const script = document.createElement("script");
    script.src = `https://www.googletagmanager.com/gtag/js?id=${data.settings.gaId}`;
    script.async = true;
    document.head.appendChild(script);
    return () => {
      script.remove();
    };
  }, [consent?.analytics, data.settings.gaId, path]);
  function changeConsent(c: Consent) {
    const withdrawn = consent?.analytics && !c.analytics;
    setConsent(c);
    if (withdrawn) {
      for (const cookie of document.cookie.split(";")) {
        const name = cookie.split("=")[0].trim();
        if (name.startsWith("_ga")) {
          document.cookie = `${name}=;Max-Age=0;path=/`;
          document.cookie = `${name}=;Max-Age=0;path=/;domain=.${location.hostname}`;
        }
      }
      location.reload();
    } else if (c.analytics && !consent?.analytics) track(path);
  }
  if (path.startsWith("/admin"))
    return (
      <Suspense
        fallback={<div className="admin-loading">Opening Growintek admin…</div>}
      >
        <Admin />
      </Suspense>
    );
  let page: React.ReactNode;
  const segments = path.split("/").filter(Boolean);
  if (path === "/")
    page = (
      <Home
        data={data}
        consent={consent}
        onPreferences={() => setCookies(true)}
      />
    );
  else if (path === "/about") page = <About data={data} />;
  else if (path === "/services") page = <Services data={data} />;
  else if (path === "/seo") page = <SEO data={data} />;
  else if (path === "/portfolio") page = <Portfolio data={data} />;
  else if (path === "/blog") page = <Blog data={data} />;
  else if (path === "/contact") page = <Contact data={data} />;
  else if (segments.length === 2 && segments[0] === "services") {
    const s = data.services.find((d) => d.slug === segments[1]);
    page = s ? <ServiceDetail service={s} data={data} /> : <NotFound />;
  } else if (segments.length === 2 && segments[0] === "portfolio") {
    const p = data.portfolio.find((d) => d.slug === segments[1]);
    page = p ? <ProjectDetail project={p} /> : <NotFound />;
  } else if (segments.length === 2 && segments[0] === "blog") {
    const p = data.posts.find((d) => d.slug === segments[1]);
    page = p ? <BlogPost post={p} data={data} /> : <NotFound />;
  } else {
    const p =
      segments.length === 1
        ? data.pages.find((d) => d.slug === segments[0])
        : null;
    page = p ? <ContentPage page={p} data={data} /> : <NotFound />;
  }
  return (
    <>
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      {path !== "/" ? <Header path={path} services={data.services} /> : null}
      <main id="main-content">
        {page}
        {["/", "/services", "/seo", "/portfolio", "/blog", "/contact"].includes(
          path,
        ) &&
        data.pages.find(
          (p) => p.slug === (path === "/" ? "home" : path.slice(1)),
        )?.content ? (
          <section className="article-body section-space">
            <Markdown
              content={
                data.pages.find(
                  (p) => p.slug === (path === "/" ? "home" : path.slice(1)),
                )!.content
              }
            />
          </section>
        ) : null}
      </main>
      <Footer
        services={data.services}
        settings={data.settings}
        onCookies={() => setCookies(true)}
      />
      <ConsentBanner
        open={cookies}
        onClose={() => setCookies(false)}
        onChange={changeConsent}
      />
    </>
  );
}
