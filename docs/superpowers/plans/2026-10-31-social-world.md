# Social World reference implementation

Use the supplied 1672 × 941 mountain artwork (optimized WebP) and the supplied full layout as the design source. Image generation is unavailable; the user explicitly supplied the required background.

- Match the blue/teal glass panels, neon cyan/mint/gold rim, white post cards, tall video cards and gold subscription bar.
- Keep two separate visible collections: social posts on the left and videos/shorts on the right. Independent platform filters and previous/next controls browse the real cached Composio items. Never invent engagement counts or verification badges.
- Map the Facebook/Instagram/YouTube artwork at its exact relative coordinates to editable site settings. Provide keyboard focus outlines and accessible names. On narrow displays present the artwork's original proportions above stacked content.
- Preserve the existing one-minute visible-page refresh, media consent and safe external links. YouTube embeds open on explicit play with consent; Meta videos link to their original platform. Empty/error states preserve valid cached items.
- Verify desktop and mobile layouts, both feeds visible, independent filters, pagination, artwork links, play/close behavior, media consent and refresh. Push together with the earlier committed CMS changes.

Palette: deep navy #00243b, glass blue #003e59, cyan #16d9f4, mint #32ffc2, gold #ffe27b, white #f9fcff. Existing Outfit/DM Sans typography.

At desktop: 22% brand / 52% heading / 26% mapped-art region in the top band; 53% posts / 47% videos below. Three cards per panel. At tablet: stacked panels. At phone: horizontal card rails with explicit arrows and touch scrolling. No auto-advancing carousel.

## Verified

- Production build and 41 backend tests pass.
- Both live panels display cached Composio data: 20 posts and 11 videos/reels; no broken social images.
- Chromium verified mapped icon clicks at 320, 390, 768, 1024, 1440 and 1672 px; platform filters; next/previous arrows; media consent; explicit YouTube playback; Escape/focus restoration; automatic sixty-second refresh.
- YouTube's provider currently reports quotaExceeded. Last successful results are retained. No new quota bypass or fabricated data was introduced.
