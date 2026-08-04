// Scans content frontmatter for `visibility: protected` entries and writes the
// resulting routes to protected-paths.json, which middleware.ts imports at
// bundle time. Runs as part of `npm run build`; the output is also committed so
// the middleware bundle never sees a stale or missing file.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;

// collection directory -> route prefix (publications have no detail pages)
const ROUTED_COLLECTIONS = { projects: '/projects' };

const paths = [];
for (const [dir, prefix] of Object.entries(ROUTED_COLLECTIONS)) {
  const base = join(ROOT, 'src/content', dir);
  for (const file of readdirSync(base)) {
    if (!file.endsWith('.md')) continue;
    const source = readFileSync(join(base, file), 'utf8');
    const frontmatter = source.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? '';
    if (/^visibility:\s*['"]?protected['"]?\s*$/m.test(frontmatter)) {
      paths.push(`${prefix}/${file.replace(/\.md$/, '')}`);
    }
  }
}

paths.sort();
writeFileSync(join(ROOT, 'protected-paths.json'), JSON.stringify({ paths }, null, 2) + '\n');
console.log(`protected-paths.json: ${paths.length} protected route(s)`, paths);
