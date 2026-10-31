import { useEffect, useState } from "react";
import Icon from "./Icon";
import type { Content, PublicSettings } from "../types";
import type { Consent } from "./SiteChrome";
export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="section-label">
      <span />
      {children}
    </div>
  );
}
export function CTA() {
  return (
    <section className="contact-section">
      <div className="contact-shade" />
      <div className="contact-content">
        <span className="contact-eyebrow">YOUR NEXT CHAPTER STARTS HERE</span>
        <h2>Let’s build something that moves you forward.</h2>
        <p>A sharper website. A smarter workflow. A clearer path to growth.</p>
        <a className="button button-gold" href="/contact">
          Start a conversation <Icon name="arrow" />
        </a>
      </div>
      <div className="contact-promises">
        <span>
          <Icon name="heart" />A thoughtful first conversation
        </span>
        <span>
          <Icon name="globe" />
          Built for global business
        </span>
        <span>
          <Icon name="shield" />
          Clear scope & pricing
        </span>
      </div>
    </section>
  );
}
export function ServicesGrid({ services }: { services: Content[] }) {
  return (
    <div className="services-grid">
      {services.map((s, i) => (
        <a className="service-card" href={`/services/${s.slug}`} key={s.id}>
          <span className={`service-icon service-icon-${i}`}>
            <Icon name={s.icon || "code"} />
          </span>
          <h3>{s.title}</h3>
          <p>{s.short || s.description}</p>
          <Icon name="arrow" className="card-arrow" />
        </a>
      ))}
    </div>
  );
}
export function WorkGrid({ projects }: { projects: Content[] }) {
  return (
    <div className="work-grid-large">
      {projects.map((p) => (
        <a className="work-card" href={`/portfolio/${p.slug}`} key={p.id}>
          <div className="work-image">
            <img
              src={p.image}
              width="1120"
              height="760"
              loading="lazy"
              alt={p.imageAlt || `${p.title} design concept`}
            />
            <span className="work-open">
              <Icon name="arrow" />
            </span>
          </div>
          <div className="work-caption">
            <div>
              <span>
                {p.category}
                {p.concept ? " · Concept" : ""}
              </span>
              <h3>{p.title}</h3>
            </div>
            <span aria-hidden="true">↗</span>
          </div>
        </a>
      ))}
    </div>
  );
}
export const industries = [
  {
    icon: "wordpress",
    title: "E-commerce & Retail",
    text: "Better product discovery, smoother shopping and connected operations.",
  },
  {
    icon: "code",
    title: "SaaS & Technology",
    text: "Clear product stories and useful digital experiences that scale.",
  },
  {
    icon: "team",
    title: "Professional Services",
    text: "Turn your expertise into a credible presence and qualified inquiries.",
  },
  {
    icon: "globe",
    title: "Trade & Manufacturing",
    text: "Connect products, capabilities and buyers across international markets.",
  },
  {
    icon: "heart",
    title: "Health & Wellness",
    text: "Accessible experiences that put clarity and trust first.",
  },
  {
    icon: "pen",
    title: "Education & Consulting",
    text: "Make complex information useful, approachable and easy to act on.",
  },
] as const;
export function Industries({ sections }: { sections?: Content[] }) {
  const items = sections
    ? sections
        .filter((x) => x.group === "industries")
        .map((x) => ({ ...x, text: x.description }))
    : industries;
  return (
    <section className="industries-section section-space">
      <div className="container">
        <div className="split-heading">
          <div>
            <SectionLabel>INDUSTRIES WE SERVE</SectionLabel>
            <h2>
              Different industries.
              <br />
              The same ambition to grow.
            </h2>
          </div>
          <p>
            Your industry has its own language, challenges and customers. We
            take the time to understand all three.
          </p>
        </div>
        <div className="industry-grid">
          {items.map((x) => (
            <a
              href={`/contact?industry=${encodeURIComponent(x.title)}`}
              key={x.title}
              className="industry-item"
            >
              <Icon name={x.icon || "globe"} />
              <div>
                <h3>{x.title}</h3>
                <p>{x.text}</p>
              </div>
              <span aria-hidden="true">↗</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
export function Why() {
  return (
    <section className="about-section why-upgrade">
      <div
        className="about-art"
        role="img"
        aria-label="Growintek website concepts on desktop, tablet and mobile"
      />
      <div className="about-content">
        <SectionLabel>WHY GROWINTEK</SectionLabel>
        <h2>
          Your vision.
          <br />
          Our shared ambition.
        </h2>
        <p>
          Good digital work connects the big picture to the small details. We
          bring strategy, design and development together around what your
          business actually needs.
        </p>
        <div className="why-points">
          {[
            [
              "shield",
              "Clarity from day one",
              "Agreed scope, visible milestones and straightforward communication.",
            ],
            [
              "settings",
              "Built around you",
              "The right solution for your team, tools and customers.",
            ],
            [
              "globe",
              "A partner beyond launch",
              "Documentation, ownership and a practical plan for what comes next.",
            ],
          ].map(([icon, title, text]) => (
            <div key={title}>
              <Icon name={icon as "shield"} />
              <div>
                <h3>{title}</h3>
                <p>{text}</p>
              </div>
            </div>
          ))}
        </div>
        <a href="/about" className="text-link light">
          Get to know Growintek <Icon name="arrow" />
        </a>
      </div>
    </section>
  );
}
export const steps = [
  [
    "Discover",
    "We listen first. Your goals, audience and challenges shape a focused plan.",
  ],
  [
    "Design",
    "We turn the plan into a clear experience, with room for your feedback.",
  ],
  [
    "Build",
    "We develop, integrate and test the details that make everything work.",
  ],
  [
    "Grow",
    "We launch carefully, measure what matters and plan the next improvement.",
  ],
];
export function Process({ sections }: { sections?: Content[] }) {
  const items = sections
    ? sections
        .filter((x) => x.group === "process")
        .map((x) => [x.title, x.description])
    : steps;
  return (
    <section className="process-section section-space">
      <div className="container">
        <div className="split-heading">
          <div>
            <SectionLabel>HOW WE DELIVER</SectionLabel>
            <h2>
              A clear process.
              <br />
              Progress you can see.
            </h2>
          </div>
          <a className="text-link" href="/contact">
            Let’s map out your project <Icon name="arrow" />
          </a>
        </div>
        <div className="process-grid">
          {items.map(([title, text], i) => (
            <div className="process-step" key={title}>
              <div className="step-top">
                <span>0{i + 1}</span>
                <Icon name="arrow" />
              </div>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
export const faqs = [
  [
    "What can Growintek help us with?",
    "We help with AI agents and automation, websites and web applications, WordPress and WooCommerce, SEO, social campaigns and UI/UX design. We can start with a focused project or scope several services around one business goal.",
  ],
  [
    "Do you work with international clients?",
    "Yes. Our workflow is designed for remote collaboration, with agreed communication windows, shared milestones and written decisions. We plan around your team’s location and project requirements.",
  ],
  [
    "How much does a project cost?",
    "Pricing depends on the scope, integrations, content and support you need. After an initial conversation, we provide a written proposal with deliverables, assumptions and payment milestones.",
  ],
  [
    "How long will my project take?",
    "We agree on a timeline after discovery. A focused website and a custom platform have very different requirements. Your proposal sets out milestones, review periods and any dependencies on content or third-party access.",
  ],
  [
    "Can you guarantee first-page Google rankings?",
    "No responsible agency can guarantee rankings or indexing. We improve technical foundations, content quality and relevance, then use measured data to guide the work. We do not use link schemes, cloaking or other manipulative tactics.",
  ],
  [
    "Will we be able to manage the website ourselves?",
    "Yes. We plan content ownership and editing needs from the start, provide a CMS where required and include a practical handover. Ongoing maintenance and support can be scoped separately.",
  ],
];
export function FAQ({ sections }: { sections?: Content[] }) {
  const items = sections
    ? sections
        .filter((x) => x.group === "faq")
        .map((x) => [x.title, x.description])
    : faqs;
  return (
    <section className="faq-section section-space" aria-labelledby="faq-title">
      <div className="container faq-redesign">
        <div className="faq-heading">
          <div><SectionLabel>LET’S CLEAR THINGS UP</SectionLabel><h2 id="faq-title">Big ideas start with<br/><em>good questions.</em></h2></div>
          <p>From your first idea to life after launch.<br/>Here’s what working together looks like.</p>
        </div>
        <div className="faq-answer-grid">
          {items.map(([q, a]) => <details key={q} open className="faq-answer-card">
            <summary><span className="faq-question-mark" aria-hidden="true">?</span><h3>{q}</h3><span className="faq-expand" aria-hidden="true">+</span></summary>
            <p>{a}</p>
          </details>)}
        </div>
        <div className="faq-conversation">
          <div className="faq-chat-icon"><Icon name="team" /></div>
          <div><h3>Your question is a little more specific?</h3><p>Tell us what you have in mind. We’ll help you find the right starting point.</p></div>
          <a className="button button-gold" href="/contact">Let’s talk it through <Icon name="arrow" /></a>
        </div>
      </div>
    </section>
  );
}
export function PostGrid({ posts }: { posts: Content[] }) {
  return (
    <div className="post-grid">
      {posts.map((p) => (
        <article className="post-card" key={p.id}>
          <a href={`/blog/${p.slug}`} className="post-image">
            <img
              src={p.image}
              width="1000"
              height="560"
              alt=""
              loading="lazy"
            />
          </a>
          <div className="post-meta">
            <span>{p.category}</span>
            <span>
              {Math.max(
                1,
                Math.ceil((p.wordCount ?? p.content.split(/\s+/).length) / 200),
              )}{" "}
              min read
            </span>
          </div>
          <h3>
            <a href={`/blog/${p.slug}`}>{p.title}</a>
          </h3>
          <p>{p.description}</p>
          <a className="text-link" href={`/blog/${p.slug}`}>
            Read the insight <Icon name="arrow" />
          </a>
        </article>
      ))}
    </div>
  );
}
type SocialPost = {
  id: string;
  text: string;
  url: string;
  image?: string;
  date: string;
  kind?: "post" | "reel" | "video";
  embedId?: string;
};
type Feed = { status: string; posts: SocialPost[]; updatedAt?: string };
const socialNames = {
  instagram: "Instagram",
  facebook: "Facebook",
  youtube: "YouTube",
};
const socialMarks = { instagram: "◎", facebook: "f", youtube: "▷" };
function SocialCard({
  post,
  channel,
  media,
  onPreferences,
}: {
  post: SocialPost;
  channel: keyof typeof socialNames;
  media: boolean;
  onPreferences: () => void;
}) {
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <article className={`social-card social-channel-${channel} social-card-${post.kind || "post"}`}>
      <div className="social-card-top">
        <span className="social-avatar">{socialMarks[channel]}</span>
        <div>
          <strong>Growintek Solutions</strong>
          <span>{socialNames[channel]}</span>
        </div>
        <span className="social-kind">{post.kind || "post"}</span>
      </div>
      <div className="social-card-art">
        {media && playing && post.embedId ? (
          <iframe
            title={post.text}
            src={`https://www.youtube-nocookie.com/embed/${post.embedId}?autoplay=1`}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <>
            {media && post.image && !failed ? (
              <img
                src={post.image}
                alt=""
                loading="lazy"
                onError={() => setFailed(true)}
              />
            ) : (
              <div className="social-art-placeholder">
                <span>{socialMarks[channel]}</span>
                <strong>{post.text.split("\n")[0].slice(0, 90)}</strong>
                <small>GROWINTEK / IDEAS IN MOTION</small>
              </div>
            )}
            {post.kind !== "post" &&
              (media && post.embedId ? (
                <button
                  className="social-play"
                  aria-label={`Play ${post.text}`}
                  onClick={() => setPlaying(true)}
                >
                  ▷
                </button>
              ) : (
                <a
                  className="social-play"
                  href={post.url}
                  aria-label={`Watch on ${socialNames[channel]}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  ▷
                </a>
              ))}
            {!media && (
              <button className="social-enable" onClick={onPreferences}>
                Enable media preview ↗
              </button>
            )}
          </>
        )}
      </div>
      <div className="social-card-copy">
        <p>{post.text.slice(0, 220)}</p>
        <div>
          <time dateTime={post.date}>
            {new Date(post.date).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
              year: "numeric",
              timeZone: "UTC",
            })}
          </time>
          <a
            href={post.url}
            target="_blank"
            rel="noreferrer"
            aria-label={`Open post on ${socialNames[channel]}`}
          >
            View post <Icon name="arrow" />
          </a>
        </div>
      </div>
    </article>
  );
}
export function Social({
  settings,
  consent,
  onPreferences,
}: {
  settings: PublicSettings;
  consent: Consent | null;
  onPreferences: () => void;
}) {
  const [active, setActive] = useState<keyof typeof socialNames>("instagram");
  const [kind, setKind] = useState("all");
  const [feeds, setFeeds] = useState<Record<string, Feed>>({});
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    const abort = new AbortController();
    fetch("/api/social", { signal: abort.signal })
      .then((r) => r.json())
      .then(setFeeds)
      .catch(() => {})
      .finally(() => setLoaded(true));
    return () => abort.abort();
  }, []);
  const feed = feeds[active],
    profile = settings.social[active];
  const posts = (feed?.posts || []).filter(
    (p) => kind === "all" || (p.kind || "post") === kind,
  );
  return (
    <section className="social-section section-space" id="social">
      <div className="container">
        <div className="split-heading">
          <div>
            <SectionLabel>BEYOND THE WEBSITE</SectionLabel>
            <h2>
              Good ideas.
              <br />
              <em>In good company.</em>
            </h2>
          </div>
          <p>
            A closer look at the ideas, experiments and conversations that keep
            us moving. Follow along.
          </p>
        </div>
        <div className="social-toolbar">
          <div className="social-channels" aria-label="Social channels">
            {(Object.keys(socialNames) as (keyof typeof socialNames)[]).map(
              (name) => (
                <button
                  key={name}
                  aria-pressed={active === name}
                  className={active === name ? "active" : ""}
                  onClick={() => {
                    setActive(name);
                    setKind("all");
                  }}
                >
                  <span>{socialMarks[name]}</span>
                  {socialNames[name]}
                </button>
              ),
            )}
          </div>
          <div className="social-filters" aria-label="Content type">
            {[
              ["all", "All"],
              ["post", "Posts"],
              ["reel", "Reels"],
              ["video", "Videos"],
            ].map(([value, label]) => (
              <button
                key={value}
                aria-pressed={kind === value}
                className={kind === value ? "active" : ""}
                onClick={() => setKind(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        <div aria-live="polite" className="social-stage">
          {posts.length ? (
            <div className="social-card-grid">
              {posts.slice(0, 6).map((p) => (
                <SocialCard
                  key={`${active}-${p.id}`}
                  post={p}
                  channel={active}
                  media={Boolean(consent?.media)}
                  onPreferences={onPreferences}
                />
              ))}
            </div>
          ) : (
            <div className="social-empty">
              <span className="social-monogram">{socialMarks[active]}</span>
              <div>
                <h3>
                  {!loaded
                    ? "Bringing our ideas together…"
                    : kind === "all"
                      ? "Continue the conversation."
                      : `More ${kind === "reel" ? "reels" : kind === "video" ? "videos" : "posts"} to discover.`}
                </h3>
                <p>
                  Visit our {socialNames[active]} channel for more from
                  Growintek.
                </p>
              </div>
              <a
                href={profile || "/blog"}
                className="button button-soft"
                target={profile ? "_blank" : undefined}
                rel="noreferrer"
              >
                Explore the channel <Icon name="arrow" />
              </a>
            </div>
          )}
        </div>
        <div className="social-bottom">
          <span>
            {feed?.updatedAt
              ? `Latest saved posts · ${new Date(feed.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })}`
              : "Ideas worth sharing."}
          </span>
          {profile && (
            <a href={profile} target="_blank" rel="noreferrer">
              Follow Growintek on {socialNames[active]} ↗
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
