import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import Icon from "./Icon";
import "./dialog.css";

export type DialogContent =
  | { kind: "service"; title: string; description: string; points: string[] }
  | {
      kind: "project";
      title: string;
      category: string;
      image: string;
      description: string;
      points: string[];
    }
  | { kind: "story" }
  | { kind: "contact" }
  | { kind: "blog" };

const articles = [
  {
    title: "Start small. Automate the right things.",
    category: "AI & AUTOMATION",
    body: "The best first automation solves a repeatable problem. Look for tasks with predictable inputs: sorting inquiries, recording leads, or sending reminders. Map the current process, decide when a person should take over, and test with real examples. Measure time saved and mistakes avoided before adding complexity.",
  },
  {
    title: "A better website starts with a clearer journey.",
    category: "WEB & DESIGN",
    body: "Give every page one clear purpose. Help visitors understand what you offer, who it is for, and what to do next. Make the important information readable on a phone, keep navigation familiar, and reduce the number of steps in an inquiry or checkout. Useful content and a fast, accessible experience build trust together.",
  },
  {
    title: "Make your next campaign a learning opportunity.",
    category: "DIGITAL GROWTH",
    body: "Choose a specific audience, a clear message, and one meaningful goal before launching a campaign. Match your landing page to the promise in the ad. Change one variable at a time when testing, and allow enough data to accumulate before drawing conclusions. The aim is a repeatable understanding of what helps your customers act.",
  },
];

function BriefForm() {
  const [downloaded, setDownloaded] = useState(false);
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const text = `GROWINTEK — PROJECT BRIEF\n\nName: ${form.get("name")}\nEmail: ${form.get("email")}\nService: ${form.get("service")}\n\nAbout the project\n${form.get("message")}\n\nPrepared ${new Date().toLocaleDateString("en-GB")}\n`;
    const url = URL.createObjectURL(
      new Blob([text], { type: "text/plain;charset=utf-8" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "growintek-project-brief.txt";
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setDownloaded(true);
  };
  return (
    <form
      className="brief-form"
      onSubmit={handleSubmit}
      onChange={() => setDownloaded(false)}
    >
      <div className="brief-form-row">
        <label>
          Your name
          <input
            name="name"
            autoComplete="name"
            placeholder="Alex Morgan"
            required
            maxLength={100}
          />
        </label>
        <label>
          Email address
          <input
            name="email"
            type="email"
            autoComplete="email"
            placeholder="alex@company.com"
            required
            maxLength={200}
          />
        </label>
      </div>
      <label>
        What can we help with?
        <select name="service" defaultValue="" required>
          <option value="" disabled>
            Select a service
          </option>
          <option>AI Agents & Automation</option>
          <option>Web Development</option>
          <option>WordPress & WooCommerce</option>
          <option>SEO & Digital Strategy</option>
          <option>Social Media & Ads</option>
          <option>UI/UX Design</option>
          <option>Let’s figure it out together</option>
        </select>
      </label>
      <label>
        Tell us about your project
        <textarea
          name="message"
          placeholder="What are you looking to build or improve? Share your goals, timeline, and anything else we should know."
          rows={4}
          required
          maxLength={5000}
        />
      </label>
      <div className="brief-form-footer">
        <p>Your brief is saved on your device, ready for you to share.</p>
        <button className="button button-gold" type="submit">
          Download project brief <Icon name="arrow" />
        </button>
      </div>
      {downloaded ? (
        <div className="brief-success" role="status">
          <Icon name="check" />
          <span>
            Your project brief has been downloaded. It’s ready to share with the
            team.
          </span>
        </div>
      ) : null}
    </form>
  );
}

export default function DetailDialog({
  content,
  onClose,
}: {
  content: DialogContent | null;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [contactMode, setContactMode] = useState(false);

  useEffect(() => {
    setContactMode(false);
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (content && !dialog.open) dialog.showModal();
    if (!content && dialog.open) dialog.close();
  }, [content]);

  useEffect(() => {
    if (!content) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [content]);

  const isContact = content?.kind === "contact" || contactMode;
  const goToContact = () => {
    setContactMode(true);
    window.requestAnimationFrame(() => {
      dialogRef.current?.querySelector("input")?.focus();
      dialogRef.current?.scrollTo({ top: 0 });
    });
  };

  return (
    <dialog
      className="detail-dialog"
      ref={dialogRef}
      aria-labelledby="dialog-heading"
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          const rect = event.currentTarget.getBoundingClientRect();
          if (
            event.clientX < rect.left ||
            event.clientX > rect.right ||
            event.clientY < rect.top ||
            event.clientY > rect.bottom
          )
            onClose();
        }
      }}
    >
      <button
        type="button"
        className="dialog-close"
        aria-label="Close dialog"
        onClick={onClose}
      >
        <Icon name="close" />
      </button>
      {content ? (
        <div className="dialog-body">
          {isContact ? (
            <>
              <span className="dialog-eyebrow">LET’S MAKE IT HAPPEN</span>
              <h2 id="dialog-heading">
                Big ideas start
                <br />
                with a conversation.
              </h2>
              <p className="dialog-intro">
                Tell us what you have in mind. Save your brief and share it with
                our team.
              </p>
              <BriefForm />
            </>
          ) : content.kind === "service" ? (
            <>
              <span className="dialog-eyebrow">BUILT AROUND YOUR BUSINESS</span>
              <h2 id="dialog-heading">{content.title}</h2>
              <p className="dialog-intro">{content.description}</p>
              <ul className="dialog-points">
                {content.points.map((point) => (
                  <li key={point}>
                    <Icon name="check" />
                    {point}
                  </li>
                ))}
              </ul>
              <div className="dialog-next">
                <p>
                  Have something in mind?
                  <br />
                  <strong>Let’s bring it to life.</strong>
                </p>
                <button className="button button-gold" onClick={goToContact}>
                  Start a Project <Icon name="arrow" />
                </button>
              </div>
            </>
          ) : content.kind === "project" ? (
            <>
              <span className="dialog-eyebrow">{content.category}</span>
              <h2 id="dialog-heading">{content.title}</h2>
              <img
                className="dialog-project-image"
                src={content.image}
                alt={`${content.title} project preview`}
              />
              <p className="dialog-intro">{content.description}</p>
              <ul className="dialog-points">
                {content.points.map((point) => (
                  <li key={point}>
                    <Icon name="check" />
                    {point}
                  </li>
                ))}
              </ul>
              <button className="button button-gold" onClick={goToContact}>
                Build Something Like This <Icon name="arrow" />
              </button>
            </>
          ) : content.kind === "story" ? (
            <>
              <span className="dialog-eyebrow">THE GROWINTEK STORY</span>
              <h2 id="dialog-heading">Ideas to impact.</h2>
              <div
                className="story-visual"
                role="img"
                aria-label="Growintek digital experiences on connected devices"
              />
              <p className="dialog-intro">
                We bring creativity, technology and strategy together to help
                businesses build smarter and grow faster. From an ambitious
                first idea to a useful digital experience, we believe great work
                starts with understanding your vision.
              </p>
              <div className="story-steps">
                {[
                  {
                    title: "Discover",
                    text: "We listen, ask questions, and map out what success means for you.",
                  },
                  {
                    title: "Design",
                    text: "We turn that understanding into clear, thoughtful experiences.",
                  },
                  {
                    title: "Build",
                    text: "We bring the details together with technology that fits your goals.",
                  },
                  {
                    title: "Grow",
                    text: "We help you launch, learn, and make your next move.",
                  },
                ].map((step, i) => (
                  <div key={step.title}>
                    <span>0{i + 1}</span>
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                  </div>
                ))}
              </div>
              <button className="button button-gold" onClick={goToContact}>
                Let’s Work Together <Icon name="arrow" />
              </button>
            </>
          ) : content.kind === "blog" ? (
            <>
              <span className="dialog-eyebrow">
                IDEAS FOR YOUR NEXT CHAPTER
              </span>
              <h2 id="dialog-heading">
                A little insight.
                <br />A smarter next step.
              </h2>
              <p className="dialog-intro">
                Practical thoughts on technology, design and digital growth.
              </p>
              <div className="dialog-articles">
                {articles.map((article) => (
                  <details key={article.title}>
                    <summary>
                      <span>{article.category}</span>
                      <h3>{article.title}</h3>
                      <Icon name="arrow" />
                    </summary>
                    <p>{article.body}</p>
                  </details>
                ))}
              </div>
            </>
          ) : null}
        </div>
      ) : null}
    </dialog>
  );
}
