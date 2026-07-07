# Scroll Area — story plan

Feeds Phase E. Source of truth: [`brief.md`](./brief.md). Styling: follow the docs hero demo CSS (CSS Modules, raw oklch values) — `docs/src/app/(docs)/react/components/scroll-area/demos/hero/css-modules/index.module.css`. Recreate the "both scrollbars" and "scroll fade" demos from `demos/both/` and `demos/scroll-fade/` rather than inventing new content.

## 1. Kept functionality demos (from current docs `demos/` dirs)

| Docs demo dir | Story |
|---|---|
| `demos/hero` | `Basic` (vertical-only scroll, hover/scroll-conditional scrollbar visibility) |
| `demos/both` | `BothScrollbars` (grid content, vertical + horizontal + Corner) |
| `demos/scroll-fade` | `GradientScrollFade` (mask-image driven by overflow CSS vars) |

## 2. One story per use case

Columns: name — renders — play? — doc section served.

1. **Basic** — hero recreation: Root+Viewport+Content(long paragraphs)+Scrollbar+Thumb, hover/scrolling-conditional scrollbar opacity (`[data-hovering]`/`[data-scrolling]`) — no — Hero / Anatomy / Behavior (scrolling-state timeout).
2. **VerticalOnly** — tall content, single vertical `Scrollbar` — no — Anatomy (minimal composition without Corner).
3. **HorizontalOnly** — wide content (e.g. a row of cards), single horizontal `Scrollbar`, logical CSS positioning — no — Anatomy / RTL groundwork.
4. **BothScrollbarsWithCorner** — `demos/both` recreation: 100-item grid, vertical + horizontal Scrollbar, `<ScrollArea.Corner>` — play (scroll both axes via wheel/drag; assert Corner renders only once both axes overflow, `hiddenState.corner`) — Anatomy / Corner conditional-render contract.
5. **AlwaysVisibleScrollbars** — Scrollbar styled with no `[data-hovering]`/`[data-scrolling]` opacity gating (opacity: 1 unconditionally) vs the hero's on-scroll/on-hover fade, shown side-by-side or via a toggle — no — Prop guidance §8 "no built-in always-visible prop" pitfall; documents the pure-CSS technique for the gap identified in the brief.
6. **OnScrollVisibility** — Scrollbar visible only while `[data-scrolling]` is present (not on hover), demonstrating the per-axis `scrollingX`/`scrollingY` independence — play (scroll vertical only; assert horizontal scrollbar stays hidden) — Behavior (per-axis scrolling state).
7. **OverflowDataAttributeStyling** — a story dedicated to visibly demonstrating `data-has-overflow-x/y` and `data-overflow-x/y-start/end` by rendering live badges/borders keyed to each attribute as content is scrolled — play (scroll to each edge in turn; assert attribute presence/absence transitions exactly as the brief's §6 edge-attribute test describes: start absent at rest, both present mid-scroll, end-side attribute drops out at the far edge) — Prop guidance §8 (the primary styling surface) / a11y honesty (what's programmatically exposed vs decorative).
8. **GradientScrollFade** — `demos/scroll-fade` recreation: `mask-image: linear-gradient(...)` driven by `--scroll-area-overflow-y-start`/`-end` with the documented SSR fallback (`, 40px`) — play (scroll; assert mask CSS var updates, e.g. via computed style inspection) — Examples "Gradient scroll fade" / CSS var contract.
9. **InsideAPopup** — recreates the `experiments/scroll-area/inside-menu.tsx` pattern: `Menu.Root > Menu.Popup > ScrollArea.Root` wrapping 100 `Menu.Item`s with `tabIndex={-1}` on the Viewport, noting in an adjacent doc comment that `Select.ScrollUpArrow`/`ScrollDownArrow` are a structurally separate mechanism that does not compose with `ScrollArea.*` (brief §4/§10) — play (open menu; scroll the embedded list; close) — When-not-to-use boundary / Pitfalls (don't combine both scroll mechanisms) / Behavior (focus-trap-safe `tabIndex` handling, #4220).
10. **CSPDisableStyleElements** — `<CSPProvider disableStyleElements>` wrapping a `Basic`-style scroll area, with a comment/annotation noting the consumer must now supply the `scrollbar-width: none` / `::-webkit-scrollbar{display:none}` rule externally themselves — no — CSP-relevant fact (B-P22); Anatomy §5 injected-`<style>` disclosure.
11. **RTL** — `DirectionProvider dir="rtl"` wrapping a `BothScrollbarsWithCorner`-style layout, verifying logical `insetInlineStart`/`insetInlineEnd` track placement and RTL horizontal scroll-ratio math flip — play (drag horizontal thumb; assert scroll direction matches RTL convention) — Behavior (RTL section, §6).

## 3. Real-world recreation stories

- [G] Pending Phase D — no `research/d-real-world-usage/scroll-area/` dataset exists yet (brief §11). No corpus-backed recreation stories are planned in this pass.
- If Phase D later runs, prioritize verifying the three archetypes named in the brief as [I] inference from the introducing PR: an app-shell sidebar/code-block scroll region, a dashboard panel with gradient fade, and a popup-embedded long list (story #9 above already covers the last one from first-party experiment evidence, independent of external corpus data).

**Totals**: 11 planned, 0 recreation placeholders (Phase D gap, honestly flagged rather than fabricated). Interaction (play) stories: 6 of 11.
