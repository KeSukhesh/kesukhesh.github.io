# Structure (Target)

```
kesukhesh/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── Header.astro
│   │   ├── Footer.astro
│   │   ├── ThemeToggle.astro
│   │   ├── BlogCard.astro
│   │   ├── ProjectCard.astro
│   │   ├── TableOfContents.astro
│   │   ├── Search.astro
│   │   └── RelatedPosts.astro
│   ├── content/
│   │   ├── config.ts     # Content collection schema
│   │   └── posts/        # Blog .md files go here
│   │       └── *.md
│   ├── layouts/
│   │   ├── BaseLayout.astro   # HTML shell, nav, footer, theme
│   │   ├── BlogLayout.astro   # Post wrapper (ToC, reading time)
│   │   └── PageLayout.astro   # Generic page wrapper
│   ├── pages/
│   │   ├── index.astro        # Landing page (scroll-snap sections)
│   │   ├── blog/
│   │   │   ├── index.astro    # Blog listing
│   │   │   ├── [slug].astro   # Individual post
│   │   │   └── tags/
│   │   │       └── [tag].astro
│   │   └── 404.astro
│   └── styles/
│       └── global.css         # Tailwind imports + custom styles
├── public/
│   ├── favicon.ico
│   └── og-image.png
├── astro.config.mjs
├── tailwind.config.mjs
├── package.json
└── tsconfig.json
```
