# Hawthorn Education Strategies

Landing page for [hawthorneducation.com](https://hawthorneducation.com).

Built with Vite, React, TypeScript, Tailwind CSS and shadcn/ui. Hosted on GitHub Pages.

## Run locally

Requires Node.js 22+.

```sh
npm install
npm run dev
```

The dev server runs at http://localhost:8080.

## Deploy

Every push to `main` builds the site and publishes it to GitHub Pages
(see `.github/workflows/deploy.yml`). You can also run the workflow by hand
from the Actions tab.

## Adding a page

1. Create the page in `src/pages/` and add a `<Route>` for it in `src/App.tsx`.
2. Add the route name to the `routes` list in `scripts/spa-fallback.mjs` so a
   direct visit to that URL works on GitHub Pages.
3. Add the URL to `public/sitemap.xml`.

## Routines

A weekly DMARC readout for hawthorneducation.com runs as a claude.ai Routine
every Monday and emails jon@hawthorneducation.com only when something needs a
look. What it does, and the instructions it follows, live in [`docs/routines.md`](docs/routines.md). Its
parser is `scripts/dmarc-weekly.py`.
