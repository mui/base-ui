# Radio (+ Radio Group) — story plan

Feeds Phase E. Source of truth: [`brief.md`](./brief.md). Styling: follow the docs hero demo CSS (CSS Modules, raw oklch values, `docs/src/app/(docs)/react/components/radio/demos/hero/css-modules/index.module.css`).

## 1. Kept functionality demos (from current docs `demos/` dirs)

| Docs demo dir | Story |
|---|---|
| `radio/demos/hero` | `Basic` (RadioGroup + Radio.Root + Radio.Indicator, enclosing labels) |

(Radio has only one demo dir; Radio Group has none of its own since its docs content lives inline in `radio/page.mdx` — the remaining stories below recreate the inline code samples from that page: sibling-label + `nativeButton`, `render` callback, and the Field/Fieldset form-integration example.)

## 2. One story per use case

Columns: name — renders — controlled? — play? — doc section served.

1. **Basic** — hero recreation: `RadioGroup` (uncontrolled, `defaultValue`) wrapping 2-3 `Radio.Root` with enclosing `<label>` + `Radio.Indicator` — uncontrolled — no — Hero / Anatomy.
2. **ArrowKeySelectsOnNavigation** *(required interaction story — the assignment's explicit ask)* — Basic layout, 3+ options — play: focus first radio → assert unchecked → `ArrowDown` → assert focus **and** `aria-checked="true"` moved to the next radio in one step (no separate Space/click needed) → repeat to wrap past the last option back to the first → `ArrowUp` to go back → assert `onValueChange` fired once per arrow press — uncontrolled — **play** — Behavior §6 / A11y keyboard table (the single most important behavioral fact in the brief).
3. **ShiftArrowMovesFocusOnly** — Basic layout — play: focus first radio → hold Shift, press ArrowDown → assert focus moved but `aria-checked` did **not** change on either radio → release Shift, press ArrowDown again → assert selection now commits normally — uncontrolled — **play** — Behavior §6 (Shift modifier suppresses auto-select).
4. **SpaceSelectsOnKeyUp** — Basic layout — play: Tab to a radio → press Space down → assert not yet selected (`aria-checked="false"`) → release Space → assert now selected — uncontrolled — **play** — Behavior §6 / keyboard table (Space-on-keyup, not keydown).
5. **HomeEndHaveNoEffect** — Basic layout, focus on a middle option — play: press Home → assert focus/selection unchanged; press End → assert unchanged — uncontrolled — **play** — Pitfall 4 / keyboard table (`enableHomeAndEndKeys={false}`).
6. **ControlledValue** — external `value`/`onValueChange` state + a button that programmatically selects an option and a button that clears to `null` from outside the group — controlled — play (external select; external clear; assert `null` is a real, reachable app state, not just "nothing selected yet") — Behavior / Decision log (#2473 native-null contract).
7. **NativeButtonSiblingLabel** — recreates docs "Rendering as a native button" example: `nativeButton` + `render={<button/>}` + `htmlFor`/`id` sibling `<label>`s — uncontrolled — play (click the sibling label; assert the corresponding radio selects) — Anatomy / Prop guidance `nativeButton`.
8. **RenderCallbackWrappingLabel** — recreates docs "Render callback" example: `nativeButton` + `render={(buttonProps) => <label><button {...buttonProps}/>Text</label>}` — uncontrolled — no — Prop guidance `nativeButton` / Pitfall 1 (avoids invalid-HTML while still using a native button).
9. **DisabledItemVsDisabledGroup** — two variants side by side: (a) one `Radio.Root disabled` inside an otherwise-enabled group — assert it's skippable by keyboard-select but remains focusable/visible for discoverability; (b) the whole `RadioGroup disabled` — assert every item is inert — uncontrolled — play (attempt to select the disabled item in variant (a); assert no-op; assert variant (b)'s items report `data-disabled`) — Prop guidance `disabled` cascade / A11y contract (composite-widget disabled-focusable policy).
10. **WithFieldAndFieldset** — recreates docs "Form integration" example: `Field.Root name` + `Fieldset.Root render={<RadioGroup/>}` + `Fieldset.Legend` + N × `Field.Item > Field.Label > Radio.Root` — uncontrolled — play (click a `Field.Label`-wrapped option; assert selection + label association via `for`/`id`) — Anatomy composition / Field brief cross-reference.
11. **NativeFormSubmitReturnsNull** — plain `<form>` + `name` on RadioGroup, no default selection, submit handler reading `FormData` — uncontrolled — play (submit with nothing selected → assert payload value is `null`, matching native `<input type=radio>` group behavior; then select one and resubmit → assert the chosen value appears) — Behavior / Decision log (#2473).
12. **RequiredInvalidState** — `Field.Root` + `RadioGroup required` + `Field.Error match="valueMissing"`, inside `<Form>` — uncontrolled — play (submit with nothing selected → assert error shows + `aria-invalid` on group and each radio; select an option → assert error clears) — A11y contract / Field integration (mirrors the `RadioGroup.test.tsx` "clears required validation when a value is selected" test).
13. **DisabledSelectedExcludedFromSubmit** — `RadioGroup defaultValue="a"` with radio "a" toggle-able to `disabled` via an external button, inside a `<Form>` with an `onFormSubmit` readout — uncontrolled — play (disable the selected radio → submit → assert payload is `null`; re-enable → submit → assert payload is `"a"` again) — Behavior / Decision log (#4926).

## 3. Real-world recreation stories

- [G] Pending Phase D — no `research/d-real-world-usage/radio/` dataset exists yet (brief §11). No corpus-derived recreation stories can be finalized in this pass.
- Placeholder names based on the brief's inferred archetypes (§11), to finalize once `ranked.json` exists: `RealWorldThemePicker` (settings light/dark/system), `RealWorldPaymentMethodPicker` (checkout flow), `RealWorldSingleAnswerSurveyQuestion`.

**Totals**: 13 planned + 3 recreation placeholders. Interaction (play) stories: 9, including the mandatory arrow-key-selects flow (#2) and the Shift-suppresses-selection companion (#3).
