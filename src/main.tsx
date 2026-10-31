import React from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import App from "./App";
import type { SiteData } from "./types";
import "./styles.css";
import "./platform.css";
import "./refinement.css";
import "./latest.css";
const root = document.getElementById("root")!;
const serialized = document.getElementById("grow-data")?.textContent;
function render(path: string, data: SiteData, hydrate: boolean) {
  const app = (
    <React.StrictMode>
      <App path={path} data={data} />
    </React.StrictMode>
  );
  if (hydrate) hydrateRoot(root, app);
  else createRoot(root).render(app);
}
if (serialized) {
  const { path, data } = JSON.parse(serialized);
  render(path, data, !path.startsWith("/admin"));
} else
  fetch(`/api/public?path=${encodeURIComponent(window.location.pathname)}`)
    .then((r) => {
      if (!r.ok) throw new Error("Server unavailable");
      return r.json();
    })
    .then((data) => render(window.location.pathname, data, false))
    .catch(() => {
      root.innerHTML =
        '<main style="padding:4rem;font-family:sans-serif"><h1>Growintek is starting up.</h1><p>Please refresh in a moment.</p></main>';
    });
