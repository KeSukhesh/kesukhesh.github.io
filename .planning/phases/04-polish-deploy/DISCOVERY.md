# Phase 4 Discovery: Polish & Deploy

## Scope
Add SEO meta tags (Open Graph, canonical URLs), robots.txt, GitHub Actions deploy workflow, and run final build verification.
Traces to: PRD §6 (Non-Functional), §8 (Success Metrics).

## Technical Approach

### SEO Meta Tags
- Add Open Graph (og:title, og:description, og:type, og:url, og:image) to BaseLayout
- Add Twitter card meta tags
- Add canonical URL using `Astro.url`
- BlogLayout passes post-specific title/description to BaseLayout
- sitemap.xml already handled by @astrojs/sitemap integration

### robots.txt
- Create `public/robots.txt` allowing all crawlers
- Point to sitemap URL

### GitHub Actions Workflow
- `.github/workflows/deploy.yml`
- Trigger on push to main
- Use official `withastro/action@v3` for build
- Deploy to GitHub Pages using `actions/deploy-pages@v4`
- Set up Pages environment

### Final Verification
- `npm run build` succeeds
- All pages generate correctly
- No TypeScript errors
- Check bundle: minimal JS (only search + theme + animations)

## Plan Breakdown
Single plan (04-01) — all tasks are small and interdependent.

## Risks
- GitHub Actions deploy needs correct permissions and Pages settings
- OG image: skip for MVP (no image to reference), can add post-MVP

## Dependencies
- Phase 1, 2, 3 all complete
- sitemap integration already configured
