import sharp from "sharp";
import { randomUUID } from "node:crypto";
import { storeImage } from "./storage.js";
const escape = (s) =>
  s.replace(
    /[<>&"']/g,
    (c) =>
      ({
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        '"': "&quot;",
        "'": "&apos;",
      })[c],
  );
export async function createBlogThumbnail(title, category, db) {
  const lines = [];
  let line = "";
  for (const word of title.split(/\s+/)) {
    if ((line + " " + word).trim().length > 29 && line) {
      lines.push(line);
      line = word;
    } else line = (line + " " + word).trim();
  }
  if (line) lines.push(line);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675"><defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="#082f38"/><stop offset="1" stop-color="#326955"/></linearGradient><linearGradient id="gold"><stop stop-color="#f4e8b7"/><stop offset="1" stop-color="#cba856"/></linearGradient></defs><rect width="1200" height="675" fill="url(#bg)"/><circle cx="1120" cy="130" r="250" fill="none" stroke="#e9d28a" stroke-opacity=".2" stroke-width="55"/><circle cx="1130" cy="140" r="175" fill="none" stroke="#c8e3c4" stroke-opacity=".15" stroke-width="2"/><rect x="76" y="76" width="55" height="5" rx="2" fill="url(#gold)"/><text x="76" y="126" fill="#d8d8b7" font-size="18" font-family="sans-serif" letter-spacing="3">${escape(category.toUpperCase().slice(0, 52))}</text>${lines
    .slice(0, 4)
    .map(
      (text, i) =>
        `<text x="72" y="${245 + i * 70}" fill="#fffbed" font-family="sans-serif" font-size="54" font-weight="600">${escape(text)}</text>`,
    )
    .join(
      "",
    )}<path d="M76 554h1048" stroke="#bad1b7" stroke-opacity=".3"/><text x="76" y="605" fill="#e8d79d" font-family="sans-serif" font-size="23">GROWINTEK</text><text x="840" y="605" fill="#c1d7c8" font-family="sans-serif" font-size="16" letter-spacing="3">IDEAS &amp; INSIGHTS</text></svg>`;
  const buffer = await sharp(Buffer.from(svg)).webp({ quality: 87 }).toBuffer();
  return storeImage(`media-${randomUUID()}.webp`, buffer, db);
}
