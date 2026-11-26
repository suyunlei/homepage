import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

function resolveCollectionBase(subDir: string): string | URL {
  const customRoot = process.env.CONTENT_DIR?.trim();
  if (!customRoot) {
    return `./content/${subDir}`;
  }
  const absDir = path.resolve(customRoot, subDir);
  return pathToFileURL(absDir.endsWith(path.sep) ? absDir : `${absDir}${path.sep}`);
}

const publications = defineCollection({
  loader: glob({
    pattern: ['**/*.md', '!**/_*.md'],
    base: resolveCollectionBase('publications'),
  }),
  schema: z.object({
    title: z.string(),
    titleZh: z.string().default(''),
    authors: z.array(z.string()),
    authorNote: z.string().default(''),
    highlightAuthor: z.string().default('Yunlei Su'),
    venue: z.string(),
    year: z.number().int(),
    date: z.string(),
    type: z.enum(['journal', 'conference', 'preprint', 'thesis']),
    indexing: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    pdf: z.string().default(''),
    doi: z.string().default(''),
    code: z.string().default(''),
    dataset: z.string().default(''),
    keywords: z.array(z.string()).default([]),
    abstract: z.string(),
    bibtex: z.string().default(''),
  }),
});

const projects = defineCollection({
  loader: glob({
    pattern: ['**/*.md', '!**/_*.md'],
    base: resolveCollectionBase('projects'),
  }),
  schema: z.object({
    order: z.number().int(),
    title: z.string(),
    subtitle: z.string().default(''),
    category: z.string(),
    organization: z.string(),
    date: z.string(),
    cover: z.string(),
    summary: z.string(),
    tags: z.array(z.string()).default([]),
    highlights: z.array(z.string()).default([]),
    links: z
      .array(
        z.object({
          label: z.string(),
          href: z.string(),
          kind: z.enum(['internal', 'pdf', 'external']).default('internal'),
        }),
      )
      .default([]),
    archiveNote: z.string().default(''),
  }),
});

const albums = defineCollection({
  loader: glob({
    pattern: ['**/*.md', '!**/_*.md'],
    base: resolveCollectionBase('albums'),
  }),
  schema: z.object({
    order: z.number().int(),
    number: z.string(),
    title: z.string(),
    titleZh: z.string(),
    location: z.string(),
    headline: z.string(),
    description: z.string(),
    cover: z.string(),
    heroImage: z.string().default(''),
    layout: z.enum(['masonry-gallery', 'editorial-stories']),
    items: z.array(
      z.object({
        title: z.string(),
        subtitle: z.string().default(''),
        image: z.string(),
        gallery: z.array(z.string()).default([]),
        caption: z.string().default(''),
        paragraphs: z.array(z.string()).default([]),
        tags: z.array(z.string()).default([]),
      }),
    ),
  }),
});

export const collections = {
  publications,
  projects,
  albums,
};
