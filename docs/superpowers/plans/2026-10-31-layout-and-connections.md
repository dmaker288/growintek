# Layout and Connections Implementation Plan

**Goal:** Apply the requested visual revision, use real portfolio captures, connect Prisma and Google, and push the reviewed website to dmaker288.

**Architecture:** Retain the React/Express SSR application and existing CMS. Use Prisma Postgres for content and bounded image storage. Keep provider secrets in ignored environment files.

**Tech Stack:** React 19, TypeScript, Vite SSR, Express, Prisma 7, PostgreSQL.

- [x] Widen public containers, preserve the home header appearance, add a white/gold inner header with directional scroll visibility.
- [x] Move the mountain CTA to the last homepage section, redesign FAQ as a dense three-column answer grid and give social feeds gold-edged dimensional cards.
- [x] Expand About with capabilities and practical collaboration commitments.
- [x] Capture verified live sites and update seed plus current content records without replacing unrelated edits.
- [x] Verify provider access, migrate only the inspected empty Prisma database and import the local CMS with existing administrator.
- [x] Add database media storage and read-only Google Business Profile support; exercise these using isolated fixtures.
- [x] Build, run backend tests and browser flow checks, visually inspect desktop and mobile, and restart preview.
- [x] Prepare a private Vercel environment, document remaining provider errors and scan Git contents for credentials.
- [x] Push `growintek-platform-refresh` to `dmaker288/growintek`, preserving existing repository history.
