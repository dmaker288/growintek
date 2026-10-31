import sharp from "sharp";
import { randomUUID } from "node:crypto";
import { storeImage } from "./storage.js";
const escape = (s) =>
  String(s).replace(
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
export async function blogThumbnailBuffer(title, category) {
  const topic = `${title} ${category}`;
  const subject = /automat|workflow|\bAI\b/i.test(topic)
    ? "automation"
    : /brief|website|design|\bweb\b/i.test(topic)
      ? "web"
      : "search";
  const palettes = {
    search: ["#073b3f", "#082932", "#e7cf84"],
    automation: ["#103b45", "#011f34", "#73d2bd"],
    web: ["#314538", "#162f2d", "#f5d894"],
  };
  const [light, dark, accent] = palettes[subject];
  const lines = [];
  let line = "";
  for (const word of title.split(/\s+/)) {
    if ((line + " " + word).trim().length > 24 && line) {
      lines.push(line);
      line = word;
    } else line = (line + " " + word).trim();
  }
  if (line) lines.push(line);
  const fontSize = lines.length > 5 ? 39 : 47;
  const top = lines.length > 4 ? 196 : 225;
  const motifs = {
    search: `<g transform="translate(800 195) rotate(-7)"><rect x="-75" y="-60" width="370" height="295" rx="20" fill="#f9f8ec"/><rect x="-45" y="-30" width="310" height="40" rx="20" fill="#e4e8dd"/><circle cx="-22" cy="-10" r="8" fill="none" stroke="#416962" stroke-width="3"/><path d="m-16-4 9 9" stroke="#416962" stroke-width="3"/><path d="M6-10h145" stroke="#92aaa0" stroke-width="6" stroke-linecap="round"/><path d="M-38 58h186M-38 76h120M-38 99h265M-38 115h216" stroke="#d0d7c8" stroke-width="8" stroke-linecap="round"/><path d="M-38 53h180" stroke="#356a5e" stroke-width="9" stroke-linecap="round"/><rect x="-20" y="177" width="38" height="35" rx="5" fill="#cbd6b9"/><rect x="36" y="151" width="38" height="61" rx="5" fill="#a0b997"/><rect x="92" y="116" width="38" height="96" rx="5" fill="#527d65"/><rect x="148" y="79" width="38" height="133" rx="5" fill="#c4a957"/></g><g transform="translate(1000 442)"><circle r="63" fill="#d6ba67"/><circle r="44" fill="#153e3c"/><path d="m-18 0 12 14 30-31" fill="none" stroke="#f4df99" stroke-width="10" stroke-linecap="round"/></g>`,
    automation: `<path d="M755 240h260v202H760V240m128 0v202" fill="none" stroke="#86cdbb" stroke-width="3" stroke-dasharray="9 8"/><g transform="translate(716 153) rotate(-6)"><rect width="144" height="130" rx="21" fill="#f7f5e8"/><rect x="22" y="24" width="100" height="60" rx="11" fill="#287264"/><circle cx="52" cy="54" r="8" fill="#b9ebd1"/><circle cx="92" cy="54" r="8" fill="#b9ebd1"/><path d="M54 102h39" stroke="#aec5b5" stroke-width="8" stroke-linecap="round"/></g><g transform="translate(954 269) rotate(8)"><rect width="142" height="130" rx="21" fill="#f4d886"/><path d="m42 63 18 19 42-44" fill="none" stroke="#234e45" stroke-width="11" stroke-linecap="round"/><path d="M35 105h72" stroke="#c9ad59" stroke-width="7" stroke-linecap="round"/></g><g transform="translate(713 379) rotate(-7)"><rect width="168" height="120" rx="20" fill="#dceee0"/><path d="M30 35h105M30 59h75M30 83h95" stroke="#639183" stroke-width="9" stroke-linecap="round"/></g>`,
    web: `<g transform="translate(730 165) rotate(-6)"><rect width="352" height="260" rx="17" fill="#fff9e9"/><path d="M0 43h352" stroke="#d9d8c2" stroke-width="2"/><circle cx="24" cy="22" r="5" fill="#d7aa69"/><circle cx="43" cy="22" r="5" fill="#9cb393"/><rect x="23" y="66" width="156" height="137" rx="7" fill="#224b40"/><path d="M43 94h90M43 115h109M43 136h65" stroke="#d3d9b4" stroke-width="6" stroke-linecap="round"/><rect x="43" y="161" width="70" height="19" rx="9" fill="#e7c477"/><rect x="196" y="66" width="134" height="78" rx="7" fill="#b9c7a4"/><rect x="196" y="158" width="134" height="45" rx="7" fill="#e4cc8d"/><path d="M26 227h105M157 227h73M252 227h73" stroke="#d5d7c0" stroke-width="8" stroke-linecap="round"/></g><g transform="translate(951 333) rotate(9)"><rect width="131" height="192" rx="21" fill="#072f30" stroke="#a6bd9e" stroke-width="3"/><rect x="10" y="24" width="111" height="151" rx="9" fill="#f4f1dc"/><rect x="20" y="35" width="91" height="73" rx="5" fill="#6f9478"/><path d="M22 123h85M22 139h60" stroke="#b2bda1" stroke-width="7" stroke-linecap="round"/><rect x="22" y="155" width="67" height="10" rx="5" fill="#c9a64d"/></g>`,
  };
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="675"><defs><linearGradient id="bg" x2="1" y2="1"><stop stop-color="${light}"/><stop offset="1" stop-color="${dark}"/></linearGradient><radialGradient id="glow"><stop stop-color="${accent}" stop-opacity=".2"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></radialGradient><filter id="shadow" x="-50%" y="-50%" width="220%" height="220%"><feDropShadow dx="0" dy="24" stdDeviation="17" flood-color="#00191b" flood-opacity=".4"/></filter></defs><rect width="1200" height="675" fill="url(#bg)"/><circle cx="954" cy="299" r="310" fill="url(#glow)"/><circle cx="930" cy="321" r="238" stroke="${accent}" stroke-opacity=".13" fill="none"/><circle cx="930" cy="321" r="280" stroke="${accent}" stroke-opacity=".07" fill="none"/><rect x="66" y="64" width="5" height="35" rx="2" fill="${accent}"/><text x="91" y="87" fill="${accent}" font-size="19" font-family="DejaVu Sans,sans-serif" letter-spacing="2">${escape(category.toUpperCase().slice(0, 38))}</text>${lines
    .slice(0, 6)
    .map(
      (line, i) =>
        `<text x="66" y="${top + i * (fontSize + 10)}" fill="#fff9e7" font-size="${fontSize}" font-weight="700" font-family="DejaVu Sans,sans-serif">${escape(line)}</text>`,
    )
    .join(
      "",
    )}<g filter="url(#shadow)">${motifs[subject]}</g><path d="M66 565h1068" stroke="#e2dab2" stroke-opacity=".2"/><text x="66" y="615" fill="#f3d581" font-size="23" font-family="DejaVu Sans,sans-serif" font-weight="700">GROWINTEK</text><text x="856" y="615" fill="#b9cfc3" font-size="15" font-family="DejaVu Sans,sans-serif" letter-spacing="2">PRACTICAL INSIGHTS</text></svg>`;
  return sharp(Buffer.from(svg)).webp({ quality: 88 }).toBuffer();
}
export async function createBlogThumbnail(title, category, db) {
  const buffer = await blogThumbnailBuffer(title, category);
  return storeImage(`media-${randomUUID()}.webp`, buffer, db);
}
