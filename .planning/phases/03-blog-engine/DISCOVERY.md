# Phase 3 Discovery: Blog Engine

## Scope
Build the blog engine: content collections, blog index with pagination, post pages with ToC/reading time, tag pages, search (Fuse.js), related posts.
Traces to: PRD US-007 through US-010.

## Technical Approach

### Content Collections (Astro 6 Content Layer API)

- Config file: `src/content.config.ts` (Astro 6 convention)
- Import `z` from `astro/zod` (NOT `astro:content` — deprecated in v6)
- Use `glob` loader from `astro/loaders` for local markdown files
- Collection defined with `defineCollection({ loader: glob(...), schema: z.object({...}) })`
- Query with `getCollection('posts')` and `getEntry('posts', slug)` from `astro:content`
- Render markdown via `entry.render()` which returns `{ Content, headings, remarkPluginFrontmatter }`

### Schema (frontmatter)
```ts
{
  title: z.string(),
  date: z.date(),
  description: z.string(),
  tags: z.array(z.string()).default([]),
  draft: z.boolean().default(false),
}
```
Slug derived from filename (Astro convention).

### Blog Layout
- New `BlogLayout.astro` extending BaseLayout with:
  - Post header: title, date, reading time, tags
  - Table of contents sidebar (generated from headings)
  - Prose styling for rendered markdown
  - Related posts at bottom

### Blog Index (`/blog`)
- Reverse-chronological list of non-draft posts
- Each entry: title, date, description, tags, reading time
- Pagination at 10 posts per page using Astro's `paginate()` in `getStaticPaths()`
- Route: `src/pages/blog/[...page].astro`

### Post Pages (`/blog/[slug]`)
- Dynamic route: `src/pages/blog/[slug].astro`
- Uses `getStaticPaths()` with `getCollection('posts')`
- Renders markdown with `entry.render()`
- ToC from headings array
- Reading time calculated from word count (~200 wpm)

### Tag Pages (`/blog/tags/[tag]`)
- Dynamic route collecting all unique tags
- Filtered post list per tag
- Route: `src/pages/blog/tags/[tag].astro`

### Search (Fuse.js) — CoVe required
- Client-side fuzzy search on blog index
- Build search index at build time (JSON with title, description, tags, slug)
- Fuse.js already in package.json
- Search component as Astro island with `client:load`

### Syntax Highlighting
- Shiki v4 built into Astro 6, zero config needed
- Configure dual themes (light/dark) via `markdown.shikiConfig` in astro.config.mjs
- Use `github-dark` / `github-light` or similar pair

### Reading Time
- Calculate from rendered content word count
- Inject via remark plugin or calculate in page template
- Simpler: calculate in page frontmatter script (~200 wpm)

### Prose Styling
- Tailwind `@tailwindcss/typography` plugin for markdown content
- Or manual prose styles in global.css matching the design system
- Manual approach preferred to avoid extra dependency and maintain control

### Wire Landing Page Blog Teaser
- Replace hardcoded `blogPosts` array in `index.astro` with actual content collection query
- Show latest 3 posts from `getCollection('posts')`

## Plan Breakdown

### Plan 03-01: Content Infrastructure
- Content collection config (`src/content.config.ts`)
- Shiki dual-theme configuration
- BlogLayout component with prose styling
- 2 sample blog posts
- Reading time utility

### Plan 03-02: Blog Pages & Navigation
- Blog index with pagination (`/blog/[...page].astro`)
- Post pages (`/blog/[slug].astro`) with ToC
- Tag pages (`/blog/tags/[tag].astro`)
- Related posts component
- Wire landing page blog teaser to real data

### Plan 03-03: Search (CoVe)
- Search component with Fuse.js
- Build-time search index generation
- Search UI on blog index
- CoVe verification for client-side JS

## Risks
- Astro 6 Content Layer API is relatively new — verify glob loader import path
- Shiki dual themes need CSS variable approach for theme toggle compatibility
- Fuse.js island needs `client:load` — verify hydration works correctly
- Pagination may need `[...page].astro` rest params for `/blog` (page 1) and `/blog/2` etc.

## Dependencies
- Phase 1 complete: BaseLayout, Header, Footer, theme toggle, Tailwind 4
- Phase 2 complete: Landing page with blog teaser section (currently hardcoded)
- fuse.js already in package.json
