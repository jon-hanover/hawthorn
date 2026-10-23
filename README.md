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

## Contact form

`/contact` (`src/pages/Contact.tsx`) posts to a Cloudflare Worker,
`hawthorn-contact`, whose code lives in `worker/contact/`. The Worker checks a
hidden honeypot field, verifies the Cloudflare Turnstile token, and forwards
the message to the "Website contact form" automation in the **Hawthorn
Contacts** Airtable base. That automation saves it to the Submissions table
and emails Jon.

- The Turnstile site key in `Contact.tsx` is public. Local dev uses
  Cloudflare's always-pass test key, and the Worker only accepts requests from
  hawthorneducation.com, so a real send only works on the live site.
- The Worker's two secrets, `TURNSTILE_SECRET` and `AIRTABLE_WEBHOOK_URL`,
  live in Cloudflare and are never committed.
- To deploy Worker changes: `cd worker/contact && npx wrangler deploy`.

## Routines

A weekly DMARC readout for hawthorneducation.com runs as a claude.ai Routine
every Monday and emails Jon's Hawthorn inbox only when something needs a
look. What it does, and the instructions it follows, live in [`docs/routines.md`](docs/routines.md). Its
parser is `scripts/dmarc-weekly.py`.
