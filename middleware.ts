// Vercel Routing Middleware — runs in front of the static site on Vercel and
// password-gates protected routes. Protected routes come from two sources:
//   - whole sections marked `protected` in src/site.config.ts
//   - individual content entries, collected into protected-paths.json at build
//     time by scripts/gen-protected.mjs
// Auth is a shared password (SITE_PASSWORD env var). A successful unlock sets a
// cookie holding the SHA-256 hash of the password, so changing the password
// invalidates every existing cookie. Note: this does not run under `astro dev`;
// use `vercel dev` or a preview deployment to exercise it.
import { rewrite } from '@vercel/functions/middleware';
import { SECTIONS } from './src/site.config';
import protectedData from './protected-paths.json';

const COOKIE_NAME = 'site_auth';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

const protectedPrefixes = SECTIONS.filter((s) => s.visibility === 'protected').map((s) => s.href);
const protectedExact = new Set<string>(protectedData.paths);

async function passwordHash(): Promise<string | null> {
  const password = process.env.SITE_PASSWORD;
  if (!password) return null;
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`about-brian:${password}`));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function getCookie(request: Request, name: string): string | null {
  for (const part of (request.headers.get('cookie') ?? '').split(/;\s*/)) {
    const eq = part.indexOf('=');
    if (eq > -1 && part.slice(0, eq) === name) return part.slice(eq + 1);
  }
  return null;
}

function isProtected(pathname: string): boolean {
  const path = pathname.replace(/\/+$/, '') || '/';
  if (protectedExact.has(path)) return true;
  return protectedPrefixes.some((prefix) => path === prefix || path.startsWith(`${prefix}/`));
}

export default async function middleware(request: Request): Promise<Response | undefined> {
  const url = new URL(request.url);

  if (url.pathname === '/unlock' && request.method === 'POST') {
    const form = await request.formData();
    const password = form.get('password');
    const nextRaw = form.get('next');
    // Only same-site relative targets, so the form can't be used as an open redirect.
    const next =
      typeof nextRaw === 'string' && nextRaw.startsWith('/') && !nextRaw.startsWith('//') ? nextRaw : '/';

    const hash = await passwordHash();
    if (hash && typeof password === 'string' && password === process.env.SITE_PASSWORD) {
      return new Response(null, {
        status: 303,
        headers: {
          location: next,
          'set-cookie': `${COOKIE_NAME}=${hash}; Path=/; Max-Age=${COOKIE_MAX_AGE}; HttpOnly; Secure; SameSite=Lax`,
        },
      });
    }

    const retry = new URL('/unlock', url);
    retry.searchParams.set('error', '1');
    retry.searchParams.set('next', next);
    return Response.redirect(retry, 303);
  }

  // Maintenance mode: while the MAINTENANCE_MODE env var is set, everyone sees
  // the /soon page. Unlocking with the site password at /unlock bypasses it, so
  // the real site stays previewable. Toggle off with:
  //   vercel env rm MAINTENANCE_MODE production && vercel redeploy <url> (or a new deploy)
  if (process.env.MAINTENANCE_MODE) {
    const path = url.pathname.replace(/\/+$/, '') || '/';
    const exempt = path === '/unlock' || path === '/soon' || path === '/robots.txt' || path.startsWith('/favicon');
    if (!exempt) {
      const hash = await passwordHash();
      const unlocked = hash !== null && getCookie(request, COOKIE_NAME) === hash;
      if (!unlocked) return rewrite(new URL('/soon', url));
    }
  }

  if (!isProtected(url.pathname)) return undefined;

  const hash = await passwordHash();
  if (!hash) {
    // Fail closed rather than exposing protected pages when the env var is missing.
    return new Response('Protected content is unavailable: SITE_PASSWORD is not configured.', {
      status: 503,
    });
  }
  if (getCookie(request, COOKIE_NAME) === hash) return undefined;

  const unlock = new URL('/unlock', url);
  unlock.searchParams.set('next', url.pathname);
  return Response.redirect(unlock, 303);
}

export const config = {
  // Skip hashed build assets and /snow-peak (proxied to the snow-peak-2026
  // project by vercel.json; it has its own sign-in and is never in maintenance
  // mode here). Everything else goes through the protected check.
  matcher: ['/((?!_astro/|snow-peak(?:/|$)).*)'],
};
