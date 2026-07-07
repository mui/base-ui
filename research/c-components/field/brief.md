# Field — component research brief

Tier 1 (researched together with **form**; see `../form/brief.md`). Mined 2026-07-07 from source (`packages/react/src/field/`), docs (`docs/src/app/(docs)/react/components/field/page.mdx`), the forms handbook (`docs/src/app/(docs)/react/handbook/forms/page.mdx`), tests, experiments (`docs/src/app/(private)/experiments/forms/`), git history (`[field]` scope, 31 commits + introducing `[Field]` commit), and upstream issues/PRs via `gh` (cached in `research/b-library-principles/_mining/_cache/fieldform/`). Evidence tags: [E] direct evidence, [I] inference, [G] gap. Builds on principles.md §6 (B-P29–B-P34).

## 1. Identity

- **Name / subpath**: Field — `@base-ui/react/field`. Multi-part compound component exported as a namespace.
- **Parts** (from `index.parts.ts`, JSDoc one-liners from source):
  - `Field.Root` — "Groups all parts of the field." Renders `<div>`. Owns the state machine (touched/dirty/filled/focused/valid) and validation; provides `FieldRootContext` + `LabelableProvider`.
  - `Field.Label` — "An accessible label that is automatically associated with the field control." Renders `<label>` (auto `htmlFor`).
  - `Field.Control` — "The form control to label and validate." Renders `<input>`. **Optional**: "You can omit this part and use any Base UI input component instead. For example, Input, Checkbox, or Select, among others, will work with Field out of the box." [E] (`FieldControl.tsx` JSDoc).
  - `Field.Description` — "A paragraph with additional information about the field." Renders `<p>`; auto-joins `aria-describedby`.
  - `Field.Error` — "An error message displayed if the field control fails validation." Renders `<div>`; auto-joins `aria-describedby`; animatable (transition status).
  - `Field.Item` — "Groups individual items in a checkbox group or radio group with a label and description." Renders `<div>`. Added post-1.0 (v1.2.0, PR #2810).
  - `Field.Validity` — "Used to display a custom message based on the field's validity. Requires `children` to be a function." Renders **no element** — a render-prop window into `FieldValidityState`.
- **Status**: stable; founding-era. Created 2024-08-20, commit c51fb490a `[Field] Create new Field components` ([mui/base-ui#477](https://github.com/mui/base-ui/pull/477), atomiks). Fieldset was born inside the same PR [E] (history.md component table).
- **Taxonomy** (Phase A): selection & input → **form infrastructure** sub-cluster (field, fieldset, form, input). Purpose: the labeling-and-validation wrapper for exactly one logical form value. IA: an invisible-by-default `<div>` grouping label, control, description, and error for a single named control; the unit that `<Form>` aggregates.
- **Cross-component role**: Field is the integration bus for every Base UI form control. Components consuming `FieldRootContext` directly: checkbox, checkbox-group, combobox (and autocomplete via combobox), number-field, otp-field, radio, radio-group, select, slider, switch [E] (grep `useFieldRootContext` outside `field/`); `Input` literally extends `Field.Control` (`packages/react/src/input/Input.tsx` imports `Field` and `InputState extends FieldControlState`) [E].

## 2. Intention

- [E] **Origin**: PR #477 (atomiks, merged 2024-08-19) "[Field] Create new `Field` components" — body is only a preview link; the intention is carried by the docs subtitle it shipped: "A component that provides labeling and validation for form controls" (`page.mdx`). No standalone "[field] Implement" issue found ([G] — searched `gh search issues '[field] Implement'`; only #1996/#185 matched, neither is the origin).
- [E] **Extend the platform, don't replace it**: "Base UI form control components extend the native [constraint validation API] so you can build forms for collecting user input or providing control over an interface. They also integrate seamlessly with third-party libraries like React Hook Form and TanStack Form" (forms handbook, added in #2989). Concretely: `Field.Root` mirrors the full `ValidityState` (badInput…valueMissing) in `validityData.state`, and custom `validate` results are written back via `element.setCustomValidity()` [E] (`useFieldValidation.ts`).
- [E] **Accessibility is the reason the component exists**: "Form controls must have an accessible name in order to be recognized by assistive technologies" (forms handbook); "Base UI provides components like Form, Input, Field, Fieldset to automatically associate form controls" (accessibility overview page). The association machinery (ids, `htmlFor`, `aria-describedby`, `aria-labelledby`) is Field's core deliverable.
- [E] **Native-feeling validation UX, deliberately quiet**: the default `validationMode: 'onSubmit'` "matches native form submission behavior and the defaults of RA, Ariakit and react-hook-form" (PR #3013, mj12albert, breaking in beta.5); the motivating issue calls it "an option that's even less noisy than `onBlur` validation and closer to a native form submission", citing Adam Silver's "The problem with live validation" ([mui/base-ui#2142](https://github.com/mui/base-ui/issues/2142)). The same philosophy shows earlier: "Only make `valueMissing` mark the field invalid if it's been changed to reduce error noise" (source comment; PRs #1810, #1840).
- [E] **First-class adapter for external form libraries**: `dirty`/`touched` controlled props exist because "both react-hook-form and Tanstack form provide these two states in their API" and "Tanstack form treats 'dirty' differently from RHF" (PR #2950); `invalid` exists to be "controlled by an external library" (prop JSDoc). Disabled-field semantics were aligned with RHF: "This lines up with React Hook Form, which skips validation on disabled fields but keeps errors set by the app" (PR #5116).
- [I] **The heart of the intention**: one Field = one named form value, with the library owning the tedious parts — id wiring, ARIA relationships, ValidityState plumbing, and an interaction-state machine (touched/dirty/filled/focused/valid) exposed uniformly as data attributes for styling — while staying agnostic about what the control is (native input, any Base UI control, or a custom control via `render`). Inferred from the LabelableProvider/registration architecture (#2810, #4481) and the Control JSDoc.

## 3. When to use

- [E] Any labeled form control: the forms handbook's labeling table prescribes `<Field.Label>` (or native `<label>`) for Input, NumberField, OTPField, Autocomplete, Combobox (input outside popup), Checkbox, Radio, Switch — and implicit wrapping for Checkbox/Radio/Switch (forms handbook; implicit labels via PR #2036).
- [E] When you need validation display: `required`/`pattern`/`type` native constraints plus a custom `validate` function, rendered by `Field.Error` (hero demo: `required` + `match="valueMissing"`).
- [E] Inside `<Form>` for submit-gated validation and server-error display: "Pass the `name` prop to `<Field.Root>` to include the wrapped control's value when a parent form is submitted" (forms handbook).
- [E] With React Hook Form / TanStack Form: map `<Controller>`/`<form.Field>` render props onto `Field.Root` (`invalid`, `touched`, `dirty`, `name`) and `Field.Control` (`ref`, `value`, `onBlur`, `onChange`→`onValueChange`); `<Field.Error match={!!error}>` delegates error rendering (forms handbook RHF/TanStack sections).
- [E] Labeling options inside checkbox/radio groups: `Field.Item` "should enclose each checkbox or radio option so every control has its own label and description" (forms handbook; PR #2810).
- [E] Custom controls: `Field.Control render={<textarea />}` participates fully in Field state/validation (maintainer answer in [mui/base-ui#1996](https://github.com/mui/base-ui/issues/1996)).
- [I] Standalone (no `<Form>`) for single-input surfaces — but only with `validationMode="onChange"`/`"onBlur"` or `actionsRef.validate()`, since the default `onSubmit` mode needs a Form submit to fire (see Pitfall 1).

## 4. When not to use + alternatives

- **One label for multiple controls → Fieldset**: "Compose `<Fieldset>` when a single label applies to multiple controls, such as a range slider with multiple thumbs or a section that combines several inputs. For checkbox and radio groups, keep the group label in `<Fieldset.Legend>` and wrap each option with `<Field.Item>`" [E] (forms handbook). Fieldset composes over other roots via `render` (`<Fieldset.Root render={<RadioGroup />}>`) [E].
- **Two independent controls → two Fields**: wrapping `Select` and `Checkbox` under one `<Field.Root>` caused an update loop and is not a supported shape — one field = one logical value [E] ([mui/base-ui#3928](https://github.com/mui/base-ui/issues/3928), closed fixed; the fix makes the last registration win rather than blessing the pattern) [I on the norm].
- **Form-level/schema validation → not Field's job**: there is no schema prop; Standard Schema support is an open request ([mui/base-ui#4737](https://github.com/mui/base-ui/issues/4737), open). Today: per-field `validate` (which receives all `formValues` for cross-field rules, #1941), or run Zod at submit/server time and feed `<Form errors>` (form docs "Using with Zod").
- **A form library already owns validation state → don't double-validate**: drive Field with `invalid`/`dirty`/`touched` + `match` instead of `validate`; "For React Hook Form to focus invalid fields… you must ensure that any wrapping components forward the `ref`" [E] (forms handbook).
- **Plain text next to an input is not a substitute**: without Field (or manual ids), Description/Error text is not programmatically associated; the a11y machinery is the point [I from accessibility overview statement].

## 5. Anatomy & composition

```jsx
<Field.Root>            // div; state machine + validation + name; context provider
  <Field.Label />       // label; htmlFor auto-wired
  <Field.Control />     // input; OR any Base UI form control; OR render={<textarea/>}
  <Field.Description /> // p; joins aria-describedby
  <Field.Error />       // div; conditional on validity; joins aria-describedby
  <Field.Validity />    // render-prop, no DOM
</Field.Root>
```

(`page.mdx` anatomy adds `<Field.Item />` in the list; Item is only meaningful inside checkbox/radio groups.)

- **The control slot is polymorphic by registration, not by prop**: `Field.Root` wraps children in `LabelableProvider` (`FieldRoot.tsx`); any control registers itself (id, ref, `getValue`, name) via the internal `useRegisterFieldControl`, and Label/Description/Error read/write the shared context (`labelId`, `messageIds`, `controlId`). This is why "Input, Checkbox, or Select… work with Field out of the box" without a wiring prop [E] (source; PR #2810 "a `LabelableProvider` is split off from FieldRootContext"; PR #4481 moved registration into Field.Root).
- **Group anatomy** (checkbox group / radio group): Fieldset provides the group label; each option gets its own `Field.Item` with `Field.Label` + `Field.Description` [E] (PR #2810 body carries the canonical JSX: `Field.Root > RadioGroup > Field.Item > (Radio.Root + Field.Label + Field.Description)`). `Field.Item` opens a *nested* `LabelableProvider`, so item-level descriptions attach to the item control while the root-level ones attach to the group — parent `messageIds` are merged into `aria-describedby` (`LabelableProvider.getDescriptionProps`).
- **Implicit label**: for Checkbox/Radio/Switch, `Field.Label` may *enclose* the control instead of preceding it [E] (forms handbook; PR #2036).
- **Visual anatomy diagram spec**: (1) Root box outlining the whole unit → (2) Label above → (3) Control (show swap variants: input / select trigger / checkbox) → (4) Description below → (5) Error below, styled by `data-invalid` → (6) side panel: the id/aria wiring arrows (Label→htmlFor→Control; Description+Error→aria-describedby→Control).
- **Hidden inputs** (context for what Field validates against): "Base UI form components use a hidden input to participate in native form submission and validation. To anchor the hidden input near a control so the native validation bubble points to the correct area… wrap controls in a relatively positioned container" [E] (forms handbook).

## 6. Behavior ("How it works")

**The interaction-state machine** (all tri-state `valid`, boolean rest; `FieldRoot.tsx`):

| state | set when | cleared when |
|---|---|---|
| `touched` | control blurs; also Enter keydown on an input | never (per mount) |
| `dirty` | value ≠ initial value | value returns to initial |
| `filled` | value non-empty (tracks external/controlled changes too) | value emptied |
| `focused` | control focus (incl. `autoFocus` in SSR, #3871) | blur |
| `valid` | `null` until first validation (or while disabled); then boolean | re-validation |

**Validation lifecycle** (`useFieldValidation.ts`):

1. Native constraint validation runs first — the control's `ValidityState` is snapshotted into `validityData.state`.
2. The custom `validate(value, formValues)` runs **only after native validations pass** (or when validating on change) [E] — PR #1926 "[field] Run validate function after native validations", closing [mui/base-ui#1904](https://github.com/mui/base-ui/issues/1904) which asked exactly for this ordering.
3. `validate` returns `string | string[] | null` (or a Promise of those); non-null → `customError: true` + `element.setCustomValidity(...)` so native validity stays in sync; `null` → custom validity cleared.
4. `formValues` (2nd argument) contains every named field's current value — "enables validating a field based on the value of another field, e.g. `confirmPassword` and `password`" [E] (PR #1941).
5. Async: supported, with a commit-id guard that discards stale results (tested: "ignores stale async validation results") — but async results **cannot block form submission** in `onSubmit` mode (prop JSDoc: "Asynchronous functions are supported, but they do not prevent form submission"; `Form.tsx` comment: "Async validation isn't supported to stop the submit event").

**Validation modes** (`validationMode`, default `'onSubmit'`, inherits from `<Form>`; Field's own prop wins [E] prop JSDoc):

- `onSubmit`: nothing until the Form submit; afterwards invalid fields **revalidate on every change** (`shouldValidateOnChange = onChange || (onSubmit && submitAttempted)`).
- `onBlur`: commits validation when the control blurs.
- `onChange`: validates every change; `validationDebounceTime` (ms, default 0) debounces the commit "in use cases such as asynchronous requests" [E] (handbook) — debounce only applies to non-empty values (`change()` in source).
- **Noise reduction regardless of mode**: an untouched, never-dirtied field is *not* marked invalid for `valueMissing` alone (#1810); on change between commits, only the `valueMissing` resolution is re-checked optimistically — other native errors (e.g. `typeMismatch`) wait for blur/submit so users aren't "scolded" mid-typing [E] (source comments; PR #1840 "Revalidate only `required` on change"; regression-fixed in #4995).
- Enter inside an `<input>` marks touched + commits validation before the form submit fires (`FieldControl.tsx` onKeyDown).

**Controlled/uncontrolled**: `Field.Control` supports `value`/`onValueChange`/`defaultValue`; uncontrolled usage re-renders nothing per keystroke since PR #3820 (issue [mui/base-ui#3819](https://github.com/mui/base-ui/issues/3819) — RHF `register` users hit per-keystroke re-renders). `defaultValue` no longer resets on focus (#2543).

**External-library adapters**: `invalid`, `dirty`, `touched` props switch those states to controlled ("Useful when the field state is controlled by an external library", prop JSDoc; PR #2950).

**Disabled semantics** [E] (PR #5116 + source comment): "App-controlled invalidity (the `invalid` prop and `<Form>` errors) keeps the field marked invalid even while disabled. Only computed validity (native constraints and `validate`) is suppressed when disabled, matching `:disabled` not participating in constraint validation." `aria-invalid` is still never added to disabled controls — only the `data-invalid` styling hook remains. Disabled fields are excluded from Form validation and `onFormSubmit` values (Form tests), and a Fieldset's `disabled` cascades into every Field inside (`FieldRoot.tsx` reads `useFieldsetRootContext`).

**Imperative**: `actionsRef.current.validate()` validates on demand — added because there was no way to "trigger initial validation" ([mui/base-ui#3323](https://github.com/mui/base-ui/issues/3323) → PR #3395, which also added Form-level `actionsRef`).

**Form-error interplay**: an entry in `<Form errors>` matching the field's `name` makes the field invalid and feeds `Field.Error`; it is cleared as soon as the field's value changes (see form brief §6; PR #3136).

**Animation**: `Field.Error` participates in the standard transition-status contract — `data-starting-style`/`data-ending-style` (added with avatar in PR #3939); it holds the last rendered message during exit animations (`lastRenderedMessage` in source) so text doesn't vanish mid-fade.

**SSR**: `autoFocus` focus-state detection works in SSR environments (#3871); label association ids are generated with hydration-safe ids; "does not set `aria-labelledby` during SSR when Field.Label is absent" (FieldRoot test, Chromium-only).

## 7. Accessibility contract

Field is labeling machinery; it has no ARIA APG widget pattern of its own. The relevant reference is the WAI Forms Tutorial (labels/instructions) plus each wrapped control's pattern [I].

**What Field manages automatically:**

| Mechanism | How |
|---|---|
| Label → control | `Field.Label` renders `<label htmlFor={controlId}>`; controls register their id in `LabelableContext`. For span-based controls (Checkbox/Radio/Switch), `aria-labelledby` is auto-linked instead — added after an external WCAG report verified across NVDA/Narrator/JAWS [E] ([mui/base-ui#4122](https://github.com/mui/base-ui/issues/4122) → fix #4142). |
| Description → control | `Field.Description` registers its id into `messageIds` → merged into the control's `aria-describedby` (`getDescriptionProps`), deduplicated, including parent-scope messages when nested in `Field.Item`. |
| Error → control | `Field.Error` registers its id into `aria-describedby` **only while rendered** (mounted/visible), so SRs only hear active errors. |
| Invalid state | `aria-invalid` added to the control when `valid === false` and the field is not disabled (`getValidationProps`); never on disabled controls (#5116). |
| Implicit labels | Checkbox/Radio/Switch can be *enclosed* by `Field.Label` (#2036), matching native implicit label association. |

**Keyboard interaction**: Field adds only one binding of its own — Enter on an `<input>` commits validation (then native submit proceeds). Everything else belongs to the wrapped control.

**`nativeLabel` prop** (Label): when the control is a `<button>` (Select.Trigger, Combobox.Trigger), a native `<label>` causes clicks to `.click()` the button and `:hover` to leak; render a `<div>` via `render` + `nativeLabel={false}` — dev-mode console errors enforce consistency between the prop and the rendered tag [E] (PR #3723; the two error strings in `FieldLabel.tsx`).

**Known issues / honesty**: [E] error-message customization for multiple simultaneous rules is acknowledged as awkward ([mui/base-ui#1923](https://github.com/mui/base-ui/issues/1923), open); `invalid` prop cannot be "reset" to resume internal validity ([mui/base-ui#3777](https://github.com/mui/base-ui/issues/3777), open). Docs lacked `Field.Item` guidance until #3807 (closed).

## 8. Prop-level guidance

**`Field.Root`**
- `name` — "Identifies the field when a form is submitted. Takes precedence over the `name` prop on the `<Field.Control>`" [E] (JSDoc; fallback-to-Control-name behavior tested extensively). Use Root-level `name` — it is also what `<Form errors>` keys match.
- `validate` — custom rules after native ones; return message(s) or `null`. Use `formValues` for cross-field rules (confirm-password, #1941). Don't use it when a form library validates — use `invalid` + `match` instead [E] (handbook RHF section).
- `validationMode` — keep the `onSubmit` default for form-shaped UIs (maintainer-argued UX, #3013/#2142); use `onChange` for instant-feedback inputs (username availability) with `validationDebounceTime`; `onBlur` as the middle ground.
- `validationDebounceTime` — pair with async `validate` in `onChange` mode (handbook).
- `invalid` / `dirty` / `touched` — the external-library adapters (#2950): controlled; internal setters become no-ops.
- `disabled` — cascades to the control and suppresses computed validation, keeps app-set invalidity (#5116); takes precedence over Control's `disabled`.
- `actionsRef` — imperative `validate()`; initial/on-demand validation (#3395, #3323).
**`Field.Control`**
- `onValueChange(value, eventDetails)` — Base UI change-handler grammar; fires even without `value`/`defaultValue` (#2600).
- `render` — swap in `<textarea>` or a custom element; the sanctioned custom-control path [E] (#1996).
**`Field.Error`**
- `match` — `true` = always show ("lets external libraries control the visibility", JSDoc); a `ValidityState` key = show for that native failure (`match="valueMissing"` hero); omitted = show when invalid or a Form error exists for the field. Consolidated from `forceShow` in beta.0 [E] (PR #1919, closing #1200).
- Without `children`, it renders the field's message automatically — native message, `validate`'s string(s) (arrays become `<ul><li>`), or the matching `<Form errors>` entry (source).
**`Field.Label`** — `nativeLabel` (see §7).
**`Field.Item`** — `disabled` (per-option disable; reflected into item-scoped Label/Description state, #4916/#4960).
**`Field.Validity`** — `children(state)` where state = combined validity data + `validity` (`ValidityState` booleans) + `transitionStatus`; the escape hatch for fully custom validity UI [E] (source JSDoc).

**Data attributes (the styling contract, identical across Root/Control/Label/Description/Error/Item)**: `data-disabled`, `data-touched`, `data-dirty`, `data-filled`, `data-focused`, and the tri-state pair `data-valid` / `data-invalid` — *neither* is present while `valid === null` (pristine or disabled-computed), which is what makes "don't show errors before interaction" stylable [E] (`*DataAttributes.ts`; `fieldValidityMapping` in `internals/field-constants/constants.ts`). `Field.Error` adds `data-starting-style`/`data-ending-style`.

## 9. Decision log

- **2024-08-20** — Field created (with Fieldset in the same PR) — c51fb490a, [#477](https://github.com/mui/base-ui/pull/477).
- **2024-10** — `Control` restricted to `<input>`-only types by default ([#935](https://github.com/mui/base-ui/pull/935)).
- **2025-05** — Error-noise doctrine lands: `valueMissing` alone doesn't invalidate a pristine field ([#1810](https://github.com/mui/base-ui/pull/1810)); on-change revalidation limited to `required` recovery ([#1840](https://github.com/mui/base-ui/pull/1840)).
- **2025-05 (beta.0)** — `Field.Error` `forceShow` folded into `match: boolean | keyof ValidityState` ([#1919](https://github.com/mui/base-ui/pull/1919), closes #1200); `validate` ordered strictly after native validation ([#1926](https://github.com/mui/base-ui/pull/1926), closes #1904).
- **2025-06** — `validate` receives `formValues` for cross-field rules ([#1941](https://github.com/mui/base-ui/pull/1941)).
- **2025-07** — Implicit `Field.Label` wrapping for Switch/Checkbox/Radio ([#2036](https://github.com/mui/base-ui/pull/2036)).
- **2025-10** — `dirty`/`touched` controlled props for RHF/TanStack parity ([#2950](https://github.com/mui/base-ui/pull/2950)); `Field.Item` part + `LabelableProvider` architecture ([#2810](https://github.com/mui/base-ui/pull/2810), closes #2172/#2773).
- **2025-10-29 (beta.5, breaking)** — default `validationMode` becomes `'onSubmit'` (was `onBlur`), configurable on `<Form>`; "matches native form submission behavior and the defaults of RA, Ariakit and react-hook-form" ([#3013](https://github.com/mui/base-ui/pull/3013), closes #2142).
- **2026-01** — `nativeLabel` prop on Label for button-shaped controls ([#3723](https://github.com/mui/base-ui/pull/3723)).
- **2026-02** — uncontrolled `Field.Control` re-render elimination ([#3820](https://github.com/mui/base-ui/pull/3820), closes #3819); registration centralized in Field.Root ([#4481](https://github.com/mui/base-ui/pull/4481)).
- **2026-06 (v1.6.0 regression → fix)** — #4890 excluded disabled controls from validation, dropping app-set `data-invalid`; [#5116](https://github.com/mui/base-ui/pull/5116) restored it: app-set invalid persists while disabled, computed validity stays suppressed, RHF-aligned (closes #5100).

## 10. Pitfalls & FAQ

1. **"My `validate` never runs"** → With the default `validationMode="onSubmit"` and no surrounding `<Form>`, nothing ever triggers submit-validation; the function "does not run by default" outside a Form [E] (FieldRoot test title). Correction: wrap in `<Form>`, or set `validationMode="onBlur"`/`"onChange"`, or call `actionsRef.current.validate()`.
2. **"How do I build a custom control (textarea, color input)?"** → `Field.Control render={<textarea />}`; state attributes (`data-dirty`/`data-touched`/`data-filled`/`data-focused`) can also be driven via native events + Constraint Validation API [E] (maintainer answers, [#1996](https://github.com/mui/base-ui/issues/1996)). The asker explicitly requested a docs guide — confirmed gap.
3. **"Two controls in one Field"** → update loop / undefined behavior; one Field per logical value; use Fieldset for grouping [E] (#3928).
4. **"Error shows while the user is still typing"** (or: doesn't show when I expect) → understand the mode matrix: `onSubmit` shows nothing until first submit, then live-revalidates; only `valueMissing` recovery is optimistic between commits; `typeMismatch` etc. wait for blur/submit [E] (#1840, #4995, source comments).
5. **"Async validation didn't stop submission"** → by design; async `validate` can't block the submit event [E] (Form.tsx comment; prop JSDoc). Validate synchronously for gating, or gate on the server via `<Form errors>`.
6. **"`Field.Root` `invalid` won't reset"** → passing `invalid={false}`... the prop is one-way app-control; resuming computed validity is an open issue [E] ([#3777](https://github.com/mui/base-ui/issues/3777), open).
7. **"Multiple rules, custom message each"** → `errors` array from `validate` renders a `<ul>`; per-rule message customization beyond `match`-per-native-key is acknowledged rough [E] ([#1923](https://github.com/mui/base-ui/issues/1923), open). `Field.Validity` is the escape hatch.
8. **"Label `:hover`/click misbehaves on Select"** → use `nativeLabel={false}` + non-label element; native `<label>` forwards clicks/hover to button controls [E] (#3723; discussion mining: radio `:hover` question).
9. **"RHF doesn't focus my invalid field"** → forward the ref to the underlying Base UI input (`inputRef` prop or direct `ref`) [E] (forms handbook).
10. **"`name`/`disabled` on Field.Root didn't reach my control"** → fixed (#1614); both cascade, Root takes precedence (JSDoc).

## 11. Real-world patterns observed

[G] pending Phase D (usage mining for field/form not yet run at time of writing; corpus queries `@base-ui/react/field` planned). Expected archetypes to verify against ranked.json: design-system `TextField`-style wrappers composing Root+Label+Control+Description+Error; RHF `Controller` adapters; group-form patterns with Fieldset+Field.Item.

## 12. Story plan

See [story-plan.md](./story-plan.md) — 18 stories: anatomy, validation-mode matrix, custom/cross-field/async validate, control-swap set (input/textarea/select/checkbox/radio-group via Field.Item), state-attribute styling with play-driven touched/dirty, server errors, RHF-style controlled adapter, nativeLabel, Validity render prop, error animation.
