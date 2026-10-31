export type RecordData = Record<string, any>;
export type Field = {
  key: string;
  label: string;
  type?: string;
  required?: boolean;
  options?: string[];
  help?: string;
};
const contentFields: Field[] = [
  { key: "title", label: "Title", required: true },
  {
    key: "slug",
    label: "Page address",
    required: true,
    help: "Lowercase words separated by hyphens.",
  },
  { key: "description", label: "Summary", type: "textarea" },
  {
    key: "content",
    label: "Content",
    type: "markdown",
    help: "Use ## for section headings, blank lines between paragraphs, and - for bullet lists. HTML is treated as text.",
  },
  { key: "seoTitle", label: "Search title" },
  { key: "seoDescription", label: "Search description", type: "textarea" },
  {
    key: "status",
    label: "Publication status",
    type: "select",
    options: ["draft", "review", "scheduled", "published"],
  },
  {
    key: "publishedAt",
    label: "Publication date",
    type: "datetime-local",
    help: "Your browser’s local time. Saved in UTC. Scheduled content needs a future date.",
  },
];
export const fields: Record<string, Field[]> = {
  comments: [
    {key:"postId",label:"Article",type:"post",required:true},
    {key:"name",label:"Commenter name",required:true},
    {key:"email",label:"Private email",type:"email",required:true},
    {key:"body",label:"Comment",type:"textarea",required:true},
    {key:"followsConfirmed",label:"Visitor self-confirmed follows (not verified by platforms)",type:"checkbox"},
    {key:"status",label:"Moderation",type:"select",options:["pending","approved","rejected"]},
  ],
  team: [
    { key: "title", label: "Full name", required: true },
    {
      key: "slug",
      label: "Profile reference",
      required: true,
      help: "A unique lowercase name separated by hyphens.",
    },
    { key: "role", label: "Role", required: true },
    { key: "description", label: "Short biography", type: "textarea" },
    { key: "image", label: "Profile photo", type: "image" },
    { key: "linkedin", label: "LinkedIn profile", type: "url" },
    { key: "instagram", label: "Instagram profile", type: "url" },
    { key: "facebook", label: "Facebook profile", type: "url" },
    { key: "website", label: "Personal website", type: "url" },
    {
      key: "order",
      label: "Display order",
      type: "number",
      help: "Lower numbers appear first.",
    },
    {
      key: "status",
      label: "Visibility",
      type: "select",
      options: ["draft", "published"],
    },
  ],
  transactions: [
    { key: "title", label: "Description", required: true },
    {
      key: "type",
      label: "Entry type",
      type: "select",
      options: ["income", "expense"],
    },
    { key: "amount", label: "Amount", type: "number", required: true },
    {
      key: "currency",
      label: "Currency",
      type: "select",
      options: ["USD", "PKR", "GBP", "EUR", "AED", "CAD", "AUD"],
    },
    { key: "date", label: "Transaction date", type: "date", required: true },
    { key: "category", label: "Category" },
    { key: "reference", label: "Payment reference" },
    { key: "notes", label: "Notes", type: "textarea" },
    {
      key: "status",
      label: "Status",
      type: "select",
      options: ["recorded", "void"],
    },
  ],
  sections: [
    {
      key: "group",
      label: "Section",
      type: "select",
      options: ["faq", "industries", "process", "why"],
    },
    { key: "title", label: "Title or question", required: true },
    {
      key: "description",
      label: "Description or answer",
      type: "textarea",
      required: true,
    },
    {
      key: "icon",
      label: "Icon",
      type: "select",
      options: [
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
      ],
    },
    { key: "order", label: "Display order", type: "number" },
    {
      key: "status",
      label: "Status",
      type: "select",
      options: ["draft", "published"],
    },
  ],
  posts: [
    ...contentFields,
    { key: "category", label: "Category", required: true },
    { key: "author", label: "Author", required: true },
    { key: "keyword", label: "Primary topic" },
    { key: "image", label: "Cover image", type: "image" },
    { key: "aiGenerated", label: "AI-assisted content", type: "checkbox" },
    {
      key: "reviewed",
      label: "I have checked accuracy, sources, originality and relevance",
      type: "checkbox",
    },
    {
      key: "reviewer",
      label: "Reviewer name",
      help: "Required for publication of AI-assisted content.",
    },
    { key: "sources", label: "Editorial sources", type: "sources" },
    { key: "featured", label: "Feature this article", type: "checkbox" },
  ],
  pages: [...contentFields, { key: "eyebrow", label: "Section label" }],
  services: [
    {
      key: "order",
      label: "Display order",
      type: "number",
      help: "Lower numbers appear first.",
    },
    ...contentFields,
    { key: "short", label: "Short card summary" },
    {
      key: "icon",
      label: "Service icon",
      type: "select",
      options: ["robot", "code", "wordpress", "search", "megaphone", "pen"],
    },
    { key: "points", label: "Highlights", type: "lines" },
    { key: "deliverables", label: "Deliverables", type: "lines" },
    { key: "timeline", label: "Delivery approach" },
    { key: "bestFor", label: "Who this is for", type: "lines" },
    { key: "preparation", label: "What to prepare", type: "lines" },
    { key: "process", label: "Delivery steps", type: "pairs" },
    { key: "faqs", label: "Service questions", type: "pairs" },
  ],
  portfolio: [
    {
      key: "order",
      label: "Display order",
      type: "number",
      help: "Lower numbers appear first.",
    },
    ...contentFields,
    { key: "category", label: "Category" },
    { key: "image", label: "Project image", type: "image" },
    { key: "imageAlt", label: "Image description", required: true },
    { key: "points", label: "Project highlights", type: "lines" },
    {
      key: "concept",
      label: "This is a design concept, not a verified client case study",
      type: "checkbox",
    },
    { key: "client", label: "Client name (with permission)" },
    { key: "url", label: "Live project URL", type: "url" },
  ],
  leads: [
    { key: "name", label: "Name", required: true },
    { key: "email", label: "Email", type: "email", required: true },
    { key: "company", label: "Company" },
    { key: "service", label: "Service interest" },
    { key: "industry", label: "Industry" },
    { key: "budget", label: "Budget range" },
    { key: "message", label: "Inquiry", type: "textarea", required: true },
    {
      key: "status",
      label: "Pipeline stage",
      type: "select",
      options: ["new", "contacted", "qualified", "proposal", "won", "lost"],
    },
    { key: "notes", label: "Internal notes", type: "textarea" },
  ],
  clients: [
    { key: "name", label: "Contact name", required: true },
    { key: "email", label: "Email", type: "email", required: true },
    { key: "company", label: "Company" },
    { key: "country", label: "Country" },
    { key: "address", label: "Billing address", type: "textarea" },
    {
      key: "status",
      label: "Status",
      type: "select",
      options: ["active", "inactive"],
    },
    { key: "notes", label: "Internal notes", type: "textarea" },
  ],
  invoices: [
    { key: "number", label: "Invoice number", required: true },
    { key: "clientId", label: "Client", type: "client", required: true },
    {
      key: "currency",
      label: "Currency",
      type: "select",
      options: ["USD", "GBP", "EUR", "PKR", "AED", "CAD", "AUD"],
    },
    {
      key: "status",
      label: "Status",
      type: "select",
      options: ["draft", "sent", "paid", "void"],
    },
    { key: "dueDate", label: "Payment due", type: "date", required: true },
    { key: "taxRate", label: "Tax rate (%)", type: "number" },
    { key: "items", label: "Invoice items", type: "items" },
    { key: "notes", label: "Payment instructions / notes", type: "textarea" },
  ],
  keywords: [
    { key: "title", label: "Search topic / keyword", required: true },
    { key: "slug", label: "Topic identifier", required: true },
    {
      key: "intent",
      label: "Search intent",
      type: "select",
      options: ["informational", "commercial", "transactional"],
    },
    { key: "market", label: "Target market" },
    {
      key: "status",
      label: "Research status",
      type: "select",
      options: ["planned", "ready", "used"],
      help: "Ready topics need at least two verified source notes to generate an article.",
    },
    { key: "notes", label: "Research brief", type: "textarea" },
    { key: "sources", label: "Verified research sources", type: "sources" },
    {
      key: "position",
      label: "Observed position",
      type: "number",
      help: "Leave blank unless measured. Search Console positions are averages.",
    },
    { key: "observedAt", label: "Observation date", type: "datetime-local" },
    {
      key: "source",
      label: "Observation source",
      type: "select",
      options: ["manual", "search-console", "ai-idea"],
    },
  ],
};
export const collectionNames: Record<string, string> = {
  team: "Our team",
  comments: "Blog comments",
  sections: "Homepage sections",
  transactions: "Funds ledger",
  posts: "Blog posts",
  pages: "Pages",
  services: "Services",
  portfolio: "Portfolio",
  leads: "Leads",
  clients: "Clients",
  invoices: "Invoices",
  keywords: "Keyword research",
};
export const emptyRecord = (kind: string): RecordData => ({
  order: 0,
  bestFor: [], preparation: [], process: [], faqs: [],
  group: "faq",
  type: "expense",
  amount: 0,
  date: new Date().toISOString().slice(0, 10),
  reference: "",
  title: "",
  slug: "",
  description: "",
  content: "",
  status:
    kind === "transactions"
      ? "recorded"
      : kind === "sections"
        ? "published"
        : kind === "leads"
          ? "new"
          : kind === "clients"
            ? "active"
            : kind === "keywords"
              ? "planned"
              : "draft",
  seoTitle: "",
  seoDescription: "",
  publishedAt: "",
  category: "Insights",
  author: "Growintek Editorial",
  reviewer: "",
  reviewed: false,
  aiGenerated: false,
  featured: false,
  image:
    kind === "team"
      ? ""
      : kind === "portfolio"
        ? "/images/project-growintek.svg"
        : "/images/insight-seo.svg",
  imageAlt: "",
  role: "",
  linkedin: "",
  instagram: "",
  facebook: "",
  website: "",
  points: [],
  deliverables: [],
  icon: "code",
  short: "",
  timeline: "",
  concept: true,
  url: "",
  client: "",
  eyebrow: "Growintek",
  name: "",
  email: "",
  company: "",
  country: "",
  address: "",
  notes: "",
  message: "",
  service: "",
  budget: "",
  industry: "",
  consent: true,
  number: `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`,
  clientId: "",
  currency: "USD",
  dueDate: new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10),
  taxRate: 0,
  items: [{ description: "", quantity: 1, unitPrice: 0 }],
  intent: "informational",
  market: "International",
  sources: [],
  position: null,
  observedAt: "",
  source: "manual",
});
export function money(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
export function totals(record: RecordData) {
  const subtotal = (record.items || []).reduce(
    (sum: number, i: RecordData) =>
      sum + Math.round(Number(i.quantity) * Number(i.unitPrice) * 100),
    0,
  );
  const tax = Math.round((subtotal * Number(record.taxRate || 0)) / 100);
  return {
    subtotal: subtotal / 100,
    tax: tax / 100,
    total: (subtotal + tax) / 100,
  };
}
export const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s-]+/g, "-")
    .slice(0, 130);
