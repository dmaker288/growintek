# Growintek Reference Recreation Implementation Plan

> **For agentic workers:** Use delegated independent asset and component tasks, with integration and browser review by the primary agent.

**Goal:** Build a responsive, working website that closely matches the supplied Growintek image.

**Architecture:** Vite React app with a single landing page, reusable icons, structured content, and an accessible detail dialog. Supplied artwork is optimized into local assets; page text and controls remain real HTML.

**Tech Stack:** React 19, TypeScript, Vite, CSS, local WebP artwork.

## Global Constraints

- Preserve the supplied copy, section sequence, dark teal, mint and gold palette, and cream service cards.
- Desktop target proportions: hero 29.6%, services 20.5%, about 19%, impact 7.6%, projects 11.8%, closing call to action 11.5% of original 1024 × 1536 reference.
- Use actual DOM navigation and buttons, accessible focus states, native dialogs, and reduced-motion support.
- No invented contact destination or false submission. Contact interaction prepares a downloadable project brief.
- Match the image with its supplied artwork because image generation is unavailable; do not use a flat screenshot as the page.

## Design specification

Color tokens: midnight #001c29, deep teal #003e43, mint #4ce0bb, cream #faf7ed, gold #f3d581, ink #052c3b.
Typography: rounded geometric sans, Outfit for headings and DM Sans for body, with local fonts. Headlines use tight tracking; body uses comfortable line spacing.
Layout: full-bleed hero and about artwork alternate with warm pale sections. Main content aligns to an 84% centered container. Services use an introductory column and six cards in a 3 × 2 grid; portfolio uses an intro followed by five thumbnails.
Signature: the supplied luminous globe, floating technology cards, curved cream dividers, and teal/gold light trails.

### Task 1: Artwork and page

Files: public/images/*, src/App.tsx, src/styles.css, src/components/Icon.tsx, src/content.ts, src/main.tsx, index.html, package.json.

- [x] Extract optimized hero, devices, landscape, logo, avatars, globe and project thumbnails from the supplied artwork.
- [x] Build semantic page sections home, services, about, impact, work and contact using matching copy and proportions.
- [x] Add responsive layout with a working mobile menu and meaningful image alternatives.
- [x] Check actual desktop and mobile screenshots against the reference; correct alignment, font scale, cropping and overflow.

### Task 2: Working interactions

Files: src/components/DetailDialog.tsx, src/components/dialog.css.

- [x] Add service details, project previews, story content and short original blog articles in native dialogs.
- [x] Add a validated contact brief form which truthfully downloads user-entered requirements locally.
- [x] Verify open, close, Escape, focus restoration, form validation and downloadable output.

### Task 3: Verification and handoff

Files: README.md, evidence screenshots.

- [x] Run production build and browser checks at desktop, tablet and narrow phone widths.
- [x] Verify no console errors, missing assets or horizontal page overflow.
- [x] Keep local preview available and open it beside the chat.
