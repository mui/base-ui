# Meter — story plan

Feeds Phase E. Source of truth: [`brief.md`](./brief.md). Styling: follow the docs hero demo CSS (CSS Modules, raw oklch values).

## 1. Kept functionality demos (from current docs `demos/` dirs)

| Docs demo dir | Story |
|---|---|
| `demos/hero` | `Basic` (labeled "Storage Used" meter, `value={24}`) |

## 2. One story per use case

Columns: name — renders — controlled? — play? — doc section served.

1. **RoleMeterSemantics** *(mandatory)* — Basic recreation; play function asserts (via testing-library / accessibility-tree query) `role="meter"` plus `aria-valuenow`/`aria-valuemin`/`aria-valuemax` are present and correct, and explicitly asserts there is **no** indeterminate variant available (contrasting with Progress) — controlled — **play** — A11y contract (the mandatory role=meter story).
2. **DefaultPercentFormatting** — no `format` prop, default percent-of-range text/`aria-valuetext` behavior — controlled — no — Behavior (formatting default).
3. **CustomValueRange** — non-default `min`/`max` (e.g. battery `0`–`4` hours, or `20`–`40`) showing percentage math holds for arbitrary bounds — controlled — no — Prop guidance (`min`/`max`).
4. **CustomFormatCurrencyOrUnit** — `format={{ style: 'currency', currency: 'USD' }}` showing raw-value (not percent) display — controlled — no — Prop guidance (`format`).
5. **LocaleVariants** — same value under two `locale` values (e.g. `en-US` vs `de-DE`) to demonstrate formatting differences — doubles as a regression guard for open issue #4616 — controlled — no — Prop guidance (`locale`) / Pitfalls.
6. **CustomAriaValueText** — `getAriaValueText` producing an enriched screen-reader string distinct from the visible `Value` text; play asserts the two diverge as designed — controlled — play — Behavior / A11y contract.
7. **ClampedOutOfRangeValues** — value above `max` / below `min` / `NaN`; play asserts indicator width and `aria-valuenow` clamp correctly (mirrors existing unit-test coverage) — controlled — play — Behavior (clamping).
8. **ConsumerDrivenValueTierStyling** — since Meter has no built-in low/medium/high data attributes (§8 of brief), demonstrates the recommended external pattern: consumer-computed `className`/`style` based on `value`/`min`/`max` — controlled — no — Prop guidance / Pitfalls (documents the gap rather than implying a hook exists).

## 3. Real-world recreation stories

- [G] Pending Phase D (`research/d-real-world-usage/meter/` not yet produced). No corpus signal gathered in this Tier-3 pass.

**Totals**: 8 planned. Interaction (play) stories: 3, including the mandatory role=meter semantics story (#1).
