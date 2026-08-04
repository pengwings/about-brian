export type Visibility = 'public' | 'unlisted' | 'protected';

export const SITE = {
  title: 'Brian',
  description: 'Personal site of Brian — resume, photography, publications, and projects.',
  author: 'Brian',
};

// Top-level sections. Visibility controls both navigation and access:
//   public    — in the nav, indexable
//   unlisted  — hidden from nav and search engines, reachable by direct link
//   protected — same as unlisted, plus password-gated by the Vercel routing
//               middleware (middleware.ts reads this list at build time)
export const SECTIONS: { label: string; href: string; visibility: Visibility }[] = [
  { label: 'Resume', href: '/resume', visibility: 'public' },
  { label: 'Photography', href: '/photography', visibility: 'public' },
  { label: 'Publications', href: '/publications', visibility: 'public' },
  { label: 'Projects', href: '/projects', visibility: 'public' },
];

export function sectionVisibility(href: string): Visibility {
  return SECTIONS.find((s) => s.href === href)?.visibility ?? 'public';
}
