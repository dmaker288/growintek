export const site = {
  name: "GrowinTek",
  legalName: "GrowinTek",
  domain: "growintek.com",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://growintek.com",
  email: "hello@growintek.com",
  bookingEmail: "hello@growintek.com",
  tagline: "AI-Powered Web Engineering, Autonomous Agents & Growth Automation.",
  description:
    "GrowinTek builds high-converting Next.js websites, autonomous AI agents, technical AEO/GEO SEO, and revenue automation pipelines that drive explosive growth for global enterprises.",
  location: "United States · United Kingdom · Global Remote",
  hours: "24/7 Autonomous Operations · Mon–Fri Dedicated Engineering",
  whatsapp: "+1-800-476-9468",
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
        label: "Web Engineering",
        description: "Sub-second Next.js web applications built to convert.",
      },
      {
        href: "/services/ai-agents",
        label: "AI Agents",
        description: "24/7 conversational agents that qualify and close.",
      },
      {
        href: "/services/ai-seo",
        label: "AEO & Technical SEO",
        description: "Rank #1 in Google, ChatGPT & Perplexity AI search.",
      },
      {
        href: "/services/automation",
        label: "Revenue Automation",
        description: "Zero-touch pipelines connecting your CRM and tools.",
      },
      {
        href: "/services/growth-ads",
        label: "Paid Ads (Google & Meta)",
        description: "Hyper-targeted campaigns with high conversion ROI.",
      },
      {
        href: "/services/it-support",
        label: "Cloud & IT Infrastructure",
        description: "Domain, cloud edge, security audits and uptime SLA.",
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
      { href: "/services/websites", label: "Web Engineering" },
      { href: "/services/ai-agents", label: "AI Autonomous Agents" },
      { href: "/services/ai-seo", label: "AEO & Technical SEO" },
      { href: "/services/automation", label: "Revenue Automation" },
      { href: "/services/growth-ads", label: "Google & Meta Ads" },
      { href: "/services/it-support", label: "Cloud & IT Care" },
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
