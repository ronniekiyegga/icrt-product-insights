# 003 — Respect prefers-reduced-motion for chart hover motion

- **Status**: DONE
- **Commit**: 9aedf24
- **Severity**: MEDIUM
- **Category**: Accessibility
- **Estimated scope**: 1 file (~15 lines)

Implemented for both CSS bar fading and JavaScript tooltip travel.

## Problem

Chart hover motion (bar dim + tooltip travel) runs unconditionally via `requestAnimationFrame`. There is no branch for `prefers-reduced-motion: reduce`.

CSS elsewhere respects reduced motion:

```css
/* src/assets/main.css:207-211 — exemplar */
@media (prefers-reduced-motion: no-preference) {
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity var(--duration-fade) ease;
  }
}
```

But `ScoreComparison.vue` rAF loops ignore the preference — movement and interpolation still run.

## Target

```ts
// target helper (ScoreComparison.vue)
let reducedMotionQuery: MediaQueryList | undefined

function prefersReducedMotion(): boolean {
  return reducedMotionQuery?.matches ?? false
}

// onMounted: reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

// In setHoveredBar + showProductTooltip paths:
if (prefersReducedMotion()) {
  // snap bar opacities to targets
  // snap tooltipX to barOverlayX immediately
  chart?.draw()
  return
}

// tickMotion: if prefersReducedMotion(), do not schedule further frames
```

Per AUDIT.md: keep opacity feedback, drop positional animation.

## Repo conventions to follow

- Match the existing `tabletQuery` / `matchMedia` pattern in `ScoreComparison.vue` (lines 409–410).
- Gate motion in JS; do not remove bar dim entirely — instant opacity change still communicates focus.

## Steps

1. Add `let reducedMotionQuery: MediaQueryList | undefined` and `prefersReducedMotion()` helper.
2. In `onMounted`, set `reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')`.
3. In `setHoveredBar`, if reduced motion: copy targets directly into `barOpacities`, `chart?.draw()`, skip `requestMotion()`.
4. In `moveTooltipTo` / `easeTooltipTo` / `onCanvasMove`, if reduced motion: set `tooltipX` immediately, set phase to `'rest'`, skip rAF easing.
5. In `onBeforeUnmount`, remove listener if added (optional — `matchMedia` without listener is fine for snapshot reads).

## Boundaries

- Do NOT remove bar dim or tooltip — only remove **animation duration**.
- Do NOT change tier gating or chart data.
- Implement after plans 001 and 002 so snap paths reuse `barOverlayX`.

## Verification

- **Mechanical**: `npm run lint:check && npm run type-check` — exit 0.
- **Feel check**:
  - DevTools → Rendering → emulate `prefers-reduced-motion: reduce`.
  - Hover bars — opacity changes instantly, no visible fade duration.
  - Switch bars — tooltip content and X update instantly.
  - Disable reduced motion — plans 001/002 smooth motion returns.
- **Done when**: no rAF easing runs under reduced motion; opacity feedback remains.
