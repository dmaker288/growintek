import nodemailer, { type Transporter } from "nodemailer";

let cached: Transporter | null = null;

function transport(): Transporter | null {
  if (cached) return cached;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;

  cached = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT ?? 587),
    secure: Number(SMTP_PORT ?? 587) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return cached;
}

export type MailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

/**
 * Sends email when SMTP is configured. Without SMTP it writes to the server
 * log so local development and a fresh deploy still work — sign-in codes and
 * lead alerts appear in the Vercel function logs.
 */
export async function sendMail(input: MailInput): Promise<{ delivered: boolean }> {
  const from = process.env.SMTP_FROM ?? "GrowinTek <hello@growintek.com>";
  const t = transport();

  if (!t) {
    console.info(
      `\n── mail (no SMTP configured) ─────────────\nto: ${input.to}\nsubject: ${input.subject}\n\n${input.text}\n─────────────────────────────────────────\n`
    );
    return { delivered: false };
  }

  try {
    await t.sendMail({
      from,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html ?? undefined,
    });
    return { delivered: true };
  } catch (err) {
    console.error("mail send failed", err);
    return { delivered: false };
  }
}

export function emailShell(title: string, bodyHtml: string): string {
  return `<!doctype html><html><body style="margin:0;background:#F3EFE7;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#171512">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#FFFDF8;border:1px solid #E3DCCD;border-radius:14px;overflow:hidden">
        <tr><td style="padding:28px 28px 8px">
          <div style="font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:#6F6A5E">GrowinTek</div>
          <h1 style="margin:10px 0 0;font-size:24px;line-height:1.2;font-weight:600">${escapeHtml(title)}</h1>
        </td></tr>
        <tr><td style="padding:14px 28px 30px;font-size:15px;line-height:1.6">${bodyHtml}</td></tr>
        <tr><td style="padding:16px 28px;border-top:1px solid #E3DCCD;font-size:12px;color:#6F6A5E">
          GrowinTek · growintek.com
        </td></tr>
      </table>
    </td></tr>
  </table></body></html>`;
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
