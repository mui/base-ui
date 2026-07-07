# Checkbox Group — story plan

Feeds Phase E. Source of truth: [`brief.md`](./brief.md). Styling: follow the docs hero demo CSS (CSS Modules, raw oklch values, `docs/src/app/(docs)/react/components/checkbox-group/demos/hero/css-modules/index.module.css`; the `parent`/`nested` demos have their own module CSS worth reusing for the tri-state stories).

## 1. Kept functionality demos (from current docs `demos/` dirs)

| Docs demo dir | Story |
|---|---|
| `checkbox-group/demos/hero` | `Basic` (CheckboxGroup + several Checkbox.Root children, controlled value array) |
| `checkbox-group/demos/parent` | `ParentCheckboxSelectAll` |
| `checkbox-group/demos/nested` | `NestedParentCheckbox` |

## 2. One story per use case

Columns: name — renders — controlled? — play? — doc section served.

1. **Basic** — hero recreation: `CheckboxGroup` (controlled `value`/`onValueChange`) wrapping 3 `Checkbox.Root` children with enclosing labels — controlled — no — Hero / Anatomy.
2. **GroupValueCoordination** *(required interaction story)* — Basic layout — play: check the first checkbox → assert group value becomes `['a']` and only that checkbox is `aria-checked=true`; check the second → assert `['a','b']`; uncheck the first → assert `['b']` (filter-based removal, not a re-sort) — controlled — **play** — Behavior §6 (the core array-coordination contract).
3. **ParentCheckboxSelectAll** — recreates the `parent` docs demo: a parent `Checkbox.Root parent` + `allValues` + 3 child checkboxes — controlled — play: click the parent → assert all 3 children become checked in one action and the parent shows `aria-checked=true`; click the parent again → assert all uncheck — controlled — **play** — Anatomy / Behavior §6 (select-all/select-none).
4. **ParentIndeterminateFromPartialSelection** — same layout as #3 — play: check exactly one child directly (not via parent) → assert the parent automatically shows `aria-checked="mixed"` and its indicator renders the indeterminate icon (dash, not checkmark, per the docs demo's `state.indeterminate` render prop) — controlled — **play** — Behavior §6 / Prop guidance `indeterminate` (auto-computed tri-state).
5. **ParentMixedCyclePreservesPriorSelection** — same layout as #3, pre-seed a mixed state (child 1 checked, children 2-3 unchecked) via an external control before the play starts — play: click the parent once → assert it now selects **all** children (mixed → on); click again → assert it goes to **none** (on → off); click a third time → assert it **restores exactly the original one-child subset** rather than resetting to empty — controlled — **play** — Behavior §6 (the tri-state cycle algorithm, the least obvious behavior in the brief).
6. **DisabledChildExcludedFromParentToggle** — parent + `allValues` + one child marked `disabled` and pre-checked, others enabled and unchecked — play: click the parent's "select all" → assert the disabled-and-checked child stays checked (untouched) while the other enabled children become checked; click "select none" → assert the disabled-and-checked child is **not** unchecked, only the enabled ones are — controlled — **play** — Behavior §6 (disabled-child exclusion from bulk operations).
7. **NestedParentCheckbox** — recreates the `nested` docs demo: a top-level `CheckboxGroup` (main permissions) containing a parent checkbox plus a nested second `CheckboxGroup` (user-management permissions) with its own parent checkbox, wired via app-level `onValueChange` propagation — controlled — play: check every child in the nested group → assert the nested parent shows checked **and** the outer "manage-users" value gets added automatically; uncheck one nested child → assert "manage-users" is removed from the outer group's value — controlled — **play** — When-not-to-use boundary (§4, the app-composed nesting pattern) / Anatomy.
8. **RequiredMeansAllMustBeChecked** — `Field.Root name required` semantics test recreation: 2 `Checkbox.Root required` inside one group, `Field.Error match="valueMissing"`, inside `<Form>` — uncontrolled — play: submit with nothing checked → assert error shows; check only one of the two required checkboxes → resubmit → assert error **still shows** (this is the counter-intuitive contract, brief §6/Pitfall 1); check the second → resubmit → assert error clears — uncontrolled — **play** — Field integration / Pitfall 1 (the most important prop-guidance fact for this component).
9. **NativeFormSubmitAsOneArrayField** — plain `<form>` + `Field.Root name="protocols"` + `CheckboxGroup` with a parent + several children, submit-log readout of `FormData.getAll(name)` — uncontrolled — play: check two children → submit → assert the payload contains exactly those two values, and confirm the **parent checkbox never appears** in the submitted array (brief §5/§6, "excludes parent checkboxes from form submission") — uncontrolled — **play** — Decision log (#1948) / Anatomy (parent exclusion).

## 3. Real-world recreation stories

- [G] Pending Phase D — no `research/d-real-world-usage/checkbox-group/` dataset exists yet (brief §11).
- Placeholder names based on the brief's inferred archetypes (§11), directly signaled by the built-in parent-checkbox feature and its own docs demos: `RealWorldPermissionsManagementForm` (the nested demo's own archetype, generalized), `RealWorldFacetedSearchFilterPanel` (e-commerce/dashboard filter checkboxes with a "select all" toggle).

**Totals**: 9 planned + 2 recreation placeholders. Interaction (play) stories: 8, including the mandatory group-value-coordination flow (#2) and the tri-state parent-cycle flow (#5), which is the single most nuanced behavior documented in the brief.
