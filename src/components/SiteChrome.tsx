import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";
import SocialIcon from "./SocialIcon";
import type { Content, PublicSettings } from "../types";
const links = [["Home", "/"], ["Services", "/services"], ["Our Work", "/portfolio"], ["About", "/about"], ["Blog", "/blog"], ["Contact", "/contact"]];
export function Header({ path, home = false, services }: { path: string; home?: boolean; services: Content[] }) {
  const [open, setOpen] = useState(false), [servicesOpen, setServicesOpen] = useState(false);
  const header = useRef<HTMLElement>(null);
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [pastHero, setPastHero] = useState(false);
  useEffect(() => {
    let previous = window.scrollY;
    const update = () => {
      const current = Math.max(0, window.scrollY);
      setPastHero(home && (document.getElementById("home")?.getBoundingClientRect().bottom || 0) <= 90);
      setScrolled(current > 40);
      if (current < 80 || current < previous || header.current?.contains(document.activeElement)) setHidden(false);
      else if (current > previous && !open && !servicesOpen) setHidden(true);
      previous = current;
    };
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
    return () => { window.removeEventListener("scroll", update); window.removeEventListener("resize", update); };
  }, [open, servicesOpen, home]);
  const submenuToggle = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open && !servicesOpen) return;
    const key = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (servicesOpen) { setServicesOpen(false); submenuToggle.current?.focus(); }
      else { setOpen(false); document.getElementById("menu-toggle")?.focus(); }
    };
    const outside = (e: PointerEvent) => { if (!header.current?.contains(e.target as Node)) { setOpen(false); setServicesOpen(false); } };
    document.addEventListener("keydown", key);
    document.addEventListener("pointerdown", outside);
    return () => { document.removeEventListener("keydown", key); document.removeEventListener("pointerdown", outside); };
  }, [open, servicesOpen]);
  return <div onFocusCapture={() => setHidden(false)} className={`${home && !pastHero ? "header-home" : "header-shell"} smart-header ${home && pastHero ? "header-home-past" : ""} ${hidden ? "header-hidden" : ""} ${scrolled ? "header-scrolled" : ""}`}>
    <header ref={header} className="site-header container">
      <a className="brand flat-brand" href="/" aria-label="Growintek home"><img src="/images/growintek-flat.png" width="240" height="120" alt="Growintek Solutions" /></a>
      <nav id="main-navigation" className={`main-nav ${open ? "is-open" : ""}`} aria-label="Main navigation">
        {links.map(([label, href]) => href === "/services" ?
          <div className="nav-services" key={href} onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setServicesOpen(false); }}>
            <div className="nav-service-trigger"><a href={href} className={path.startsWith(href) ? "is-active" : ""} aria-current={path === href ? "page" : undefined}>Services</a>
              <button ref={submenuToggle} className="submenu-toggle" aria-label="Toggle services submenu" aria-expanded={servicesOpen} aria-controls="services-submenu" onClick={() => setServicesOpen(!servicesOpen)}><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4" /></svg></button>
            </div>
            <div id="services-submenu" className="services-submenu" hidden={!servicesOpen}>
              <div className="submenu-heading"><span>Find your next step</span><a href="/services">All services <Icon name="arrow" /></a></div>
              <div className="submenu-links">{services.map(s => <a href={`/services/${s.slug}`} key={s.id} aria-current={path === `/services/${s.slug}` ? "page" : undefined}><Icon name={s.icon || "code"} /><span><strong>{s.title}</strong><small>{s.short || s.description}</small></span></a>)}</div>
              <a href="/seo" className="submenu-seo">Explore our SEO approach <Icon name="arrow" /></a>
            </div>
          </div> : <a key={href} href={href} className={path === href ? "is-active" : ""} aria-current={path === href ? "page" : undefined}>{label}</a>)}
        <a href="/contact" className="mobile-project-link">Start a project <Icon name="arrow" /></a>
      </nav>
      <a className="button button-gold header-cta" href="/contact">Start a Project <Icon name="arrow" /></a>
      <button id="menu-toggle" className="menu-toggle" aria-label={open ? "Close navigation" : "Open navigation"} aria-expanded={open} aria-controls="main-navigation" onClick={() => { setOpen(!open); setServicesOpen(false); }}><Icon name={open ? "close" : "menu"} /></button>
    </header>
  </div>;
}
function Rocket() {
  return <svg className="footer-rocket" viewBox="0 0 64 64" fill="none" aria-hidden="true"><path d="m22 35-12 1 9-15 13 1M29 43l-1 12 15-9-1-13" fill="#eed26d" stroke="#fff0b5" strokeWidth="2"/><path d="M20 35C27 14 42 6 58 5c-1 17-10 32-30 40Z" fill="#d2f7ed" stroke="#76dfdc" strokeWidth="2"/><circle cx="43" cy="20" r="7" fill="#07556a" stroke="#fff" strokeWidth="2"/><path d="m18 41-8 15 14-9M12 45 6 57" stroke="#f5c649" strokeWidth="4" strokeLinecap="round"/></svg>;
}
export function Footer({ settings, services, onCookies }: { settings: PublicSettings; services: Content[]; onCookies: () => void }) {
  return <footer className="site-footer landscape-footer">
    <div className="footer-light-trails" aria-hidden="true" />
    <div className="footer-invitation">
      <Rocket /><div><h2>Let’s Build Something <span>Amazing</span> Together</h2><p>Turn your ideas into powerful digital solutions.</p></div>
      <a className="button button-gold" href="/contact">Get Started <Icon name="arrow" /></a>
    </div>
    <div className="footer-glass">
      <div className="footer-columns">
        <div className="footer-identity">
          <a href="/" className="flat-brand"><img src="/images/growintek-flat.png" alt="Growintek Solutions" width="240" height="120" loading="lazy" /></a>
          <p className="footer-motto">Innovate <span>•</span> Automate <span>•</span> Grow</p>
          <p>Turning ideas into intelligent solutions with AI, automation and cutting-edge digital technologies.</p>
          <div className="footer-social-icons">{Object.entries(settings.social).filter(([,url]) => url).map(([name,url]) => <a key={name} href={url} aria-label={`Growintek on ${name}`} target="_blank" rel="noreferrer"><SocialIcon name={name} /></a>)}</div>
        </div>
        <nav aria-label="Footer navigation"><h3>Quick Links</h3>{links.map(([label,href]) => <a key={href} href={href}><span aria-hidden="true">›</span>{label}</a>)}</nav>
        <nav aria-label="Footer services"><h3>Our Services</h3>{services.slice(0,6).map(s => <a key={s.id} href={`/services/${s.slug}`}><span aria-hidden="true">›</span>{s.title}</a>)}<a href="/services"><span aria-hidden="true">›</span>Explore all services</a></nav>
        <div className="footer-connect"><h3>Contact Us</h3>
          <a href={settings.email ? `mailto:${settings.email}` : "/contact"}><span className="contact-orb"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 6 9 7 9-7"/></svg></span><span>{settings.email || "Tell us about your project"}</span></a>
          <div><span className="contact-orb"><Icon name="globe" /></span><span>{settings.country || "Working with clients worldwide"}</span></div>
          <a href="/contact" className="footer-project-link">Let’s talk about your next step <Icon name="arrow" /></a>
        </div>
      </div>
    </div>
    <div className="footer-legal container"><span>© {new Date().getFullYear()} {settings.legalName || "Growintek Solutions"}. All Rights Reserved.</span><nav aria-label="Legal links"><a href="/privacy-policy">Privacy Policy</a><a href="/terms">Terms of Service</a><a href="/sitemap.xml">Sitemap</a></nav></div>
    <div className="footer-utility container"><a href="/cookie-policy">Cookie Policy</a><a href="/accessibility">Accessibility</a><button onClick={onCookies}>Cookie preferences</button><a href="/admin">Admin</a></div>
  </footer>;
}
export type Consent = { analytics: boolean; media: boolean };
export function readConsent(): Consent | null {
  try {
    const c = JSON.parse(localStorage.getItem("grow-consent-v1") || "null");
    return c && typeof c.analytics === "boolean" && typeof c.media === "boolean"
      ? c
      : null;
  } catch {
    return null;
  }
}
export function ConsentBanner({
  open,
  onClose,
  onChange,
}: {
  open: boolean;
  onClose: () => void;
  onChange: (c: Consent) => void;
}) {
  const [media, setMedia] = useState(false);
  useEffect(() => {
    if (open) setMedia(readConsent()?.media || false);
  }, [open]);
  if (!open) return null;
  function choose(analytics: boolean) {
    const c = { analytics, media };
    try {
      localStorage.setItem("grow-consent-v1", JSON.stringify(c));
    } catch {
      /* Private storage may be unavailable. */
    }
    onChange(c);
    onClose();
  }
  return (
    <aside className="cookie-banner" aria-label="Cookie preferences">
      <div>
        <strong>Your privacy, your choice.</strong>
        <p>
          We use essential storage to keep the site working. Optional analytics
          help us improve. <a href="/cookie-policy">Read our cookie policy</a>.
        </p>
        <label className="check-label">
          <input
            type="checkbox"
            checked={media}
            onChange={(e) => setMedia(e.target.checked)}
          />
          Allow external social media content
        </label>
      </div>
      <div className="cookie-actions">
        <button className="button button-quiet" onClick={() => choose(false)}>
          {media ? "Save without analytics" : "Reject optional"}
        </button>
        <button className="button button-gold" onClick={() => choose(true)}>
          Accept analytics
        </button>
      </div>
    </aside>
  );
}
export function track(path: string, event: string = "pageview") {
  if (!readConsent()?.analytics || path.startsWith("/admin")) return;
  fetch("/api/events", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ path, event, consent: true }), keepalive: true,
  }).catch(() => {});
  const w = window as unknown as { gtag?: (...args: unknown[]) => void };
  if (event !== "pageview") w.gtag?.("event", event === "lead_submit" ? "generate_lead" : "form_start", { page_path: path });
}
