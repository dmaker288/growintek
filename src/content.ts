import type { IconName } from "./components/Icon";

export const services: {
  title: string;
  short: string;
  description: string;
  icon: IconName;
  points: string[];
}[] = [
  {
    title: "AI Agents & Automation",
    short: "Custom AI agents, chatbots, workflows & more.",
    description:
      "Make room for the work that matters. Connect your tools, simplify repetitive tasks, and give your customers helpful answers around the clock.",
    icon: "robot",
    points: [
      "AI assistants trained around your business",
      "Customer support and lead qualification chatbots",
      "Connected workflows across your existing tools",
    ],
  },
  {
    title: "Web Development",
    short: "Modern, fast & scalable web apps and websites.",
    description:
      "Your next chapter starts with a website that works beautifully. We bring thoughtful design and reliable development together, from a first landing page to a custom platform.",
    icon: "code",
    points: [
      "Responsive websites for every screen",
      "Custom web applications and integrations",
      "Performance, accessibility, and search foundations",
    ],
  },
  {
    title: "WordPress & WooCommerce",
    short: "Powerful stores and websites that sell.",
    description:
      "A website your team can manage. An online store your customers enjoy. We build flexible WordPress and WooCommerce experiences around your business.",
    icon: "wordpress",
    points: [
      "Custom WordPress websites and themes",
      "WooCommerce storefronts and checkout experiences",
      "Content migration, maintenance, and ongoing support",
    ],
  },
  {
    title: "SEO & Digital Strategy",
    short: "Rank higher. Get more traffic. Grow faster.",
    description:
      "Get found by the people who need you. We connect technical improvements, useful content, and a clear strategy to support long-term organic growth.",
    icon: "search",
    points: [
      "Technical SEO and website audits",
      "Search intent and content planning",
      "Clear reporting and practical growth recommendations",
    ],
  },
  {
    title: "Social Media & Ads",
    short: "Meta, Google, TikTok & more. Results that matter.",
    description:
      "Reach your next customer with the right message. We create focused campaigns that connect your brand, your audience, and your business goals.",
    icon: "megaphone",
    points: [
      "Social content and creative direction",
      "Paid campaigns across Meta, Google, and TikTok",
      "Campaign tracking, testing, and optimization",
    ],
  },
  {
    title: "UI/UX Design",
    short: "Beautiful, user-focused experiences.",
    description:
      "Make every interaction feel natural. We turn complex ideas into clear, useful digital experiences that help people get where they need to go.",
    icon: "pen",
    points: [
      "User journeys and experience planning",
      "Wireframes and interactive prototypes",
      "Distinctive interface design and design systems",
    ],
  },
];

export const projects = [
  {
    title: "growintek.com",
    category: "Agency Website",
    image: "/images/project-growintek.webp",
    description:
      "A digital home for ideas, technology, and growth. An immersive visual identity brings a full-service digital agency to life.",
    points: [
      "Brand-led website design",
      "Services and portfolio experience",
      "Responsive development",
    ],
  },
  {
    title: "daroodi.com",
    category: "E-commerce Platform",
    image: "/images/project-daroodi.webp",
    description:
      "A considered shopping experience that puts the products first, with a clear path from discovery to checkout.",
    points: [
      "Online storefront",
      "Product discovery and navigation",
      "Responsive shopping experience",
    ],
  },
  {
    title: "kishinternational.com",
    category: "Visa & Consultancy",
    image: "/images/project-kish.webp",
    description:
      "A clear and welcoming online presence that helps visitors explore consultancy services and take their next step.",
    points: [
      "Service-focused website",
      "Clear inquiry journeys",
      "Mobile-friendly layouts",
    ],
  },
  {
    title: "pakexporters.com",
    category: "B2B Marketplace",
    image: "/images/project-pakexporters.webp",
    description:
      "A business marketplace concept built around helping buyers discover suppliers and connect with new opportunities.",
    points: [
      "Business and product discovery",
      "Marketplace interface design",
      "Inquiry-focused user journeys",
    ],
  },
  {
    title: "zamanalytics.com",
    category: "Analytics Platform",
    image: "/images/project-zamanalytics.webp",
    description:
      "An approachable interface for a data-driven business, connecting a precise visual identity with clear product communication.",
    points: [
      "Analytics brand experience",
      "Product storytelling",
      "Responsive interface design",
    ],
  },
];

export const values: { title: string; text: string; icon: IconName }[] = [
  {
    title: "Expert Team",
    text: "Skilled & passionate professionals",
    icon: "team",
  },
  {
    title: "Custom Solutions",
    text: "Tailored to your business needs",
    icon: "settings",
  },
  {
    title: "On-Time Delivery",
    text: "Your goals, our priority",
    icon: "shield",
  },
  {
    title: "Global Support",
    text: "We’re with you, from anywhere",
    icon: "globe",
  },
];
