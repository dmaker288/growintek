import { setDefaultResultOrder } from "node:dns";
import { setDefaultAutoSelectFamilyAttemptTimeout } from "node:net";
setDefaultResultOrder("ipv4first");
// Give slower IPv4 connections time before attempting an unavailable IPv6 route.
setDefaultAutoSelectFamilyAttemptTimeout(2000);
import { DatabaseRateLimitStore } from "./rate-limit-store.js";
import express from "express";
import { fundsReport } from "./finance.js";
import compression from "compression";
import multer from "multer";
import sharp from "sharp";
import { composioWebhook } from "./composio-webhook.js";
import { businessProfileReport } from "./google-business.js";
import { storeImage, listImages, serveImage } from "./storage.js";

import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";
import { z } from "zod";
import { randomUUID, timingSafeEqual } from "node:crypto";
import {
  openDatabase,
  seed,
  list,
  get,
  insert,
  update,
  settings,
  saveSettings,
  publicData,
  dataForPage,
  log,
  now,
} from "./db.js";
import {
  auth,
  sameOrigin,
  verifyPassword,
  createSession,
  hash,
} from "./security.js";
import {
  schemas,
  settingsSchema,
  validateDocument,
  invoiceTotals,
} from "./validation.js";
import {
  integrationStatus,
  searchConsoleReport,
  analyticsReport,
  submitSitemap,
  refreshSocial,
  seoAudit,
} from "./integrations.js";
import { tick, queueJob, queuePublication, keywordIdeas } from "./jobs.js";
import { sitemap, llms, rss } from "./seo.js";
export async function createApp({
  db = openDatabase(),
  rateLimits = true,
} = {}) {
  await seed(db);
  const app = express();
  if (process.env.TRUST_PROXY_HOPS)
    app.set("trust proxy", Number(process.env.TRUST_PROXY_HOPS));
  app.disable("x-powered-by");
  app.use(
    compression({
      filter: (req, res) =>
        req.path.startsWith("/api/admin")
          ? false
          : compression.filter(req, res),
    }),
  );
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "https://www.googletagmanager.com"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: [
            "'self'",
            "data:",
            "https://i.ytimg.com",
            "https://*.fbcdn.net",
            "https://*.cdninstagram.com",
            "https://www.google-analytics.com",
          ],
          connectSrc: [
            "'self'",
            "https://*.google-analytics.com",
            "https://*.analytics.google.com",
            "https://www.googletagmanager.com",
            ...(process.env.NODE_ENV !== "production" ? ["ws:"] : []),
          ],
          frameSrc: ["https://www.youtube-nocookie.com"],
          fontSrc: ["'self'"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          upgradeInsecureRequests:
            process.env.NODE_ENV === "production" ? [] : null,
        },
      },
      crossOriginEmbedderPolicy: false,
      strictTransportSecurity:
        process.env.NODE_ENV === "production" ? undefined : false,
    }),
  );
  app.post(
    "/api/webhooks/composio",
    express.raw({ type: "application/json", limit: "160kb" }),
    composioWebhook(db),
  );
  app.use(express.json({ limit: "160kb" }), cookieParser());
  app.use("/api", sameOrigin);
  app.use("/api", (_req, res, next) => {
    res.set("Cache-Control", "no-store");
    next();
  });
  let limiterScope = 0;
  const limiter = (max, windowMs = 15 * 60 * 1000) =>
    rateLimits
      ? rateLimit({
          windowMs,
          store: new DatabaseRateLimitStore(db, `endpoint-${++limiterScope}`),
          limit: max,
          standardHeaders: "draft-8",
          legacyHeaders: false,
          message: { error: "Too many attempts. Please try again later." },
        })
      : (_req, _res, next) => next();
  app.get("/api/cron", async (req, res) => {
    const expected = process.env.CRON_SECRET;
    const supplied = req.headers.authorization || "";
    const value = `Bearer ${expected}`;
    if (
      !expected ||
      Buffer.byteLength(supplied) !== Buffer.byteLength(value) ||
      !timingSafeEqual(Buffer.from(supplied), Buffer.from(value))
    )
      return res.status(401).json({ error: "Cron authorization required." });
    const start = Date.now();
    for (let i = 0; i < 8 && Date.now() - start < 150000; i++) await tick(db);
    res.json({ ok: true, completedAt: now() });
  });
  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));
  app.get("/api/public", async (req, res) =>
    res.json(
      dataForPage(
        await publicData(db),
        typeof req.query.path === "string" ? req.query.path : "/",
      ),
    ),
  );
  app.get("/api/social", async (_req, res) =>
    res.json((await settings(db)).socialCache || {}),
  );
  app.post("/api/leads", limiter(6, 60 * 60 * 1000), async (req, res) => {
    if (req.body.website)
      return res
        .status(201)
        .json({ message: "Thank you. Your inquiry has been received." });
    const data = validateDocument("leads", {
      ...req.body,
      status: "new",
      notes: "",
      source: "Contact form",
    });
    const lead = await insert(db, "leads", data);
    res.status(201).json({
      id: lead.id,
      message: "Thank you. Your inquiry is safely with our team.",
    });
  });
  app.post("/api/events", limiter(150), async (req, res) => {
    const event = z
      .object({
        path: z
          .string()
          .regex(/^\/[a-zA-Z0-9/_-]*$/)
          .max(240),
        event: z.enum(["pageview", "contact_start", "lead_submit"]),
        consent: z.literal(true),
      })
      .parse(req.body);
    if (!event.path.startsWith("/admin"))
      await db
        .prepare("INSERT INTO events(path,event,day) VALUES(?,?,?)")
        .run(event.path, event.event, now().slice(0, 10));
    res.sendStatus(204);
  });
  app.post("/api/auth/login", limiter(8), async (req, res) => {
    const { email, password } = z
      .object({
        email: z.string().email().max(254),
        password: z.string().min(1).max(256),
      })
      .parse(req.body);
    const admin = await db
      .prepare("SELECT * FROM admins WHERE email=?")
      .get(email.toLowerCase());
    const valid = await verifyPassword(password, admin?.password_hash);
    if (!admin || !valid)
      return res
        .status(401)
        .json({ error: "The email or password is incorrect." });
    if (req.cookies.grow_session)
      await db
        .prepare("DELETE FROM sessions WHERE token_hash=?")
        .run(hash(req.cookies.grow_session));
    await log(db, admin.email, "sign-in", "session");
    res.json(await createSession(db, admin, res));
  });
  app.use("/api/admin", auth(db));
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 8 * 1024 * 1024, files: 1 },
  });
  app.get("/api/admin/media", async (_req, res) =>
    res.json(await listImages(db)),
  );
  app.post("/api/admin/media", upload.single("image"), async (req, res) => {
    if (
      !req.file ||
      !["image/png", "image/jpeg", "image/webp"].includes(req.file.mimetype)
    )
      return res
        .status(400)
        .json({ error: "Upload a PNG, JPEG or WebP image up to 8 MB." });
    const filename = `media-${randomUUID()}.webp`;
    try {
      const buffer = await sharp(req.file.buffer, {
        limitInputPixels: 40000000,
      })
        .rotate()
        .resize({
          width: 2000,
          height: 2000,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 85 })
        .toBuffer();
      await storeImage(filename, buffer, db);
    } catch (e) {
      if (e.status) throw e;
      return res.status(400).json({
        error:
          "This image could not be processed. Try a valid PNG, JPEG or WebP.",
      });
    }
    await log(db, req.session.email, "upload", filename);
    res.status(201).json({ url: "/images/" + filename });
  });
  app.get(/^\/images\/media-[a-f0-9-]+\.webp$/, (req, res) =>
    serveImage(req, res, db),
  );
  app.get("/api/admin/session", (req, res) =>
    res.json({ email: req.session.email, csrf: req.session.csrf }),
  );
  app.post("/api/admin/logout", async (req, res) => {
    await db
      .prepare("DELETE FROM sessions WHERE token_hash=?")
      .run(req.session.token_hash);
    res.clearCookie("grow_session", { path: "/" });
    res.sendStatus(204);
  });
  app.get("/api/admin/overview", async (_req, res) => {
    const leads = await list(db, "leads"),
      invoices = await list(db, "invoices"),
      posts = await list(db, "posts");
    res.json({
      counts: {
        leads: leads.length,
        qualified: leads.filter((l) =>
          ["qualified", "proposal", "won"].includes(l.status),
        ).length,
        clients: (await list(db, "clients")).filter(
          (c) => c.status === "active",
        ).length,
        published: posts.filter((p) => p.status === "published").length,
        review: posts.filter((p) => p.status === "review").length,
      },
      recentLeads: leads.slice(0, 5),
      invoices: invoices.map((i) => ({ ...i, ...invoiceTotals(i) })),
      activity: await db
        .prepare(
          "SELECT action,target,created_at FROM audit_log ORDER BY id DESC LIMIT 10",
        )
        .all(),
      events: await db
        .prepare(
          "SELECT day,event,count(*) as count FROM events GROUP BY day,event ORDER BY day DESC",
        )
        .all(),
      topPages: await db
        .prepare(
          "SELECT path,count(*) as views FROM events WHERE event='pageview' GROUP BY path ORDER BY views DESC LIMIT 10",
        )
        .all(),
    });
  });
  app.get("/api/admin/funds", async (_req, res) =>
    res.json(await fundsReport(db)),
  );
  app.get("/api/admin/settings", async (_req, res) =>
    res.json(await settings(db)),
  );
  app.put("/api/admin/settings", async (req, res) => {
    const data = settingsSchema.parse(req.body);
    await db.transaction(async () => {
      await saveSettings(db, { ...(await settings(db)), ...data });
    })();
    await log(db, req.session.email, "update", "settings");
    res.json(data);
  });
  app.get("/api/admin/integrations", async (_req, res) =>
    res.json(await integrationStatus(db)),
  );
  app.get("/api/admin/audit", async (_req, res) =>
    res.json(await seoAudit(db)),
  );
  app.get("/api/admin/search-console", async (_req, res) =>
    res.json(await searchConsoleReport()),
  );
  app.get("/api/admin/business-profile", async (_req, res) =>
    res.json(await businessProfileReport()),
  );
  app.get("/api/admin/analytics", async (_req, res) =>
    res.json(await analyticsReport()),
  );
  app.post("/api/admin/sitemap", async (req, res) => {
    const result = await submitSitemap();
    await log(db, req.session.email, "submit", "sitemap");
    res.json(result);
  });
  app.post("/api/admin/social-refresh", async (_req, res) =>
    res.json(await refreshSocial(db)),
  );
  app.post("/api/admin/jobs/run", async (_req, res) => {
    await tick(db);
    res.json({
      message: "Queue checked. Refresh the job history for results.",
    });
  });
  app.get("/api/admin/jobs", async (_req, res) =>
    res.json(
      (
        await db
          .prepare("SELECT * FROM jobs ORDER BY created_at DESC LIMIT 100")
          .all()
      ).map((j) => ({ ...j, data: JSON.parse(j.data) })),
    ),
  );
  app.post("/api/admin/jobs/:id/retry", async (req, res) => {
    const result = await db
      .prepare(
        "UPDATE jobs SET status='pending',attempts=0,error=NULL,available_at=?,updated_at=? WHERE id=? AND status='failed'",
      )
      .run(Date.now(), now(), req.params.id);
    if (!result.changes)
      return res
        .status(409)
        .json({ error: "Only failed jobs can be retried." });
    res.json({ message: "Job queued for retry." });
  });
  app.post(
    "/api/admin/generate",
    limiter(10, 60 * 60 * 1000),
    async (req, res) => {
      const topicId = z.string().uuid().parse(req.body.topicId);
      const topic = await get(db, "keywords", topicId);
      if (!topic || topic.status !== "ready" || topic.sources.length < 2)
        return res.status(400).json({
          error: "Select a ready topic with at least two source notes.",
        });
      if (
        !(await integrationStatus(db)).find((i) => i.id === "dashscope")
          .configured
      )
        return res
          .status(503)
          .json({ error: "Configure DashScope on the server first." });
      const id = await queueJob(
        db,
        "article",
        { topicId },
        `article:${topicId}:${topic.revision}`,
      );
      await log(db, req.session.email, "generate", topic.title);
      res.status(202).json({
        id,
        message: "Article queued. Check the job history and editorial queue.",
      });
    },
  );
  app.post(
    "/api/admin/keyword-ideas",
    limiter(10, 60 * 60 * 1000),
    async (req, res) =>
      res.json(
        await keywordIdeas(
          db,
          z
            .string()
            .max(2000)
            .parse(req.body.brief || ""),
        ),
      ),
  );
  app.param("kind", (req, res, next, kind) => {
    if (!Object.hasOwn(schemas, kind))
      return res.status(404).json({ error: "Collection not found." });
    next();
  });
  app.get("/api/admin/content/:kind", async (req, res) =>
    res.json(
      (await list(db, req.params.kind)).map((d) =>
        req.params.kind === "invoices" ? { ...d, ...invoiceTotals(d) } : d,
      ),
    ),
  );
  const corePages = [
    "home",
    "about",
    "services",
    "seo",
    "portfolio",
    "blog",
    "contact",
  ];
  async function validateRelations(kind, data, id) {
    if (kind === "pages") {
      const current = id ? await get(db, kind, id) : null;
      if (
        current &&
        corePages.includes(current.slug) &&
        (data.slug !== current.slug || data.status !== "published")
      )
        throw Object.assign(
          new Error(
            "Core pages keep a fixed address and published status. Edit their content and search metadata.",
          ),
          { status: 400 },
        );
      if (!current && corePages.includes(data.slug))
        throw Object.assign(
          new Error(
            "This address belongs to a core page. Edit its existing page record.",
          ),
          { status: 409 },
        );
    }
    if (kind === "invoices") {
      if (!(await get(db, "clients", data.clientId)))
        throw Object.assign(new Error("Choose an existing client."), {
          status: 400,
        });
      if (
        (await list(db, "invoices")).some(
          (i) => i.id !== id && i.number === data.number,
        )
      )
        throw Object.assign(new Error("Invoice numbers must be unique."), {
          status: 409,
        });
    }
    if (
      kind === "pages" &&
      ["admin", "api", "images", "assets"].includes(data.slug)
    )
      throw Object.assign(new Error("That page address is reserved."), {
        status: 400,
      });
  }
  app.post("/api/admin/content/:kind", async (req, res) => {
    const data = validateDocument(req.params.kind, req.body);
    const doc = await db.transaction(async () => {
      await validateRelations(req.params.kind, data);
      const d = await insert(db, req.params.kind, data);
      await queuePublication(db, req.params.kind, d);
      return d;
    })();
    await log(
      db,
      req.session.email,
      "create",
      `${req.params.kind}:${doc.title || doc.name || doc.number}`,
    );
    res.status(201).json(doc);
  });
  app.put("/api/admin/content/:kind/:id", async (req, res) => {
    const revision = z.number().int().positive().parse(req.body.revision),
      data = validateDocument(req.params.kind, req.body);
    const doc = await db.transaction(async () => {
      await validateRelations(req.params.kind, data, req.params.id);
      const d = await update(
        db,
        req.params.kind,
        req.params.id,
        data,
        revision,
      );
      await queuePublication(db, req.params.kind, d);
      return d;
    })();
    await log(
      db,
      req.session.email,
      "update",
      `${req.params.kind}:${doc.title || doc.name || doc.number}`,
    );
    res.json(doc);
  });
  app.delete("/api/admin/content/:kind/:id", async (req, res) => {
    const revision = z.number().int().positive().parse(req.body.revision);
    await db.transaction(async () => {
      if (
        req.params.kind === "pages" &&
        corePages.includes((await get(db, "pages", req.params.id))?.slug)
      )
        throw Object.assign(
          new Error(
            "Core pages cannot be deleted. Edit their content instead.",
          ),
          { status: 400 },
        );
      if (
        req.params.kind === "clients" &&
        (await list(db, "invoices")).some((i) => i.clientId === req.params.id)
      )
        throw Object.assign(
          new Error(
            "This client has invoices. Set the client inactive instead.",
          ),
          { status: 409 },
        );
      const result = await db
        .prepare("DELETE FROM documents WHERE kind=? AND id=? AND revision=?")
        .run(req.params.kind, req.params.id, revision);
      if (!result.changes)
        throw Object.assign(
          new Error("The record changed or was deleted. Refresh the list."),
          { status: 409 },
        );
    })();
    await log(
      db,
      req.session.email,
      "delete",
      `${req.params.kind}:${req.params.id}`,
    );
    res.sendStatus(204);
  });
  app.get("/sitemap.xml", async (_req, res) =>
    res.type("application/xml").send(sitemap(await publicData(db))),
  );
  app.get(["/robots.txt", "/robort.txt"], (_req, res) =>
    res
      .type("text/plain")
      .send(
        process.env.SITE_URL
          ? `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api\nSitemap: ${process.env.SITE_URL.replace(/\/$/, "")}/sitemap.xml\n`
          : "User-agent: *\nDisallow: /\n",
      ),
  );
  app.get(["/llms.txt", "/llm.txt", "/llms.tst"], async (_req, res) =>
    res.type("text/plain").send(llms(await publicData(db))),
  );
  app.get("/feed.xml", async (_req, res) =>
    res.type("application/rss+xml").send(rss(await publicData(db))),
  );
  app.get(/^\/[a-zA-Z0-9-]{8,128}\.txt$/, (req, res, next) => {
    const key = process.env.INDEXNOW_KEY;
    if (key && req.path === `/${key}.txt`)
      return res.type("text/plain").send(key);
    next();
  });
  app.use("/api", (_req, res) =>
    res.status(404).json({ error: "Endpoint not found." }),
  );
  app.use((error, _req, res, next) => {
    if (res.headersSent) return next(error);
    if (error instanceof z.ZodError)
      return res.status(400).json({
        error: error.issues
          .map((i) => `${i.path.join(".")}: ${i.message}`)
          .join("; "),
      });
    if (error.code === "SQLITE_CONSTRAINT_UNIQUE")
      return res
        .status(409)
        .json({ error: "That address or identifier is already in use." });
    if (error instanceof multer.MulterError)
      return res.status(400).json({ error: "Upload one image up to 8 MB." });
    if (error.type === "entity.parse.failed")
      return res.status(400).json({ error: "Invalid JSON request." });
    if (error.status)
      return res.status(error.status).json({ error: error.message });
    console.error("Request failed:", error.name);
    res
      .status(500)
      .json({ error: "The request could not be completed. Please try again." });
  });
  return { app, db };
}
