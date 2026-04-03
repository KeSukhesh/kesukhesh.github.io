# PRD: kesukhesh — Personal Website

## 1. Overview

A personal website for Sukhesh Patro — a minimal, beautifully crafted Astro site with two core experiences: an animated landing page with full-viewport scroll-snapping sections (inspired by claudemaxxing.org), and a blog powered by markdown files committed to a `/posts` folder. The site deploys to GitHub Pages and uses Libre Baskerville typography with a black/gray/white + forest green color palette. Dark/light mode with toggle.

## 2. Target Users

| User Type | Description | Primary Need |
|-----------|-------------|--------------|
| Recruiter/Hiring Manager | Reviewing Sukhesh's profile and work | Quick overview of experience, projects, links |
| Peer/Colleague | Engineers, collaborators, friends | Read blog posts, see what Sukhesh is working on |
| Sukhesh (author) | Writing and publishing blog content | Commit `.md` files and have them appear formatted |

## 3. User Stories

### Epic: Landing Page

- **US-001**: As a visitor, I want to see an animated hero section with Sukhesh's name and tagline so I get an immediate sense of who he is
  - Acceptance Criteria:
    - [ ] Hero takes full viewport, name animates in (letter-drop or fade)
    - [ ] Tagline and social links visible below name
    - [ ] Scroll indicator at bottom

- **US-002**: As a visitor, I want to scroll through full-viewport sections with snap scrolling so the experience feels like a presentation
  - Acceptance Criteria:
    - [ ] `scroll-snap-type: y mandatory` on html
    - [ ] Each section is `min-height: 100vh` with `scroll-snap-align: start`
    - [ ] Sections reveal content via IntersectionObserver (fade-up, slide-in)
    - [ ] Scroll progress bar at top of page

- **US-003**: As a visitor, I want to see an About section so I understand Sukhesh's background
  - Acceptance Criteria:
    - [ ] Brief bio paragraph
    - [ ] Key highlights (Lyra, UNSW, technical skills)
    - [ ] Reveal animation on scroll

- **US-004**: As a visitor, I want to see a Projects section with placeholder cards
  - Acceptance Criteria:
    - [ ] Sheaf project card with description
    - [ ] FishSOOP project card with description
    - [ ] Cards link out or expand (placeholder behavior fine for MVP)

- **US-005**: As a visitor, I want to see a Blog teaser section linking to `/blog`
  - Acceptance Criteria:
    - [ ] Shows 2-3 latest blog post titles/dates
    - [ ] "Read more" link to `/blog`

- **US-006**: As a visitor, I want a footer/contact section with social links
  - Acceptance Criteria:
    - [ ] GitHub (github.com/kesukhesh), LinkedIn (linkedin.com/in/sukheshkp)
    - [ ] Email link
    - [ ] Minimal footer design

### Epic: Blog

- **US-007**: As Sukhesh, I want to commit `.md` files to a `/posts` folder and have them appear as blog pages
  - Acceptance Criteria:
    - [ ] Astro content collection configured for `src/content/posts/`
    - [ ] Markdown frontmatter: title, date, description, tags, draft (optional)
    - [ ] Each post renders at `/blog/[slug]`
    - [ ] Draft posts excluded from production build

- **US-008**: As a visitor, I want to browse all blog posts on `/blog`
  - Acceptance Criteria:
    - [ ] Reverse-chronological list of posts
    - [ ] Each entry shows: title, date, description, tags, estimated reading time
    - [ ] Pagination if > 10 posts

- **US-009**: As a visitor, I want blog posts to be nicely formatted
  - Acceptance Criteria:
    - [ ] Proper typography (Libre Baskerville for body, monospace for code)
    - [ ] Syntax-highlighted code blocks (Shiki, built into Astro)
    - [ ] Auto-generated table of contents from headings
    - [ ] Estimated reading time displayed
    - [ ] Responsive images

- **US-010**: As a visitor, I want to filter/find blog posts
  - Acceptance Criteria:
    - [ ] Tag pages at `/blog/tags/[tag]`
    - [ ] Search functionality (client-side, Fuse.js or similar)
    - [ ] Related posts shown at bottom of each post (by shared tags)

### Epic: Theme & Design System

- **US-011**: As a visitor, I want to toggle between dark and light mode
  - Acceptance Criteria:
    - [ ] Toggle button in header/nav
    - [ ] Preference persisted in localStorage
    - [ ] Respects `prefers-color-scheme` on first visit
    - [ ] No flash of wrong theme on load (inline script in `<head>`)

- **US-012**: As a visitor, I want consistent, beautiful typography and color
  - Acceptance Criteria:
    - [ ] Libre Baskerville for headings and body
    - [ ] Monospace font for code (Space Mono or JetBrains Mono)
    - [ ] Color palette: black (#0a0a0a), white (#f5f5f0), grays, forest green (#2d5a3d) as accent
    - [ ] Smooth transitions on theme toggle

## 4. Technical Requirements

### Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Framework | Astro 5.x | Content-first, zero JS by default, built-in content collections |
| Styling | Tailwind CSS 4.x | Utility-first, easy dark mode, consistent spacing |
| Animations | CSS + vanilla JS | Scroll-snap, IntersectionObserver — no heavy libs needed |
| Blog content | Astro Content Collections | Type-safe frontmatter, `.md` files auto-discovered |
| Syntax highlighting | Shiki (built into Astro) | Zero-JS, beautiful themes |
| Search | Fuse.js | Lightweight client-side fuzzy search |
| Deployment | GitHub Pages | Free, git-push deploys via GitHub Actions |
| Package manager | npm | Standard, no extra tooling |

### Architecture

- Static site generation (SSG) — all pages pre-rendered at build time
- Content collections for blog posts (`src/content/posts/*.md`)
- Layouts: `BaseLayout` (html/head/nav/footer) > `BlogLayout` (post-specific) / `PageLayout` (landing sections)
- No backend, no database, no auth — pure static

### Data Model

| Entity | Key Fields | Relationships |
|--------|-----------|---------------|
| Blog Post | title, date, description, tags[], draft, slug | Tags → Tag pages |
| Project | name, description, tech[], link, image | Displayed on landing |

## 5. Screens & Navigation

### Screen Map

```
/ (Landing Page)
  ├── Hero section
  ├── About section
  ├── Projects section
  ├── Blog teaser section
  └── Contact/Footer section

/blog (Blog Index)
  ├── Search bar
  ├── Post list (paginated)
  └── Tag filter

/blog/[slug] (Blog Post)
  ├── Post header (title, date, reading time, tags)
  ├── Table of contents (sidebar or top)
  ├── Post body (rendered markdown)
  └── Related posts

/blog/tags/[tag] (Tag Page)
  └── Filtered post list
```

### Navigation

| Element | Behavior |
|---------|----------|
| Header nav | Fixed/sticky: Home, Blog, Projects (anchor), About (anchor) |
| Theme toggle | In header, persisted |
| Mobile nav | Hamburger menu |

### Screen Descriptions

| Screen | Purpose | Key Components |
|--------|---------|----------------|
| Landing `/` | First impression, scroll-snap presentation | Hero, About, Projects, Blog teaser, Contact |
| Blog Index `/blog` | Browse all posts | Search, post cards, pagination, tag filters |
| Blog Post `/blog/[slug]` | Read a post | ToC, rendered markdown, reading time, related posts |
| Tag Page `/blog/tags/[tag]` | Filter by tag | Filtered post list |

## 6. Non-Functional Requirements

- **Performance**: Lighthouse score > 95 (all categories). Zero JS shipped except search + theme toggle + scroll animations.
- **SEO**: Open Graph meta tags, sitemap.xml, robots.txt, canonical URLs
- **Accessibility**: Semantic HTML, ARIA labels, keyboard navigation, color contrast AA
- **Responsive**: Mobile-first, works on all screen sizes
- **No flash**: Theme toggle must not flash wrong theme on page load

## 7. MVP Scope

### In Scope (MVP)
- Landing page with 5 scroll-snap sections (hero, about, projects, blog teaser, contact)
- Scroll animations (IntersectionObserver reveals, progress bar)
- Blog with content collections, post pages, tag pages
- Search (Fuse.js)
- Reading time, table of contents
- Related posts
- Dark/light toggle with persistence
- GitHub Pages deployment via Actions
- 1-2 sample blog posts
- Libre Baskerville + forest green design system

### Out of Scope (Post-MVP)
- RSS feed
- Comments system (Giscus/Utterances)
- Analytics
- Newsletter/email subscription
- Full projects portfolio page (just cards on landing for now)
- i18n
- CMS integration

## 8. Success Metrics

| Metric | Target | How Measured |
|--------|--------|--------------|
| Lighthouse Performance | > 95 | Lighthouse CI |
| Lighthouse Accessibility | > 95 | Lighthouse CI |
| Blog post creation time | < 5 min | Commit .md → live |
| First Contentful Paint | < 1s | Lighthouse |
| Zero JS by default | Only search + theme + animations | Bundle analysis |

## 9. Open Questions

- Custom domain? (kesukhesh.github.io for now, can add later)
- Blog post image hosting strategy? (local in repo vs external CDN)
