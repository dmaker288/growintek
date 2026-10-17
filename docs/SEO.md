# Search, answer engines and structured data

What is implemented, why, and what still needs doing by hand.

---

## What ships in the code

**Structured data** — `lib/schema.ts` exposes typed node builders. Pages render one
`@graph` document rather than several disconnected scripts, so entities reference each
other by `@id`:

- `Organization` + `ProfessionalService` (`#organization`) — name, area served,
  `knowsAbout`, `sameAs` to your social profiles, founder reference.
- `WebSite` (`#website`) — publisher link, language.
- `Person` (`#person`) — the named founder, linked from every article's `author`.
- `Service` — one per service page, with an `Offer` carrying the "from" price.
- `BlogPosting` — headline, dates, author, keywords, canonical page.
- `BreadcrumbList` — emitted by the `Breadcrumbs` component, so the visible trail and
  the markup can never disagree.
- `FAQPage` — on `/faq`, `/pricing` and `/answers`.
- `AggregateRating` + `Review` — **only** when real reviews exist in the database. No
  rating is ever emitted without visible reviews on the page; that is a manual-action
  risk, not an optimisation.

**Breadcrumbs** — a server component that renders both the visible trail and its schema
in one place. Used on services, journal posts, reviews, pricing and answers.

**Canonicals and metadata** — every page sets `alternates.canonical` from the slug.
Open Graph and Twitter cards come from the root layout with per-page overrides.

**`/answers`** — the answer-engine page. Eight self-contained questions about cost,
timelines, ownership, AI reliability and care plans. Each answer stands alone: no
"as mentioned above", so a retrieval system can lift one answer without losing meaning.

**`/llms.txt`** — generated from the database at request time. Not a ranking factor;
it is a cheap way to reduce the chance an assistant quotes the wrong price. It lists
services, published prices, key pages, the ten newest posts, and an explicit note that
this file may be stale and the page is authoritative.

**`robots.txt`** — allows crawling including GPTBot, ClaudeBot, PerplexityBot and
Google-Extended, disallows `/admin` and `/api`, and points at the sitemap.

**Language and locale** — `en-GB` set on `<html>` and in `WebSite.inLanguage`.

---

## What AEO, GEO and AIO actually mean here

Terms worth being precise about, because they are used loosely:

- **SEO** — ranking in classic search results. Mostly handled by the technical
  groundwork: crawlability, canonical URLs, speed, internal linking, schema.
- **AEO (answer engine optimisation)** — being quoted as *the answer* by something like
  Google's AI Overviews or Bing Chat. Requires self-contained answers, clear headings
  phrased as questions, and factual consistency across the site.
- **GEO (generative engine optimisation)** — being cited by LLM-based assistants. The
  practical levers are the same facts, stated plainly, on pages that load without
  JavaScript and can be parsed without guessing.
- **AIO** — an umbrella label for the above. There is no separate technique.

The honest position: none of these have a guaranteed mechanism. What reliably helps is
specific, attributable writing, consistent prices everywhere, and structured data that
matches what a human sees. What does not help is mass-producing AI pages.

---

## E-E-A-T: what is real here and what is not

Experience, Expertise, Authoritativeness, Trust. The code supports this; the writing does
the work.

Present:
- A named author with a bio and `Person` schema, linked from every article.
- Review pages that display reviews exactly as written, with no editing.
- Visible `last updated` dates on posts and on `/answers`.
- Clear pricing with "what is not included" stated explicitly.
- Contact details, working hours and area served on every legal page.
- Case studies that stay unpublished until real numbers exist.

Missing, and it cannot be generated:
- **Credentials.** If you hold a relevant qualification, say so on `/about` with the
  awarding body. If not, do not invent one.
- **A registered address.** UK businesses should show a real trading address or at
  least a service area. `localBusinessNode()` accepts street, city, postcode and phone —
  fill them in on `/about` and the layout.
- **Reviews at volume.** Five Google reviews is a start, not a moat.
- **Backlinks.** Nothing in this codebase creates them. Guest posts, directory listings,
  genuine partnerships and press mentions are the only routes.

---

## The work that is still manual

1. **Create the Google Business Profile properly.** Choose the most specific category
   (e.g. "Website designer" or "Marketing agency"), add the service area, hours, phone
   number and a real photo. Then ask your first five clients for a review with a direct
   link.
2. **Verify the site in Google Search Console** and submit `sitemap.xml`.
3. **Fill in the placeholders.** `app/icon.png` and `app/opengraph-image.png` do not
   exist yet — add a 512×512 icon and a 1200×630 social card.
4. **Publish one real case study.** Replace the seeded draft entirely. One honest case
   study with three metrics outperforms five vague ones.
5. **Write the first three journal posts yourself, or heavily edit the AI drafts.**
   The assistant in the CMS will draft them; the value is in the specifics you add —
   real numbers, real mistakes, real tooling.
6. **Add the business address and phone** to `localBusinessNode()` and to `/about`.
7. **Keep prices identical everywhere** — pricing page, `/answers`, `llms.txt`, seed
   data and proposals. Inconsistency is the fastest way to lose a citation.

---

## What to avoid

- **Fake reviews or testimonials.** Illegal under the UK Digital Markets, Competition
  and Consumers Act 2024 and the Australian Consumer Law, and trivially spotted.
- **Emitting `AggregateRating` without visible reviews.** Structured data must describe
  what is on the page.
- **Mass-generated location pages** ("web design in [town]" × 200). It works briefly and
  then does not.
- **AI-written pages with no human edit.** The tell is the absence of specifics, and
  both readers and crawlers are now good at spotting it.
- **Keyword stuffing in `llms.txt` or metadata.** These files are read by systems that
  already understand the page; there is nothing to game.
