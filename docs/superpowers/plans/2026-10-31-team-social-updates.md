# Team, Social Updates and Content Expansion Implementation Plan

**Goal:** Editable team profiles, reliable social refreshes, expanded service content and moderated blog conversations.

**Architecture:** Reuse the validated documents collection and CMS editor. Keep all provider credentials and social API reads server-side. Public pages receive only published content and approved comments. Persistent preview uses Composio's SDK listener; Vercel uses its signed webhook and cron.

**Tech Stack:** React 19, Express, Prisma PostgreSQL, Sharp WebP, Composio SDK, Vite, Node 22.22.3.

## Constraints

- Preserve the hero header style, reduce its logo, and use white/gold navigation after the hero.
- User supplied people/photos and profiles are the source of truth; do not invent biographies or credentials.
- Comments require self-confirmed follows and manual CMS approval, never falsely verified platform follows.
- Social links open only on explicit visitor clicks. Public comments prohibit links and markup.
- Read public social feeds only; no social posting.
- Private env values remain uncommitted. Tests use disposable databases.

## Implementation

- [x] Fix Composio owner user ID, verify live accounts and enable YouTube activity trigger.
- [x] Add persistent-host listener, account filtering, hourly polling, retry handling and minute-by-minute page refresh.
- [x] Add team validation, CMS controls, About portrait cards and optimized image storage.
- [x] Correct Pak Exporters live URL/screenshot and unpublish Growintek portfolio entry.
- [x] Add Waqam and Aiman profiles with supplied photos and Instagram links.
- [x] Expand service records and templates with scope, deliverables, steps, FAQs and related services; add useful About/SEO content.
- [x] Refresh existing and future blog covers using the site's editable graphic artwork system and WebP storage.
- [x] Add comment submission, follow self-confirmation, anti-link validation, moderation controls and public approved-comment display.
- [x] Verify full build, backend permissions/data checks, browser responsive layouts and editorial/moderation workflow.
- [ ] Update docs, scan staged content for secrets and push the authorized existing branch.

## Design

Ink #052c3b, white #ffffff, cream #faf7ed, gold #f3d581 and teal #003e43. Outfit headings and DM Sans body. Compact gold-framed portraits avoid enlarging the low-resolution CEO image. Two-column team cards become one column on mobile. Service content uses clean editorial sections, a scope sidebar and specific delivery steps; comments use a quiet white/gold conversation panel.

## Research

Comparable agencies' public offerings checked on 31 October 2026: Digi Pandaz (https://digipandaz.com/), Hyde Media (https://hydeinternational.com/marketing-agency-pakistan.html), 8raction (https://8raction.pk/), MSK Studio (https://mskstudio.net/). Common categories: branding, creative/video, social management, paid campaigns and e-commerce. New copy is original and scoped to the user's stated team capabilities, without adopting competitors' performance claims.
