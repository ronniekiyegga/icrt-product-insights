# 002 — Stabilize tooltip travel: lock X to bar score, shorten ease-out

- **Status**: DONE
- **Commit**: 9aedf24
- **Severity**: HIGH
- **Category**: Easing & duration / Interruptibility
- **Estimated scope**: 1 file (~35 lines)

Implemented with 180ms endpoint-locked desktop travel and an immediate resting position on leave.

## Problem

The tooltip feels like it jumps when moving between bars because:

1. **Horizontal position follows the mouse**, not the bar's score endpoint — inconsistent with the default/rest state which uses `element.x`.
2. **420 ms ease-in-out** is too slow for a high-frequency hover affordance (AUDIT budget: tooltips 125–200 ms).
3. **Each bar switch restarts a full enter animation**, even for small horizontal deltas.
4. **`onCanvasLeave` swaps tooltip content to bar 0 then animates X**, causing a visible content/position mismatch mid-transition.

Current code:

```ts
// src/dashboard/ScoreComparison.vue:41 — current
const tooltipEaseMs = 420

// src/dashboard/ScoreComparison.vue:111-113 — current easing
function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - (0 - 2 * t + 2) ** 3 / 2
}

// src/dashboard/ScoreComparison.vue:252-266 — hover uses mouse X
const x = overlayX(event.clientX)
showProductTooltip(hit.index, x)
// ...
easeTooltipTo(x, 'enter')

// src/dashboard/ScoreComparison.vue:215-227 — rest uses bar end X
showProductTooltip(index, element.x + (canvasBox.left - overlayBox.left), immediate)

// src/dashboard/ScoreComparison.vue:269-274 — leave handler
placeTooltipOnBar(0)
easeTooltipTo(tooltipTargetX, 'leave')
```

When the pointer moves vertically across bars, `clientX` stays roughly fixed but each bar's **score endpoint X differs** (92 vs 85 vs 79). Following the mouse means the tooltip does not align with the dashed axis marker; switching bars triggers a long ease-in-out slide that reads as bobbing/jumping.

## Target

```ts
// target constants
const tooltipEaseMs = 180
const tooltipSnapPx = 8 // skip animation if |delta| <= 8

// target: derive X from bar element, not clientX
function barOverlayX(index: number): number | undefined {
  // same math as placeTooltipOnBar: element.x + (canvasBox.left - overlayBox.left)
}

// target easing — ease-out for UI travel (AUDIT.md)
function easeOutStrong(t: number): number {
  return 1 - (1 - t) ** 3
}

// target onCanvasMove
const x = barOverlayX(hit.index) ?? overlayX(event.clientX)
if (hit.index !== tooltipIndex) {
  showProductTooltip(hit.index, x)
  const delta = Math.abs(x - tooltipX.value)
  if (delta <= tooltipSnapPx) {
    tooltipX.value = x
    tooltipPhase = 'track'
  } else {
    easeTooltipTo(x, 'enter')
  }
} else if (tooltipPhase === 'track') {
  tooltipX.value = x // bar endpoint may shift slightly on resize; keep synced
}

// target onCanvasLeave (tablet default state)
placeTooltipOnBar(0, true) // immediate snap — no leave animation
setHoveredBar(null)
```

Add token in `src/assets/main.css`:

```css
--duration-tooltip-travel: 180ms;
```

Remove the `'leave'` phase if nothing uses it after `onCanvasLeave` change (or keep for future — but dead code should be deleted).

Tooltip template stays on `transform: translate3d(tooltipX, 0, 0)` — no vertical motion.

## Repo conventions to follow

- Durations as CSS tokens in `src/assets/main.css` (`--duration-fade: 200ms` is the exemplar).
- Tooltip overlay already uses GPU-friendly `translate3d` (line 527) — keep that.
- `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)` from plan 001 should be the single shared ease-out token.

## Steps

1. Add `--duration-tooltip-travel: 180ms;` to `src/assets/main.css` `@theme`.
2. Extract `barOverlayX(index: number): number | undefined` from the math inside `placeTooltipOnBar` (lines 220–227). Use it in both `placeTooltipOnBar` and `onCanvasMove`.
3. Change `tooltipEaseMs` to read from token: `readPx('--duration-tooltip-travel', 180)`.
4. Replace `easeInOutCubic` with `easeOutStrong` (ease-out, not ease-in-out) in the tooltip branch of `tickMotion`.
5. Update `onCanvasMove`:
   - Compute `x` via `barOverlayX(hit.index)`.
   - On bar index change: update tooltip content, then animate only if `|x - tooltipX| > 8`, else snap to `track`.
   - On same bar: set `tooltipX = x` in `track` phase (bar endpoint is stable).
6. Update `onCanvasLeave` for tablet: `placeTooltipOnBar(0, true)` and `setHoveredBar(null)` — remove `easeTooltipTo(..., 'leave')`.
7. Remove unused `leave` phase handling if no callers remain; simplify `tooltipPhase` to `'rest' | 'enter' | 'track'`.
8. In `onCanvasMove`, remove the branch that calls `easeTooltipTo` on every move when already on the same bar in `rest` — first hover from rest should enter once; subsequent same-bar moves should not re-enter.

## Boundaries

- Do NOT change tooltip card markup, dashed line, or axis anchor CSS (`.tooltip-axis-anchor`).
- Do NOT change bar dim logic (plan 001).
- Do NOT add spring libraries.
- Do NOT animate tooltip content (brand/score text) — horizontal position only in this plan.

## Verification

- **Mechanical**: `npm run lint:check && npm run type-check && npm run test:unit` — all exit 0.
- **Feel check**: Premium tier, desktop:
  - Hover bar 92 (BrandC) — tooltip sits above the bar end, dashed line meets x-axis dot at the 92 tick.
  - Move vertically to bar 85, then 79 — tooltip slides horizontally ~180 ms with ease-out, **no vertical bobbing**.
  - Wiggle pointer horizontally within one bar — tooltip X stays locked to bar endpoint (no cursor tracking).
  - Move pointer off chart — tooltip snaps instantly to bar 0 default, no slow return animation.
  - DevTools → Animations → 10% speed: confirm one smooth horizontal slide per bar change, no ease-in slow start.
  - Rapidly scrub across all three bars — motion retargets from current X without restarting from zero.
- **Done when**: tooltip travel feels crisp (≤200 ms), stays aligned with score endpoints, and bar switches no longer read as jumping.
