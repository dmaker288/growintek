// Comments are plain text. Reject addresses rather than rendering clickable user content.
export function hasCommentLink(value) {
  let text = String(value).normalize("NFKC");
  for (let i = 0; i < 2; i++) {
    try {
      text = decodeURIComponent(text);
    } catch {
      break;
    }
  }
  text = text
    .replace(
      /&#(?:x([0-9a-f]{1,6})|([0-9]{1,7}));/gi,
      (match, hex, decimal) => {
        const code = parseInt(hex || decimal, hex ? 16 : 10);
        return code <= 0x10ffff ? String.fromCodePoint(code) : match;
      },
    )
    .replace(/&(?:period|colon);/gi, (match) =>
      match.toLowerCase() === "&colon;" ? ":" : ".",
    )
    .replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/g, "");
  return /(?:https?|ftp|mailto|tel|data|javascript)\s*:|www\s*[.。]|[<>]|\]\s*\(|[\p{L}\p{N}_-]+[.。][\p{L}]{2,}|[\p{L}\p{N}_-]+\s*(?:\[dot\]|\(dot\)|\bdot\b)\s*(?:com|net|org|io|co|pk|uk|dev|app|info)\b|\b\d{1,3}(?:\.\d{1,3}){3}\b|(?:^|\s)\/[\w/-]+/iu.test(
    text,
  );
}
