# Progress — component research brief

Tier 3 (lean). Mined 2026-07-07 from source, docs, main test file, and a targeted issue search (read-only). Evidence tags: [E] direct evidence, [I] inference, [G] gap.

## 1. Identity

- **Name / slug**: Progress — `@base-ui/react/progress`. Multi-part compound component, namespace export `Progress.*`.
- **Status**: stable; no `[New]`/`[Preview]` tag on the docs page. [E] Introduced 2024-07-30, commit `0e60b910d`, PR #470 (`research/b-library-principles/_mining/history.md`); the commit trailer itself carries no body beyond the title.
- **Purpose / IA statement**: displays "the status of a task that takes a long time" [E] (docs Subtitle). Taxonomy: **status & display** cluster — "task completion (role=progressbar, determinate/indeterminate)" [E] (`research/a-documentation-standard/taxonomy.md`). Full progress-vs-meter comparison: [`research/c-components/_clusters/status.md`](../_clusters/status.md).
- **5 parts** (from `index.parts.ts`; one-liners from JSDoc):
  | Part | Renders | One-liner |
  |---|---|---|
  | Root | `<div>` | Groups all parts and provides the task completion status to screen readers |
  | Track | `<div>` | Contains the progress bar indicator |
  | Indicator | `<div>` | Visualizes the completion status of the task |
  | Value | `<span>` | A text element displaying the current value (`aria-hidden`) |
  | Label | `<span>` | An accessible label for the progress bar |
- Only Root is structurally required (it owns context); Track/Indicator/Value/Label are all optional in principle, though a meaningful visual bar needs at least Track+Indicator. [I] from anatomy + absence of any required-child check in Root.

## 2. Intention

- [E] **Design goal — a single `value: number | null` as the source of truth.** Source comment: "a single clamped value and normalized percentage so completion status, `aria-valuenow`, the formatted text, the default `aria-valuetext`, and the indicator width all stay in sync for any `min`/`max` (not just the default 0–100)" (`ProgressRoot.tsx`). Indeterminate is `value === null` (or any non-finite number) rather than a separate boolean prop alongside `value` — one prop drives three derived statuses (`indeterminate | progressing | complete`).
- [E] **Design goal — custom ARIA over the native `<progress>` element, defended explicitly and still contested.** A 2026-04-08 feature request (mui/base-ui#4558) asked why Base UI doesn't use native `<progress>`; maintainer reply (@mj12albert): "The native progress element has had many small issues across various browser/SR combinations, that aria progressbar implementation is a little better (though far from perfect); however it has been a number of years and the landscape may be different in 2026 ... Also for parity with Radix and React Aria." A follow-up commenter proposed a decorative-bar + visually-hidden-text alternative "to reduce custom js/css code and relying on the browser platform," unanswered as of this pass — this is a live, unresolved design tension, not settled doctrine.
- [E] **Non-goal**: not interactive/focusable — no keyboard model exists or is expected (§7).
- [G] The introducing PR #470's own body was not fetched in this pass (Tier-3 budget reserved for the issue search above instead of a second GitHub lookup); the commit trailer carries only the title.

## 3. When to use

- [E] Any long-running, async task where completion is knowable or trackable over time — uploads, downloads, exports, multi-step processing (docs keyword list: "Upload Progress," "Download Progress," "Task Status Indicator"; hero demo simulates "Export data" with an incrementing value via `setInterval`).
- [E] When a numeric position within an arbitrary range (not just 0–100) should drive ARIA + visual fill + formatted text consistently — e.g. "$30 of $100 budget" via the `format` prop (`Intl.NumberFormatOptions`), confirmed by `ProgressRoot.test.tsx`'s currency-format test block.
- [E] When completion is unknown up front but "work is happening" must still be communicated accessibly — indeterminate mode (`value={null}`) still renders `role="progressbar"` with `aria-valuetext="indeterminate progress"` by default, a stronger accessibility contract than a purely decorative spinner.

## 4. When not to use + alternatives

Full comparative guidance: [`research/c-components/_clusters/status.md`](../_clusters/status.md).

- [I] Base UI has no separate `Spinner`/`Loader` component in its 37-component surface — an indeterminate Progress is the library's answer to "just show busy," not a decorative alternative. (Confirmed by absence: no spinner/loader entry anywhere in the documented component list.)
- [E] Native `<progress>` remains a real, currently-open alternative some users request (mui/base-ui#4558) — Base UI's position is parity/consistency, not technical impossibility; teams that accept native quirks and want zero custom ARIA have a documented (if maintainer-declined) alternative.
- [I] A bounded, non-task measurement (disk usage, battery level, a score-within-a-range with no "done" state) belongs to Meter instead — see the cluster note for the full APG-grounded distinction.

## 5. Anatomy & composition

- [E] Canonical tree (docs Anatomy):
  `Root > (Label, Track > Indicator, Value)`.
- [E] **Root** renders `<div role="progressbar">`, owns all `aria-value*`/`aria-labelledby` attributes, and injects a hidden `<span role="presentation">x</span>` sibling as an NVDA screen-reader workaround (code comment: "force NVDA to read the label https://github.com/mui/base-ui/issues/4184").
- [E] **Track** is purely structural — no ARIA, no computed style; exists to give Indicator a positioning/overflow context (demo CSS sets `overflow: hidden` on it).
- [E] **Indicator** is the only part with computed inline style: determinate mode sets `{ insetInlineStart: 0, height: 'inherit', width: '${percentageValue}%' }`; indeterminate mode sets no inline style at all (`{}`), leaving any sweep animation entirely to consumer CSS — confirmed by `ProgressIndicator.test.tsx` (`toHaveComputedStyle({})` when indeterminate).
- [E] **Label** is optional; renders `role="presentation"` (not a "label" ARIA role, since none exists) — a deliberate choice tied to the NVDA fix (PR #4200), not an oversight.
- [E] **Value** is optional, always `aria-hidden="true"` — a purely visual mirror of the formatted value/percentage; supports a render-prop `children={(formattedValue, value) => ReactNode}` for custom formatting/layout.
- [E] Every part shares one `progressStateAttributesMapping` object for its `data-*` attributes (identical set on Root/Track/Indicator/Value/Label).
- Text spec for a future anatomy diagram: a vertical stack inside a box labeled "Root (div, role=progressbar)" — (1) Label (span) with a dashed arrow to "aria-labelledby" on Root, (2) Track (div) containing (3) Indicator (div, width: N%), (4) Value (span, aria-hidden). Footnote the hidden NVDA workaround span rather than treating it as a "real" part.

## 6. Behavior ("How it works")

- [E] **Controlled only, no uncontrolled mode.** `value: number | null` is a required prop with no default and no internal state fallback — the consumer always drives it (the hero demo uses `React.useState` + `setInterval`). This is a deliberate departure from B-P15 (uncontrolled-by-default): Progress has no lifecycle of its own to manage.
- [E] **Indeterminate semantics**: `value={null}` (or any non-finite number, e.g. `NaN`) sets `status: 'indeterminate'`. In that state: `percentageValue`/`clampedValue` are `null`, `aria-valuenow` is fully omitted (`undefined`, not `0`), `aria-valuetext` defaults to the literal `"indeterminate progress"`, and Indicator receives no inline style.
- [E] **Value clamping**: `value` is clamped to `[min, max]` for `aria-valuenow`, percentage, and indicator width even when the raw prop overshoots — test: `min={0} max={40} value={50}` yields `aria-valuenow="40"`, width `100%`, text `100%`. Percentage is separately clamped to `[0, 100]` and guards `NaN` when `min === max` (test: `min={5} max={5} value={5}` → `aria-valuenow="5"`, width `0%`).
- [E] **Status derivation**: `status = clampedValue === max ? 'complete' : 'progressing'` (or `'indeterminate'`); test confirms `data-complete` fires once the clamped value reaches/exceeds max, not just on exact equality.
- [E] **Formatting**: default text is the percentage-of-range via `Intl.NumberFormat(locale, { style: 'percent' })`. If `format` is supplied, the *raw* `value` (not the percentage) is formatted instead — e.g. currency. `locale` threads into `Intl.NumberFormat`, defaulting to the runtime locale; formatter instances are cached in a module-level `Map`. `format`/`locale` changes reflect immediately without a lagging commit (explicitly tested).
- [E] **`getAriaValueText` override**: consumers can fully replace `aria-valuetext` derivation via `(formattedValue, value) => string`, independent of the visible `Value` text.
- [E] **SSR — a real, currently open hydration gotcha.** Open issue mui/base-ui#4616 (filed 2026-04-14): `aria-valuetext` can mismatch between server and client because `Intl.NumberFormat(undefined, ...)` resolves the *runtime* locale on each side (e.g. server "30%" vs. client "30 %" for locales using NBSP before `%`), root-caused to the shared `formatNumber` utility. Mitigation: always pass an explicit `locale` (or a non-locale-dependent `format`) in SSR apps.

## 7. Accessibility contract

- [E] **Not interactive**: no keydown handlers, no `tabIndex` management anywhere across the five part files — matches the "read-only reflection of state" purpose.
- [E] **ARIA managed by the component**: `role="progressbar"` (Root); `aria-valuemin`/`aria-valuemax` always numeric from `min`/`max` (default 0/100); `aria-valuenow` = clamped value, or omitted when indeterminate; `aria-valuetext` = formatted percentage or `"indeterminate progress"` by default, overridable via `getAriaValueText` or a direct `aria-valuetext` passthrough; `aria-labelledby` auto-wired from `Progress.Label`'s `id` via context.
- [E] **No dedicated W3C ARIA APG pattern page exists for progressbar.** Verified live: the APG patterns index (https://www.w3.org/WAI/ARIA/apg/patterns/) lists a "Meter" pattern but no "Progressbar"/"Progress" entry — progressbar role semantics live only in the core WAI-ARIA spec (https://www.w3.org/TR/wai-aria-1.2/#progressbar), which documents `aria-valuenow` as omittable specifically to signal indeterminate state (MDN: "The read-only `aria-valuenow` should be provided and updated unless the value is indeterminate, in which case don't include the attribute"). See the cluster note for the full progress-vs-meter APG contrast.
- **Open accessibility issues (honesty list)**: [E] mui/base-ui#4184 ("[progress][meter] accessibility: NVDA and JAWS don't announce the programmatic label," filed 2026-02-24, still open) — both screen readers announced only "Progress bar N%" and ignored the `aria-labelledby`-referenced visible label; root cause per maintainer citing NVDA won't announce label associations when the labeled element has no visible text content of its own. **Partially fixed** by merged PR #4200 (the hidden-span + `role="presentation"` Label workaround now in source), but JAWS-side behavior remains outside Base UI's control and the issue is not fully closed. [E] mui/base-ui#4616 (SSR hydration mismatch, §6, open). [E] mui/base-ui#4558 (native-`<progress>` request, closed but design question left open, §2/§4).

## 8. Prop-level guidance (decision-relevant props)

- [E] **`value: number | null` (required)** — the only state-driving prop; `null`/non-finite → indeterminate. Everything else (status, percentage, `aria-valuenow`, formatted text) derives from it plus `min`/`max`/`format`.
- [E] **`min` (default `0`) / `max` (default `100`)** — range bounds; let Progress represent non-0–100 scales (byte counts, item counts) while still deriving a correct fill percentage. `status` becomes `'complete'` once the clamped value reaches `max`.
- [E] **`format` (`Intl.NumberFormatOptions`)** — overrides the default "percentage of range" text with a format applied to the raw value (currency/byte-size/unit). Without it, text always mirrors the fill percentage.
- [E] **`locale`** — passed to `Intl.NumberFormat`; defaults to runtime locale. Set explicitly in SSR apps to avoid the #4616 hydration mismatch.
- [E] **`getAriaValueText`** — full override of `aria-valuetext` derivation logic beyond formatting options alone (e.g. "3 of 10 files uploaded"); does not affect the visible `Value` text.
- [E] **Styling contract — data attributes** (from `progressStateAttributesMapping`, identical on every part): `data-progressing`, `data-complete`, `data-indeterminate` — mutually exclusive booleans per B-P13, never `data-state="value"` style.
- [E] **No CSS variables.** No `ProgressCssVars.ts` file exists anywhere in `packages/react/src/progress/`; the fill percentage is applied as a plain inline `style.width` string directly on Indicator by React, not exposed as a `--custom-property`. This is a genuine exception to B-P14 ("CSS variables carry dynamic numeric values") — consumers cannot key `calc()`/`transform` styling off a library-provided percentage variable; they either accept the width-based fill or replace `style`/`className` entirely. See the cluster note for the meter-side confirmation of the same asymmetry.

## 9. Decision log

- **2024-07-30 — Progress ships** (#470, commit `0e60b910d`): Root, Track, Indicator only at this point (per file-list evidence in the commit diff — no Value/Label yet). [E]
- **2024-12-13 — data attributes documented** (#1070, "[docs] Document data attributes on all components (part 2)"). [E]
- **~2024-12 — zero-width bug fixed** (#1204, closing #1201/#1203 "Indicator doesn't set `width: 0%` when the value is zero"): the `percentageValue == null ? {} : {...}` branch's explicit zero-handling; test-confirmed in `ProgressIndicator.test.tsx`. [E]
- **2025-02-03 — `format` prop and `Progress.Value` added** (#1355). [E]
- **2025-04-16 — `Progress.Label` and `locale` prop added** (#1666); the old `getAriaLabel` prop was removed in favor of the new Label part (`research/b-library-principles/_mining/history.md`). [E]
- **2025-07-09 — ARIA attribute fixes** (#2267, "[meter][progress] Fix ARIA attributes and update docs"). [E]
- **2026-01-21 — formatting logic de-duplicated with Meter** (#3805, "[progress][meter] De-duplicate `formatValue` function"). [E]
- **2026-02-26 — NVDA label-announcement fix** (#4200, "[meter][progress] Fix label announcements in NVDA") — the hidden-span workaround still in source today. [E]
- **2026-04-08 — native-`<progress>` request closed, design question left open** (#4558). [E]
- **2026-04-14 — SSR hydration mismatch reported, still open** (#4616). [E]
- [G] Full PR #470 body not fetched (commit trailer carries only the title) — `gh pr view 470` would be needed for the original design writeup; not spent in this Tier-3 pass.

## 10. Pitfalls & FAQ

- **SSR apps see a hydration warning on `aria-valuetext`** → pass `locale` explicitly (or a locale-independent `format`), since `Intl.NumberFormat(undefined, ...)` resolves the runtime locale differently server vs. client (mui/base-ui#4616, open). [E]
- **Screen reader labels may not announce reliably, especially historically with NVDA/JAWS** → Root ships a hidden-span + `role="presentation"` Label workaround (PR #4200), but the underlying issue (#4184) is not fully closed — verify with your target AT combination rather than assuming full coverage. [E]
- **Zero-value indicator width was a real historical bug** (#1201/#1203, fixed by #1204) — early versions didn't explicitly set `width: 0%` at `value === 0`, leaving stale width. Now covered by a dedicated test; safe today but explains why the width-computation branch exists at all. [E]
- **No CSS variable for percentage** — consumers expecting a `--progress-percentage`-style var for custom `calc()`/`transform` effects (common in some other progress libraries) will be surprised; Base UI only sets `style.width` directly. [E]
- **`Progress.Value` is always `aria-hidden`** — don't rely on it for accessible text; the accessible path is exclusively `aria-valuetext`/`aria-labelledby` on Root. [E]
- [G] No other misuse patterns found in source comments or test `describe` blocks beyond the above — searched all five `*.test.tsx` files for explanatory inline comments; none found beyond the NVDA-workaround comment already cited.

## 11. Real-world patterns observed

[G] pending Phase D. Phase D data for this component would live at `research/d-real-world-usage/progress/` (directory does not yet exist as of this pass).

## 12. Story plan pointer

See [`story-plan.md`](./story-plan.md) — 8 planned stories, including the mandatory determinate + indeterminate + play-function-asserting-`aria-valuenow` set.
