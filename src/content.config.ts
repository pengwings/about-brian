import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const visibility = z.enum(['public', 'unlisted', 'protected']).default('public');

const projects = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    image: z.string().optional(),
    links: z
      .object({
        repo: z.string().url().optional(),
        demo: z.string().url().optional(),
      })
      .optional(),
    visibility,
  }),
});

const publications = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/publications' }),
  schema: z.object({
    title: z.string(),
    authors: z.array(z.string()),
    venue: z.string(),
    year: z.number().int(),
    doi: z.string().url().optional(),
    pdf: z.string().optional(),
    visibility,
  }),
});

export const collections = { projects, publications };
