import type { Content } from "../types";
import Icon from "./Icon";
export default function ServiceSections({
  service,
  services,
}: {
  service: Content;
  services: Content[];
}) {
  const related = services.filter((s) => s.id !== service.id).slice(0, 3);
  return (
    <>
      <section className="service-fit section-space">
        <div className="container service-fit-grid">
          <div>
            <span className="section-label">A CLEAR FIT</span>
            <h2>
              Built around
              <br />
              what you need next.
            </h2>
            <ul>
              {(service.bestFor || []).map((item) => (
                <li key={item}>
                  <Icon name="check" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="service-preparation">
            <span className="section-label">BEFORE WE BEGIN</span>
            <h3>
              A little preparation.
              <br />A stronger starting point.
            </h3>
            <ul>
              {(service.preparation || []).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <p>We’ll help you work through anything you don’t have yet.</p>
          </div>
        </div>
      </section>
      {service.process?.length ? (
        <section className="section-space service-delivery">
          <div className="container">
            <span className="section-label">FROM BRIEF TO HANDOVER</span>
            <h2>A clear route through the work.</h2>
            <div className="service-steps">
              {service.process.map((step, i) => (
                <article key={step.title}>
                  <span>{String(i + 1).padStart(2, "0")}</span>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}
      {service.faqs?.length ? (
        <section className="section-space service-questions">
          <div className="container">
            <div>
              <span className="section-label">A FEW USEFUL ANSWERS</span>
              <h2>Before you get started.</h2>
            </div>
            <div>
              {service.faqs.map((item) => (
                <details key={item.title}>
                  <summary>
                    {item.title}
                    <span>+</span>
                  </summary>
                  <p>{item.description}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      ) : null}
      <section className="section-space service-related">
        <div className="container">
          <span className="section-label">CONNECT THE NEXT PIECE</span>
          <h2>Work that fits together.</h2>
          <div>
            {related.map((s) => (
              <a href={`/services/${s.slug}`} key={s.id}>
                <Icon name={s.icon || "code"} />
                <h3>{s.title}</h3>
                <p>{s.short}</p>
                <span>
                  Explore service <Icon name="arrow" />
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
