# Project: kesukhesh — Personal Website

## Vision
A minimal, beautifully crafted personal website for Sukhesh Patro built with Astro. Features an animated scroll-snap landing page and a blog powered by markdown files. Deploys to GitHub Pages.

## Requirements

### Validated
- Astro 5.x static site with Tailwind CSS
- Landing page with 5 scroll-snap sections (hero, about, projects, blog teaser, contact)
- Scroll animations via IntersectionObserver + CSS transitions
- Blog via Astro content collections (`src/content/posts/*.md`)
- Blog features: tags, search (Fuse.js), reading time, ToC, related posts, pagination
- Dark/light mode with toggle, localStorage persistence, no FOUC
- Libre Baskerville typography, forest green (#2d5a3d) accent palette
- GitHub Pages deployment via GitHub Actions
- Projects section with Sheaf and FishSOOP cards
- Social links: GitHub (Kesukhesh), LinkedIn (sukheshkp)

### Out of Scope
- RSS feed, comments, analytics, newsletter, CMS, i18n
- Full projects portfolio page (just landing cards for MVP)

## Constraints
- Zero JS by default (only search + theme + scroll animations)
- Lighthouse > 95 all categories
- Mobile-first responsive
- Static-only (no SSR, no backend)

## Key Decisions
| Decision | Status | Rationale |
|----------|--------|-----------|
| Astro 5.x | Approved | Content-first, zero JS default, built-in content collections |
| Tailwind CSS 4.x | Approved | Utility-first, easy dark mode |
| Shiki for syntax highlighting | Approved | Built into Astro, zero JS |
| Fuse.js for search | Approved | Lightweight client-side fuzzy search |
| GitHub Pages | Approved | Free, simple git-push deploys |
| Libre Baskerville + Space Mono | Approved | Elegant serif + monospace pairing |
| Forest green accent | Approved | Black/gray/white + #2d5a3d palette |
