import { z } from "zod";
import { hasCommentLink } from "../shared/comment-policy.js";
const short = z.string().trim().max(240);
const text = z.string().trim().max(100000);
const slug = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  .max(140);
const url = z
  .string()
  .url()
  .refine((v) => {
    try {
      return new URL(v).protocol === "https:";
    } catch {
      return false;
    }
  }, "Use an HTTPS URL");
const image = z
  .string()
  .refine(
    (v) => !v || /^\/images\/[a-zA-Z0-9_.-]+\.(webp|png|jpg|jpeg|svg)$/.test(v),
    "Use an image from /images/",
  );
const state = z.enum(["draft", "review", "scheduled", "published"]);
const date = z
  .string()
  .refine((v) => !v || !Number.isNaN(Date.parse(v)), "Use a valid date");
const base = {
  title: short.min(3),
  slug,
  description: z.string().trim().max(500).default(""),
  status: state.default("draft"),
  seoTitle: short.default(""),
  seoDescription: z.string().max(200).default(""),
  content: text.default(""),
  publishedAt: date.default(""),
};
const sources = z
  .array(
    z.object({
      title: short.min(2),
      url,
      notes: z.string().min(20).max(12000),
    }),
  )
  .max(12)
  .default([]);
export const schemas = {
  comments: z.object({
    postId: z.string().uuid(),
    name: z.string().trim().min(2).max(80).refine(v => !hasCommentLink(v), "Links and markup are not allowed in names."),
    email: z.string().email().max(254),
    body: z.string().trim().min(10).max(2000).refine(v => !hasCommentLink(v), "Please remove links, web addresses and markup from your comment."),
    followsConfirmed: z.literal(true),
    status: z.enum(["pending", "approved", "rejected"]).default("pending"),
  }),
  team: z.object({
    title: short.min(2),
    slug,
    role: short.min(2),
    description: z.string().trim().max(1000).default(""),
    image: image.default(""),
    linkedin: z.union([url, z.literal("")]).default(""),
    instagram: z.union([url, z.literal("")]).default(""),
    facebook: z.union([url, z.literal("")]).default(""),
    website: z.union([url, z.literal("")]).default(""),
    order: z.number().int().min(0).max(999).default(0),
    status: z.enum(["draft", "published"]).default("draft"),
  }),
  posts: z.object({
    topicId: z.string().uuid().optional(),
    ...base,
    category: short.default("Insights"),
    author: short.default("Growintek Editorial"),
    reviewer: short.default(""),
    keyword: short.default(""),
    image: image.default("/images/about-art.webp"),
    sources,
    aiGenerated: z.boolean().default(false),
    reviewed: z.boolean().default(false),
    featured: z.boolean().default(false),
  }),
  pages: z.object({ ...base, eyebrow: short.default("Growintek") }),
  services: z.object({
    order: z.number().int().min(0).max(999).default(0),
    ...base,
    short: short.default(""),
    icon: z
      .enum(["robot", "code", "wordpress", "search", "megaphone", "pen"])
      .default("code"),
    points: z.array(short).max(12).default([]),
    deliverables: z.array(short).max(12).default([]),
    timeline: short.default("Scoped to your project"),
    bestFor: z.array(short).max(8).default([]),
    preparation: z.array(short).max(8).default([]),
    process: z.array(z.object({title: short.min(2), description: z.string().max(1000)})).max(8).default([]),
    faqs: z.array(z.object({title: short.min(2), description: z.string().max(1500)})).max(12).default([]),
  }),
  portfolio: z.object({
    order: z.number().int().min(0).max(999).default(0),
    ...base,
    category: short.default("Web design"),
    image: image.default("/images/project-growintek.svg"),
    imageAlt: short.default("Project design concept"),
    points: z.array(short).max(12).default([]),
    concept: z.boolean().default(true),
    client: short.default(""),
    url: z.union([url, z.literal("")]).default(""),
  }),
  leads: z.object({
    name: short.min(2),
    email: z.string().email().max(254),
    company: short.default(""),
    industry: short.default(""),
    service: short.default(""),
    budget: short.default(""),
    message: z.string().trim().min(20).max(10000),
    status: z
      .enum(["new", "contacted", "qualified", "proposal", "won", "lost"])
      .default("new"),
    notes: text.default(""),
    consent: z.literal(true),
    source: short.default("Contact form"),
  }),
  clients: z.object({
    name: short.min(2),
    email: z.string().email().max(254),
    company: short.default(""),
    country: short.default(""),
    address: z.string().max(1000).default(""),
    notes: text.default(""),
    status: z.enum(["active", "inactive"]).default("active"),
  }),
  invoices: z.object({
    number: short.min(1),
    clientId: z.string().uuid(),
    currency: z
      .enum(["USD", "GBP", "EUR", "PKR", "AED", "CAD", "AUD"])
      .default("USD"),
    status: z.enum(["draft", "sent", "paid", "void"]).default("draft"),
    dueDate: date.refine(Boolean, "A due date is required"),
    taxRate: z.number().min(0).max(100).default(0),
    items: z
      .array(
        z.object({
          description: short.min(1),
          quantity: z.number().positive().max(100000),
          unitPrice: z.number().min(0).max(10000000),
        }),
      )
      .min(1)
      .max(50),
    notes: z.string().max(3000).default(""),
  }),
  transactions: z.object({
    title: short.min(2),
    type: z.enum(["income", "expense"]),
    amount: z
      .number()
      .positive()
      .max(100000000)
      .refine(
        (v) => Number.isInteger(Math.round(v * 1000000) / 10000),
        "Use at most two decimal places",
      ),
    currency: z.enum(["USD", "PKR", "GBP", "EUR", "AED", "CAD", "AUD"]),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/)
      .refine((v) => !Number.isNaN(Date.parse(v))),
    category: short.default("General"),
    reference: short.default(""),
    notes: text.default(""),
    status: z.enum(["recorded", "void"]).default("recorded"),
  }),
  sections: z.object({
    title: short.min(2),
    description: z.string().max(1000).default(""),
    group: z.enum(["faq", "industries", "process", "why"]),
    icon: z
      .enum([
        "robot",
        "code",
        "wordpress",
        "search",
        "megaphone",
        "pen",
        "team",
        "shield",
        "globe",
        "heart",
        "settings",
      ])
      .default("globe"),
    order: z.number().int().min(0).max(999).default(0),
    status: z.enum(["draft", "published"]).default("published"),
  }),
  keywords: z.object({
    title: short.min(3),
    slug,
    intent: z
      .enum(["informational", "commercial", "transactional"])
      .default("informational"),
    market: short.default("International"),
    status: z.enum(["planned", "ready", "used"]).default("planned"),
    notes: text.default(""),
    sources,
    position: z.number().min(1).max(1000).nullable().default(null),
    observedAt: date.default(""),
    source: z.enum(["manual", "search-console", "ai-idea"]).default("manual"),
  }),
};
export const settingsSchema = z.object({
  brand: short.min(2),
  email: z.union([z.string().email(), z.literal("")]),
  legalName: short,
  country: short,
  gaId: z.string().regex(/^(G-[A-Z0-9]+)?$/),
  social: z.object({
    facebook: z.union([url, z.literal("")]),
    instagram: z.union([url, z.literal("")]),
    youtube: z.union([url, z.literal("")]),
    tiktok: z.union([url, z.literal("")]).default(""),
    x: z.union([url, z.literal("")]).default(""),
  }),
  aiEnabled: z.boolean(),
  aiApproval: z.boolean(),
  aiHour: z.number().int().min(0).max(23),
  aiTimezone: z.string().refine((v) => {
    try {
      Intl.DateTimeFormat("en", { timeZone: v });
      return true;
    } catch {
      return false;
    }
  }, "Use an IANA timezone"),
  aiAuthor: short.min(2),
  aiTopics: z.string().max(2000),
  retentionDays: z.number().int().min(30).max(730),
});
export function validateDocument(kind, input) {
  const doc = schemas[kind].parse(input);
  if (["posts", "pages", "services", "portfolio"].includes(kind)) {
    if (
      doc.status === "scheduled" &&
      (!doc.publishedAt || Date.parse(doc.publishedAt) <= Date.now())
    )
      throw Object.assign(
        new Error("Scheduled content needs a future publication date."),
        { status: 400 },
      );
    if (
      kind === "posts" &&
      ["scheduled", "published"].includes(doc.status) &&
      (doc.content.length < 200 ||
        (doc.aiGenerated && (!doc.reviewed || !doc.reviewer)))
    )
      throw Object.assign(
        new Error(
          "Publishing requires article content and an identified reviewer for AI-generated articles.",
        ),
        { status: 400 },
      );
    if (
      kind === "posts" &&
      ["scheduled", "published"].includes(doc.status) &&
      doc.aiGenerated &&
      new Set(doc.sources.map((s) => s.url)).size < 2
    )
      throw Object.assign(
        new Error(
          "AI-generated articles require at least two editorial sources.",
        ),
        { status: 400 },
      );
  }
  return doc;
}
export function invoiceTotals(invoice) {
  const subtotal = invoice.items.reduce(
    (sum, i) => sum + Math.round(i.quantity * i.unitPrice * 100),
    0,
  );
  const tax = Math.round((subtotal * invoice.taxRate) / 100);
  return {
    subtotal: subtotal / 100,
    tax: tax / 100,
    total: (subtotal + tax) / 100,
  };
}
