# Roadmap — Milestone 1: MVP

## Progress
| Phase | Name | Status | Plans |
|-------|------|--------|-------|
| 1 | Infrastructure & Setup | COMPLETE | 01-01 |
| 2 | Landing Page | COMPLETE | 02-01 |
| 3 | Blog Engine | COMPLETE | 03-01, 03-02, 03-03 |
| 4 | Polish & Deploy | COMPLETE | 04-01 |

---

### Phase 1: Infrastructure & Setup
**Goal**: Scaffold Astro project, configure Tailwind, set up design tokens (colors, typography), base layout with nav/footer, dark/light theme toggle, GitHub repo init
**Depends on**: None
**Research**: Likely (Astro 5 + Tailwind 4 integration)
**Traces to**: PRD §4 (Stack), §11-12 (Theme & Design System)

### Phase 2: Landing Page
**Goal**: Build the 5-section scroll-snap landing page with animations — hero, about, projects, blog teaser, contact/footer
**Depends on**: Phase 1
**Research**: Unlikely
**Traces to**: PRD §3 US-001 through US-006

### Phase 3: Blog Engine
**Goal**: Content collections, blog index with pagination, post pages with ToC/reading time, tag pages, search, related posts
**Depends on**: Phase 1
**Research**: Likely (Astro content collections API)
**Traces to**: PRD §3 US-007 through US-010

### Phase 4: Polish & Deploy
**Goal**: SEO meta tags, GitHub Actions workflow, sample blog posts, Lighthouse audit, responsive QA, final fixes
**Depends on**: Phase 2, Phase 3
**Traces to**: PRD §6 (Non-Functional), §8 (Success Metrics)
