export default function SocialIcon({ name }: { name: string }) {
  const paths: Record<string, string> = {
    linkedin:
      "M5 8H1v15h4V8ZM3 1a2.3 2.3 0 1 0 0 4.6A2.3 2.3 0 0 0 3 1Zm7 7H6.5v15H10v-8c0-2.1.4-4 3-4 2.5 0 2.5 2.3 2.5 4.1V23H19V14c0-4.4-1-6.5-5-6.5-1.9 0-3.2 1-4 2.1V8Z",
    facebook:
      "M14 23V13h3.4l.5-4H14V6.5c0-1.2.4-2 2.1-2h2.2V.9A29 29 0 0 0 15.1.7C11.9.7 10 2.6 10 6.1V9H6.5v4H10v10h4Z",
    youtube:
      "M23 7s-.2-1.7-1-2.5c-1-1-2-1-2.5-1.1C16 3.1 12 3.1 12 3.1s-4 0-7.5.3C4 3.5 3 3.5 2 4.5 1.2 5.3 1 7 1 7S.7 9 .7 11v2c0 2 .3 4 .3 4s.2 1.7 1 2.5c1 1 2.3 1 3 1.1 2.3.2 7 .3 7 .3s4 0 7.5-.3c.5-.1 1.5-.1 2.5-1.1.8-.8 1-2.5 1-2.5s.3-2 .3-4v-2c0-2-.3-4-.3-4ZM10 15.5v-7l6 3.5-6 3.5Z",
    x: "M18.9 2H22l-7 8 8.2 12H17l-4.8-7-6.1 7H3l7.8-9L3 2h6.4l4.3 6.4L18.9 2ZM17.9 20h1.8L8.4 3.9H6.5L17.9 20Z",
    tiktok:
      "M14 1h4c.2 3 1.7 4.8 5 5v4a12 12 0 0 1-5-1.4v8a7 7 0 1 1-6-7v4a3 3 0 1 0 2 3V1Z",
  };
  return (
    <svg
      className="social-logo"
      viewBox="0 0 24 24"
      width="20"
      height="20"
      aria-hidden="true"
      fill="currentColor"
    >
      {name === "instagram" ? (
        <>
          <rect
            x="3"
            y="3"
            width="18"
            height="18"
            rx="5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
          <circle
            cx="12"
            cy="12"
            r="4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          />
          <circle cx="17.5" cy="6.5" r="1.2" />
        </>
      ) : paths[name] ? (
        <path d={paths[name]} />
      ) : (
        <>
          <circle
            cx="12"
            cy="12"
            r="9"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M3 12h18M12 3c-6 5-6 13 0 18 6-5 6-13 0-18"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
          />
        </>
      )}
    </svg>
  );
}
