# 001 — Smooth bar dim on hover with time-based ease-out

- **Status**: DONE
- **Commit**: 9aedf24
- **Severity**: HIGH
- **Category**: Easing & duration / Performance
- **Estimated scope**: 2 files (~40 lines)

Resolved by the Vue/CSS bar refactor. Opacity now uses a bounded CSS transition and no canvas redraw loop.

## Problem

Bar hover dimming feels clanky because opacity is advanced with a **per-frame proportional lerp** and the entire Chart.js canvas is redrawn on every animation frame.

Current code in `src/dashboard/ScoreComparison.vue`:

```ts
// src/dashboard/ScoreComparison.vue:41-42 — current
const tooltipEaseMs = 420
const barDimFollow = 0.18

// src/dashboard/ScoreComparison.vue:156-171 — current
for (const [index, opacity] of barOpacities.entries()) {
  const target = barOpacityTargets[index] ?? 1
  const delta = target - opacity
  if (Math.abs(delta) < 0.004) {
    barOpacities[index] = target
    continue
  }

  barOpacities[index] = opacity + delta * barDimFollow
  barsMoving = true
  moving = true
}

if (barsMoving) {
  chart?.draw()
}
```

Issues:

1. `barDimFollow = 0.18` is **frame-rate dependent** — 120 Hz displays settle faster than 60 Hz, producing inconsistent feel.
2. No easing curve — linear exponential approach reads as mechanical, not UI-polished.
3. Full `chart.draw()` every frame while hovering is expensive and can stutter under load.

Hover is hit tens of times per session (AUDIT.md frequency tier: reduce or polish, don't delete — dimming communicates focus).

## Target

Replace frame-lerp with **time-based interpolation** using a shared ease-out token and a tooltip-scale duration budget (160 ms).

```ts
// target constants (ScoreComparison.vue)
const barDimMs = 160

// target tickMotion bar branch — time-based ease-out
const barDimStartedAt = /* per-target timestamp map or single transition start */

function easeOutStrong(t: number): number {
  // maps 0→1 with strong ease-out; use CSS token value below
  return 1 - (1 - t) ** 3 // acceptable JS mirror of cubic-bezier(0.23, 1, 0.32, 1)
}

// On setHoveredBar: record performance.now() as barDimStartedAt when targets change
// In tickMotion:
const t = Math.min(1, (performance.now() - barDimStartedAt) / barDimMs)
const eased = easeOutStrong(t)
for each index:
  barOpacities[index] = barOpacityFrom + (barOpacityTargets[index] - barOpacityFrom) * eased
// barOpacityFrom captured when hover target last changed
```

Add tokens in `src/assets/main.css`:

```css
--duration-bar-dim: 160ms;
--ease-out: cubic-bezier(0.23, 1, 0.32, 1);
```

Optionally soften the dim amount from `0.9` to `0.93` so the effect is felt but not heavy.

When `prefers-reduced-motion: reduce`, skip interpolation — set opacities to targets immediately (see plan 003).

## Repo conventions to follow

- Motion durations live as CSS custom properties in `src/assets/main.css` (exemplar: `--duration-fade: 200ms` at line 57).
- Reduced-motion handling already gates CSS transitions in `.fade-enter-active` (lines 207–211) — mirror that pattern for JS-driven chart motion.
- Chart.js stays isolated to `ScoreComparison.vue`; do not add a motion library.

## Steps

1. In `src/assets/main.css` `@theme`, add:
   ```css
   --duration-bar-dim: 160ms;
   --ease-out: cubic-bezier(0.23, 1, 0.32, 1);
   ```
2. In `ScoreComparison.vue`, remove `barDimFollow`. Add module-level state:
   - `let barDimStartedAt = 0`
   - `const barOpacityFrom = products.map(() => 1)` (snapshot when targets change)
3. In `setHoveredBar`, before updating `barOpacityTargets`, copy current `barOpacities` into `barOpacityFrom`, set `barDimStartedAt = performance.now()`, then update targets and call `requestMotion()`.
4. Replace the bar-opacity loop in `tickMotion` with time-based ease-out over `readPx('--duration-bar-dim', 160)` ms. Snap to targets when `t >= 1`.
5. Keep `chart?.draw()` only while `barsMoving`, but it should run ≤10 frames for a 160 ms animation at 60 Hz — acceptable.
6. Delete the unused `barDimFollow` constant.

## Boundaries

- Do NOT touch tooltip motion in this plan (plan 002).
- Do NOT change bar colours, chart layout, or tooltip markup.
- Do NOT add Framer Motion, GSAP, or other dependencies.
- Do NOT animate anything other than bar/label opacity via the existing `fadeUnhovered` and `endLabels` plugins.

## Verification

- **Mechanical**: `npm run lint:check && npm run type-check && npm run test:unit` — all exit 0.
- **Feel check**: Premium/Enterprise tier, desktop width ≥768px:
  - Hover each bar slowly — dimming should ease out smoothly, no stepped flicker.
  - Move quickly between bars — opacities retarget mid-animation without restarting from zero (from-snapshot pattern).
  - DevTools → Rendering → `prefers-reduced-motion: reduce` — opacities snap instantly (after plan 003, or stub `if (prefersReducedMotion) { snap; return }` here).
  - Performance panel: confirm chart draw calls cluster in a short burst, not sustained 60fps for seconds.
- **Done when**: bar hover dim feels smooth and consistent at 60 Hz and 120 Hz, with no visible stutter on rapid bar switches.
