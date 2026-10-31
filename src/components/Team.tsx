import type { Content } from "../types";
import Icon from "./Icon";
import SocialIcon from "./SocialIcon";

const networks = [
  ["linkedin", "LinkedIn"],
  ["instagram", "Instagram"],
  ["facebook", "Facebook"],
  ["website", "Website"],
] as const;
export default function Team({ members }: { members: Content[] }) {
  if (!members.length) return null;
  return (
    <section
      className="team-section section-space"
      aria-labelledby="team-heading"
    >
      <div className="container">
        <div className="team-heading">
          <div>
            <span className="section-label">THE PEOPLE BEHIND THE WORK</span>
            <h2 id="team-heading">
              Different skills.
              <br />
              <span>One dedicated team.</span>
            </h2>
          </div>
          <p>
            Meet the people connecting strategy, delivery, marketing and
            technology for your business.
          </p>
        </div>
        <div className="team-grid">
          {members.map((member) => (
            <article className="team-card" key={member.id}>
              <div className="team-portrait">
                {member.image ? (
                  <img
                    src={member.image}
                    width="96"
                    height="112"
                    loading="lazy"
                    alt={member.title}
                  />
                ) : (
                  <Icon name="team" />
                )}
              </div>
              <div className="team-profile">
                <h3>{member.title}</h3>
                <p className="team-role">{member.role}</p>
                {member.description ? (
                  <p className="team-bio">{member.description}</p>
                ) : null}
                <div className="team-links">
                  {networks.map(([key, label]) =>
                    member[key] ? (
                      <a
                        key={key}
                        href={member[key]}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${member.title} on ${label} (opens in a new tab)`}
                      >
                        <SocialIcon name={key} />
                        {label}
                        <Icon name="arrow" />
                      </a>
                    ) : null,
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
        <div className="team-invitation">
          <span>Your next project starts with a conversation.</span>
          <a href="/contact">
            Let’s meet <Icon name="arrow" />
          </a>
        </div>
      </div>
    </section>
  );
}
