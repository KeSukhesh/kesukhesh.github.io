---
title: "Building with Astro: A Modern Static Site"
date: 2026-04-01
description: "How I built this site with Astro, Tailwind CSS, and a focus on performance."
tags: ["astro", "web", "tailwind"]
---

When I set out to rebuild my personal site, I had a few non-negotiables: it had to be fast, minimal, and a joy to maintain. After evaluating a handful of frameworks, I landed on [Astro](https://astro.build/) — and it's been one of the best decisions I've made for a project like this.

## Why Astro?

Astro's philosophy of shipping zero JavaScript by default resonated with me. For a personal site that's mostly static content, there's no reason to send a React runtime to the browser. Astro lets you write components in a familiar `.astro` syntax, and everything compiles down to plain HTML and CSS at build time.

The content collections API is particularly elegant. You define a schema for your frontmatter, drop markdown files into a folder, and Astro handles the rest — type-safe queries, automatic slug generation, and built-in syntax highlighting via Shiki.

## The Stack

Here's what powers this site:

```typescript
// astro.config.mjs
export default defineConfig({
  site: 'https://kesukhesh.github.io',
  output: 'static',
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
```

- **Astro 6** for the framework
- **Tailwind CSS 4** for styling (CSS-first configuration, no `tailwind.config.mjs`)
- **Shiki** for syntax highlighting (built into Astro, zero extra JS)
- **GitHub Pages** for hosting

## Scroll-Snap Landing Page

The landing page uses CSS `scroll-snap-type: y mandatory` to create a presentation-like experience. Each section takes the full viewport, and an `IntersectionObserver` triggers reveal animations as you scroll through.

The hero animation uses a letter-drop effect — each character of my name falls into place with a staggered delay. It's pure CSS keyframes with inline `animation-delay` values, no JavaScript animation library needed.

## What I Learned

Building with Astro reinforced something I keep coming back to: the best tools are the ones that get out of your way. Astro doesn't fight you. It doesn't impose opinions about state management or routing patterns. It just helps you ship fast, accessible websites.
