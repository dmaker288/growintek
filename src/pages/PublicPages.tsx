import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import type { SiteData, Content } from "../types";
import Icon from "../components/Icon";
import Team from "../components/Team";
import Comments from "../components/Comments";
import ServiceSections from "../components/ServiceSections";
import Markdown, { articleHeadings } from "../components/Markdown";
import {
  SectionLabel,
  ServicesGrid,
  WorkGrid,
  PostGrid,
  Process,
  Industries,
  FAQ,
  CTA,
} from "../components/Sections";
import { track } from "../components/SiteChrome";
export function PageHero({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <section className="page-hero">
      <div className="container">
        <div className="breadcrumb">
          <a href="/">Home</a>
          <span>/</span>
          <span>{eyebrow}</span>
        </div>
        <SectionLabel>{eyebrow.toUpperCase()}</SectionLabel>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="page-orbit" aria-hidden="true" />
    </section>
  );
}
export function About({ data }: { data: SiteData }) {
  const custom = data.pages.find((p) => p.slug === "about");
  return (
    <>
      <PageHero
        eyebrow="About Growintek"
        title={custom?.title || "Big-picture thinking.\nPersonal commitment."}
        description={
          custom?.description ||
          "We bring strategy, design and technology together to help ambitious businesses take their next step."
        }
      />
      <section className="section-space">
        <div className="container about-story">
          <div className="story-image">
            <img
              src="/images/about-art.webp"
              width="491"
              height="286"
              alt="Growintek design concepts across multiple devices"
            />
          </div>
          <div>
            <SectionLabel>IDEAS TO IMPACT</SectionLabel>
            <h2>
              A better digital business
              <br />
              starts with understanding.
            </h2>
            <p>
              We believe the best solution begins with the right questions. What
              does your customer need? Where does your team lose time? What
              would meaningful progress look like?
            </p>
            <p>
              Growintek connects those answers to thoughtful design, dependable
              development and practical digital strategy. We work
              collaboratively, explain our decisions and build with your
              long-term ownership in mind.
            </p>
            <a href="/contact" className="text-link">
              Tell us where you want to go <Icon name="arrow" />
            </a>
          </div>
        </div>
        {custom?.content ? (
          <div className="container article-body">
            <Markdown content={custom.content} />
          </div>
        ) : null}
      </section>
      <div className="principles-band">
        <div className="container">
          {[
            [
              "Clarity",
              "Know what we are building, why it matters and what happens next.",
            ],
            [
              "Craft",
              "Care about the small details that make an experience feel right.",
            ],
            [
              "Ownership",
              "Leave with the access, documentation and confidence to move forward.",
            ],
          ].map(([t, p]) => (
            <div key={t}>
              <h3>{t}</h3>
              <p>{p}</p>
            </div>
          ))}
        </div>
      </div>
      <section className="about-partnership section-space">
        <div className="container">
          <div className="split-heading"><div><SectionLabel>BUILT AROUND YOUR BUSINESS</SectionLabel><h2>A small-team mindset.<br/>A connected set of skills.</h2></div><p>One conversation connects your brand, website, workflows and next stage of growth.</p></div>
          <div className="about-capabilities">
            {[["pen", "Make the right impression", "Strategy & design", "We turn what makes your business useful into a clear story, a considered visual identity and an experience your customers can navigate."], ["code", "Build something dependable", "Websites & platforms", "From a focused service website to a connected web application, we build around your content, operations and the people who use it."], ["settings", "Make room for better work", "Automation & growth", "We connect repetitive tasks, improve discoverability and use real measurement to decide which improvements deserve attention next."]].map(([icon,title,label,text])=><article key={title}><span className="about-capability-icon"><Icon name={icon as "code"}/></span><small>{label}</small><h3>{title}</h3><p>{text}</p></article>)}
          </div>
          <div className="about-working"><div><SectionLabel>WHAT YOU CAN EXPECT</SectionLabel><h2>Close collaboration.<br/>Clear next steps.</h2><a href="/contact" className="text-link">Meet your next digital partner <Icon name="arrow"/></a></div><div className="about-commitments">{[["A plan you can understand", "Scope, priorities and delivery milestones agreed before the build begins."],["A voice in the process", "Regular reviews, shared decisions and feedback at the moments that matter."],["A useful handover", "Your accounts, editing access and practical guidance for running what we build."],["Room to keep improving", "A clear distinction between launch essentials and the improvements we can make next."]].map(([title,text])=><div key={title}><Icon name="check"/><div><h3>{title}</h3><p>{text}</p></div></div>)}</div></div>
        </div>
      </section>
      <Team members={data.team || []} />
      <section className="section-space about-principles"><div className="container"><span className="section-label">HOW WE THINK</span><h2>Good work starts<br/>with understanding.</h2><div>{[["Your business comes first","We connect the work to a real customer need: finding your service, understanding your offer, completing a purchase or getting an answer."],["One team, connected disciplines","Project management keeps the work moving. Design, development, SEO and marketing work together so the message and the experience stay consistent."],["A useful result, in your hands","You receive agreed deliverables, account access and a practical handover. Support, ongoing content and campaign management can be scoped around what comes next."]].map(([title,description])=><article key={title}><h3>{title}</h3><p>{description}</p></article>)}</div></div></section>
      <Process sections={data.sections} />
      <Industries sections={data.sections} />
      <CTA />
    </>
  );
}
export function Services({ data }: { data: SiteData }) {
  return (
    <>
      <PageHero
        eyebrow="Our services"
        title={
          data.pages.find((p) => p.slug === "services")?.title ||
          "The right expertise.\nOne connected approach."
        }
        description={
          data.pages.find((p) => p.slug === "services")?.description ||
          "From your first website to the workflows behind your business, we build the pieces that help you move forward."
        }
      />
      <section className="section-space services-page">
        <div className="container">
          <ServicesGrid services={data.services} />
        </div>
      </section>
      <Process sections={data.sections} />
      <FAQ sections={data.sections} />
      <CTA />
    </>
  );
}
export function ServiceDetail({
  service,
  data,
}: {
  service: Content;
  data: SiteData;
}) {
  return (
    <>
      <PageHero
        eyebrow="Our services"
        title={service.title}
        description={service.description}
      />
      <section className="section-space">
        <div className="container detail-layout">
          <article>
            <Markdown content={service.content} />
          </article>
          <aside className="detail-aside">
            <span className="service-icon">
              <Icon name={service.icon || "code"} />
            </span>
            <h2>Made for your next step.</h2>
            <ul>
              {(service.deliverables || service.points || []).map((p) => (
                <li key={p}>
                  <Icon name="check" />
                  {p}
                </li>
              ))}
            </ul>
            <p className="aside-label">HOW WE WORK</p>
            <p>
              {service.timeline ||
                "A scope and timeline agreed around your needs."}
            </p>
            <a
              className="button button-gold"
              href={`/contact?service=${encodeURIComponent(service.title)}`}
            >
              Discuss your project <Icon name="arrow" />
            </a>
          </aside>
        </div>
      </section>
      <ServiceSections service={service} services={data.services} />
      <CTA />
    </>
  );
}
export function SEO({ data }: { data: SiteData }) {
  const s = data.services.find((s) => s.slug === "seo-digital-strategy");
  return (
    <>
      <PageHero
        eyebrow="SEO & Digital Growth"
        title={
          data.pages.find((p) => p.slug === "seo")?.title ||
          "Get found for the\nright reasons."
        }
        description={
          data.pages.find((p) => p.slug === "seo")?.description ||
          "Build visibility around useful content, a technically sound website and the questions your next customer is asking."
        }
      />
      <section className="section-space">
        <div className="container">
          <div className="seo-pillars">
            {[
              [
                "search",
                "Understand demand",
                "Research buyer questions, search intent and the pages that deserve priority.",
              ],
              [
                "code",
                "Strengthen the foundations",
                "Improve crawlability, page structure, mobile usability and performance.",
              ],
              [
                "pen",
                "Create something useful",
                "Build expert-informed content with evidence, editorial review and clear purpose.",
              ],
              [
                "globe",
                "Measure and improve",
                "Use Search Console and conversion data to choose the next meaningful change.",
              ],
            ].map(([icon, t, p]) => (
              <div key={t}>
                <Icon name={icon as "search"} />
                <h2>{t}</h2>
                <p>{p}</p>
              </div>
            ))}
          </div>
          <div className="seo-promise">
            <div>
              <SectionLabel>OUR APPROACH</SectionLabel>
              <h2>
                Earn attention.
                <br />
                Build lasting trust.
              </h2>
            </div>
            <div>
              <p>
                We do not promise a ranking position. We commit to clear
                priorities, useful work and honest reporting. Search performance
                depends on your market, competition, website history and the
                search engines themselves.
              </p>
              <a
                className="text-link"
                href={`/contact?service=${encodeURIComponent(s?.title || "SEO")}`}
              >
                Start with an SEO conversation <Icon name="arrow" />
              </a>
            </div>
          </div>
        </div>
      </section>
      <section className="section-space seo-next"><div className="container"><span className="section-label">VISIBILITY WITH A PURPOSE</span><h2>From search questions<br/>to useful customer journeys.</h2><div className="seo-next-grid">{[["Technical SEO","Crawl access, indexing, canonicals, internal links and fast, usable pages.","technical-seo"],["Local SEO","Accurate business information, useful location pages and a well-maintained business profile.","local-seo"],["Content & on-page SEO","Clear service pages, distinct search intent, supporting evidence and sensible content updates.","seo-digital-strategy"]].map(([title,description,slug])=><a href={`/services/${slug}`} key={slug}><Icon name="search"/><h3>{title}</h3><p>{description}</p><span>Explore the approach <Icon name="arrow"/></span></a>)}</div><div className="seo-measure"><div><h3>Know what is changing.</h3><p>Search Console shows clicks, impressions and average position. Analytics connects visits to useful actions, such as an inquiry. We read these together and prioritise pages that serve a real business goal.</p></div><div><h3>Make expertise visible.</h3><p>Named contributors, clear service details, real project evidence, updated sources and transparent editorial practices help people assess your business. We build those foundations into the site.</p></div></div></div></section>
      <FAQ sections={data.sections} />
      <CTA />
    </>
  );
}
export function Portfolio({ data }: { data: SiteData }) {
  const [filter, setFilter] = useState("All work");
  const categories = [
    "All work",
    ...new Set(data.portfolio.map((p) => p.category || "Web design")),
  ];
  return (
    <>
      <PageHero
        eyebrow="Our portfolio"
        title={
          data.pages.find((p) => p.slug === "portfolio")?.title ||
          "A window into\nwhat’s possible."
        }
        description={
          data.pages.find((p) => p.slug === "portfolio")?.description ||
          "Explore our approach to brands, websites and digital products. Concept projects are labeled so you can see exactly what is being showcased."
        }
      />
      <section className="section-space">
        <div className="container">
          <div className="filter-tabs" aria-label="Filter portfolio">
            {categories.map((c) => (
              <button
                key={c}
                className={filter === c ? "active" : ""}
                aria-pressed={filter === c}
                onClick={() => setFilter(c)}
              >
                {c}
              </button>
            ))}
          </div>
          <WorkGrid
            projects={data.portfolio.filter(
              (p) => filter === "All work" || p.category === filter,
            )}
          />
        </div>
      </section>
      <CTA />
    </>
  );
}
export function ProjectDetail({ project }: { project: Content }) {
  return (
    <>
      <PageHero
        eyebrow={project.concept ? "Portfolio · Design concept" : "Portfolio"}
        title={project.title}
        description={project.description}
      />
      <section className="section-space">
        <div className="container">
          <img
            className="project-detail-image"
            src={project.image}
            alt={project.imageAlt || project.title}
            width="1120"
            height="760"
          />
          {project.concept ? (
            <p className="image-caption">
              Design concept · This artwork illustrates a proposed experience
              and is not a verified live-site screenshot or client result.
            </p>
          ) : null}
          <div className="detail-layout">
            <Markdown content={project.content} />
            <aside className="detail-aside">
              <SectionLabel>PROJECT FOCUS</SectionLabel>
              <h2>{project.category}</h2>
              <ul>
                {project.points?.map((p) => (
                  <li key={p}>
                    <Icon name="check" />
                    {p}
                  </li>
                ))}
              </ul>
              {project.url ? (
                <a
                  href={project.url}
                  className="text-link"
                  target="_blank"
                  rel="noreferrer"
                >
                  Visit the project <Icon name="arrow" />
                </a>
              ) : null}
              <a className="button button-gold" href="/contact">
                Build something with us <Icon name="arrow" />
              </a>
            </aside>
          </div>
        </div>
      </section>
      <CTA />
    </>
  );
}
export function Blog({ data }: { data: SiteData }) {
  const [search, setSearch] = useState(""),
    [category, setCategory] = useState("All insights");
  const categories = [
    "All insights",
    ...new Set(data.posts.map((p) => p.category || "Insights")),
  ];
  const posts = data.posts.filter(
    (p) =>
      (category === "All insights" || p.category === category) &&
      `${p.title} ${p.description}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  return (
    <>
      <PageHero
        eyebrow="Ideas & Insights"
        title={
          data.pages.find((p) => p.slug === "blog")?.title ||
          "A little knowledge.\nA better next move."
        }
        description={
          data.pages.find((p) => p.slug === "blog")?.description ||
          "Practical perspectives on websites, automation and sustainable digital growth. Written to help you make clearer decisions."
        }
      />
      <section className="section-space">
        <div className="container">
          <div className="blog-toolbar">
            <div className="filter-tabs" aria-label="Filter articles">
              {categories.map((c) => (
                <button
                  key={c}
                  className={category === c ? "active" : ""}
                  aria-pressed={category === c}
                  onClick={() => setCategory(c)}
                >
                  {c}
                </button>
              ))}
            </div>
            <label className="search-field">
              <Icon name="search" />
              <input
                aria-label="Search insights"
                placeholder="Find an insight…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
          </div>
          {posts.length ? (
            <PostGrid posts={posts} />
          ) : (
            <div className="empty-state">
              <h2>No matching insights yet.</h2>
              <p>Try a different search or explore all categories.</p>
              <button
                className="button button-soft"
                onClick={() => {
                  setSearch("");
                  setCategory("All insights");
                }}
              >
                Show all insights
              </button>
            </div>
          )}
          <div className="editorial-note">
            <Icon name="shield" />
            <p>
              Useful content. Clear sources. Honest claims.{" "}
              <a href="/editorial-policy">Read our editorial principles</a> or{" "}
              <a href="/feed.xml">subscribe with RSS</a>.
            </p>
          </div>
        </div>
      </section>
      <CTA />
    </>
  );
}
export function BlogPost({ post, data }: { post: Content; data: SiteData }) {
  const headings = articleHeadings(post.content);
  const [copied, setCopied] = useState(false);
  const [shareError, setShareError] = useState(false);
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setShareError(false);
    } catch {
      setShareError(true);
    }
  };
  return (
    <>
      <section className="article-hero">
        <div className="container">
          <div className="breadcrumb">
            <a href="/blog">Ideas & insights</a>
            <span>/</span>
            <span>{post.category}</span>
          </div>
          <SectionLabel>{post.category?.toUpperCase()}</SectionLabel>
          <h1>{post.title}</h1>
          <p>{post.description}</p>
          <div className="article-byline">
            <span className="author-mark">G</span>
            <div>
              <strong>{post.author}</strong>
              <span>
                {new Date(
                  post.publishedAt || post.createdAt,
                ).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  timeZone: "UTC",
                })}{" "}
                ·{" "}
                {Math.max(1, Math.ceil(post.content.split(/\s+/).length / 200))}{" "}
                min read
              </span>
            </div>
          </div>
        </div>
      </section>
      <div className="container">
        <img
          className="article-cover"
          src={post.image}
          width="1000"
          height="560"
          alt=""
        />
      </div>
      <div className="container article-reading-layout">
        <aside className="article-sidebar">
          <div>
            <span className="section-label">IN THIS INSIGHT</span>
            <nav aria-label="Article contents">
              {headings
                .filter((h) => h.level === 2)
                .map((h) => (
                  <a href={`#${h.id}`} key={h.id}>
                    {h.title}
                  </a>
                ))}
            </nav>
            <button className="text-button" onClick={copyLink}>
              {copied ? "Link copied ✓" : "Copy article link ↗"}
            </button>
            <span role="status">
              {shareError
                ? "Copy the address from your browser to share this article."
                : ""}
            </span>
            <a href="/services" className="article-service-link">
              Put the idea to work<span>Explore our services ↗</span>
            </a>
          </div>
        </aside>
        <article className="article-body section-space">
          {post.aiGenerated ? (
            <div className="article-disclosure">
              AI-assisted article.{" "}
              {post.reviewer?.startsWith("Automated")
                ? "Published after automated checks; no human review."
                : post.reviewer
                  ? `Reviewed by ${post.reviewer}.`
                  : "Editorial review pending."}
            </div>
          ) : null}
          <Markdown content={post.content} />
          {post.sources?.length ? (
            <div className="article-sources">
              <h2>Sources & further reading</h2>
              <ul>
                {post.sources.map((s) => (
                  <li key={s.url}>
                    <a href={s.url} target="_blank" rel="noreferrer">
                      {s.title} ↗
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="article-end">
            <p>Have a question about applying this to your business?</p>
            <a href="/contact" className="button button-gold">
              Let’s talk it through <Icon name="arrow" />
            </a>
          </div>
        </article>
      </div>
      <Comments postId={post.id} settings={data.settings} />
      <section className="section-space related-posts">
        <div className="container">
          <SectionLabel>KEEP EXPLORING</SectionLabel>
          <h2>Another useful perspective.</h2>
          <PostGrid
            posts={data.posts.filter((p) => p.id !== post.id).slice(0, 3)}
          />
        </div>
      </section>
    </>
  );
}
export function Contact({ data }: { data: SiteData }) {
  const [state, setState] = useState<"idle" | "sending" | "success" | "error">(
      "idle",
    ),
    [message, setMessage] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [industry, setIndustry] = useState("");
  const started = useRef(false);
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    setSelectedService(query.get("service") || "");
    setIndustry(query.get("industry") || "");
  }, []);
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setState("sending");
    setMessage("");
    try {
      const body = {
        ...Object.fromEntries(f),
        consent: f.get("consent") === "on",
      };
      const r = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok)
        throw new Error(
          d.error || "We could not save your inquiry. Please try again.",
        );
      setState("success");
      setMessage(d.message);
      track("/contact", "lead_submit");
    } catch (e) {
      setState("error");
      setMessage(e instanceof Error ? e.message : "Please try again.");
    }
  }
  return (
    <>
      <PageHero
        eyebrow="Let’s talk"
        title={
          data.pages.find((p) => p.slug === "contact")?.title ||
          "Your next big idea\nstarts with hello."
        }
        description={
          data.pages.find((p) => p.slug === "contact")?.description ||
          "Tell us what you’re working on, where you want to go and what’s getting in the way. We’ll help you find a useful next step."
        }
      />
      <section className="section-space">
        <div className="container contact-layout">
          <aside>
            <SectionLabel>START A CONVERSATION</SectionLabel>
            <h2>
              Let’s make
              <br />
              something meaningful.
            </h2>
            <p>
              You do not need a perfect brief. A little context is enough to get
              the conversation started.
            </p>
            <div className="contact-facts">
              <div>
                <Icon name="globe" />
                <span>
                  <strong>Open to international projects</strong>Remote
                  collaboration, thoughtfully planned.
                </span>
              </div>
              <div>
                <Icon name="shield" />
                <span>
                  <strong>Clear from the beginning</strong>A written scope
                  before work starts.
                </span>
              </div>
              <div>
                <Icon name="heart" />
                <span>
                  <strong>A human conversation</strong>We listen, ask questions
                  and explain our thinking.
                </span>
              </div>
            </div>
            {data.settings.email ? (
              <a className="text-link" href={`mailto:${data.settings.email}`}>
                {data.settings.email} <Icon name="arrow" />
              </a>
            ) : null}
          </aside>
          {state === "success" ? (
            <div className="contact-form success-panel" role="status">
              <span className="success-icon">
                <Icon name="check" />
              </span>
              <h2>We have your idea.</h2>
              <p>{message}</p>
              <p>
                Our team can now review your brief and follow up using the email
                you provided.
              </p>
              <a href="/blog" className="button button-gold">
                Explore our insights <Icon name="arrow" />
              </a>
            </div>
          ) : (
            <form
              className="contact-form"
              onSubmit={submit}
              onFocus={() => {
                if (!started.current) {
                  track("/contact", "contact_start");
                  started.current = true;
                }
              }}
            >
              <h2>A little about your project</h2>
              <div className="form-grid">
                <label>
                  Your name <span>*</span>
                  <input
                    name="name"
                    autoComplete="name"
                    required
                    minLength={2}
                    maxLength={240}
                    placeholder="Alex Morgan"
                  />
                </label>
                <label>
                  Email address <span>*</span>
                  <input
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    maxLength={254}
                    placeholder="alex@yourcompany.com"
                  />
                </label>
                <label>
                  Company
                  <input
                    name="company"
                    autoComplete="organization"
                    maxLength={240}
                    placeholder="Your company"
                  />
                </label>
                <label>
                  What can we help with?
                  <select
                    name="service"
                    value={selectedService}
                    onChange={(e) => setSelectedService(e.target.value)}
                  >
                    <option value="">Select a service</option>
                    {data.services.map((s) => (
                      <option key={s.id}>{s.title}</option>
                    ))}
                    <option>Not sure yet</option>
                  </select>
                </label>
                <label>
                  Project budget
                  <select name="budget" defaultValue="">
                    <option value="">Select a range (USD)</option>
                    <option>Under $2,500</option>
                    <option>$2,500–$5,000</option>
                    <option>$5,000–$10,000</option>
                    <option>$10,000–$25,000</option>
                    <option>$25,000+</option>
                    <option>Let’s discuss</option>
                  </select>
                </label>
                <label>
                  Industry
                  <input
                    name="industry"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                    maxLength={240}
                    placeholder="Your industry"
                  />
                </label>
                <label className="full-width">
                  Tell us about your project <span>*</span>
                  <textarea
                    name="message"
                    rows={5}
                    required
                    minLength={20}
                    maxLength={10000}
                    placeholder="Your goals, your timeline, and anything we should know…"
                  />
                </label>
                <label className="honeypot" aria-hidden="true">
                  Website
                  <input name="website" tabIndex={-1} autoComplete="off" />
                </label>
              </div>
              <label className="check-label">
                <input name="consent" type="checkbox" required />
                <span>
                  I agree to the <a href="/privacy-policy">Privacy Policy</a>{" "}
                  and to being contacted about my inquiry.
                </span>
              </label>
              {state === "error" ? (
                <p className="form-error" role="alert">
                  {message}
                </p>
              ) : null}
              <button
                className="button button-gold"
                disabled={state === "sending"}
              >
                {state === "sending"
                  ? "Sending your inquiry…"
                  : "Send Your Inquiry"}{" "}
                <Icon name="arrow" />
              </button>
              <p className="form-footnote">
                Your information is used to respond to this inquiry. No
                newsletter signup.
              </p>
            </form>
          )}
        </div>
      </section>
    </>
  );
}
export function ContentPage({ page, data }: { page: Content; data: SiteData }) {
  const legal = [
    "privacy-policy",
    "terms",
    "cookie-policy",
    "accessibility",
    "editorial-policy",
  ].includes(page.slug);
  return (
    <>
      <PageHero
        eyebrow={legal ? "Our policies" : page.eyebrow || "Growintek"}
        title={page.title}
        description={page.description}
      />
      <article className="article-body section-space">
        {legal ? (
          <p className="legal-operator">
            Website operator: {data.settings.legalName || "Growintek"}
            {data.settings.country ? ` · ${data.settings.country}` : ""}
            {data.settings.email ? ` · ${data.settings.email}` : ""}
          </p>
        ) : null}
        <Markdown content={page.content} />
        <p className="policy-contact">
          Questions? <a href="/contact">Get in touch with Growintek.</a>
        </p>
      </article>
    </>
  );
}
export function NotFound() {
  return (
    <section className="not-found section-space container">
      <SectionLabel>404 · A DIFFERENT DIRECTION</SectionLabel>
      <h1>
        This page has moved
        <br />
        out of view.
      </h1>
      <p>Let’s get you back to something useful.</p>
      <a className="button button-gold" href="/">
        Back to Growintek <Icon name="arrow" />
      </a>
    </section>
  );
}
