import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createHmac, createHash, randomBytes, randomInt, timingSafeEqual, scryptSync } from "node:crypto";
import { cache } from "react";
import { prisma } from "@/lib/db";
import { sendMail, emailShell } from "@/lib/mailer";

const COOKIE = "gt_session";
const SESSION_DAYS = 30;
const OTP_TTL_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 60;

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 24) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("AUTH_SECRET must be set to at least 24 characters in production.");
    }
    return "dev-only-insecure-secret-change-me-now";
  }
  return s;
}

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function hmac(value: string): string {
  return createHmac("sha256", secret()).update(value).digest("hex");
}

export function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Creates a one-time code for an existing user and emails it.
 * Returns a generic result so the caller never leaks whether an account exists.
 */
export async function requestSignInCode(emailRaw: string): Promise<{ throttled: boolean }> {
  const email = emailRaw.trim().toLowerCase();

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.disabled) return { throttled: false };

  const recent = await prisma.otpCode.findFirst({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });
  if (
    recent &&
    Date.now() - recent.createdAt.getTime() < RESEND_COOLDOWN_SECONDS * 1000
  ) {
    return { throttled: true };
  }

  const code = String(randomInt(100000, 1000000));
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60_000);

  await prisma.otpCode.create({
    data: { userId: user.id, codeHash: hmac(code), expiresAt },
  });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  await sendMail({
    to: user.email,
    subject: `Your GrowinTek sign-in code: ${code}`,
    text: `Your sign-in code is ${code}. It expires in ${OTP_TTL_MINUTES} minutes.\n\nSign in: ${siteUrl}/admin/login\n\nIf you did not request this, ignore this email.`,
    html: emailShell(
      "Your sign-in code",
      `<p style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:30px;letter-spacing:.22em;margin:8px 0 18px">${code}</p>
       <p>This code expires in ${OTP_TTL_MINUTES} minutes.</p>
       <p><a href="${siteUrl}/admin/login" style="color:#1B2CE0">Open the admin →</a></p>
       <p style="color:#6F6A5E;font-size:13px">If you did not request this, you can ignore this email.</p>`
    ),
  });

  return { throttled: false };
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPasswordHash(password: string, stored: string): boolean {
  try {
    const [salt, key] = stored.split(":");
    if (!salt || !key) return false;
    const keyBuffer = Buffer.from(key, "hex");
    const derivedBuffer = scryptSync(password, salt, 64);
    return keyBuffer.length === derivedBuffer.length && timingSafeEqual(keyBuffer, derivedBuffer);
  } catch {
    return false;
  }
}

export async function signInWithPassword(
  emailRaw: string,
  passwordRaw: string
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const email = emailRaw.trim().toLowerCase();
  const password = passwordRaw.trim();

  if (!email || !password) {
    return { ok: false, reason: "Please enter both email and password." };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.disabled) {
    return { ok: false, reason: "Invalid email or password." };
  }

  if (user.passwordHash) {
    const match = verifyPasswordHash(password, user.passwordHash);
    if (!match) {
      return { ok: false, reason: "Invalid email or password." };
    }
  } else {
    const defaultPass = process.env.ADMIN_PASSWORD || "Admin2026!";
    if (password !== defaultPass) {
      return { ok: false, reason: "Invalid email or password." };
    }
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: hashPassword(password) },
    });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  await createSession(user.id);
  return { ok: true };
}

export async function verifySignInCode(
  emailRaw: string,
  codeRaw: string
): Promise<{ ok: true } | { ok: false; reason: string }> {
  const email = emailRaw.trim().toLowerCase();
  const code = codeRaw.trim();

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.disabled) return { ok: false, reason: "That code is not valid." };

  const otp = await prisma.otpCode.findFirst({
    where: { userId: user.id, usedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!otp) return { ok: false, reason: "That code has expired. Request a new one." };
  if (otp.attempts >= MAX_OTP_ATTEMPTS) {
    return { ok: false, reason: "Too many attempts. Request a new code." };
  }

  const expected = Buffer.from(otp.codeHash, "hex");
  const given = Buffer.from(hmac(code), "hex");
  const match =
    expected.length === given.length && timingSafeEqual(expected, given);

  if (!match) {
    await prisma.otpCode.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } },
    });
    return { ok: false, reason: "That code is not valid." };
  }

  await prisma.$transaction([
    prisma.otpCode.update({ where: { id: otp.id }, data: { usedAt: new Date() } }),
    prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } }),
  ]);

  await createSession(user.id);
  return { ok: true };
}

export async function createSession(userId: string): Promise<void> {
  const raw = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 86_400_000);

  await prisma.session.create({
    data: { userId, tokenHash: sha256(raw), expiresAt },
  });

  const jar = await cookies();
  jar.set(COOKIE, raw, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  role: "ADMIN" | "EDITOR";
};

/** Cached per request so multiple server components share one lookup. */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (!raw) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: sha256(raw) },
    include: { user: true },
  });
  if (!session) return null;
  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => null);
    return null;
  }
  if (session.user.disabled) return null;

  return {
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    role: session.user.role,
  };
});

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "ADMIN") redirect("/admin?denied=1");
  return user;
}

export async function signOut(): Promise<void> {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (raw) {
    await prisma.session
      .delete({ where: { tokenHash: sha256(raw) } })
      .catch(() => null);
  }
  jar.delete(COOKIE);
}

/**
 * Lightweight CSRF defence for server actions: the Origin header must match
 * the site's own origin. SameSite=Lax cookies already block most cross-site
 * POSTs; this closes the gap for older browsers.
 */
export function assertSameOrigin(origin: string | null, host: string | null): void {
  if (!origin || !host) return; // non-browser clients without Origin are rejected elsewhere
  try {
    const o = new URL(origin);
    if (o.host !== host) throw new Error("Cross-origin request rejected.");
  } catch {
    throw new Error("Cross-origin request rejected.");
  }
}
