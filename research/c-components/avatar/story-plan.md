# Avatar — story plan

Feeds Phase E. Source of truth: [`brief.md`](./brief.md). Styling: follow the docs hero demo CSS (CSS Modules, raw oklch values).

## 1. Kept functionality demos (from current docs `demos/` dirs)

| Docs demo dir | Story |
|---|---|
| `demos/hero` | `Basic` (image avatar with `delay={600}` initials fallback, plus a second initials-only avatar) |

## 2. One story per use case

Columns: name — renders — controlled? — play? — doc section served.

1. **ImageLoadFallback** *(mandatory)* — `Avatar.Root > Avatar.Image(src="<broken/unreachable URL>") + Avatar.Fallback("JD")`. Play function: use a genuinely invalid/unreachable URL (e.g. a relative 404 path or nonexistent asset) so the browser's real image error event fires naturally — no mocking needed in a real browser story (unlike unit tests, which mock `window.Image`). Await the fallback text becoming visible (`findByText`, not a synchronous assertion, since status resolves asynchronously) and assert the `<img>` is absent/removed from the DOM once resolved. If a `delay` is set, the play function must additionally wait out that delay before asserting visibility — n/a — **play** — Behavior (state machine) / A11y contract / the mandatory fallback story.
2. **SuccessfulImageLoad** — valid, fast-loading `src` with a `Fallback` present but never shown; play asserts the image renders and fallback text is never visible (`queryByText` returns null) — n/a — play — Behavior baseline.
3. **DefaultDelay** — demonstrates default `delay={0}` (fallback appears immediately, no flash-prevention) vs. a `delay={600}` variant matching the hero demo, to show the debounce effect — n/a — no — Prop guidance (`delay`) / Pitfalls (flash-of-fallback).
4. **InitialsOnly** — `Avatar.Root` with plain text children and no `Image`/`Fallback` parts, matching the "no photo available" pattern from both hero demos — n/a — no — Anatomy (optional parts).
5. **CustomFallbackContent** — Fallback containing something other than initials text (e.g. an SVG/icon placeholder), showing Fallback accepts arbitrary children — n/a — no — Anatomy / Prop guidance.
6. **ResponsiveImage** — `srcSet`/`sizes` usage, showing status still resolves correctly for responsive sources — n/a — no — Prop guidance (`srcSet`/`sizes`).
7. **AltTextVariations** — one variant with informative `alt="Jane Doe"` (avatar is the sole identifier) and one with `alt=""` (decorative, name shown as adjacent text) — directly documents the a11y gap identified in brief §7, since the official docs don't cover this — n/a — no — A11y contract (the mandatory decorative-vs-informative treatment).
8. **OnLoadingStatusChangeCallback** — wiring `onLoadingStatusChange` to show a custom loading indicator or log status transitions, distinct from the Fallback part itself — n/a — play (assert callback fires with each expected status) — Prop guidance / Behavior (state machine).

## 3. Real-world recreation stories

- [G] Pending Phase D (`research/d-real-world-usage/avatar/` not yet produced). No corpus signal gathered in this Tier-3 pass.

**Totals**: 8 planned. Interaction (play) stories: 3, including the mandatory image-load-fallback story (#1).
