import ts from "typescript";
import { readFileSync, writeFileSync } from "node:fs";
const code = ts.transpileModule(readFileSync("src/content.ts", "utf8"), {
  compilerOptions: { module: ts.ModuleKind.ESNext },
}).outputText;
const old = await import(
  `data:text/javascript;base64,${Buffer.from(code).toString("base64")}`
);
const slugs = [
  "ai-agents-automation",
  "web-development",
  "wordpress-woocommerce",
  "seo-digital-strategy",
  "social-media-ads",
  "ui-ux-design",
];
const settings = {
  brand: "Growintek",
  email: "",
  legalName: "Growintek",
  country: "",
  gaId: "",
  social: { facebook: "", instagram: "", youtube: "" },
  aiEnabled: false,
  aiApproval: true,
  aiHour: 9,
  aiTimezone: "Asia/Karachi",
  aiAuthor: "Growintek Editorial",
  aiTopics:
    "Practical SEO, business automation, accessible websites, conversion strategy for international businesses",
  retentionDays: 90,
};
const services = old.services.map((s, i) => ({
  ...s,
  slug: slugs[i],
  status: "published",
  seoTitle: s.title,
  seoDescription: s.description.slice(0, 155),
  content: `## Built around your business\n${s.description}\n\n## What our work includes\n${s.points.map((p) => "- " + p).join("\n")}\n\n## A clear path from idea to launch\nWe begin with your goals, audience, current tools and constraints. Together, we agree on the scope, deliverables and measures of success before production begins. You see progress through shared milestones and get the documentation you need to own the result.\n\n## Designed for the next step\nYour project should remain useful after launch. We plan for maintainability, accessibility and practical handover, and can scope ongoing support separately. Contact us for an initial conversation and a written proposal.`,
  deliverables: s.points,
  timeline:
    i === 0
      ? "Discovery, pilot, integration and handover"
      : "Discovery, design, development and launch",
}));
const portfolio = old.projects.map((p, i) => ({
  ...p,
  slug: p.title.replace(".com", ""),
  image: `/images/project-${["growintek", "daroodi", "kish", "pakexporters", "zamanalytics"][i]}.svg`,
  imageAlt: `${p.title} concept presented in a detailed website mockup`,
  status: "published",
  concept: true,
  client: "",
  url: "",
  seoTitle: p.title + " — Design concept",
  seoDescription: p.description,
  content: `## The direction\n${p.description}\n\n## The experience\n${p.points.map((p) => "- " + p).join("\n")}\n\n## About this showcase\nThis is a design concept from the Growintek visual portfolio. It demonstrates an approach to the experience; it is not a verified client case study, live-site screenshot, or claim of measured business results.\n\n## Have a similar challenge?\nTell us about your audience, current website and the outcome you want. We can scope a solution around your requirements.`,
}));
const posts = [
  {
    slug: "seo-foundations-for-service-businesses",
    title: "SEO foundations that help the right clients find you",
    category: "SEO & Growth",
    description:
      "A practical starting point for service businesses: search intent, useful pages, technical checks and meaningful measurement.",
    image: "/images/insight-seo.svg",
    keyword: "SEO for service businesses",
    content: `A service website has a specific job: help someone decide whether your business can solve their problem. Search visibility works best when it supports that decision. Before adding more articles, check whether your core pages explain what you do, who you help and how to take the next step.

## Start with the questions buyers ask
Write down the questions that appear in discovery calls. What does a project include? What affects the cost? How long can it take? What does your team need from the client? These questions are a useful starting point for research because they connect content to real purchase decisions.

A keyword is not a complete content brief. Look at the search results, the type of pages shown and the problem behind the query. A person comparing providers needs different information from someone learning a basic definition. Give each important service its own useful page instead of forcing unrelated services into a single paragraph.

## Make your service pages specific
Describe the deliverables, the working process and any constraints. Explain what a visitor can expect after contacting you. If you have permission to share a case study, document the starting point, work performed, measurement period and limitations. Avoid publishing outcome claims you cannot support.

Connect related pages with descriptive internal links. For example, a technical SEO article can link to your SEO service, while the service page can link to an explanation of an audit. The links should help a reader continue a task, not simply repeat a keyword.

## Check the technical basics
Open the site on a phone, test its forms and inspect important pages with Search Console. Confirm that public pages return useful HTML, have unique titles and can be discovered through navigation. Keep drafts and private business records out of search results.

Use a sitemap to describe the public URLs you want discovered. A sitemap is a discovery signal, not an indexing guarantee. Check canonical links, redirects and response codes after a migration so old links continue to lead somewhere useful.

## Measure inquiries as well as visits
More traffic is not automatically better traffic. Agree on what a qualified inquiry looks like and measure whether visitors reach the contact form, complete it and become relevant conversations. Compare changes across sensible time periods and account for seasonality and other marketing activity.

Search Console can show query impressions, clicks and average position. These measurements have limits: average position varies by query, country, device and date range. Treat the data as evidence to investigate, not a promise that everyone sees the same ranking.

## A manageable first month
Begin with a small audit, improve your most important service page and fix any broken conversion paths. Publish one genuinely useful supporting guide when you have something clear to explain. Review the results, collect new buyer questions and choose the next improvement from evidence.

Consistent, useful maintenance is more defensible than a high publishing volume with little original value. Search optimization should make the website better for the people you want to serve.`,
  },
  {
    slug: "where-business-automation-should-start",
    title: "Before you automate, find the work worth fixing",
    category: "AI & Automation",
    description:
      "Choose a first automation project with a clear owner, a measurable outcome and a safe path back to a person.",
    image: "/images/insight-automation.svg",
    keyword: "business automation planning",
    content: `Automation is most useful when the task is already understood. A workflow that saves a few minutes hundreds of times can be a better starting point than a complicated system that tries to handle every situation.

## Map the current process
Choose a repeated task and document its trigger, inputs, decisions and output. Ask the people who perform it where work waits, where information goes missing and which exceptions require judgment. A simple process map often exposes improvements that do not require AI at all.

Lead routing is one example. A new inquiry may need validation, a service category, an owner and a follow-up reminder. The first version can be based on explicit rules. If natural-language classification adds value later, it can be introduced at that decision point.

## Choose a meaningful measure
Define the baseline before building. You might track response time, manual handling time or the number of records that require correction. Use a measure the team can observe consistently. Do not turn a model demonstration into a claim of financial savings without validating the real workflow.

Agree on the boundaries. Which actions may run automatically? Which require approval? Which data should never be sent to an external service? These are product decisions, and they shape the architecture.

## Design the exception path
An automation should not silently lose work. Log failures, retry temporary errors with limits and give the owner a way to inspect a failed job. Repeated actions need an idempotency strategy so a retry does not create duplicate invoices, messages or records.

For AI-assisted tasks, identify where uncertain output can cause harm. A draft summary may be low risk; an irreversible action based on that summary can be very different. Keep a person in the loop where judgment or approval matters.

## Start with a small pilot
Test with representative examples, including incomplete inputs and unusual cases. Compare the new process with the current one, collect feedback and adjust the scope. A pilot should produce enough evidence to decide whether to expand, change direction or stop.

Document who owns the workflow, how credentials are rotated and what happens when a connected service is unavailable. The person maintaining the system should not need to reverse-engineer its purpose.

## Build for ongoing ownership
A useful handover includes the process diagram, integration list, failure alerts, operating instructions and acceptance criteria. Review the workflow when business rules change. A working automation is a maintained business process, not a one-time installation.`,
  },
  {
    slug: "website-brief-that-saves-rework",
    title: "A better website starts with a clearer brief",
    category: "Web & Design",
    description:
      "The decisions to make before design begins, from audience and content ownership to accessibility and launch criteria.",
    image: "/images/insight-web.svg",
    keyword: "website project brief",
    content: `A good website brief makes the important decisions visible. It does not need to prescribe every design detail. Its job is to give the team a shared understanding of the audience, the outcome and the constraints.

## Describe the audience and their task
Start with the person visiting the site. What are they trying to do? What do they already know? What might make them hesitate? A buyer evaluating a specialist agency has different needs from a returning customer looking for support.

Choose the primary action for each important page. That might be requesting a proposal, exploring a service or reading a practical guide. The page structure should support that action with relevant information.

## Make content ownership explicit
Identify who supplies service descriptions, project evidence, photography and legal information. Decide who reviews the material and what approval means. Content often determines the schedule more than the number of pages does.

Separate verified claims from ideas that still need evidence. If a portfolio item is a concept, label it clearly. If results are available, include the measurement period and enough context for the reader to assess them.

## Agree on functional requirements
List the forms, integrations and internal workflows the site must support. Explain what should happen after someone submits an inquiry. Specify which team member receives it, where it is stored and how the visitor knows the submission succeeded.

For editable content, identify which fields the team needs to control. A useful CMS provides clear publication states and sensible validation. Giving every user unrestricted access is rarely necessary.

## Define quality and launch criteria
Include mobile usability, keyboard navigation, page speed, search metadata and browser support in acceptance criteria. Test real tasks on a small screen. Verify that contact forms work and that error messages explain the next step.

If an existing site is moving, prepare a URL map. Plan redirects for useful old pages, verify canonical links and check analytics after launch. Keep access to the previous content until the migration is confirmed.

## Plan the handover
Document hosting, domain ownership, backups, content editing and integration credentials. Assign responsibility for updates and incident response. The strongest launch plan includes what happens the following week, when real visitors begin using the site.

A clear brief reduces avoidable rework because it turns assumptions into decisions. Leave room for design exploration while making the business needs and quality expectations concrete.`,
  },
].map((p, i) => ({
  ...p,
  status: "published",
  author: "Growintek Editorial",
  reviewer: "",
  aiGenerated: false,
  reviewed: false,
  sources: [],
  publishedAt: `2026-10-${[28, 24, 20][i]}T09:00:00.000Z`,
  seoTitle: p.title,
  seoDescription: p.description,
  featured: i === 0,
}));
const legal = {
  "privacy-policy": [
    "Privacy Policy",
    `## Information you choose to share\nWhen you send an inquiry, we collect your name, email, company details if provided, service interests, budget range and message. We use this information to respond, assess project fit and manage the business relationship. Please do not send passwords, payment-card details or sensitive personal information through the contact form.\n\n## Website measurement\nOptional analytics are off until you accept them. When enabled, first-party measurement records page paths, event types and dates without a persistent visitor identifier. If Google Analytics is configured and you consent, Google processes analytics data according to its policies and your settings. You may change your choice using Cookie preferences in the footer.\n\n## Service providers and transfers\nHosting and configured business tools may process information on our behalf. Access is limited to what is needed for the service. Providers may operate in other countries. The operator must assess applicable transfer requirements before activating a provider. We do not sell inquiry information.\n\n## Retention and security\nWe retain inquiries while they are needed to respond, manage a relationship or meet legal obligations. Analytics events are deleted according to the configured retention period, which defaults to 90 days. Administrative access is protected and credentials are kept on the server. No internet service can promise absolute security.\n\n## Your choices\nYou can request access, correction or deletion of your inquiry information through our Contact page. Rights and exceptions depend on applicable law. Identify the email address used in your inquiry so we can verify the request.\n\n## Contact and changes\nGrowintek is the website operator. Use the Contact page for privacy questions. This policy was prepared on 31 October 2026 and should be reviewed whenever processing practices or operator details change.`,
  ],
  terms: [
    "Terms of Use",
    `## Using this website\nThis website describes Growintek services and provides general educational information. Content does not constitute a binding offer, legal advice or a guarantee of business results. Do not misuse the website, attempt unauthorized access or interfere with its operation.\n\n## Project agreements\nScope, delivery dates, fees, payment terms, intellectual property rights and support obligations are agreed in a separate written project agreement. Sending an inquiry does not create a client relationship or reserve delivery capacity.\n\n## Intellectual property\nWebsite copy, design and original materials belong to their respective rights holders. You may share links and use the site for legitimate evaluation. Reproduction or commercial reuse beyond applicable legal exceptions requires permission.\n\n## Portfolio and performance\nConcept work is labeled as such. Outcomes depend on project scope, market conditions, client participation and third-party platforms. We do not guarantee rankings, traffic, revenue, indexing or advertising performance.\n\n## External services\nLinked platforms and optional social embeds operate under their own terms and policies. Their availability is outside our control.\n\n## Availability and liability\nWe take reasonable steps to maintain accurate content and reliable access. The website may contain errors or become unavailable. Any limitation of liability applies only to the extent permitted by applicable law and does not exclude rights that cannot lawfully be excluded.\n\n## Questions\nContact Growintek through the Contact page. Specific governing-law and dispute-resolution terms should be set in the signed project agreement. Last updated 31 October 2026.`,
  ],
  "cookie-policy": [
    "Cookie Policy",
    `## Essential storage\nThe public site stores your cookie preferences in your browser. The admin area uses an essential, HTTP-only session cookie named grow_session to keep authorized administrators signed in. That cookie expires after eight hours.\n\n## Optional analytics\nAnalytics remain disabled until you choose Accept analytics. If configured, Google Analytics may set cookies for measurement. First-party events record page paths and dates without a persistent visitor identifier. Choosing Reject optional keeps these features off.\n\n## Social content\nSocial video players and external embeds are loaded only after a separate action to enable external media. They may transmit your IP address and browser information to the provider and may use their own storage. Links to social platforms do not load embedded feeds by themselves.\n\n## Changing your choice\nOpen Cookie preferences in the footer at any time. Withdrawing consent disables future analytics collection and removes accessible Google Analytics cookies; the page reloads to stop loaded third-party scripts. Your browser also lets you delete stored information.\n\n## Contact\nUse our Contact page for questions about cookies or tracking. Last updated 31 October 2026.`,
  ],
  accessibility: [
    "Accessibility Statement",
    `## Our approach\nWe aim to make Growintek usable across devices and input methods. The site includes keyboard-accessible navigation, visible focus indicators, labeled form controls, reduced-motion support and descriptive page structure.\n\n## Ongoing improvement\nAccessibility is a continuing process. New content and third-party services can introduce issues. We review important journeys, including service discovery and contact, as the site changes.\n\n## Report a barrier\nIf you have difficulty using the site, please contact us with the page, the task you were trying to complete and any relevant assistive technology details. Avoid including sensitive information. We will use the report to investigate and improve the experience.`,
  ],
  "editorial-policy": [
    "Editorial & AI Policy",
    `## Useful, accountable content\nOur editorial goal is to answer real business questions with clear, practical information. We distinguish general guidance, design concepts and verified project evidence. We do not fabricate experience, credentials, sources or performance results.\n\n## AI assistance\nAI may help develop outlines or drafts. AI-assisted posts are identified on their article pages. The default workflow requires an editor to check accuracy, sources, relevance and originality before publication. An automation check cannot replace professional judgment.\n\n## Sources and corrections\nSources are listed where they support a technical or factual claim. Editors should verify references and remove unsupported claims. If you notice an error, contact us with the article URL and the correction you believe is needed.\n\n## Search practices\nWe use descriptive content, technical improvements and accessible design to support discovery. We do not use cloaking, link schemes, keyword stuffing, fake reviews or mass publication designed only to manipulate rankings. Search engines decide what to index and rank.`,
  ],
};
const pages = Object.entries(legal).map(([slug, [title, content]]) => ({
  slug,
  title,
  content,
  status: "published",
  description: `Growintek ${title.toLowerCase()}: how we operate and how to contact us.`,
  seoTitle: title,
  seoDescription: `Read Growintek's ${title.toLowerCase()}.`,
  eyebrow: "Clear principles. Better relationships.",
}));
writeFileSync(
  "shared/seed.json",
  JSON.stringify(
    { settings, services, portfolio, posts, pages, keywords: [] },
    null,
    2,
  ),
);
