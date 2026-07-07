# Progress — story plan

Feeds Phase E. Source of truth: [`brief.md`](./brief.md). Styling: follow the docs hero demo CSS (CSS Modules, raw oklch values).

## 1. Kept functionality demos (from current docs `demos/` dirs)

| Docs demo dir | Story |
|---|---|
| `demos/hero` | `Basic` (labeled progress, incrementing value via interval) |

## 2. One story per use case

Columns: name — renders — controlled? — play? — doc section served.

1. **Determinate** *(mandatory)* — `Root(value=40) > Label + Track > Indicator + Value` — controlled (fixed prop) — no — Anatomy / Behavior baseline.
2. **Indeterminate** *(mandatory)* — `value={null}`, CSS sweep animation on the unstyled Indicator — controlled — no — Behavior (indeterminate semantics) / A11y contract (`aria-valuenow` omitted, `aria-valuetext="indeterminate progress"`).
3. **LiveValueUpdates** *(mandatory play story)* — simulate incrementing `value` via `setInterval`/button clicks; play function asserts `aria-valuenow` updates correctly at each step (`waitFor` one assertion per step, per AGENTS.md testing conventions) — controlled — **play** — Behavior / A11y contract.
4. **CustomRange** — non-default `min`/`max` (e.g. `min={20} max={40}`) — controlled — no — Prop guidance (`min`/`max`).
5. **ValueOvershoot** — `value` exceeding `max`; play asserts `aria-valuenow`/width/text clamp at `max` rather than overflowing — controlled — play — Behavior (clamping) / Pitfalls.
6. **CustomFormat** — `format={{ style: 'currency', currency: 'USD' }}` showing Value text and `aria-valuetext` diverge from a plain percentage — controlled — no — Prop guidance (`format`).
7. **LocaleVariants** — same value rendered under two `locale` values (e.g. `en-US` vs `de-DE`) to demonstrate formatting differences — doubles as a regression guard for the open SSR/locale issue (#4616) — controlled — no — Prop guidance (`locale`) / Pitfalls (SSR hydration).
8. **WithLabelAndCustomAriaValueText** — `Progress.Label` present + `getAriaValueText` producing enriched screen-reader text distinct from the visible `Value` — controlled — no — A11y contract / Prop guidance.

## 3. Real-world recreation stories

- [G] Pending Phase D (`research/d-real-world-usage/progress/` not yet produced). No corpus signal gathered in this Tier-3 pass.

**Totals**: 8 planned. Interaction (play) stories: 2, including the mandatory live-value-update flow (#3).
