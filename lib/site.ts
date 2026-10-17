export const site = {
  name: "GrowinTek",
  legalName: "GrowinTek",
  domain: "growintek.com",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://growintek.com",
  email: "hello@growintek.com",
  bookingEmail: "hello@growintek.com",
  tagline: "Websites, AI agents and automation for businesses that answer the phone.",
  description:
    "GrowinTek designs high-converting websites and builds AI agents that answer enquiries, qualify leads and write to your CRM — shipped in weeks, not quarters.",
  location: "Remote · UK, Australia and Europe",
  hours: "Mon–Fri, 09:00–18:00 UK",
  whatsapp: "",
  calendly: "",
  social: {
    linkedin: "https://www.linkedin.com/company/growintek",
    instagram: "https://www.instagram.com/growintek",
    youtube: "https://www.youtube.com/@growintek",
    facebook: "https://www.facebook.com/growintek",
  },
  founded: "2024",
} as const;

export type NavItem = {
  href: string;
  label: string;
  children?: { href: string; label: string; description: string }[];
};

export const nav: NavItem[] = [
  {
    href: "/services",
    label: "Services",
    children: [
      {
        href: "/services/websites",
        label: "Websites",
        description: "Fast, search-ready sites built to convert.",
      },
      {
        href: "/services/ai-agents",
        label: "AI agents",
        description: "Answer enquiries and qualify leads in minutes.",
      },
      {
        href: "/services/automation",
        label: "Automation",
        description: "Connect the tools you already pay for.",
      },
      {
        href: "/services/it-support",
        label: "IT & support",
        description: "Domain, email, hosting and the unglamorous bits.",
      },
    ],
  },
  { href: "/work", label: "Work" },
  { href: "/pricing", label: "Pricing" },
  { href: "/reviews", label: "Reviews" },
  { href: "/answers", label: "Answers" },
  { href: "/journal", label: "Journal" },
];

export const footerNav = [
  {
    heading: "Services",
    links: [
      { href: "/services/websites", label: "Website development" },
      { href: "/services/ai-agents", label: "AI agents" },
      { href: "/services/automation", label: "Business automation" },
      { href: "/services/it-support", label: "IT & support" },
    ],
  },
  {
    heading: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/work", label: "Case studies" },
      { href: "/reviews", label: "Reviews" },
      { href: "/journal", label: "Journal" },
    ],
  },
  {
    heading: "Start",
    links: [
      { href: "/pricing", label: "Pricing" },
      { href: "/contact", label: "Book an intro call" },
      { href: "/start", label: "Project brief" },
      { href: "/faq", label: "FAQ" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
      { href: "/cookies", label: "Cookies" },
    ],
  },
] as const;

/** Pre-filled mailto so a visitor without a form still reaches you. */
export function mailto(subject = "Project enquiry"): string {
  return `mailto:${site.email}?subject=${encodeURIComponent(subject)}`;
}
