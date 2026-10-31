import "dotenv/config";
import { readFile } from "node:fs/promises";
import express from "express";
import { createApp } from "./app.js";
import { publicData, dataForPage } from "./db.js";
import { safeJson, seoHead, routeInfo } from "./seo.js";
import { tick } from "./jobs.js";
import { startComposioStream } from "./composio-stream.js";
process.umask(0o077);
const production = process.env.NODE_ENV === "production";
if (process.env.SITE_URL) {
  const u = new URL(process.env.SITE_URL);
  if (u.origin !== process.env.SITE_URL || u.username || u.password)
    throw new Error(
      "SITE_URL must be an exact origin without a path, credentials or trailing slash.",
    );
}
if (production && !process.env.SITE_URL?.startsWith("https://"))
  throw new Error("Production requires an HTTPS SITE_URL.");
const { app, db } = await createApp();
let vite, render;
if (!production && process.env.SERVE_BUILD !== "true") {
  const { createServer } = await import("vite");
  vite = await createServer({
    server: { middlewareMode: true },
    appType: "custom",
  });
  app.use(vite.middlewares);
} else {
  app.use(
    "/assets",
    express.static("dist/client/assets", { immutable: true, maxAge: "1y" }),
  );
  app.use(express.static("dist/client", { index: false, maxAge: "1h" }));
  render = (await import("../dist/server/entry-server.js")).render;
}
app.use(async (req, res, next) => {
  if (!["GET", "HEAD"].includes(req.method)) return next();
  try {
    const path = decodeURIComponent(req.path).replace(/\/$/, "") || "/";
    if (path === "/home") return res.redirect(308, "/");
    if (req.path !== path && req.path !== "/") return res.redirect(308, path);
    const data = dataForPage(await publicData(db), path),
      info = routeInfo(path, data);
    let template = await readFile(
      !vite ? "dist/client/index.html" : "index.html",
      "utf8",
    );
    if (vite) {
      template = await vite.transformIndexHtml(req.originalUrl, template);
      render = (await vite.ssrLoadModule("/src/entry-server.tsx")).render;
    }
    const markup = render(path, data);
    const html = template
      .replace("<!--app-head-->", () => seoHead(path, data))
      .replace("<!--app-html-->", () => markup)
      .replace(
        "<!--app-data-->",
        () =>
          `<script id="grow-data" type="application/json">${safeJson({ path, data })}</script>`,
      );
    res
      .status(info.exists ? 200 : 404)
      .set("Cache-Control", "no-cache")
      .type("html")
      .send(html);
  } catch (e) {
    vite?.ssrFixStacktrace(e);
    console.error(e);
    res.status(500).send("Unable to load the page. Please try again.");
  }
});
const port = Number(process.env.PORT || 3000);
const server = app.listen(port, "0.0.0.0", () =>
  console.log(`Growintek available on http://localhost:${port}`),
);
let busy = false;
const stopSocialStream = startComposioStream(db);
const timer = setInterval(async () => {
  if (busy) return;
  busy = true;
  try {
    await tick(db);
  } catch (e) {
    console.error("Worker:", e.message);
  } finally {
    busy = false;
  }
}, 30000);
timer.unref();
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, async () => {
    clearInterval(timer);
    await stopSocialStream();
    server.close(() => {
      db.close();
      process.exit(0);
    });
  });
