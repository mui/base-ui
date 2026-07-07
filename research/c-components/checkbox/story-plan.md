# Checkbox — story plan

Feeds Phase E. Source of truth: [`brief.md`](./brief.md). Styling: follow the docs hero demo CSS (CSS Modules, raw oklch values, `docs/src/app/(docs)/react/components/checkbox/demos/hero/css-modules/index.module.css`).

Note: the parent/child tri-state interaction (indeterminate "select all" pattern) is planned in [`research/c-components/checkbox-group/story-plan.md`](../checkbox-group/story-plan.md) instead of here, since the coordinating logic (`useCheckboxGroupParent`) lives in Checkbox Group even though the `parent` prop is declared on `Checkbox.Root` (brief §1 cross-component role).

## 1. Kept functionality demos (from current docs `demos/` dirs)

| Docs demo dir | Story |
|---|---|
| `checkbox/demos/hero` | `Basic` (enclosing-label checkbox, Root + Indicator) |

## 2. One story per use case

Columns: name — renders — controlled? — play? — doc section served.

1. **Basic** — hero recreation: `Checkbox.Root` + `Checkbox.Indicator` wrapped in an enclosing `<label>` — uncontrolled — no — Hero / Anatomy.
2. **ToggleWithSpaceAndClick** *(required interaction story)* — Basic — play: Tab to the checkbox → assert unchecked → press Space → assert `aria-checked="true"` and indicator visible → press Space again → assert unchecked and indicator removed (post-exit-transition) → click the label directly → assert toggles again — uncontrolled — **play** — Behavior §6 / A11y keyboard table.
3. **EnterDoesNotToggleButSubmitsForm** — Checkbox inside a `<form>` with a submit button, a submit-log readout — uncontrolled — play: focus checkbox → press Enter → assert checkbox state **unchanged** (`aria-checked` did not flip) but the form's submit handler fired — uncontrolled — **play** — Behavior §6 / Pitfall 5 (#4713).
4. **IndeterminateManualState** — `Checkbox.Root indeterminate` with an external button toggling `indeterminate` on/off, and a separate button toggling `checked` — no group — controlled(indeterminate) — play: assert `aria-checked="mixed"` while indeterminate, regardless of the `checked` prop's value; toggle `checked` while still indeterminate → assert still `mixed` (not overridden) — Behavior §6 / Prop guidance `indeterminate` (the "not overridden by checked" contract).
5. **ReadOnlyBlocksAllTogglePaths** — `Checkbox.Root readOnly` wrapped in a label, plus a separate `disabled` variant side by side — uncontrolled — play: click the label → assert no state change for both variants; attempt Space on the readOnly one → assert no change — Prop guidance `readOnly`/`disabled` / A11y contract.
6. **FormWithUncheckedValue** — recreates the native-parity test: `Checkbox.Root uncheckedValue="off"` inside a `<form>`, submit-log readout of `FormData.get(name)` — uncontrolled — play: submit while unchecked → assert payload is `"off"`; check the box → submit again → assert payload is the checked `value` (or `"on"` if no explicit `value`); uncheck and resubmit → assert `"off"` again (the 3-cycle contract from `CheckboxRoot.test.tsx`) — Behavior / Prop guidance `uncheckedValue` (#3406).
7. **DefaultUncheckedSubmitsNothing** — same shape as #6 but *without* `uncheckedValue` — uncontrolled — play: submit while unchecked → assert `FormData.get(name)` is `null` (not present at all), matching native `<input type="checkbox">` — Behavior / Pitfall 3 / Decision log (#3406).
8. **InFieldWithValidation** — `Field.Root name required` + `Field.Label` (enclosing) + `Checkbox.Root` + `Field.Error match="valueMissing"`, inside `<Form>` — uncontrolled — play: submit unchecked → assert error shows + `aria-invalid`; check the box → assert error clears — Field integration / A11y contract.
9. **NativeButtonSiblingLabel** — recreates docs "Rendering as a native button": `nativeButton` + `render={<button/>}` + `htmlFor`/`id` sibling `<label>` — uncontrolled — play: click the sibling label → assert toggles — Anatomy / Prop guidance `nativeButton`.
10. **RenderCallbackWrappingLabel** — recreates docs "Render callback" example: `nativeButton` + `render={(buttonProps) => <label><button {...buttonProps}/>Text</label>}` — uncontrolled — no — Prop guidance `nativeButton` / Pitfall 1 (avoids invalid-HTML while using a native button).
11. **DisabledStyling** — a `disabled` + `defaultChecked` variant and a `disabled` + unchecked variant side by side, styled on `data-disabled` — uncontrolled — no — Prop guidance `disabled` / styling contract.

## 3. Real-world recreation stories

- [G] Pending Phase D — no `research/d-real-world-usage/checkbox/` dataset exists yet (brief §11).
- Placeholder names based on the brief's inferred archetypes (§11): `RealWorldTermsAgreement`, `RealWorldBulkSelectTableRow` (single-row half of the pattern Checkbox Group's story plan completes with the parent "select all").

**Totals**: 11 planned + 2 recreation placeholders. Interaction (play) stories: 7, including the mandatory Space/click toggle flow (#2) and the Enter-submits-not-toggles flow (#3).
