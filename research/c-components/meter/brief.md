# Meter — component research brief

Tier 3 (lean). Mined 2026-07-07 from source, docs, main test file, and a targeted issue search (read-only). Evidence tags: [E] direct evidence, [I] inference, [G] gap.

## 1. Identity

- **Name / slug**: Meter — `@base-ui/react/meter`. Multi-part compound component, namespace export `Meter.*`.
- **Status**: stable; no `[New]`/`[Preview]` tag on the docs page. [E] Introduced 2025-04-08, commit `54fd03504`, PR #1435 (alpha.8) (`research/b-library-principles/_mining/history.md`).
- **Purpose / IA statement**: "A graphical display of a numeric value within a range" [E] (docs Subtitle). Taxonomy: **status & display** cluster — "measurement within known bounds (role=meter — not a task)" [E] (`research/a-documentation-standard/taxonomy.md`). Full progress-vs-meter comparison: [`research/c-components/_clusters/status.md`](../_clusters/status.md).
- **5 parts** (from `index.parts.ts`; one-liners from JSDoc):
  | Part | Renders | One-liner |
  |---|---|---|
  | Root | `<div>` | Groups all parts and provides the value for screen readers |
  | Track | `<div>` | Contains the meter indicator and represents the entire range |
  | Indicator | `<div>` | Visualizes the position of the value along the range |
  | Value | `<span>` | A text element displaying the current value (`aria-hidden`) |
  | Label | `<span>` | An accessible label for the meter |
- Anatomy is deliberately near-identical to Progress's — see §2 — with all parts except Root optional in principle.

## 2. Intention

- [E] **Founding scope explicitly cites the APG.** The originating issue (mui/base-ui#662, "[meter] Implement Meter") links directly to the W3C ARIA APG meter pattern (https://www.w3.org/WAI/ARIA/apg/patterns/meter/) as the spec to implement against, and flags `[data-optimum]`-style styling as an open question up front.
- [E] **Design goal — shared anatomy with Progress, deliberately.** The first implementation PR (#743) states: "Uses the same anatomy as `Progress` since they are closely related." The later merge PR (#1435) repeats this and adds a `locale` prop "to match #1488."
- [E] **Native `<meter>` rejected, explicitly, with concrete named reasons.** PR #743's design summary: "Does not use the `meter` element due to cross-browser inconsistencies, attributes like `optimum` actually make the VO experience worse... styling is also annoying," citing external sources on browser meter-segment inconsistency.
- [E] **A feature was designed, then deliberately abandoned before merge — direct evidence for the "no data attributes" finding in §8.** PR #743 originally *also* implemented native `<meter>`'s high/medium/low "segmenting" via a `data-segment` attribute and a `[data-optimum]` preferred-segment indicator; both are struck through in the final PR body. This was formally split into still-open issue mui/base-ui#1434 ("[meter] Support `<meter>` element's high/low/optimum attributes"). This is not an oversight — it is a scoped-out, tracked non-goal.
- [I] **Meter is a genuinely low-discourse component.** Only a small number of issues/PRs reference it directly (mostly shared with Progress); no dedicated design RFC or blog post found beyond the PR bodies cited above. [G] Searched `research/` mining directories and GitHub issues only; did not find deeper design rationale.

## 3. When to use

- [E] Storage/disk usage — the hero demo renders `<Meter.Label>Storage Used</Meter.Label>` with `value={24}` (default max 100).
- [E] Battery level — used as the example subject in the main test suite (`<Meter.Label>Battery Level</Meter.Label>`).
- [E] General pattern from the docs keyword list: "Progress Meter, Gauge, Level Indicator, Measurement Display, Capacity Indicator, Value Indicator, Rating Meter, Fuel Gauge."
- [I] Common thread across all evidence: a **static measurement of "how much of a known, bounded quantity" at a point in time** — not a live task/process.

## 4. When not to use + alternatives

Full comparative guidance: [`research/c-components/_clusters/status.md`](../_clusters/status.md).

- [E] **Cannot represent an unknown/indeterminate amount** — `value` is a required, always-numeric prop; confirmed by an exhaustive `grep -rni indeterminate` across `packages/react/src/meter/` and the meter docs returning zero matches (a true negative, not an omission). If "unknown duration, still working" is the actual need, that's Progress's indeterminate mode, not Meter.
- [I] **Overlap with Slider**: Slider also has `min`/`max`/`value`, but Slider is interactive (draggable thumb, keyboard-operable per the APG slider pattern) while Meter is a pure display. Confirmed from source: no `tabIndex`, `onKeyDown`, `onKeyUp`, or any pointer/keyboard handler anywhere in `packages/react/src/meter/`. Meter renders `role="meter"` unconditionally with no focusability — read-only by construction, not convention.
- [I] A task moving toward completion (with or without a known endpoint) belongs to Progress instead — see the cluster note for the full APG-grounded boundary.

## 5. Anatomy & composition

- [E] Canonical tree (docs Anatomy): `Root > (Label, Track > Indicator, Value)`.
- [E] **Root** renders `<div role="meter">`, owns `aria-labelledby`/`aria-value*`, computes `formattedValue`/`percentageValue`/`clampedValue`, and — mirroring Progress — renders a hidden `<span role="presentation">` sibling purely as an NVDA workaround (source comment cross-references mui/base-ui#4184).
- [E] **Label** self-registers its `id` into Root's context (`setLabelId`/`useRegisteredLabelId`), which Root reflects as its own `aria-labelledby`. Optional part.
- [E] **Track** is a pure layout container — no injected style or ARIA.
- [E] **Indicator** is the only part with computed inline style: reads `percentageValue` from context and sets `style.width: '${percentageValue}%'` plus `insetInlineStart: 0`, `height: 'inherit'`.
- [E] **Value** renders `formattedValue` as text by default (`aria-hidden="true"` always), or supports a render-prop `children={(formattedValue, value) => ReactNode}` for custom text.
- [E] All parts require being inside `<Meter.Root>` — `useMeterRootContext()` throws `'Base UI: MeterRootContext is missing. Meter parts must be placed within <Meter.Root>.'` otherwise.
- Text spec for a future anatomy diagram: Root (div, role=meter, all `aria-value*` + `aria-labelledby`) containing Label (span, feeds `aria-labelledby`), Track (div) → nested Indicator (div, width = N%), and Value (span, `aria-hidden`) as a Root sibling to Track.

## 6. Behavior ("How it works")

- [E] **Value clamping**: `clampedValue = clamp(Number.isNaN(valueProp) ? min : valueProp, min, max)` is what's exposed as `aria-valuenow` — NaN falls back to `min`; out-of-range values clamp into `[min, max]`. The Indicator's fill percentage is computed separately via `valueToPercent(valueProp, min, max)`, itself clamped to `[0, 100]` with NaN treated as `0`. `min === max` is handled gracefully (resolves to `0%` rather than `NaN`/`Infinity` — tested explicitly).
- [E] **Formatting** uses the same shared `formatNumber` utility as Progress (de-duplicated across both in PR #3805). Without an explicit `format`, displayed/spoken value defaults to percent-of-range, not the raw value — "the text stays in sync with the indicator fill for any `min`/`max`" (source comment). With `format`, the raw `value` (not the percentage) is formatted, e.g. as currency.
- [E] **`getAriaValueText` is purely an a11y-only override** — it changes `aria-valuetext` but not the visible `Meter.Value` text; a source comment states this directly ("getAriaValueText only affects the spoken text, not the visible value") and it's confirmed by test.
- [E] **Always controlled by design, with no lifecycle to manage.** `value: number` is a required prop with no default and no uncontrolled fallback. This is a deliberate departure from B-P15 (uncontrolled-by-default) for the same reason as Progress: Meter is a pure display component reflecting caller-owned state — there is no `defaultValue`/`onValueChange` because Meter never mutates its own value.
- [E] **SSR — same shared, currently-open bug as Progress.** Locale-dependent `Intl.NumberFormat` formatting of `aria-valuetext` can hydration-mismatch when server/client default locales differ (open issue mui/base-ui#4616, filed against Progress+Meter jointly).

## 7. Accessibility contract

- [E] **Not interactive** — no keyboard interaction is expected or exists; confirmed by the total absence of `tabIndex`, key handlers, or focus management in source.
- [E] **ARIA managed by the component**: `role="meter"` (unconditional); `aria-valuemin` = `min` (default 0), `aria-valuemax` = `max` (default 100), `aria-valuenow` = clamped current value, `aria-valuetext` = formatted percent-of-range by default, or `format`-driven, or fully overridden via `getAriaValueText`; `aria-labelledby` auto-wired from `Meter.Label`.
- [E] **A dedicated W3C ARIA APG pattern page exists and was verified live: https://www.w3.org/WAI/ARIA/apg/patterns/meter/ (confirmed HTTP 200).** This is the exact URL Base UI's own founding issue (#662) cited when scoping the component. The pattern states plainly: "A meter is a graphical display of a numeric value that varies within a defined range," lists keyboard interaction as "Not applicable" (meters are non-interactive), and requires exactly `aria-valuenow`/`aria-valuemin`/`aria-valuemax` plus a label (`aria-labelledby` or `aria-label`) — matching Base UI's implementation attribute-for-attribute. The pattern explicitly distinguishes meters from progress bars, noting they should not "indicate progress, such as loading or percent completion of a task." (This corrects an initial assumption that no APG pattern exists for meter — it does, unlike progressbar; see the cluster note.)
- **Known accessibility issues (honesty list)**: [E] mui/base-ui#4184 ("[progress][meter] accessibility: NVDA and JAWS don't announce the programmatic label," open) — directly explains the hidden-span workaround in `MeterRoot.tsx` (source comment cross-references the issue number). Partially fixed by PR #4200, not fully closed. [E] mui/base-ui#4616 (SSR hydration mismatch, §6, open). [E] mui/base-ui#1434 (no ARIA-equivalent for native `<meter>` high/low/optimum "preferred segment" semantics — a sighted-user-only affordance with no accessible equivalent designed yet, open).

## 8. Prop-level guidance (decision-relevant props)

- [E] **`value: number` (required)** — no default; Meter cannot render meaningfully without it. Always reflects caller state; no internal value state exists.
- [E] **`min` (default `0`) / `max` (default `100`)** — define the measured range. `min === max` resolves to `0%` rather than dividing by zero (tested explicitly for both Root and Indicator).
- [E] **`format` (`Intl.NumberFormatOptions`)** — switches both `Meter.Value`'s text and `aria-valuetext` from percent-of-range to a raw-value format (currency, decimal, unit). Use when the raw number itself is meaningful to show, not just its position in the range.
- [E] **`locale`** — passed to `Intl.NumberFormat`; defaults to runtime locale. This is the exact mechanism behind open bug #4616 — pass an explicit `locale` in SSR apps to avoid hydration drift.
- [E] **`getAriaValueText`** — pure a11y augmentation layered on the formatted value; does not affect the visible `Value` text (§6). Use to add units/context for screen readers without changing the visible number.
- [E] **Styling contract — no data attributes at all.** Confirmed by direct file search: no `*DataAttributes.ts` file exists on any Meter part, and `grep -rn "data-"` across all Meter `.tsx` source files returns zero matches outside test files (`data-testid` only). This is a stark, deliberate contrast with Progress, which ships `data-complete`/`data-indeterminate`/`data-progressing` across all its parts — see §2 (PR #743's struck-through segment-styling feature, split into open issue #1434). **Practical implication: there is currently no built-in way to style a meter differently at low/medium/high value ranges via CSS attribute selectors** — a consumer must compute their own conditional `className`/`style` from the `value`/`min`/`max` props they already control. The `className`/`style` state-function form (B-P20) technically exists per convention, but every part's `State` interface is empty (`export interface MeterRootState {}`, confirmed identically across all parts in `types.md`), so there is literally no state to branch on today even via that form.
- [E] **No CSS variables.** No `*CssVars.ts` file exists anywhere in `packages/react/src/meter/`; the fill percentage is applied as a plain inline `style.width` string, identical mechanism to Progress. See the cluster note for the shared framing of this asymmetry against B-P14.

## 9. Decision log

- **2024-09-30 — founding issue opened** (#662, "[meter] Implement Meter"), scoping against the APG meter pattern; flags `[data-optimum]` as a TBD open question. [E]
- **2024-10-17 — first implementation PR** (#743): rejects native `<meter>`; originally includes then strikes through `data-segment`/`[data-optimum]` support. [E]
- **2025-02-10 — segment-styling non-goal formalized** (issue #1434 opened, still open): high/low/optimum ARIA-equivalent support split out as a distinct future task. [E]
- **2025-04-08 — Meter merges** (PR #1435, commit `54fd03504`, alpha.8): shares Progress's anatomy/API; adds `locale` prop. [E]
- **2025-06-03 — internal refactor** (#2052, "[meter] Refactor to `useRenderElement`") — implementation alignment, no stated behavior change. [E]
- **2025-07-09 — ARIA attribute fix** (#2267, "[meter][progress] Fix ARIA attributes and update docs"): `aria-valuenow` had previously reported a 0–100 percentage/fraction instead of the raw clamped value. [E]
- **2026-01-21 — formatting logic de-duplicated with Progress** (#3805, "[progress][meter] De-duplicate `formatValue` function"). [E]
- **2026-02-26 — NVDA label-announcement fix** (#4200, "[meter][progress] Fix label announcements in NVDA") — the hidden-span workaround still in source. [E]
- **2026-05-26 — most recent behavioral change** (#4904, "[meter] Sync value text with indicator") — tightened consistency between `Meter.Value`'s text and the Indicator's width computation. [E]
- [G] No dedicated RFC/design doc found beyond the PR bodies cited above.

## 10. Pitfalls & FAQ

- **Expecting per-value-tier styling via data attributes (e.g. "make it red when low")** → none exist today, by design (§8/§2). A consumer must compute their own class/style externally from `value`/`min`/`max`. Given Progress's richer data-attribute set sits right next to Meter in the docs, this is the most likely point of confusion. [E]
- **Assuming an indeterminate meter is possible** → it is not; `value` is required and always numeric, with no equivalent to Progress's `null`-value indeterminate state (§4, confirmed by exhaustive grep). [E]
- **SSR apps not passing an explicit `locale`** → can trigger a hydration-mismatch warning on `aria-valuetext` (mui/base-ui#4616, shared with Progress); pass `locale` explicitly as a workaround. [E]
- **Edge-case value clamping is well-tested but easy to assume otherwise**: value > max clamps to 100%/`max`; value < min clamps to 0%/`min`; `min === max` produces `0%` (not NaN/Infinity); `value = NaN` falls back to `min`/`0%` — all pinned by parametrized tests. [E]
- [G] No dedicated "Concepts"/"Guides" section exists on the meter docs page beyond anatomy/API reference — searched `page.mdx` directly; no additional FAQ-shaped content found there.

## 11. Real-world patterns observed

[G] pending Phase D. Phase D data for this component would live at `research/d-real-world-usage/meter/` (directory does not yet exist as of this pass).

## 12. Story plan pointer

See [`story-plan.md`](./story-plan.md) — 8 planned stories, including the mandatory `role="meter"` semantics story asserting the ARIA contract.
