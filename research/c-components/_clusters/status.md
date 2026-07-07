# Cluster: status — Progress vs Meter

Comparative decision guidance for Base UI's two numeric-measurement display components. Referenced by the progress and meter briefs. Mined 2026-07-07.

## What each is for (docs' own words)

- **Progress** — "Displays the status of a task that takes a long time" [E] (`docs/.../progress/page.mdx` Subtitle). A live reflection of an ongoing, asynchronous task's completion — the value is expected to change over time as the task proceeds, and completion may not be knowable up front.
- **Meter** — "A graphical display of a numeric value within a range" [E] (`docs/.../meter/page.mdx` Subtitle). A static-in-spirit measurement of a bounded quantity at a point in time (disk usage, battery level) — not a task, and not expected to necessarily trend toward a "done" state.

Taxonomy placement (both category 6, "Status & display"): progress = "task completion (role=progressbar, determinate/indeterminate)"; meter = "measurement within known bounds (role=meter — not a task)" [E] (`research/a-documentation-standard/taxonomy.md`).

## The core semantic distinction, per the W3C ARIA APG itself

[E] The APG's own Meter pattern draws this line explicitly: "A meter is a graphical display of a numeric value that varies within a defined range," and it should **not** be used to "indicate progress, such as loading or percent completion of a task" (https://www.w3.org/WAI/ARIA/apg/patterns/meter/, fetched 2026-07-07). Progress is therefore the correct choice whenever "an ongoing task, possibly of unknown duration" is the subject; Meter is correct whenever "a bounded quantity, known at read time" is the subject.

[E] This maps onto a real, cited Base UI design decision for Meter: the founding issue (mui/base-ui#662, "[meter] Implement Meter") explicitly scoped the component against the APG meter pattern URL above, and the first implementation PR (#743) is titled around building something distinct from Progress despite "us[ing] the same anatomy as Progress since they are closely related." The two components share code (a common `formatNumber` utility, later de-duplicated in PR #3805 "[progress][meter] De-duplicate `formatValue` function") but are deliberately separate components, not variants of one.

## Decision table

| Question | Progress | Meter |
|---|---|---|
| ARIA role | `role="progressbar"` [E] | `role="meter"` [E] |
| Can be indeterminate ("unknown duration/amount")? | **Yes** — `value={null}` (or any non-finite number) puts it in `indeterminate` status; `aria-valuenow` is omitted entirely in that state [E] (`ProgressRoot.tsx`, confirmed by `ProgressIndicator.test.tsx`) | **No** — `value` is a required, always-numeric prop; there is no indeterminate concept anywhere in source, tests, or docs [E] (confirmed by exhaustive `grep -rni indeterminate` on `packages/react/src/meter/` and the meter docs — zero matches, a true negative) |
| `value` required? | No explicit default, but always driven by a task's live progress; typically changes over the component's lifetime (e.g. incrementing via `setInterval` in the hero demo) [E] | Yes, required prop with no default [E] (`MeterRoot.tsx`) — reflects a read at a point in time, not a running total |
| Dedicated W3C ARIA APG pattern page? | **No** — no "Progressbar" pattern exists in the APG pattern list (verified live: the APG patterns index at https://www.w3.org/WAI/ARIA/apg/patterns/ lists Meter but no Progressbar/Progress entry; role semantics for progressbar live only in the core ARIA spec, https://www.w3.org/TR/wai-aria-1.2/#progressbar) [E, fetched 2026-07-07] | **Yes** — https://www.w3.org/WAI/ARIA/apg/patterns/meter/ (confirmed live HTTP 200, and is the exact URL Base UI's own founding issue #662 cited when scoping the component) [E] |
| Data attributes | Rich: `data-progressing` / `data-complete` / `data-indeterminate`, duplicated across Root/Track/Indicator/Value/Label via a shared `progressStateAttributesMapping` [E] (`ProgressRootDataAttributes.ts` + siblings) | **None** — no `*DataAttributes.ts` file exists anywhere under `packages/react/src/meter/`; state exists in React (`MeterRootState` etc.) but every part's state-attributes mapping is empty, so there is currently no built-in way to style a meter differently at low/medium/high value ranges via CSS attribute selectors [E] (confirmed by direct file search + `stateAttributesMapping.ts`) |
| CSS variables | **None.** No `ProgressCssVars.ts` file exists. The Indicator's fill is a plain inline `style.width: '${percentageValue}%'` set directly by React, not exposed as a `--custom-property` [E] (`ProgressIndicator.tsx`) | **None.** Identical mechanism — `MeterIndicator.tsx` sets the same plain inline `style.width` percentage, no CSS var [E] |
| Non-goal features considered and dropped | — | High/medium/low "segment" styling and an `optimum`-preferred-segment indicator (mirroring native `<meter>`'s `high`/`low`/`optimum` attributes) were designed and implemented in the original PR (#743) but struck through and deliberately dropped before merge, citing "inconsistent and incorrect browser implementations" of the native feature. Split into a still-open tracking issue, mui/base-ui#1434 [E]. This is the direct, evidenced reason Meter ships with no value-tier data attributes today — a designed-then-abandoned feature, not an oversight. |
| Native HTML element considered | `<progress>` — an open, unresolved design tension exists: a 2026-04-08 feature request (mui/base-ui#4558) asked why Base UI doesn't just use it; a maintainer defended the custom-ARIA approach citing years of native `<progress>` cross-browser/screen-reader inconsistency and "parity with Radix and React Aria" [E] | `<meter>` — PR #743's design summary states directly: "Does not use the `meter` element due to cross-browser inconsistencies, attributes like `optimum` actually make the VO experience worse... styling is also annoying" [E] |
| Known open a11y issue shared by both | mui/base-ui#4184 ("[progress][meter] accessibility: NVDA and JAWS don't announce the programmatic label") — partially mitigated in both by PR #4200, which injects a visually-hidden `<span role="presentation">` workaround span and sets `role="presentation"` on the Label part; the underlying issue remains open (JAWS-side behavior outside Base UI's control) [E] | Same issue, same PR, same partial-fix status [E] |
| Known open SSR issue shared by both | mui/base-ui#4616 — locale-dependent `Intl.NumberFormat` formatting of `aria-valuetext` can hydration-mismatch between server and client default locales (e.g. differing NBSP-before-`%` conventions); mitigate by always passing an explicit `locale` prop in SSR apps [E] | Same issue, same root cause (shared `formatNumber` utility), same mitigation [E] |

## The boundary in one sentence

[I] Synthesis of the [E] evidence above: **ask whether the number represents a task moving toward completion, possibly with an unknown finish line (→ Progress, which alone supports `value={null}` indeterminate mode), or a bounded quantity being measured/read at this moment with no notion of "done" (→ Meter, which alone matches the APG's dedicated pattern and forbids indeterminate readings).** If duration/completion is genuinely unknown but you still need to signal "something is happening," Progress in indeterminate mode is correct — Meter has no equivalent state.

## What "CSS vars matter" turned out to mean in practice

Both components' research passes were asked to pay special attention to CSS variables. The finding, independently confirmed for both: **neither component defines any `*CssVars.ts` file, and neither exposes a `--custom-property` for percentage/fill.** Both compute the Indicator's fill as a plain inline `style.width` percentage string set directly by React on render — the opposite of the CSS-variable pattern used elsewhere in the library for dynamic numeric values (e.g. Popover's `--available-height`/`--anchor-width`, per B-P14 in `research/b-library-principles/principles.md`). This is a genuine, evidenced asymmetry within the library worth surfacing rather than assuming: consumers who want `calc()`/`transform`-based custom fill effects on Progress or Meter cannot key off a library-provided CSS variable today — they must either accept the `width`-based fill or replace `style`/`className` entirely.

## Related cross-references

- Progress brief §4 (when not to use), §6 (indeterminate behavior), §8 (styling contract) link here.
- Meter brief §4 (when not to use), §6 (always-controlled/no-indeterminate design), §8 (styling contract, the null data-attributes/CSS-vars finding) link here.
- Avatar is grouped in the same taxonomy category ("status & display") but is not part of this cluster — it displays image/identity state, not a numeric measurement, and has its own brief with no comparative note.
- Shared machinery: both use a common `formatNumber` utility (de-duplicated in PR #3805) and near-identical anatomy (`Root > Label, Track > Indicator, Value`).
- [G] No maintainer statement found directly comparing Progress and Meter side-by-side in one place (e.g. an RFC or design doc) — the comparison above is synthesized from each component's own founding issues/PRs and the shared APG/ARIA spec language, not from a single source that discusses both at once.
