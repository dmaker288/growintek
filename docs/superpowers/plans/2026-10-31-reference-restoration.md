# Growintek Reference Restoration Implementation Plan

**Goal:** Restore the supplied original homepage, add a reference-matched responsive footer and branded navigation, and refine CMS-driven services and articles.

**Architecture:** Retain the existing React SSR and protected CMS. Restore original homepage markup and remove only conflicting platform overrides. Public navigation and page layouts consume existing SiteData records.

**Tech stack:** React 19, TypeScript, CSS, Express SSR, SQLite; Playwright verification.

## Constraints and visual decisions
- Preserve the hero artwork, original geometry and original section sequence from localhost:4173.
- Existing cream #faf7ed, ink #052c3b, midnight #001c29, mint #4ce0bb, gold #f3d581; Outfit display and DM Sans body type.
- Footer: full-width mountain atmosphere, mint/gold light trails, compact top CTA, four actual link columns in translucent blue glass, supplied logo.
- Header uses the supplied flat logo; favicon uses the supplied circular logo.
- No new fabricated client results or social URLs. Keep unconfigured social destinations absent.
- No available image generation tool. User-supplied exact references and existing artwork are the visual source.

## Tasks
- [ ] Restore src/pages/Home.tsx original hero, services, device section, numbers strip and compact work gallery, then append Process, Industries, Insights, FAQ, Social. Preserve CMS page heading/description, services and work data.
- [ ] Remove homepage-specific conflicting overrides from src/platform.css; leave original src/styles.css responsive geometry intact.
- [ ] Save supplied logos under public/images and favicon variants under public. Update index.html.
- [ ] Update Header({path, home, services}) and Footer({settings, services, onCookies}) in src/components/SiteChrome.tsx. Use a separate Services link and disclosure button; support Escape, outside click and mobile scrolling. Pass data.services from App/Home.
- [ ] Build responsive footer using the supplied composition, existing mountain artwork, CSS light trails, links to published services, contact and legal destinations.
- [ ] Create dedicated ServicesPages.tsx with visual index, on-page service navigation, complete CMS service detail, deliverables and related services.
- [ ] Create dedicated BlogPages.tsx with featured article, live search/category filters, article table of contents, sharing, progress and related posts. Add stable heading IDs in Markdown.
- [ ] Run npm run build and npm test. Restart built SSR preview without modifying the original dist root used by port 4173.
- [ ] Browser-check every affected route, navigation keyboard/mobile behavior, filters, article anchors, all assets, horizontal overflow at 320/390/768/1024/1440, and CMS publication on an isolated test database. Save screenshots in evidence/refinement.

## Verification expectations
The original first five section dimensions at 1440px are approximately 640, 453, 419, 161, 256 pixels. Header branding and improved work artwork may differ intentionally. No page errors, unresolved image requests or dead controls; dynamic published records appear in menu, listing and detail views.
