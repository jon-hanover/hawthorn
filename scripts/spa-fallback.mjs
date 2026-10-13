// GitHub Pages serves static files only, so a direct visit to /about would 404.
// Copy the built index.html to each client-side route, plus 404.html for unknown paths.
import { copyFileSync, mkdirSync } from "node:fs";

const routes = ["about"];

for (const route of routes) {
  mkdirSync(`dist/${route}`, { recursive: true });
  copyFileSync("dist/index.html", `dist/${route}/index.html`);
}
copyFileSync("dist/index.html", "dist/404.html");
