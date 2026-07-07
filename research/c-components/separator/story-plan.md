# Separator — story plan

Feeds Phase E. Source of truth: [`brief.md`](./brief.md). Styling: follow the docs hero demo CSS (CSS Modules, raw oklch values).

## 1. Kept functionality demos (from current docs `demos/` dirs)

| Docs demo dir | Story |
|---|---|
| `demos/hero` | `Basic` (vertical separator between two nav-link clusters) |

## 2. One story per use case

Columns: name — renders — controlled? — play? — doc section served.

1. **Horizontal** *(mandatory)* — default `orientation="horizontal"`, full width, thin height, between vertically-stacked content — n/a — no — Anatomy / Prop guidance (mandatory orientation story).
2. **Vertical** *(mandatory)* — `orientation="vertical"`, full height, thin width, between horizontally-inline content (mirrors the hero demo's nav-link pattern) — n/a — no — Anatomy / Prop guidance (mandatory orientation story).
3. **InMenu** — Separator between two `Menu.Group`s inside `Menu.Popup`, demonstrating the compound re-export and grouping semantics — n/a — no — Anatomy (composition) / When to use.
4. **InToolbar** — `Toolbar.Separator` between two `Toolbar.Group`s, with a control to flip the toolbar's own orientation live so the auto-inversion behavior (brief §6/§10) is visually demonstrable rather than just a source-code curiosity — n/a — play (toggle toolbar orientation, assert separator's `data-orientation` inverts) — Behavior (Toolbar wrapper) / Pitfalls (orientation inversion).
5. **InOTPField** — `OTPField.Separator` chunking a code input into `123-456`-style groups — n/a — no — When to use (non-menu use case).
6. **CustomStyling** — Separator with `render={<hr />}` (or a custom component), showing the polymorphic escape hatch — n/a — no — Prop guidance (`render`).
7. **DataAttributeStyling** — styling driven purely by `[data-orientation="vertical"]`/`[data-orientation="horizontal"]` CSS selectors rather than reading the `orientation` prop directly, exercising the data-attribute contract — n/a — no — Prop guidance (data attributes).
8. **AccessibilityAudit** — a story confirming `role="separator"` + `aria-orientation` are present and the element is correctly excluded from the tab order — a11y-focused regression check — n/a — play (assert role/aria-orientation/no tabIndex) — A11y contract.

## 3. Real-world recreation stories

- [G] Pending Phase D (`research/d-real-world-usage/separator/` not yet produced). No corpus signal gathered in this Tier-3 pass.

**Totals**: 8 planned. Interaction (play) stories: 2, including the Toolbar orientation-inversion demonstration (#4) and the accessibility regression check (#8).
