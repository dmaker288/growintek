import type { Metadata } from "next";
import PageHero from "@/components/site/PageHero";
import LeadForm from "@/components/site/LeadForm";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Book a 20-minute intro call or send a short brief. Replies within one working day.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title={
          <>
            Tell us what is
            <br />
            <em>falling through.</em>
          </>
        }
        lede="Two ways in: the form below, or email. Either lands with the person who will actually do the work."
      />

      <section className="section section--tight">
        <div className="wrap contact-grid">
          <div className="contact-form-col">
            <LeadForm />
          </div>

          <aside className="contact-side">
            <div className="contact-card">
              <p className="eyebrow">Direct</p>
              <a href={`mailto:${site.email}`} className="contact-mail">{site.email}</a>
              <p className="small muted">
                Replies within one working day, usually a few hours. If it is
                urgent, say so in the subject line.
              </p>
            </div>

            <div className="contact-card">
              <p className="eyebrow">What happens next</p>
              <ol className="next-steps">
                <li>
                  <span className="mono">01</span>
                  <p>You submit the form or email. No sales sequence follows.</p>
                </li>
                <li>
                  <span className="mono">02</span>
                  <p>A real reply within one working day, with two or three questions.</p>
                </li>
                <li>
                  <span className="mono">03</span>
                  <p>A 20-minute call. You leave with a recommendation, free.</p>
                </li>
                <li>
                  <span className="mono">04</span>
                  <p>If it fits, a written scope and fixed price within two days.</p>
                </li>
              </ol>
            </div>

            <div className="contact-card contact-card--plain">
              <p className="eyebrow">Not a fit if</p>
              <ul className="not-fit">
                <li>You need a team of ten and a procurement process</li>
                <li>You want ads managed — we do not run paid media</li>
                <li>You want a £99 site. It would not serve either of us</li>
              </ul>
              <p className="tiny muted">
                Being honest about that up front saves everyone a call.
              </p>
            </div>
          </aside>
        </div>

        <style>{`
          .contact-grid {
            display: grid;
            grid-template-columns: minmax(0, 1fr) 22rem;
            gap: var(--s-8);
            align-items: start;
          }
          .contact-side { display: grid; gap: var(--s-4); }
          .contact-card {
            display: grid;
            gap: .7rem;
            padding: var(--s-5);
            border: 1px solid var(--rule);
            border-radius: var(--radius-lg);
            background: var(--paper-raised);
          }
          .contact-card--plain { background: transparent; }
          .contact-mail {
            font-family: var(--font-display);
            font-size: var(--step-2);
            letter-spacing: -.02em;
            color: var(--cobalt);
            text-decoration: none;
          }
          .contact-mail:hover { text-decoration: underline; }
          .next-steps { display: grid; gap: .8rem; }
          .next-steps li { display: grid; grid-template-columns: 2rem 1fr; gap: .5rem; align-items: start; }
          .next-steps .mono { font-size: var(--step--2); color: var(--cobalt); padding-top: .2rem; }
          .next-steps p { font-size: var(--step--1); color: var(--ink-soft); line-height: 1.5; }
          .not-fit { display: grid; gap: .45rem; }
          .not-fit li { position: relative; padding-left: 1.2rem; font-size: var(--step--1); color: var(--ink-mute); line-height: 1.5; }
          .not-fit li::before { content: "—"; position: absolute; left: 0; color: var(--ink-faint); }

          @media (max-width: 980px) {
            .contact-grid { grid-template-columns: 1fr; gap: var(--s-6); }
          }
        `}</style>
      </section>
    </>
  );
}
