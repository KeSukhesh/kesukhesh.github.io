# Phase 2 Discovery: Landing Page

## Scope
Build the 5-section scroll-snap landing page: Hero, About, Projects, Blog Teaser, Contact/Footer.
Traces to: PRD US-001 through US-006.

## Technical Approach

### Scroll Snap
- Add `scroll-snap-type: y mandatory` on `<html>` (only on landing page, not blog)
- Each section: `min-h-screen snap-start` with `scroll-snap-align: start`
- Landing page uses a special layout variant (or inline styles) to enable snap on html

### IntersectionObserver Animations
- Reusable `ScrollReveal` component or inline script
- Elements start with `opacity-0 translate-y-8` and transition to visible on intersection
- Use `threshold: 0.1` for trigger point
- CSS classes: `.reveal` (hidden) → `.revealed` (visible)

### Scroll Progress Bar
- Fixed bar at top of page, width proportional to scroll position
- Vanilla JS: `window.addEventListener('scroll', ...)` with `requestAnimationFrame`
- Uses forest green color

### Hero Animation
- Letter-drop effect: Each letter of "Sukhesh Patro" animates in with staggered delay
- CSS `@keyframes` + inline style for per-letter delay
- Tagline fades in after name completes

### Sections

1. **Hero** (US-001): Full viewport, animated name, tagline, social links, scroll indicator (bouncing chevron)
2. **About** (US-003): Bio paragraph, highlights (Lyra Technologies, UNSW, skills), reveal animation
3. **Projects** (US-004): Sheaf + FishSOOP cards with descriptions, hover effects, link-out
4. **Blog Teaser** (US-005): Latest 2-3 post titles/dates (hardcoded for now, will be dynamic in Phase 3), "Read more" link
5. **Contact/Footer** (US-006): Already built Footer component — enhance the contact section above it

### Content

**About**: Sukhesh Patro — software engineer at Lyra Technologies, UNSW graduate. Focus areas: automation, AI/ML, full-stack development.

**Projects**:
- **Sheaf**: Description TBD (placeholder for now)
- **FishSOOP**: Description TBD (placeholder for now)

## Plan Breakdown
Single plan (02-01) covering all 5 sections + scroll infrastructure. The sections are interdependent (scroll-snap, shared animations) so splitting would create unnecessary coordination overhead.

## Risks
- Scroll-snap can be janky on mobile Safari — test with `scroll-snap-stop: always`
- Letter-drop animation must not block/delay interaction
- Blog teaser will use hardcoded data until Phase 3 wires up content collections

## Dependencies
- Phase 1 complete: BaseLayout, Header, Footer, theme toggle, Tailwind 4 ✓
