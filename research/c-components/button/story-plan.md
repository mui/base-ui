# Button — story plan

Tier 3 floor: hero + key-variant/use-case stories. 6 stories planned (within the 5–8 Tier-3 range). Derived from `brief.md` §3 (when to use), §6 (behavior), §8 (props), §10 (pitfalls).

| # | Name | Renders | Play function? | DoD section(s) served |
|---|---|---|---|---|
| 1 | `Hero` | The kept docs hero demo as-is (plain `<Button>`, default styling) — establishes the baseline visual and the CSS-Modules/Tailwind twin pattern per AGENTS.md | No | Hero example; identity strip |
| 2 | `Disabled` | `<Button disabled>` — native `<button>` path: `disabled` attribute set, unreachable by Tab, all handlers no-op | Yes — Tab past it, assert no focus; click, assert no `onClick` fired (brief §6, `Button.test.tsx` "native button" case) | Behavior (`disabled` semantics); a11y contract (keyboard table row 5) |
| 3 | `LoadingState` (recreate the kept docs demo) | `focusableWhenDisabled` recipe: click → enters a disabled-but-focusable loading state → recovers. Matches the existing `docs/.../button/demos/loading/` demo styling | Yes — click to trigger loading, assert `aria-disabled="true"` + `tabindex="0"` + still focusable via Tab, assert click/keydown still no-op while loading (brief §3, §6, §8) | Behavior (`focusableWhenDisabled`); prop-level guidance; the one Base UI-authored functional example worth keeping per Decision 8 |
| 4 | `CustomTagButton` | `render={<div />} nativeButton={false}` — the kept "Rendering as another tag" docs example, showing Enter/Space are still synthesized on a non-`<button>` element | Yes — focus the div-rendered button via Tab, press Enter and Space, assert activation fires both times (brief §6's `useButton` non-native Enter/Space synthesis) | Anatomy & composition (`nativeButton` convention); a11y contract (keyboard table rows 3–4) |
| 5 | `NativeButtonMismatchWarning` | Deliberately mismatched `nativeButton` vs rendered tag (e.g. `nativeButton={true}` with `render={<span/>}`) to reproduce the dev-mode `Base UI:` console warning documented in the brief | Yes — assert the console warning fires with the exact string from `useButton.ts` (brief §7, §10) | Pitfalls & FAQ; a11y contract (dev-time correctness guard) |
| 6 | `NotALink` (negative/anti-pattern demo) | Side-by-side: a real `<a>` styled to look like a button vs. `<Button render={<a href=... />}>` — visually near-identical, annotated to show why the second breaks native link semantics (brief §4, docs Usage guidelines) | No (static illustrative pair, not an interaction test) | When not to use + alternatives; a documented anti-pattern worth showing rather than only describing |

Notes:
- Story 3 recreates an existing kept functionality demo (Decision 8: keep Base UI's own high-level examples) rather than inventing a new one — mirrors the current `docs/.../button/demos/loading/` CSS Modules + Tailwind twin.
- No real-world recreation stories planned (Tier 3 floor does not require them, and no Phase D corpus exists yet for button — brief §11).
- Story 6 is illustrative rather than interaction-tested; it directly supports the single most load-bearing "when not to use" boundary in the brief (§4) and deserves visual, not just prose, treatment.
