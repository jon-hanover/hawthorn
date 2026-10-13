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
