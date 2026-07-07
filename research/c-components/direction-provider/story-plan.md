# Direction Provider — story plan

Target set: 3 stories. Naming: `DirectionProvider/<Story>`. Source of truth: [`brief.md`](./brief.md). Utility brief floor per PROMPT.md §12 Tier 3: "a story only where rendering one makes sense" — DirectionProvider has no DOM of its own, so every story wraps a composite component to demonstrate its behavioral effect.

## A. Kept functionality demos (from current docs `demos/` dirs)

| # | Docs demo dir | Story | Render | Controlled? | Play? | Doc section |
|---|---|---|---|---|---|---|
| 1 | `hero` | `Hero` | `<div dir="rtl">`+`<DirectionProvider direction="rtl">`+`Slider`, pairing the app-owned `dir` attribute with the provider per the two-part RTL setup (#831) | no | no | Hero example / Anatomy (provider+`dir` pairing) |

## B. One story per use case (test-bearing)

| # | Story | Render | Controlled? | Play? | Doc section |
|---|---|---|---|---|---|
| 2 | `FlipCompositeRTL` (REQUIRED) | `DirectionProvider direction="rtl"` wrapping a `Tabs` or `Composite`-based widget, `dir="rtl"` set on the container in parallel | no | yes: focus the composite → press ArrowLeft → assert focus moves to the item that would be "next" in RTL reading order (mirrored from LTR default) — proves behavior, not just visuals | Behavior (arrow-key direction flip, #59/#831); a11y keyboard table |
| 3 | `PortaledPopupWithUseDirection` | `DirectionProvider direction="rtl"` wrapping a trigger for a portaled popup (e.g. `Tooltip.Popup`); popup reads `useDirection()` and applies `dir` manually since the provider does not set it on portaled elements | no | yes: open the popup → assert its portaled root has `dir="rtl"` applied via the hook (not inherited), demonstrating the `useDirection()` escape hatch (#3041/#3082) | Prop guidance `useDirection()`; Pitfalls (portaled popups don't inherit `dir`) |

## C. Real-world recreation stories

n/a — utils carry no Phase D data (brief §11); no recreation stories planned.

**Totals**: 3 planned, 0 recreation placeholders. Interaction (play) stories: 2, including the mandatory RTL behavioral flip (#2).
