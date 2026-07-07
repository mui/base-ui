# Fieldset — component research brief

Tier 3 (lean brief: source + JSDoc + data attributes, docs page + forms handbook, a quick issue search). Mined 2026-07-07 from source (`packages/react/src/fieldset/`), docs (`docs/src/app/(docs)/react/components/fieldset/page.mdx` + the forms handbook's "Labeling control groups" section), tests (`FieldsetRoot.test.tsx`, `FieldsetLegend.test.tsx`), git history (`git log --grep='^\[[Ff]ieldset\]'` plus the shared Field-origin commit), and two targeted `gh` issue lookups (`gh search issues "fieldset"` + full-body reads of #3044 and #3930 — 2 of this pass's 3-lookup budget; the third went to Collapsible's #4553, reported in that brief). Builds on [`../field/brief.md`](../field/brief.md) (Tier 1) for everything about `Field.Root`/`Field.Item` that Fieldset composes with. Evidence tags: [E] direct evidence, [I] inference, [G] gap.

## 1. Identity

- **Name / subpath**: Fieldset — `@base-ui/react/fieldset`. Multi-part compound component, namespace export `Fieldset.*`, but minimal: exactly **2 parts**.
- **Parts** (`index.parts.ts`, one-liners from part JSDoc):
  - `Fieldset.Root` — "Groups a shared legend with related controls." Renders a **native `<fieldset>` element** [E] (`FieldsetRoot.tsx:9`, and confirmed by `describeConformance(..., { inheritComponent: 'fieldset', refInstanceof: window.HTMLFieldSetElement })` in `FieldsetRoot.test.tsx:14-18`).
  - `Fieldset.Legend` — "An accessible label that is automatically associated with the fieldset." Renders a **`<div>` element**, not native `<legend>` [E] (`FieldsetLegend.tsx:9-14`; confirmed `refInstanceof: window.HTMLDivElement` in `FieldsetLegend.test.tsx:9-14`). This is the single most important anatomy fact about the component — see §7 for why.
- **Status**: stable; founding-era. Fieldset was **born inside the same PR as Field**: `c51fb490a [Field] Create new Field components (#477)`, merged 2024-08-19/20 [E] (git log; corroborated by field brief §1 and `research/b-library-principles/_mining/history.md:116`, "fieldset | 2024-08-20 | c51fb490a | #477 | born inside the Field PR"). Its own type-namespace migration landed slightly later and separately: `37783b039 [Fieldset] Move types to namespaces (#711)`.
- **Taxonomy** (Phase A): selection & input → form infrastructure sub-cluster (field, fieldset, form, input). Purpose: the labeling wrapper for a **group** of related controls that share one accessible name — the multi-control counterpart to Field's single-control labeling job. IA: an always-rendered, semantically native `<fieldset>` wrapping a stylable pseudo-legend plus whatever controls (native or Base UI) belong to the group.
- **Cross-component role**: Fieldset composes *over* other Base UI roots via `render`, rather than being consumed via a shared context the way Field is consumed by every form control. Confirmed direct consumers of `useFieldsetRootContext` outside `fieldset/`: `field/root/FieldRoot.tsx` (reads Fieldset's `disabled` to decide the effective disabled state when Field is nested inside a disabling Fieldset) and `radio-group/RadioGroup.tsx` (reads `fieldsetContext` optionally, `useFieldsetRootContext(true)`) [E] (`grep -rl useFieldsetRootContext packages/react/src`). Its test suite additionally demonstrates first-class composition with `RadioGroup`, `CheckboxGroup`, and `Slider.Root` via `render` (§5).

## 2. Intention

- [E] **Origin**: no standalone "[fieldset] Implement" issue exists — Fieldset shipped as a companion to Field inside PR #477, whose body is only a preview link (same gap noted in the field brief). [G] searched `gh search issues '[fieldset] Implement'` and `git log --grep` for a dedicated Fieldset RFC/issue; found none — the component's intention has to be read off the docs subtitle and the forms handbook rather than an originating design discussion.
- [E] **Stated purpose, verbatim**: "A native fieldset element with an easily stylable legend" (`page.mdx` Subtitle) — the entire value proposition is compressed into that one sentence: keep the native `<fieldset>` (for its free, browser-native semantics — see §7) but replace the unstylable native `<legend>` with something a consumer can fully style.
- [E] **The "easily stylable legend" phrase is not marketing copy — it is a direct, maintainer-confirmed design rationale**, obtained by asking the maintainers directly: in closed issue **#3044** ("[fieldset] Why does `Fieldset.Legend` render a `div` instead of a `legend` by default?"), atomiks answered: "`<legend>` elements are hard to style/position and don't act like regular [flow] elements. The description mentions 'easily stylable legend' for this reason." [E] (`gh issue view 3044`, comment by atomiks). A follow-up questioner asked whether `aria-labelledby` on the `<fieldset>` is "equally accessible" to a native `<legend>`; mj12albert's answer cited external research directly: "There are some trade-offs between `<legend>`, `aria-label` and `aria-labelledby`: [adrianroselli.com/2022/07/use-legend-and-fieldset.html#Bugs]. None of them are perfect but it seems using `div` + `aria-labelledby` avoids the [styling issues] and minimizes the a11y issues." [E] (same issue, comment by mj12albert). This is a genuinely reasoned, trade-off-aware decision, not an oversight — and it is exactly the "does it render native fieldset/legend? verify" question this research pass was asked to check: **the answer is fieldset=yes, legend=no, by deliberate, cited design.**
- [E] **Fits the library's stated scope test** (B-P4, the (a)/(b)/(c) primitive-gating test from principles.md): native `<legend>` is precisely a case where "the HTML element can't be styled" — the same rationale that gates every other Base UI primitive. [I] connecting Fieldset's specific rationale to the library-wide pattern; no single citation states this generalization, but the parallel is exact.
- [I] **The heart of the intention**: preserve every free behavior a native `<fieldset>` gives for nothing — the browser-native `disabled` cascade to all descendant form controls (§6), the implicit grouping semantics assistive technology already understands — while replacing only the one native part (`<legend>`) that fights CSS. Inferred from the combination of (a) Root staying a real `<fieldset>`, (b) Legend becoming a `<div>` + `aria-labelledby`, and (c) the disabled-cascade tests in `FieldsetRoot.test.tsx` explicitly exercising native disabled propagation into nested Base UI roots (§6).

## 3. When to use

- [E] **One label, several controls**: "Compose `<Fieldset>` when a single label applies to multiple controls, such as a range slider with multiple thumbs or a section that combines several inputs" [E] (forms handbook, "Labeling control groups"). This is the canonical, docs-stated use case — a multi-thumb Slider and a RadioGroup are the two worked examples.
- [E] **Checkbox/radio groups specifically**: "For checkbox and radio groups, keep the group label in `<Fieldset.Legend>` and wrap each option with `<Field.Item>`" [E] (forms handbook, same section) — Fieldset supplies the *group* label; `Field.Item` (inside `Field.Root`, per field brief §5) supplies each *option's* individual label/description.
- [E] **Composing over other Base UI roots via `render`**: the documented and tested pattern is `<Fieldset.Root render={<Slider.Root />}>`, `<Fieldset.Root render={<RadioGroup />}>`, `<Fieldset.Root render={<CheckboxGroup />}>` — Fieldset.Root becomes the actual rendered `<fieldset>` element that the composed-over Root's props land on, rather than adding an extra wrapping DOM node [E] (forms handbook code samples; `FieldsetRoot.test.tsx` "passes disabled to rendered Base UI roots" exercises exactly this composition with all three).
- [I] Any grouping of native `<input>`s or plain HTML that needs one shared, stylable label and native disabled-cascade behavior, even without any Base UI form control involved (e.g. `<Fieldset.Root><Fieldset.Legend>Billing details</Fieldset.Legend><Field.Root>…</Field.Root><Field.Root>…</Field.Root></Fieldset.Root>` — the component's own hero demo, §5).

## 4. When not to use + alternatives

- **A single control needs a label → `Field.Label`, not Fieldset**: Fieldset's entire reason to exist is labeling a *group*; a lone `<input>` should use `Field.Root`/`Field.Label` (or a plain `<label>`, or `Input`'s standalone pattern — see `../input/brief.md` §5) instead of wrapping one control in a `<Fieldset.Root>` for no grouping benefit. [I] — direct consequence of the stated intention (§2); no maintainer quote directly says "don't use Fieldset for one control," but nothing in docs or tests shows a single-control Fieldset example either.
- **An architecturally unresolved boundary, disclosed honestly**: today, the validation boundary for a group of *non-identical* controls (e.g. a form section combining a text field and a checkbox) is created by `<Field.Root>` wrapping the whole `<Fieldset.Root>`, while for *identical* repeated controls (radio/checkbox groups) each option gets its own `<Field.Item>` inside the Fieldset — an asymmetry a maintainer flagged as worth reconsidering. **Open issue #3930** ("[fieldset][field] Investigate `Fieldset`s as validation boundaries", open, no comments) proposes that `<Fieldset.Root>` itself could become the validation boundary directly — sketching the target shape as `<Fieldset.Root><Fieldset.Legend/><Field.Root/><Field.Root/><Field.Root/></Fieldset.Root>` (one `Field.Root` per repeated control, nested *inside* Fieldset) versus today's actual pattern of `<Field.Root><Fieldset.Root><Fieldset.Legend/><Field.Item/><Field.Item/></Fieldset.Root></Field.Root>` (Field.Root outermost) [E] (`gh issue view 3930`, body, referencing a discussion in #3807). **This is a live, unresolved design question, not settled behavior** — treat any prose that asserts a definitive validation-boundary story for grouped-but-non-identical controls as [G], not [E].
- **Related, closed-but-declined scope requests**: `Fieldset.Description`/`Fieldset.Error` parts were requested (#3260, open, `type: enhancement`) but Fieldset ships with exactly 2 parts today — no group-level description/error part exists; per-item description/error still lives on `Field.Description`/`Field.Error` inside each `Field.Item` (field brief §5). `useFieldsetRootContext` being exposed publicly was also requested (#3262, open) — currently it is `@internal`-adjacent (imported directly from `../root/FieldsetRootContext` by Field and RadioGroup, not re-exported through `index.parts.ts`), so consumers cannot read Fieldset's `disabled` state the sanctioned way documented for other components (principles B-P11: read state via `render`'s `state` argument or data attributes — `data-disabled` is exactly this escape hatch, see §8).

## 5. Anatomy & composition

```jsx
import { Fieldset } from '@base-ui/react/fieldset';

<Fieldset.Root>
  <Fieldset.Legend />
</Fieldset.Root>;
```

(docs Anatomy, `page.mdx:16-24` — only 2 parts, so the anatomy section is intentionally minimal compared to popup components.)

- **Hero demo composition** (`docs/.../fieldset/demos/hero/css-modules/index.tsx`) — Fieldset wrapping two independent `Field.Root`s, no other Base UI root composed via `render`:
  ```jsx
  <Fieldset.Root className={styles.Fieldset}>
    <Fieldset.Legend className={styles.Legend}>Billing details</Fieldset.Legend>
    <Field.Root className={styles.Field}>
      <Field.Label className={styles.Label}>Company</Field.Label>
      <Field.Control placeholder="Enter company name" className={styles.Input} />
    </Field.Root>
    <Field.Root className={styles.Field}>
      <Field.Label className={styles.Label}>Tax ID</Field.Label>
      <Field.Control placeholder="Enter fiscal number" className={styles.Input} />
    </Field.Root>
  </Fieldset.Root>
  ```
  [E] This is the simplest legitimate use: two unrelated-but-co-located fields sharing one visual/semantic section heading ("Billing details"), each still independently labeled and validated by its own `Field.Root`.
- **Group-labeling composition** (forms handbook, canonical and tested) — `Field.Root` outermost (today's actual validation-boundary pattern, see §4), `Fieldset.Root` composed via `render` over the group Root, `Fieldset.Legend` as the group's visible/accessible name, then either bare Base UI item roots (Slider thumbs) or `Field.Item`-wrapped options (radio/checkbox):
  ```jsx
  <Field.Root>
    <Fieldset.Root render={<Slider.Root />}>
      <Fieldset.Legend>Price range</Fieldset.Legend>
      <Slider.Control>
        <Slider.Track>
          <Slider.Thumb aria-label="Minimum price" />
          <Slider.Thumb aria-label="Maximum price" />
        </Slider.Track>
      </Slider.Control>
    </Fieldset.Root>
  </Field.Root>
  ```
  and, for checkbox/radio groups, `Field.Item` wraps each option:
  ```jsx
  <Field.Root>
    <Fieldset.Root render={<CheckboxGroup />}>
      <Fieldset.Legend>Backup schedule</Fieldset.Legend>
      <Field.Item>
        <Checkbox.Root value="daily" />
        <Field.Label>Daily</Field.Label>
        <Field.Description>Daily at 00:00</Field.Description>
      </Field.Item>
      <Field.Item>
        <Checkbox.Root value="monthly" />
        <Field.Label>Monthly</Field.Label>
        <Field.Description>On the 5th of every month at 23:59</Field.Description>
      </Field.Item>
    </Fieldset.Root>
  </Field.Root>
  ```
  [E] both blocks verbatim from the forms handbook's "Labeling control groups" section.
- **`render`-composition mechanics**: `Fieldset.Root` becomes the literal element the composed-over Root's own root renders as (the standard Base UI `render` grammar, principles B-P9) — confirmed for `RadioGroup`, `CheckboxGroup`, and `Slider.Root` in `FieldsetRoot.test.tsx`'s "passes disabled to rendered Base UI roots" test, which asserts the resulting elements carry `aria-disabled="true"` (RadioGroup) or `data-disabled` (Checkbox/Slider) after `<Fieldset.Root disabled render={<RadioGroup />} />`.
- **Legend registration**: `Fieldset.Legend` writes its id into `FieldsetRootContext.setLegendId` via `useIsoLayoutEffect` on mount and clears it on unmount [E] (`FieldsetLegend.tsx:25-30`) — `Fieldset.Root` then sets `aria-labelledby={legendId}` on the rendered `<fieldset>` (`FieldsetRoot.tsx:39`). This mirrors Field's Label→Control registration pattern (field brief §5) but is a much simpler single-value context slot rather than a full `LabelableProvider`.
- **Nested fieldsets**: `useFieldsetRootContext(true)` (the optional-context overload) lets a `Fieldset.Root` read an ancestor Fieldset's `disabled` state without throwing when no ancestor exists — `parentDisabled || disabledProp` (`FieldsetRoot.tsx:27-28`) — enabling arbitrarily nested Fieldsets where an outer `disabled` cascades to every inner one regardless of the inner ones' own `disabled` prop value [E] (`FieldsetRoot.test.tsx` "keeps nested fieldsets disabled when an ancestor fieldset is disabled").
- **Visual anatomy diagram spec**: (1) an outer box representing the native `<fieldset>` boundary (visually near-invisible by default — native fieldsets have default browser padding/border that most consumers reset) → (2) the Legend `<div>` positioned wherever CSS places it (not constrained to the native legend's forced top-left placement) → (3) an arrow from Legend to Root labeled `aria-labelledby` → (4) the grouped controls inside, shown either as bare Field.Root islands (hero-demo shape) or as a composed-over Root (RadioGroup/CheckboxGroup/Slider.Root, handbook shape) with per-item Field.Item boxes when applicable.

## 6. Behavior ("How it works")

- [E] **Native `disabled` cascade, not just a React-context relay**: `Fieldset.Root` sets the real `disabled` attribute on the rendered `<fieldset>` DOM node (`FieldsetRoot.tsx:41`) — this means descendant native `<input>`/`<button>`/etc. are disabled by the browser's own fieldset-disabling behavior, independent of whatever Base UI does in React. Base UI's own controls additionally read the cascaded state through their own `disabled` prop resolution (e.g. Field reads `useFieldsetRootContext(true)?.disabled`, per the field brief's note "a Fieldset's `disabled` cascades into every Field inside") — so the disabling is enforced twice, redundantly and consistently, once by the platform and once by the React tree. [E] (`FieldsetRoot.test.tsx` "sets the native disabled attribute": `expect(screen.getByTestId('fieldset')).toHaveAttribute('disabled'); expect(screen.getByRole('textbox')).toBeDisabled();` — the inner `<input>` is disabled with zero Base UI wiring at all, purely via native cascade).
- [E] **Ancestor-Fieldset disabled always wins**: `parentDisabled || disabledProp` — an outer `disabled` Fieldset forces every nested Fieldset (and everything inside them) disabled regardless of the inner Fieldset's own `disabled={false}` (or omitted) prop (`FieldsetRoot.tsx:27-28`; test "keeps nested fieldsets disabled when an ancestor fieldset is disabled").
- [E] **Composing-over disabled semantics differ by target**: when Fieldset is composed via `render` over `RadioGroup`, the resulting element gets `aria-disabled="true"` (RadioGroup's own disabled convention); over `CheckboxGroup`/`Slider.Root`, the resulting elements get `data-disabled` on the relevant descendant (Checkbox.Root, Slider.Control) — Fieldset itself doesn't normalize these; it simply passes `disabled` through to whatever it's composed over, and that target's own disabled convention determines the resulting attribute [E] (`FieldsetRoot.test.tsx` "passes disabled to rendered Base UI roots").
- [E] **No state machine, no validation, no open/close semantics of its own**: Fieldset's `FieldsetRootState`/`FieldsetLegendState` interfaces contain exactly one field, `disabled: boolean` (`FieldsetRoot.tsx:60-65`, `FieldsetLegend.tsx:45-50`) — there is no `valid`/`touched`/`dirty`/`focused` state anywhere in Fieldset; all of that machinery belongs to `Field.Root` (field brief §6), and Fieldset never reads or writes it.
- [E] **SSR**: `aria-labelledby` is not set on the rendered `<fieldset>` until the Legend has mounted and registered its id via the layout effect — `FieldsetLegend.test.tsx`'s SSR suite confirms `aria-labelledby` is absent immediately after `renderToString` and only appears after `hydrate()` resolves (`it.skipIf(isJSDOM)('sets aria-labelledby after hydration...')`), mirroring the same pre-hydration-absence pattern the field brief documents for `Field.Root`'s label linkage (field brief §6, "does not set `aria-labelledby` during SSR when Field.Label is absent").
- [E] **Missing-context error is loud and specific**: rendering `<Fieldset.Legend />` outside `<Fieldset.Root>` throws `'Base UI: FieldsetRootContext is missing. Fieldset parts must be placed within <Fieldset.Root>.'` [E] (`FieldsetRootContext.ts:17-19`; pinned by `FieldsetLegend.test.tsx` "throws a descriptive error when rendered outside <Fieldset.Root>") — follows the library's three-part error contract (principles B-P7: say what happened, why it matters, how to fix it) and the `Base UI:`-prefix house rule.

## 7. Accessibility contract

Fieldset has no ARIA APG widget pattern of its own — it renders the platform's own grouping element and augments only the one part (the legend) that the platform can't style. The relevant reference is the WAI Forms Tutorial / WCAG "Labeling" guidance, plus the exact maintainer-cited external source on the trade-off (below).

**Does Fieldset render native `<fieldset>`/`<legend>`? — verified directly:**

| Part | Native element? | Verified by |
|---|---|---|
| `Fieldset.Root` | **Yes** — real `<fieldset>` | `describeConformance` `inheritComponent: 'fieldset'`, `refInstanceof: window.HTMLFieldSetElement` (`FieldsetRoot.test.tsx:14-18`); native `disabled` attribute test (§6) |
| `Fieldset.Legend` | **No** — a `<div>`, not `<legend>` | `describeConformance` `refInstanceof: window.HTMLDivElement` (`FieldsetLegend.test.tsx:9-14`); JSDoc "Renders a `<div>` element" (`FieldsetLegend.tsx:9-13`) |

- [E] **The div-not-legend decision is deliberate and cited, not an oversight**: see §2 for the full atomiks/mj12albert exchange in issue #3044. Key restatement for the a11y contract specifically: native `<legend>` has real accessibility trade-offs of its own (documented externally at adrianroselli.com/2022/07/use-legend-and-fieldset.html, cited directly by mj12albert) — Base UI's chosen alternative (`<fieldset>` + `<div aria-labelledby>`) is presented as "not perfect" but preferable on balance, avoiding both `<legend>`'s styling bugs and (per mj12albert) "minimiz[ing] the a11y issues" relative to the alternatives considered.
- [E] **What Fieldset manages automatically**: `Fieldset.Root` sets `aria-labelledby` pointing at `Fieldset.Legend`'s id, auto-registered via the layout-effect mount/unmount pattern (§5, §6) — functionally equivalent to what a native `<legend>` gives for free, delivered instead through the ARIA relationship.
- [E] **Native fieldset semantics preserved for free**: because Root really is a `<fieldset>`, assistive technology that already understands native fieldset grouping (announcing entry/exit of the group, associating the accessible name) continues to work without Base UI reimplementing that logic — only the legend's *rendering*, not the group's *semantics*, was replaced.
- **Keyboard interaction**: none of its own — Fieldset adds no bindings; everything belongs to whatever controls are grouped inside it.
- **Known issues / honesty**: [E] the validation-boundary question (#3930, §4) is the main open architectural gap, not an accessibility bug per se, but it affects where `aria-describedby`/error announcements land for non-identical grouped controls. [E] `Fieldset.Description`/`Fieldset.Error` remain unshipped (#3260, open) — meaning a11y-relevant group-level description/error text has no dedicated Fieldset part today; authors must place such text manually (e.g., as a paragraph referenced by the Fieldset's own `aria-describedby`, unautomated) or rely entirely on per-item `Field.Description`/`Field.Error` inside `Field.Item`.

## 8. Prop-level guidance

Fieldset's prop surface is intentionally tiny — this is a lean component with few decision points.

**`Fieldset.Root`**
- `disabled` (default `false`) — cascades natively to every descendant form control via the real `<fieldset disabled>` attribute (§6), and cascades to nested `Fieldset.Root`s via context regardless of their own `disabled` value. Use it once at the top of a form section to disable an entire group; don't also set `disabled` redundantly on every inner control unless you specifically want a control disabled independent of the group's state (setting an inner control's own `disabled={true}` still works when the outer group is enabled — only the *outer-disabled-wins* direction is forced).
- `render` — the sanctioned way to compose Fieldset's labeling/disabled-cascade behavior *onto* another Base UI Root component (RadioGroup, CheckboxGroup, Slider.Root are the tested/documented targets) rather than adding an extra wrapping DOM element. Use this whenever the group being labeled is itself a Base UI compound component with its own Root; when the group is just loose Field.Roots or plain HTML (hero-demo shape), omit `render` and let Fieldset.Root render its own bare `<fieldset>`.

**`Fieldset.Legend`**
- `id` — settable explicitly; if omitted, an auto-generated id is used (`useBaseUiId`) and the same registration/`aria-labelledby` wiring applies either way (`FieldsetLegend.test.tsx` exercises both the auto-id and custom-id paths identically).
- No styling-relevant prop beyond the inherited `className`/`style`/`render` — there are **no `Fieldset*CssVars.ts` or dedicated data-attribute files** beyond the one `disabled` state, confirmed by `find packages/react/src/fieldset -name "*DataAttributes*" -o -name "*CssVars*"` returning nothing. The only styling hook either part exposes is the generic `data-disabled` attribute that `useRenderElement`'s default state-attribute mapping derives from `state.disabled` on both `Root` and `Legend` [I] — inferred from both state interfaces containing only `disabled: boolean` and no custom `stateAttributesMapping` being passed to either part's `useRenderElement` call (contrast Collapsible, which passes an explicit `stateAttributesMapping` — see `../collapsible/brief.md` §8).

## 9. Decision log

- **2024-08-19/20** — Fieldset created alongside Field in the same PR — `c51fb490a`, [#477](https://github.com/mui/base-ui/pull/477). [E]
- **2024-XX** — `[Fieldset] Move types to namespaces` — `37783b039`, [#711](https://github.com/mui/base-ui/pull/711) — the `Fieldset.Root`/`Fieldset.Legend` namespace-type pattern formalized shortly after launch, matching the library-wide TypeScript grammar (principles B-P19). [E]
- **~2024-2025 — `[Fieldset] Render `div` for `Legend` part`** — `c2601b2b3`, [#944](https://github.com/mui/base-ui/pull/944) — the exact commit implementing the div-not-legend decision later explained in issue #3044 (§2, §7). This is the single most consequential decision in Fieldset's history and the one this research pass was specifically asked to verify. [E]
- **2025-06 — `[core] Prefix `id`s`** — `946c69210`, [#939](https://github.com/mui/base-ui/pull/939) — part of a library-wide id-generation convention change that touches Legend's auto-id path. [E]
- **2025-10 — `[Field][Fieldset] Refactor to `useRenderElement``** — `6299ede58`, [#1870](https://github.com/mui/base-ui/pull/1870) — internal rendering-pipeline modernization, no public API change. [E]
- **2026-06 — `[fieldset] Fix disabled fieldset form bugs`** — `c779f6bc1`, [#4890](https://github.com/mui/base-ui/pull/4890) — the most recent Fieldset-scoped fix, addressing form-submission bugs tied to the disabled cascade; cross-references the same v1.6.0 disabled-validation regression the field brief documents being fixed by #5116 shortly after (field brief §9, "2026-06 (v1.6.0 regression → fix)"). [E] — [I] the two fixes (#4890/fieldset, #5116/field) plausibly address the same underlying regression wave from different component angles, but this brief did not verify the exact relationship between the two PR bodies; flagged rather than asserted.
- **Open, unresolved as of this writing**: #3930 (validation-boundary architecture, §4) and #3260/#3262 (Description/Error parts; public `useFieldsetRootContext` export) remain open feature requests with no committed direction yet. [E]

## 10. Pitfalls & FAQ

1. **"Why does `Fieldset.Legend` render a `<div>` instead of `<legend>`?"** → deliberate: native `<legend>` is hard to style/position and doesn't behave like a normal flow element; `<div>` + `aria-labelledby` was chosen after weighing the a11y trade-offs of `<legend>` vs `aria-label` vs `aria-labelledby` and judged to minimize accessibility issues while fully solving the styling problem [E] (#3044, atomiks + mj12albert, citing adrianroselli.com).
2. **"How do I label a group of otherwise-identical controls (radio/checkbox group) vs. a group of different controls?"** → for identical repeated controls, wrap each option in `Field.Item` inside the Fieldset; for a heterogeneous section (e.g. several unrelated fields under one heading), just nest independent `Field.Root`s inside the Fieldset with no `Field.Item` involved (§5, both patterns shown). The validation-boundary question for the heterogeneous case is still open — see #3930 — don't assume a settled "one right way."
3. **"My nested Fieldset won't re-enable even though I didn't set `disabled` on it"** → correct, expected behavior: an ancestor Fieldset's `disabled={true}` always wins over a descendant Fieldset's own `disabled` value (§6; test-pinned).
4. **"I composed Fieldset over my custom component via `render` and disabled isn't propagating the way I expected"** → check which disabled convention your composed-over component actually uses (`aria-disabled` vs `data-disabled` vs a plain DOM `disabled` attribute) — Fieldset passes `disabled` straight through; it does not normalize the resulting attribute shape across different composed-over targets (§6, RadioGroup vs CheckboxGroup/Slider examples differ).
5. **"I want group-level error/description text"** → no dedicated part exists yet (`Fieldset.Description`/`Fieldset.Error` are an open, uncommitted request, #3260); today, description/error text lives per-item via `Field.Description`/`Field.Error` inside each `Field.Item`, or must be wired manually at the group level.
6. **"I need to read Fieldset's `disabled` state from outside (e.g., in a sibling component)"** → no public API for this today; `useFieldsetRootContext` is not re-exported through `index.parts.ts` and its public exposure is an open request (#3262). Use the `data-disabled` attribute (styling) or lift the disabled state into your own component if you need to read it programmatically.

## 11. Real-world patterns observed

[G] pending Phase D. No per-component candidates.json/ranked.json exists yet for `fieldset` at time of writing (Tier-3 cap: ≤20 candidates, top ~5, no screenshots — mining not yet run). Expected archetypes to verify once run: billing/checkout form sections (the component's own hero demo shape — heterogeneous fields under one heading); settings-page grouped radio/checkbox sections (the forms-handbook shape); multi-thumb range-filter sections in e-commerce/dashboard UIs (the Slider composition example) — these three map directly onto the three composition patterns already evidenced in §5.

## 12. Story plan

See [story-plan.md](./story-plan.md) — 5 stories: legend + grouped heterogeneous fields (hero-demo shape), radio-group composition via `render` with Field.Item labeling, checkbox-group composition via `render` with Field.Item labeling, disabled cascade (nested Fieldsets + composed-over Base UI roots), and Slider multi-thumb composition (the handbook's third worked example, included because it's the only evidenced case of Fieldset grouping non-repeated, non-Field.Item controls via `render`).
