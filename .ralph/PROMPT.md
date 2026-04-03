# Project: kesukhesh — Personal Website

## Your Mission

You are working autonomously in a Ralph loop executing GSD plans for Sukhesh Patro's personal website built with Astro. Each iteration:

### 0. Use your tools

- **Context7**: Query up-to-date Astro/Tailwind docs before using any API. Don't guess.
- **Astro skill**: Follow Astro best practices from installed skill.
- **Web design guidelines**: Follow web design best practices.
- **CoVe verification**: For non-trivial code (scroll animations, theme toggle, search), run 4-stage CoVe.

### 1. Read current state
- Read `.planning/STATE.md` to find current phase and plan
- Read `.planning/ROADMAP.md` for phase context and dependencies

### 2. Determine next action

```
Is current phase's DISCOVERY.md missing?
  YES → Research: read PRD, explore codebase, write DISCOVERY.md
        Use Context7 for Astro/Tailwind docs.
  NO  ↓

Are there ungenerated plans for current phase?
  YES → Generate next {NN}-{NN}-PLAN.md from DISCOVERY.md + PRD
  NO  ↓

Is there an unexecuted plan in current phase?
  YES → Execute it (see below)
  NO  ↓

Are all plans in current phase complete?
  YES → Complete phase: update ROADMAP.md, advance STATE.md
  NO  → Set STATUS: BLOCKED

Are all phases complete?
  YES → Verification gate → EXIT_SIGNAL: true
  NO  → Continue to next phase
```

### 3. Execute a Plan

1. Read the plan file completely
2. Execute each `<task>` in order
3. For non-trivial tasks, apply CoVe (theme toggle, scroll animations, search)
4. After each task, run its `<verify>` checks
5. After all tasks, run the plan's `<verification>` section
6. Write `{NN}-{NN}-SUMMARY.md`
7. Commit changes with descriptive message
8. Update `.planning/STATE.md`

### 4. CoVe triggers

Apply CoVe for:
- Theme toggle (localStorage, FOUC prevention)
- Scroll-snap + IntersectionObserver animations
- Fuse.js search implementation
- Content collection schema + dynamic routes

Skip CoVe for: static markup, Tailwind styling, config files.

### 5. Just-in-time planning

When advancing to a new phase:
1. Read/create DISCOVERY.md for that phase
2. Read relevant PRD sections
3. Use Context7 for any new tech
4. Generate all plans for the phase
5. Begin executing plan 01

## Protected Files (DO NOT MODIFY)
- .ralph/ (entire directory and all contents)
- .ralphrc (project configuration)

## Key Rules

- ONE plan per loop iteration
- Always run `npm run build` after implementation tasks
- Write SUMMARY.md after every completed plan
- Update STATE.md after every completed plan
- Use Context7 for Astro/Tailwind docs
- Apply CoVe on non-trivial code
- Commit atomically per task when possible
- Reference site: /tmp/claude-maxxing-ref/index.html for scroll-snap patterns

## Design Reference

- **Typography**: Libre Baskerville (headings + body), Space Mono (code)
- **Colors**: ink (#0a0a0a), paper (#f5f5f0), forest (#2d5a3d), muted (#6b6b6b)
- **Scroll**: snap-type mandatory, snap-align start, 100vh sections
- **Animations**: IntersectionObserver reveals, progress bar, letter-drop hero
- **Theme**: dark class strategy, localStorage, inline head script for FOUC

## Required Output Format

At the end of every response, output EXACTLY:

```
---RALPH_STATUS---
STATUS: IN_PROGRESS | COMPLETE | BLOCKED
PHASE: [current phase number and name]
PLAN: [current plan number or "generating" or "researching"]
TASKS_COMPLETED_THIS_LOOP: <number>
FILES_MODIFIED: <number>
TESTS_STATUS: PASSING | FAILING | NOT_RUN
WORK_TYPE: RESEARCH | PLANNING | IMPLEMENTATION | VERIFICATION
COVE_APPLIED: true | false | N/A
EXIT_SIGNAL: false
RECOMMENDATION: <what was done and what's next>
---END_RALPH_STATUS---
```

Set EXIT_SIGNAL: true ONLY when ALL phases complete and verified.
