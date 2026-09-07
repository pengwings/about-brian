# about-brian

Minimalist personal site — resume, photography, publications, and projects.
Built with [Astro](https://astro.build), deployed on Vercel.

## Editing content

| What | Where |
| :-- | :-- |
| Intro / homepage | `src/pages/index.astro` |
| Resume | `src/pages/resume.astro` (and drop your real PDF at `public/resume.pdf`) |
| Photos | Add image files to `src/assets/photos/` — the gallery picks them up automatically; the filename becomes the alt text |
| Projects | One Markdown file per project in `src/content/projects/` |
| Publications | One Markdown file per publication in `src/content/publications/` |
| Nav / section visibility | `src/site.config.ts` |

## Visibility

Every project/publication entry (via `visibility:` frontmatter) and every
section (via `src/site.config.ts`) is one of:

- `public` — listed, in the nav, indexable (default)
- `unlisted` — hidden from listings, nav, and search engines; reachable by direct link
- `protected` — unlisted **and** password-gated

Password gating is enforced by `middleware.ts` (Vercel Routing Middleware)
against the `SITE_PASSWORD` environment variable. `scripts/gen-protected.mjs`
collects protected entry routes into `protected-paths.json` during `npm run
build`; commit that file when it changes. To change the password:

```sh
vercel env rm SITE_PASSWORD production && vercel env add SITE_PASSWORD production
```

(repeat for `preview`) — changing it invalidates everyone's unlock cookies on
the next deploy. Note the middleware does not run under `npm run dev`; test
gating with `vercel dev` or on a deployment.

## Maintenance mode

While the `MAINTENANCE_MODE` env var is set, all visitors see the minimal
`/soon` page. Entering the site password at `/unlock` bypasses it, so you can
still browse the real site while it's "closed". Toggle:

```sh
# off (site goes live)
vercel env rm MAINTENANCE_MODE production -y && vercel deploy --prod

# on
printf 1 | vercel env add MAINTENANCE_MODE production && vercel deploy --prod
```

## Snow Peak trip app

The trip app is a separate Vercel project (`pengwings-projects/snow-peak-2026`)
served at `snow-peak.brian-yu.com`; the `snow-peak` DNS record lives in the
same GoDaddy zone as the apex. `vercel.json` redirects the old
`brian-yu.com/snow-peak` path there, and `middleware.ts` keeps that path out of
its matcher so maintenance mode never intercepts the redirect. Nothing else
here is involved.

## Commands

| Command | Action |
| :-- | :-- |
| `npm run dev` | Dev server at `localhost:4321` |
| `npm run build` | Regenerate `protected-paths.json` + production build to `dist/` |
| `npm run preview` | Serve the built site locally |
| `vercel deploy` | Deploy (project: `pengwings-projects/about-brian`) |
