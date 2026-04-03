---
title: "Why I Rebuilt My Site with Astro"
date: 2026-04-01
description: "I wanted zero JavaScript, markdown blog posts, and a site that loads before you blink. Astro delivered."
tags: ["astro", "web", "tailwind"]
---

I had three personal sites before this one. A Next.js app that shipped 200KB of JavaScript to display text. A Hugo blog I stopped updating because the templating language made me want to quit engineering. A raw HTML page from 2023 that still looked better than both.

This time I wanted something different. Ship no JavaScript. Write blog posts in markdown. Deploy by pushing to GitHub. Load before you blink.

Astro does all of that.

## The pitch is simple

You write `.astro` components. They compile to HTML and CSS at build time. No runtime. No hydration. No bundle.

For a personal site, this is table stakes. I don't need React on the client. I don't need a virtual DOM diffing my name and a paragraph of text. Astro skips all of that by default, and you opt in to interactivity only where you need it.

The content collections API sold me. You define a schema for your frontmatter, drop `.md` files into a folder, and Astro gives you type-safe queries and automatic slug generation. Adding a blog post is a git commit. That's it.

## What's under the hood

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

Astro 6 for the framework. Tailwind CSS 4 for styling, configured entirely in CSS with no config file. Shiki for syntax highlighting, which ships zero JavaScript because it highlights at build time. GitHub Pages for hosting.

The whole site builds in under a second. 11 pages, 800ms.

## The scroll-snap landing page

The landing page uses CSS `scroll-snap-type: y mandatory`. Each section fills the viewport. An `IntersectionObserver` triggers reveal animations on scroll.

The hero has a letter-drop animation. Each character falls into place with a staggered delay. Pure CSS keyframes with inline `animation-delay` values. No animation library.

I pulled the pattern from a site I liked and adapted it. Nothing original, and that's the point. The best frontend work is boring frontend work that loads fast.

## What I took away

The previous versions of my site failed because they fought me. Too much config. Too much abstraction. Too many decisions for a page that displays text.

Astro got out of the way. I spent my time on the writing and the design, not on the build system.

That's what good tools do.
