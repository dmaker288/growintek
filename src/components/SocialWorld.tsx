import { useEffect, useRef, useState } from "react";
import Icon from "./Icon";
import SocialIcon from "./SocialIcon";
import type { PublicSettings } from "../types";
import type { Consent } from "./SiteChrome";
import "./social-world.css";

type Channel = "facebook" | "instagram" | "youtube";
type Filter = Channel | "all";
type SocialPost = {
  id: string;
  text: string;
  url: string;
  image?: string;
  date?: string;
  kind?: "post" | "reel" | "video";
  embedId?: string;
};
type Item = SocialPost & { channel: Channel };
type Feed = { status: string; posts: SocialPost[]; updatedAt?: string };
const channels: Channel[] = ["facebook", "instagram", "youtube"];
const names = {
  facebook: "Facebook",
  instagram: "Instagram",
  youtube: "YouTube",
};
const time = (date?: string) =>
  date && Number.isFinite(Date.parse(date))
    ? new Date(date).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        timeZone: "UTC",
      })
    : "From our channel";
const headline = (text: string) =>
  text.split("\n").find((line) => line.trim()) || "From Growintek";
function PanelIcon({ video = false }: { video?: boolean }) {
  return (
    <svg
      viewBox="0 0 40 40"
      width="40"
      height="40"
      aria-hidden="true"
      fill="none"
    >
      {video ? (
        <>
          <rect
            x="2"
            y="2"
            width="36"
            height="36"
            rx="12"
            fill="currentColor"
          />
          <path d="m16 11 13 9-13 9Z" fill="#003246" />
        </>
      ) : (
        <>
          <rect
            x="3"
            y="3"
            width="34"
            height="34"
            rx="5"
            stroke="currentColor"
            strokeWidth="3"
          />
          <circle cx="12" cy="12" r="3" fill="currentColor" />
          <path d="m6 30 9-12 7 8 5-6 7 10Z" fill="currentColor" />
        </>
      )}
    </svg>
  );
}
function ArtworkLinks({ settings }: { settings: PublicSettings }) {
  return (
    <div className="sw-artwork">
      <img
        src="/images/social-world-background.webp"
        alt=""
        width="1672"
        height="941"
        loading="lazy"
      />
      <nav className="sw-art-links" aria-label="Social profiles in artwork">
        {channels.map((channel) =>
          settings.social[channel] ? (
            <a
              key={channel}
              className={`sw-art-link sw-art-${channel}`}
              href={settings.social[channel]}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Follow Growintek on ${names[channel]} (opens in a new tab)`}
            />
          ) : null,
        )}
      </nav>
    </div>
  );
}
function Preview({
  item,
  media,
  video,
  onPreferences,
  onPlay,
}: {
  item: Item;
  media: boolean;
  video: boolean;
  onPreferences: () => void;
  onPlay: (item: Item) => void;
}) {
  const [failed, setFailed] = useState(false);
  const canEmbed =
    video && media && item.channel === "youtube" && Boolean(item.embedId);
  return (
    <div
      className={`sw-preview sw-preview-${item.channel} ${video ? "sw-preview-video" : ""}`}
    >
      {media && item.image && !failed ? (
        <img
          src={item.image}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="sw-preview-fallback">
          <SocialIcon name={item.channel} />
          <strong>{headline(item.text).slice(0, 90)}</strong>
          <span>GROWINTEK SOLUTIONS</span>
        </div>
      )}
      <span
        className={`sw-platform-mark sw-platform-${item.channel}`}
        title={names[item.channel]}
      >
        <SocialIcon name={item.channel} />
      </span>
      {video &&
        (canEmbed ? (
          <button
            className="sw-play"
            aria-label={`Play ${headline(item.text)}`}
            onClick={() => onPlay(item)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m8 4 13 8-13 8Z" fill="currentColor" />
            </svg>
          </button>
        ) : (
          <a
            className="sw-play"
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Watch ${headline(item.text)} on ${names[item.channel]}`}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m8 4 13 8-13 8Z" fill="currentColor" />
            </svg>
          </a>
        ))}
      {!media && (
        <button className="sw-enable-media" onClick={onPreferences}>
          Enable media previews <span>↗</span>
        </button>
      )}
      {video && (
        <div className="sw-video-caption">
          <span>
            {item.kind === "reel" ? "REEL" : "VIDEO"} · {names[item.channel]}
          </span>
          <h4>
            <a href={item.url} target="_blank" rel="noopener noreferrer">
              {headline(item.text)}
            </a>
          </h4>
          <span className="sw-video-date">
            <Icon name="play" />
            {time(item.date)}
            <Icon name="heart" />
          </span>
        </div>
      )}
    </div>
  );
}
function PostCard({
  item,
  media,
  onPreferences,
}: {
  item: Item;
  media: boolean;
  onPreferences: () => void;
}) {
  return (
    <article className={`sw-post-card sw-channel-${item.channel}`}>
      <Preview
        item={item}
        media={media}
        video={false}
        onPreferences={onPreferences}
        onPlay={() => {}}
      />
      <div className="sw-post-copy">
        <div className="sw-author">
          <img
            src="/images/growintek-round.png"
            alt=""
            width="30"
            height="30"
            loading="lazy"
          />
          <div>
            <strong>Growintek Solutions</strong>
            <span>
              {time(item.date)} · {names[item.channel]}
            </span>
          </div>
        </div>
        <p>{item.text}</p>
        <div className="sw-post-footer">
          <span className={`sw-post-network sw-platform-${item.channel}`}>
            <SocialIcon name={item.channel} />
          </span>
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`See post on ${names[item.channel]}`}
          >
            See Post <Icon name="arrow" />
          </a>
        </div>
      </div>
    </article>
  );
}
function VideoDialog({
  item,
  onClose,
}: {
  item: Item | null;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || !item) return;
    const previous = document.activeElement as HTMLElement;
    const overflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      previous?.focus();
    };
  }, [item]);
  return (
    <dialog
      ref={ref}
      className="sw-video-dialog"
      aria-labelledby="sw-video-title"
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          const r = e.currentTarget.getBoundingClientRect();
          if (
            e.clientX < r.left ||
            e.clientX > r.right ||
            e.clientY < r.top ||
            e.clientY > r.bottom
          )
            onClose();
        }
      }}
    >
      <div className="sw-dialog-heading">
        <h3 id="sw-video-title">
          {item ? headline(item.text) : "Watch Growintek"}
        </h3>
        <button aria-label="Close video" onClick={onClose}>
          <Icon name="close" />
        </button>
      </div>
      {item?.embedId && (
        <iframe
          title={headline(item.text)}
          src={`https://www.youtube-nocookie.com/embed/${item.embedId}?autoplay=1`}
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      )}
      {item && (
        <a href={item.url} target="_blank" rel="noopener noreferrer">
          Watch on YouTube <Icon name="arrow" />
        </a>
      )}
    </dialog>
  );
}
function FeedPanel({
  video,
  items,
  loaded,
  filter,
  setFilter,
  media,
  onPreferences,
  onPlay,
  settings,
}: {
  video: boolean;
  items: Item[];
  loaded: boolean;
  filter: Filter;
  setFilter: (f: Filter) => void;
  media: boolean;
  onPreferences: () => void;
  onPlay: (item: Item) => void;
  settings: PublicSettings;
}) {
  const rail = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ start: true, end: false });
  const shown = items.filter(
    (item) => filter === "all" || item.channel === filter,
  );
  function updatePosition() {
    const r = rail.current;
    if (r)
      setPosition({
        start: r.scrollLeft < 8,
        end: r.scrollLeft + r.clientWidth >= r.scrollWidth - 8,
      });
  }
  useEffect(() => {
    const r = rail.current;
    if (!r) return;
    r.scrollLeft = 0;
    updatePosition();
    const observer = new ResizeObserver(updatePosition);
    observer.observe(r);
    return () => observer.disconnect();
  }, [filter, items.length]);
  function move(direction: number) {
    const r = rail.current;
    if (!r) return;
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    r.scrollBy({
      left: direction * r.clientWidth,
      behavior: reduced ? "instant" : "smooth",
    });
  }
  const profile =
    settings.social[
      filter === "all" ? (video ? "youtube" : "instagram") : filter
    ];
  const id = video ? "social-videos" : "social-posts";
  return (
    <section
      className={`sw-panel ${video ? "sw-videos" : "sw-posts"}`}
      aria-labelledby={`${id}-heading`}
    >
      <div className="sw-panel-top">
        <div className="sw-panel-title">
          <PanelIcon video={video} />
          <div>
            <h3 id={`${id}-heading`}>
              {video ? "Our Videos & Shorts" : "Our Social Posts"}
            </h3>
            <p>
              {video
                ? "Watch our latest videos and reels"
                : "Explore our latest updates across platforms"}
            </p>
          </div>
        </div>
        <div
          className="sw-filters"
          role="group"
          aria-label={
            video ? "Filter videos by platform" : "Filter posts by platform"
          }
        >
          {(["all", ...channels] as Filter[]).map((channel) => (
            <button
              key={channel}
              className={`${filter === channel ? "is-active" : ""} sw-filter-${channel}`}
              aria-pressed={filter === channel}
              onClick={() => setFilter(channel)}
            >
              {channel !== "all" && <SocialIcon name={channel} />}
              <span>{channel === "all" ? "All" : names[channel]}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="sw-carousel">
        {shown.length ? (
          <>
            <div
              className="sw-card-rail"
              ref={rail}
              onScroll={updatePosition}
              tabIndex={0}
              aria-label={video ? "Video cards" : "Post cards"}
            >
              {shown.map((item) =>
                video ? (
                  <article
                    key={`${item.channel}-${item.id}`}
                    className={`sw-video-card sw-channel-${item.channel}`}
                  >
                    <Preview
                      item={item}
                      media={media}
                      video
                      onPreferences={onPreferences}
                      onPlay={onPlay}
                    />
                  </article>
                ) : (
                  <PostCard
                    key={`${item.channel}-${item.id}`}
                    item={item}
                    media={media}
                    onPreferences={onPreferences}
                  />
                ),
              )}
            </div>
            <button
              className="sw-carousel-arrow sw-prev"
              aria-label={video ? "Previous videos" : "Previous posts"}
              disabled={position.start}
              onClick={() => move(-1)}
            >
              <Icon name="arrow" />
            </button>
            <button
              className="sw-carousel-arrow sw-next"
              aria-label={video ? "Next videos" : "Next posts"}
              disabled={position.end}
              onClick={() => move(1)}
            >
              <Icon name="arrow" />
            </button>
          </>
        ) : (
          <div className="sw-empty" role="status">
            <PanelIcon video={video} />
            <h4>
              {!loaded
                ? "Loading our latest updates…"
                : video
                  ? "More videos are on the way."
                  : "More posts to discover."}
            </h4>
            <p>
              {!loaded
                ? "Bringing our channels together."
                : filter === "youtube" && !video
                  ? "YouTube videos are in the Videos & Shorts panel."
                  : "Visit our social profiles for more from Growintek."}
            </p>
            {filter === "youtube" && !video && (
              <a href="#social-videos-heading">
                Explore videos <Icon name="arrow" />
              </a>
            )}
          </div>
        )}
      </div>
      <div className="sw-panel-bottom">
        {profile && (
          <a
            className="sw-glow-button"
            href={profile}
            target="_blank"
            rel="noopener noreferrer"
          >
            <SocialIcon
              name={
                filter === "all" ? (video ? "youtube" : "instagram") : filter
              }
            />
            {video ? "Watch All Videos" : "View More Posts"}
            <Icon name="arrow" />
          </a>
        )}
      </div>
    </section>
  );
}
export default function SocialWorld({
  settings,
  consent,
  onPreferences,
}: {
  settings: PublicSettings;
  consent: Consent | null;
  onPreferences: () => void;
}) {
  const [feeds, setFeeds] = useState<Partial<Record<Channel, Feed>>>({});
  const [loaded, setLoaded] = useState(false);
  const [postFilter, setPostFilter] = useState<Filter>("all"),
    [videoFilter, setVideoFilter] = useState<Filter>("all");
  const [playing, setPlaying] = useState<Item | null>(null);
  useEffect(() => {
    if (!consent?.media) setPlaying(null);
  }, [consent?.media]);
  useEffect(() => {
    const abort = new AbortController();
    let pending = false;
    const refresh = async () => {
      if (pending || document.hidden || abort.signal.aborted) return;
      pending = true;
      try {
        const response = await fetch("/api/social", {
          signal: abort.signal,
          cache: "no-store",
        });
        if (response.ok) setFeeds(await response.json());
      } catch {
        /* Keep the last saved feed during an interruption. */
      } finally {
        pending = false;
        if (!abort.signal.aborted) setLoaded(true);
      }
    };
    void refresh();
    const timer = window.setInterval(refresh, 60000);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      abort.abort();
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);
  const all = channels
    .flatMap((channel) =>
      (feeds[channel]?.posts || []).map((item) => ({ ...item, channel })),
    )
    .sort(
      (a, b) =>
        (Date.parse(b.date || "") || 0) - (Date.parse(a.date || "") || 0),
    );
  const posts = all.filter((item) => !item.kind || item.kind === "post");
  const videos = all.filter(
    (item) => item.kind === "video" || item.kind === "reel",
  );
  const common = {
    loaded,
    media: Boolean(consent?.media),
    onPreferences,
    onPlay: setPlaying,
    settings,
  };
  return (
    <section
      className="social-world"
      id="social"
      aria-labelledby="social-world-heading"
    >
      <ArtworkLinks settings={settings} />
      <div className="sw-content">
        <header className="sw-heading">
          <a className="sw-brand" href="/" aria-label="Growintek home">
            <img
              src="/images/growintek-flat.png"
              alt="Growintek Solutions"
              width="240"
              height="120"
              loading="lazy"
            />
          </a>
          <div className="sw-heading-copy">
            <h2 id="social-world-heading">
              Follow Our <span>Social World</span>
            </h2>
            <p>
              Stay connected for the latest updates, insights and exclusive
              content.
            </p>
            <div className="sw-spark" aria-hidden="true">
              <span />✦<span />
            </div>
          </div>
        </header>
        <div className="sw-panels">
          <FeedPanel
            {...common}
            video={false}
            items={posts}
            filter={postFilter}
            setFilter={setPostFilter}
          />
          <FeedPanel
            {...common}
            video
            items={videos}
            filter={videoFilter}
            setFilter={setVideoFilter}
          />
        </div>
        <div className="sw-subscribe-row">
          <span className="sw-subscribe-line" />
          <div className="sw-subscribe">
            <svg
              className="sw-bell"
              viewBox="0 0 40 40"
              aria-hidden="true"
              fill="currentColor"
            >
              <path d="M8 26V17a12 12 0 0 1 24 0v9l4 5H4l4-5Zm7 8h10a5 5 0 0 1-10 0ZM17 3a3 3 0 0 1 6 0v3h-6Z" />
              <path
                d="M3 9 0 17M37 9l3 8"
                stroke="currentColor"
                strokeWidth="2"
              />
            </svg>
            <div>
              <h3>Subscribe to our YouTube Channel</h3>
              <p>Never miss our latest tutorials & updates.</p>
            </div>
            {settings.social.youtube && (
              <a
                href={settings.social.youtube}
                target="_blank"
                rel="noopener noreferrer"
              >
                <SocialIcon name="youtube" />
                Subscribe
              </a>
            )}
          </div>
          <span className="sw-subscribe-line" />
        </div>
      </div>
      <VideoDialog item={playing} onClose={() => setPlaying(null)} />
    </section>
  );
}
