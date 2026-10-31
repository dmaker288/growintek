import express from "express";
import { readFile } from "node:fs/promises";
import { createApp } from "./app.js";
import { publicData, dataForPage } from "./db.js";
import { safeJson, seoHead, routeInfo } from "./seo.js";
export async function createRenderedApp() {
  const { app, db } = await createApp();
  const { render } = await import("../dist/server/entry-server.js");
  const template = await readFile("dist/client/index.html", "utf8");
  app.use(
    "/assets",
    express.static("dist/client/assets", { immutable: true, maxAge: "1y" }),
  );
  app.use(express.static("public", { index: false, maxAge: "1h" }));
  app.use(async (req, res) => {
    if (!["GET", "HEAD"].includes(req.method)) return res.sendStatus(405);
    try {
      const path = decodeURIComponent(req.path).replace(/\/$/, "") || "/";
      if (path === "/home") return res.redirect(308, "/");
      if (path !== req.path && req.path !== "/") return res.redirect(308, path);
      const data = dataForPage(await publicData(db), path),
        info = routeInfo(path, data);
      const html = template
        .replace("<!--app-head-->", () => seoHead(path, data))
        .replace("<!--app-html-->", () => render(path, data))
        .replace(
          "<!--app-data-->",
          () =>
            `<script id="grow-data" type="application/json">${safeJson({ path, data })}</script>`,
        );
      res
        .status(info.exists ? 200 : 404)
        .type("html")
        .set("Cache-Control", "no-cache")
        .send(html);
    } catch (e) {
      console.error("Page render failed:", e.name);
      res.status(500).send("Unable to load this page. Please try again.");
    }
  });
  return { app, db };
}
