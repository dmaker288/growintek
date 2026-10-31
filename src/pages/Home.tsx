import useHomeMotion from "../components/useHomeMotion";
import { Fragment, useState } from "react";
import type { SiteData } from "../types";
import type { Consent } from "../components/SiteChrome";
import { Header } from "../components/SiteChrome";
import Icon from "../components/Icon";
import StoryDialog from "../components/StoryDialog";
import { values } from "../content";
import { SectionLabel, ServicesGrid, Process, Industries, PostGrid, FAQ, Social } from "../components/Sections";

export default function Home({ data, consent, onPreferences }: { data: SiteData; consent: Consent | null; onPreferences: () => void }) {
  useHomeMotion();
  const [storyOpen, setStoryOpen] = useState(false);
  const home = data.pages.find(p => p.slug === "home");
  const heading = home?.title || "Build Smarter.\nGrow Faster.";
  const serviceHref = (slug: string) => data.services.some(s => s.slug === slug) ? `/services/${slug}` : "/services";
  return <div className="home-page">
      <Header path="/" home services={data.services} />
      <section id="home" className="hero" aria-labelledby="hero-heading">
        <div className="hero-art" aria-hidden="true" />
        <div className="hero-shade" aria-hidden="true" />
        <div className="home-header-space" aria-hidden="true" />

        <div className="hero-body container">
          <div className="hero-copy">
            <div className="hero-eyebrow">AI <span>•</span> AUTOMATION <span>•</span> WEB <span>•</span> DIGITAL GROWTH</div>
            <h1 id="hero-heading">{heading === "Build Smarter.\nGrow Faster." ? <>Build Smarter.<br/><span>Grow</span> Faster.</> : heading.split("\n").map((line, i) => <Fragment key={i}>{i > 0 && <br/>}{line}</Fragment>)}</h1>
            <p>{home?.description || "Growintek is a next-gen digital agency, helping businesses around the world with AI agents, automation, web development and smart digital strategy."}</p>
            <div className="hero-actions">
              <a className="button button-gold" href="/contact">Get Started <Icon name="arrow" /></a>
              <button className="button button-outline" onClick={() => setStoryOpen(true)}><Icon name="play"/> Watch Our Story</button>
            </div>
            <div className="trust-row">
              <img src="/images/avatars.webp" width="112" height="44" alt="Three members of the Growintek business community" />
              <div><strong>Trusted by 100+ Businesses</strong><span>Across 20+ Countries</span></div>
            </div>
          </div>
        </div>
        <div className="hero-art-links" aria-label="Explore our capabilities">
          <a className="art-link art-link-ai" aria-label="Explore AI agents and automation" href={serviceHref("ai-agents-automation")} />
          <a className="art-link art-link-web" aria-label="Explore web apps and websites" href={serviceHref("web-development")} />
          <a className="art-link art-link-seo" aria-label="Explore SEO and digital marketing" href={serviceHref("seo-digital-strategy")} />
          <a className="art-link art-link-automation" aria-label="Explore automation and workflows" href={serviceHref("ai-agents-automation")} />
        </div>
        <svg className="section-wave hero-wave" viewBox="0 0 1440 64" preserveAspectRatio="none" aria-hidden="true"><path d="M0 10C180 76 334 47 712 51c387 4 577 28 728-46v59H0Z" fill="currentColor"/></svg>
      </section>

      <section id="services" className="services-section" aria-labelledby="services-heading">
        <div className="services-wash" aria-hidden="true"/>
        <div className="container services-layout">
          <div className="section-intro">
            <SectionLabel>OUR SERVICES</SectionLabel>
            <h2 id="services-heading">Everything You Need<br className="desktop-break"/> for Digital Success</h2>
            <p>From AI-powered solutions to stunning websites, we provide end-to-end services to help your business innovate, automate and grow.</p>
            <a className="button button-gold button-soft" href="/services">Explore All Services <Icon name="arrow" /></a>
          </div>
          <ServicesGrid services={data.services.slice(0,6)} />
        </div>
      </section>

      <section id="about" className="about-section" aria-labelledby="about-heading">
        <svg className="section-wave about-top-wave" viewBox="0 0 1440 30" preserveAspectRatio="none" aria-hidden="true"><path d="M0 0h1440v13C1020 38 450 29 0 8Z" fill="currentColor"/></svg>
        <div className="about-art" role="img" aria-label="Growintek websites displayed on a laptop, tablet, and phone, surrounded by glowing green and gold light"/>
        <div className="about-content">
          <SectionLabel>WHY GROWINTEK</SectionLabel>
          <h2 id="about-heading">Your Vision, Our Technology</h2>
          <p>We combine creativity, technology and strategy to deliver solutions that make a real impact. With a passion for innovation and a commitment to excellence, we turn ideas into powerful digital experiences.</p>
          <div className="values-grid">
            {(data.sections ? data.sections.filter(x=>x.group === "why").map(x=>({...x,text:x.description})) : values).map(value => <div className="value" key={value.title}><Icon name={value.icon || "globe"}/><h3>{value.title}</h3><p>{value.text}</p></div>)}
          </div>
        </div>
        <svg className="section-wave about-bottom-wave" viewBox="0 0 1440 28" preserveAspectRatio="none" aria-hidden="true"><path d="M0 8c418 17 1084 25 1440 0v20H0Z" fill="currentColor"/></svg>
      </section>

      <section className="impact-section" aria-labelledby="impact-heading">
        <div className="impact-globe" aria-hidden="true"/>
        <div className="container impact-layout">
          <h2 id="impact-heading">Our Impact<br/>in Numbers</h2>
          <div className="impact-stat"><strong>100<span>+</span></strong><span>Projects Completed</span></div>
          <div className="impact-stat"><strong>20<span>+</span></strong><span>Countries Served</span></div>
          <div className="impact-stat"><strong>98<span>%</span></strong><span>Client Satisfaction</span></div>
          <div className="impact-stat"><strong>5<span className="rating-star">★</span></strong><span>Average Rating</span></div>
        </div>
      </section>

      <section id="work" className="work-section" aria-labelledby="work-heading">
        <div className="container work-layout">
          <div className="work-intro">
            <SectionLabel>FEATURED WORK</SectionLabel>
            <h2 id="work-heading">Websites. Apps. Real Results.</h2>
            <p>Explore some of our latest projects and see how we help businesses build, grow and succeed online.</p>
            <a className="button button-gold button-soft" href="/portfolio">View Our Portfolio <Icon name="arrow"/></a>
          </div>
          <div className="project-grid">
            {data.portfolio.slice(0, 5).map(project => <a className="project-card" key={project.id} href={`/portfolio/${project.slug}`}>
              <div className="project-image"><img src={project.image} alt={project.imageAlt || `${project.title} website design`} width="240" height="176" loading="lazy"/><span><Icon name="arrow"/></span></div>
              <h3>{project.title}</h3><p>{project.category}{project.concept ? " · Concept" : ""}</p>
            </a>)}
          </div>
        </div>
      </section>

      <Process sections={data.sections} />
      <Industries sections={data.sections} />
      <section className="insights-section section-space">
        <div className="container">
          <div className="split-heading"><div><SectionLabel>IDEAS & INSIGHTS</SectionLabel><h2>A fresh perspective on digital growth.</h2></div><a href="/blog" className="text-link">All insights <Icon name="arrow" /></a></div>
          <PostGrid posts={data.posts.slice(0, 3)} />
        </div>
      </section>
      <FAQ sections={data.sections} />
      <Social settings={data.settings} consent={consent} onPreferences={onPreferences} />
      <section id="contact" className="contact-section" aria-labelledby="contact-heading">
        <div className="contact-shade" aria-hidden="true"/>
        <div className="contact-content">
          <span className="contact-eyebrow">READY TO GET STARTED?</span>
          <h2 id="contact-heading">Let’s Build Something Amazing Together</h2>
          <p>Whether you need a website, an AI agent, or a full digital strategy — we’re here to help.</p>
          <a className="button button-gold" href="/contact">Contact Us <Icon name="arrow"/></a>
        </div>
        <div className="contact-promises"><span><Icon name="heart"/>Free Consultation</span><span><Icon name="clock"/>Quick Response</span><span><Icon name="shield"/>No Hidden Costs</span></div>
      </section>

      <StoryDialog open={storyOpen} onClose={() => setStoryOpen(false)} />
  </div>;
}
