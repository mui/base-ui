# Field — story plan

Target set: 18 stories. Naming: `Field/<Story>`. Styling per docs hero demo CSS (CSS Modules, raw oklch values; `.Field`, `.Label`, `.Input`, `.Error`, `.Description` classes). "Play?" = interaction test via play function. Doc-section = Definition-of-Done slot the story feeds. Evidence pointers reference `brief.md` sections.

## A. Kept functionality demos (from current docs — Decision 8)

The Field docs page has **only** a hero demo (no Examples section at all — itself a gap worth noting in the MDX); the forms handbook supplies the rest of the canonical demos.

| # | Story | Render | Play? | Doc section |
|---|---|---|---|---|
| 1 | `Hero` | docs hero: Root(name) > Label + Control(`required`, placeholder) + Error(`match="valueMissing"`) + Description | no | Hero example; anatomy |
| 2 | `HandbookLabeling` | three Fields side by side: explicit `Field.Label`+Input; implicit label wrapping a Checkbox; `aria-label`-only control (no visible label) | yes: assert `htmlFor`/id linkage, implicit association, `aria-label` presence | A11y contract (labeling table, brief §7) |
| 3 | `GroupWithFieldItem` | Fieldset.Root+Legend > Field.Root > RadioGroup > Field.Item ×3, each with Field.Label + Field.Description (PR #2810 JSX) | yes: click item label → radio checked; assert per-item `aria-describedby` | Anatomy (groups); Field.Item guidance (#3807 gap) |

## B. One story per use case (test-bearing)

| # | Story | Render | Play? | Doc section |
|---|---|---|---|---|
| 4 | `AnatomyAllParts` | Root > Label + Control + Description + Error(match) + Validity (all 7 parts incl. a no-op Item note) | yes: assert Description AND Error ids both inside control's `aria-describedby`; `aria-invalid` absent while pristine | Anatomy; a11y wiring (brief §5/§7) |
| 5 | `ValidationModeOnSubmit` (REQUIRED modes 1/3) | Form > Field(`required`, default mode) + submit | yes: type-clear-blur → NO error; submit empty → error + `aria-invalid`; type → revalidates live (submitAttempted) | Behavior: validation modes; decision #3013 |
| 6 | `ValidationModeOnBlur` (2/3) | Field `validationMode="onBlur"` + `type="email"` | yes: type invalid email → no error while typing → blur → error appears | Validation modes |
| 7 | `ValidationModeOnChange` (3/3) | Field `validationMode="onChange"` + `validate` (min length) | yes: each keystroke validates; error appears/disappears mid-typing | Validation modes |
| 8 | `CustomValidateFunction` (REQUIRED) | `validate={(v) => v !== 'base-ui' ? 'Type "base-ui"' : null}` , mode onChange | yes: wrong value → custom message rendered by Error; right value → data-valid | Prop guidance: validate; lifecycle (native-first, #1926) |
| 9 | `CrossFieldValidation` | password + confirm-password; confirm's `validate={(v, values) => v !== values.password ? 'Passwords do not match' : null}` in a Form | yes: mismatch blocks submit; matching submits (#1941 use case) | validate(formValues); Form interplay |
| 10 | `AsyncValidationDebounced` | `validationMode="onChange"` + `validationDebounceTime={500}` + async validate (fake username-taken check, pending indicator via Validity) | yes: burst-type → single validation after debounce; stale results ignored | validationDebounceTime; async caveat (brief §6) |
| 11 | `WrapsInput` (control-swap 1/4) | Field around `<Input />` (which extends Field.Control) | yes: label click focuses input; error on required | Control adaptation (brief §1 cross-component role) |
| 12 | `WrapsSelect` (2/4) | Field > Label(`render={<div/>}` `nativeLabel={false}`) + Select.Root(required)… + Error | yes: submit empty → error; select option → clears; assert label does NOT trigger `:hover`/click on trigger | Control adaptation; nativeLabel (#3723) |
| 13 | `WrapsCheckbox` (3/4) | Field > implicit Field.Label wrapping Checkbox.Root(required, terms-acceptance) + Error | yes: submit unchecked → error; check → valid | Control adaptation; implicit label (#2036) |
| 14 | `WrapsCustomTextarea` (4/4) | `Field.Control render={<textarea />}` with maxLength+required | yes: type → data-dirty/data-filled on textarea; blur+submit validation works | Custom control recipe (#1996 — maintainer-confirmed gap) |
| 15 | `StateAttributesStyling` (REQUIRED state machine) | Field whose CSS visibly keys every attribute: `[data-touched]` outline, `[data-dirty]` badge, `[data-filled]` bg, `[data-focused]` ring, `[data-valid]`/`[data-invalid]` border; legend showing live attribute values via Validity | yes (play drives the machine): initial → none of valid/invalid present (tri-state); focus → focused; type → dirty+filled; clear → dirty, not filled; blur → touched; submit → invalid | Styling contract (brief §8 data attributes); tri-state valid |
| 16 | `ServerErrorDisplay` (REQUIRED) | Form with `errors={{ email: 'Email already in use' }}` from state (hero-style fake server) > Field(name="email") + Error | yes: submit → server error shown + field `data-invalid`; type one char → error auto-clears (#3136) | Server errors; Form interplay |
| 17 | `ExternalLibraryControlled` (RHF-style adapter) | Field driven purely by controlled `invalid`/`dirty`/`touched` props + `Error match={true}` with external children — a minimal Controller-shaped harness (no RHF dep), mirroring handbook mapping | yes: toggle external invalid → `data-invalid` + error text swap; disabled+invalid keeps `data-invalid` (#5116) | Prop guidance: invalid/dirty/touched (#2950); RHF section |
| 18 | `ErrorTransitionAnimation` | Error styled with `[data-starting-style]`/`[data-ending-style]` fade; onChange mode | yes: trigger invalid → error fades in; fix → message persists during fade-out (lastRenderedMessage) | Animation (#3939); Error behavior |

## C. Real-world recreation placeholders

| # | Story | Notes |
|---|---|---|
| R1 | `RecreationTextFieldWrapper` | [G] pending Phase D — expected archetype: design-system `TextField` component composing Root+Label+Control+Description+Error with size/variant props. Finalize from field ranked.json. |

## Coverage check

Required set from the research assignment, all present: label+description+error anatomy (#1, #4), validation modes (#5–#7), custom validate fn (#8, #9, #10), wrapping representative controls input/select/checkbox (+custom textarea) (#11–#14), state-attribute styling with play-driven touched/dirty (#15), server-error display (#16). A11y-contract assertions concentrated in #2, #4, #12; pitfalls exercised: standalone-onSubmit trap (#5 uses Form deliberately; note in MDX), nativeLabel (#12), auto-clearing (#16), disabled+invalid (#17).
