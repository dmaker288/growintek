import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
  createHash,
} from "node:crypto";
import { promisify } from "node:util";
const scrypt = promisify(scryptCallback);
export const hash = (value) => createHash("sha256").update(value).digest("hex");
export async function hashPassword(password) {
  const salt = randomBytes(32).toString("hex");
  const derived = await scrypt(password, salt, 64, {
    N: 32768,
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024,
  });
  return `${salt}:${derived.toString("hex")}`;
}
export async function verifyPassword(password, encoded) {
  const [salt, key] = (encoded || `${"0".repeat(64)}:${"0".repeat(128)}`).split(
    ":",
  );
  const derived = await scrypt(password, salt, 64, {
    N: 32768,
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024,
  });
  return (
    derived.length === Buffer.from(key, "hex").length &&
    timingSafeEqual(derived, Buffer.from(key, "hex"))
  );
}
export function auth(db) {
  return async (req, res, next) => {
    const token = req.cookies.grow_session;
    const session =
      token &&
      (await db
        .prepare(
          "SELECT s.*,a.email FROM sessions s JOIN admins a ON a.id=s.admin_id WHERE s.token_hash=? AND s.expires_at>?",
        )
        .get(hash(token), Date.now()));
    if (!session)
      return res.status(401).json({ error: "Please sign in to continue." });
    req.session = session;
    if (
      !["GET", "HEAD"].includes(req.method) &&
      req.headers["x-csrf-token"] !== session.csrf
    )
      return res
        .status(403)
        .json({ error: "Security token expired. Refresh and sign in again." });
    next();
  };
}
export function sameOrigin(req, res, next) {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) return next();
  const origin = req.get("origin");
  const expected =
    process.env.SITE_URL || `${req.protocol}://${req.get("host")}`;
  if (origin && origin !== new URL(expected).origin)
    return res
      .status(403)
      .json({ error: "Cross-site requests are not allowed." });
  if (req.get("sec-fetch-site") === "cross-site")
    return res
      .status(403)
      .json({ error: "Cross-site requests are not allowed." });
  if (
    !req.is("application/json") &&
    !(req.path === "/admin/media" && req.is("multipart/form-data"))
  )
    return res.status(415).json({ error: "Use application/json." });
  next();
}
export async function createSession(db, admin, res) {
  const token = randomBytes(32).toString("hex"),
    csrf = randomBytes(24).toString("hex");
  await db.prepare("DELETE FROM sessions WHERE expires_at<?").run(Date.now());
  await db
    .prepare("INSERT INTO sessions VALUES(?,?,?,?)")
    .run(hash(token), admin.id, csrf, Date.now() + 8 * 60 * 60 * 1000);
  res.cookie("grow_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 8 * 60 * 60 * 1000,
    path: "/",
  });
  return { email: admin.email, csrf };
}
