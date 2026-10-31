import { renderToString } from "react-dom/server";
import App from "./App";
import type { SiteData } from "./types";
export function render(path: string, data: SiteData) {
  return path.startsWith("/admin")
    ? ""
    : renderToString(<App path={path} data={data} />);
}
