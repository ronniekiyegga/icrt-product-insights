# Animation improvement plans

Audit commit: `9aedf24`  
Scope: `ScoreComparison.vue` bar hover dim + tooltip travel (user-reported clanky bars, jumping tooltip).

| #   | Plan | Severity | Status | Depends on |
| --- | ---- | -------- | ------ | ---------- |
| 001 | [Smooth bar dim on hover](./001-smooth-bar-dim-on-hover.md) | HIGH | TODO | — |
| 002 | [Stabilize tooltip travel](./002-stabilize-tooltip-travel.md) | HIGH | TODO | 001 (shared `--ease-out` token) |
| 003 | [Reduced motion for chart hover](./003-reduced-motion-chart-hover.md) | MEDIUM | TODO | 001, 002 |

## Recommended execution order

1. **001** — fixes bar clank (time-based ease-out replaces frame lerp).
2. **002** — fixes tooltip jump (lock X to bar endpoint, 180 ms ease-out, remove leave animation).
3. **003** — accessibility snap path.

Plans 001 and 002 can land in one PR if the executor keeps boundaries clean.

## Execute a plan

Tell any agent:

```
/improve-animations execute plans/002-stabilize-tooltip-travel.md
```

Or implement manually following each plan's Steps and Verification sections.
