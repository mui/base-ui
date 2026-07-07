# Accessibility review — `apps/storybook` stories

Date: 2026-07-08

## Method

1. `addon-a11y` is configured in `.storybook/preview.tsx` with `test: 'todo'` — violations are
   collected by the addon but never asserted, so `npx vitest --project storybook run` reports
   green regardless of what axe finds.
2. Flipped `test` to `'error'` temporarily (never committed in that state) so the same vitest
   run turns every axe violation into a real test failure with the violating selector, the
   rule id, and axe's fix-suggestions printed inline.
3. Baseline run: **66 failing tests across 14 story files** (471 total tests; the pre-existing
   `combobox.stories.tsx > Open Filter Select Close` `toHaveValue('')` flake was confirmed
   unrelated — passes 28/28 in isolation — and is not part of this count).
4. Triaged every violation by reading the rendered HTML, the failing selector, and (for anything
   not obviously our own markup) the relevant `packages/react/src/**` source to determine
   whether Base UI itself produced the offending DOM.
5. Fixed everything attributable to our demo markup/CSS in `apps/storybook/src/stories/**`;
   left everything attributable to library behavior in place and documented it below instead.
6. Final run after fixes: **35 failing tests**, all in the library-attributable categories
   below. `test` restored to `'todo'`; full suite green again (`471/471`, only the pre-existing
   flake noted above still occasionally reruns).

## Violations by rule (baseline → after fixes)

| Rule | Baseline count | Remaining | Disposition |
|---|---|---|---|
| `aria-hidden-focus` | 77 | 77 | Library (floating-ui-react `FocusGuard` + `markOthers`) |
| `label` | 31 | 1 | 30 fixed (NumberField/OTPField demo labeling); 1 library (combobox markOthers hides its own label) |
| `landmark-unique` | 12 | 0 | Fixed (missing `aria-label` on `NavigationMenu.Root`/nested `Popup`) |
| `color-contrast` | 7 | 0 | Fixed (muted-gray text under AA threshold in 3 stories) |
| `aria-dialog-name` | 7 | 1 | 6 fixed (Popover missing `Title`, Toast anchored recreation missing `Title`); 1 library/docs-parity (Toast `promise()`) |
| `aria-required-children` | 6 | 6 | Library (Menubar `role="menubar"`, Combobox listbox+separator) |
| `scrollable-region-focusable` | 3 | 0\* | Fixed (2 demo `<pre>`/`<div>` scroll regions missing `tabIndex`); \*a 3rd occurrence in Select's own listbox is library-attributable and is now the one counted under "library" in the final run |
| `aria-input-field-name` | 3 | 3 | Library (Combobox/Select listbox popups with no name of their own) |
| `aria-allowed-attr` | 2 | 2\*\* | Library (Combobox grid `aria-orientation`, Radio `aria-readonly`) — \*\*one of the two Radio occurrences is a duplicate of the same root cause on a sibling radio |
| `aria-required-attr` | 2 | 2 | Library (Combobox `inline` variant missing `aria-expanded`) |
| `empty-table-header` | 1 | 0 | Fixed, **and** an identical instance found in a second story during re-verification, also fixed |
| `aria-valid-attr-value` | 1 | 1 | Library (Menu shadow-DOM `aria-owns` dangling reference) |

(The final table found one extra `empty-table-header` and confirmed the `scrollable-region-focusable`/`aria-allowed-attr` splits during the second and third re-verification passes — the counts above are the corrected, final tallies from the last clean triage run.)

## Fixed (our demo markup/CSS)

All fixes are scoped to `apps/storybook/src/stories/**`; no library code was touched.

- **`packages/react` cross-check, not a fix**: the official docs hero demo for NumberField
  (`docs/src/app/(docs)/react/components/number-field/demos/hero/css-modules/index.tsx`)
  associates its label via `id={useId()}` on `NumberField.Root` + `htmlFor={id}` on a native
  `<label>`. The Storybook copy of every other NumberField story had silently dropped that
  association (`<label className={styles.Label}>Amount</label>` with no `htmlFor`, and no
  `id` on Root). Fixed all 14 stories in `number-field.stories.tsx` by adding matching
  `id`/`htmlFor` pairs (or converting two-instance stories to a small component using
  `React.useId()` per instance where a static string wasn't safe to dedupe).
- **OTPField**: `packages/react/src/otp-field/input/OTPFieldInput.tsx` has an explicit dev-mode
  warning: `"<OTPField.Input> ignores aria-label on the first input. Use a <label> or
  <Field.Label> to label the OTP field."` Only the `Hero` story followed that guidance; the
  other 11 stories in `otp-field.stories.tsx` used either an unassociated `<label>`/`<span>` or
  `aria-label` directly on `OTPField.Root` (which only names the `role="group"` wrapper, not
  slot 0's `<input>`). Added `id`/`htmlFor` pairs to all 11, converting a few inline
  `render: () => (...)` stories into small function components so each instance could carry
  its own `React.useId()`.
- **Popover `PositionerPlayground` / `ArrowSides`**: both stories rendered `Popover.Description`
  but no `Popover.Title`, leaving a `role="dialog"` with `aria-describedby` and no accessible
  name. Added `Popover.Title`.
- **Toast `RealWorldAnchoredActionableToast`**: the recreation only rendered `Toast.Description`
  (no `Title`), so its `role="dialog"` had no name. Added a visually-hidden `Toast.Title` (new
  `.SrOnly` class in `toast.module.css`, matching the existing `.SrOnly` convention already used
  in `popover.module.css`) plus a distinct `title` value in the `toastManager.add()` call.
- **Color contrast** (`4.5:1` AA threshold for normal text):
  - `autocomplete.module.css` `.Empty` — the "nova" dark-skin recreation
    (`MultiSkinAutocompleteExample.tsx`) always renders a dark navy popup background regardless
    of system color scheme, but `.Empty`'s default (light-mode) muted gray only darkens under
    `prefers-color-scheme: dark`. Added a `data-skin="nova"` override.
  - `navigation-menu.module.css` `.LinkDescription` and `.SubmenuHint` — both used the same
    muted gray (`oklch(55.6% 0 0deg)` / `#737373`), which measured 3.76–4.34:1 against the
    item's own hover/pressed highlight background (light gray, not the page's white). Darkened
    to `oklch(38% 0 0deg)`.
  - `scroll-area.module.css` `.Badge` (inactive state) — `oklch(70.8% 0 0deg)` measured 2.58:1
    against white. Darkened to `oklch(50% 0 0deg)`.
- **`landmark-unique`**: `NavigationMenu.Root` renders `<nav>`, and its portalled `Popup` *also*
  renders `<nav>` (by design, so flyout content stays in the landmark tree) — see the project's
  own test comment in `navigation-menu.stories.tsx`: `"Exactly two <nav> landmarks: the Root bar
  and the portalled Popup."` One story (`KeyboardNavigation`) already followed the correct
  pattern (`aria-label="Main"` on Root); the other 12 didn't, so with two *unnamed* `<nav>`s
  present simultaneously (i.e. whenever the play function leaves a panel open at test end) axe
  correctly flags them as indistinguishable landmarks. Added `aria-label="Main"` to all 12.
  `NestedPopupSubmenu` additionally nests a *second* `NavigationMenu.Root` with its own portalled
  `Popup`, producing three concurrent `<nav>`s — added `aria-label="Handbook"` to the nested
  Popup specifically to disambiguate it from the outer (shared `Flyout`) Popup.
- **`scrollable-region-focusable`**: two demo-owned scrollable regions (a JSON-payload `<pre>`
  in `form.stories.tsx` and its twin in `recreations/MultiControlQuoteFormExample.tsx`; a plain
  `<div>` "page content" scroll area in `select.stories.tsx`'s `NonModal` story) had
  `overflow(-y): auto` but no way to reach them by keyboard. Added `tabIndex={0}` to each.
- **`empty-table-header`**: `popover.stories.tsx`'s `TableRowSharedPopover` and
  `menu/recreations/RowActionsExample.tsx`'s row-actions table both used
  `<th aria-label="Actions" />` — accessible-name-only, with zero visible text, so sighted users
  see a blank header cell. Changed both to `<th>Actions</th>`.

## Library findings (reported, not patched — scope is `apps/storybook/**` only)

These are potential upstream issues surfaced by exercising real Base UI components through
realistic demo compositions; none are patched here per the review's scope.

1. **`aria-hidden-focus` (77 occurrences, the largest category) — two distinct root causes in
   `packages/react/src/floating-ui-react/`:**
   - `utils/FocusGuard.tsx` renders `<span data-base-ui-focus-guard aria-hidden="true"
     tabindex="0">` sentinels used by `FloatingFocusManager` to trap Tab at the edges of an open
     Menu/Menubar/NavigationMenu/Select popup. This is a deliberate, known floating-ui pattern
     (the guard must be focusable to catch the tab keystroke), but it is simultaneously
     `aria-hidden`, which axe's `aria-hidden-focus` rule flags unconditionally regardless of
     intent.
   - `utils/markOthers.ts` implements "hide everything outside the open popup" for
     Autocomplete/Combobox: any DOM outside the anchor/floating "keep" chain gets
     `aria-hidden="true"`, but is **not** also given `inert`/`tabindex="-1"`. Any focusable
     content caught in that region — a `<button>` group in a "skin switcher" recreation, or
     (see #2 below) the field's own `<label>` — stays fully tabbable while marked
     `aria-hidden`. The `autocomplete.stories.tsx` source itself has a comment acknowledging
     this: `"(While open, content outside the combobox is aria-hidden, so query by text.)"`.
2. **`label` (combobox `RealWorldMultiSelectModelPickerWithGroups`)** — the same `markOthers`
   mechanism from #1 hides the combobox's *own* `<label>` while its popup is open, because the
   label is a DOM sibling (not an ancestor) of the input's wrapping `InputGroup` and therefore
   falls outside the "keep" chain. Axe reports: `"Form element has explicit <label> that is
   hidden."` This is the most severe manifestation of the pattern — the field loses its own
   accessible name at the exact moment (popup open) a screen-reader user is most likely to be
   interacting with it. A defensive `aria-label` was considered but wouldn't reliably help,
   since the real fix belongs in `markOthers`'s "keep" set (it should also keep labeling
   elements referenced by `for`/`aria-labelledby`, not just DOM ancestors of the reference/
   floating elements).
3. **`aria-required-children` (6)** — `Menubar`'s `role="menubar"` root (Hero, Disabled Cascade,
   Vertical Orientation, Checkbox And Radio Items, Hover Switch After First Click) and
   `Combobox`'s `role="listbox"` + `aria-multiselectable="true"` list
   (`RealWorldMultiSelectModelPickerWithGroups`) both render a `role="separator"` child between
   groups, which axe's ARIA-in-HTML model disallows as a direct child of those container roles.
4. **`aria-allowed-attr` (2)** — Combobox's `role="grid"` list (`GridLayout` story) carries
   `aria-orientation`, not a spec-supported attribute for `role="grid"`; `Radio`'s individual
   `role="radio"` items (`ReadOnlyGroup` story, both radios) carry `aria-readonly="true"`, not
   spec-supported on `role="radio"` (the component's own source comment already flags this
   exact tension for the *stepper buttons* elsewhere — `NumberField`'s `readOnly` disables via
   `aria-disabled` specifically because `aria-readonly` is invalid on `role="button"` — but
   `Radio` still applies it to `role="radio"`).
5. **`aria-required-attr` (2)** — Combobox's `inline` (no-popup) variant renders its `input
   role="combobox"` without `aria-expanded`, which axe's ARIA-in-HTML model requires
   unconditionally for `role="combobox"` (`InlineNoPopup`, `InlineInsideDialog`).
6. **`aria-input-field-name` (3)** — Combobox's and Select's own `role="listbox"` popups
   (`ComboboxOpenFilterSelectClose`, `SelectControlledOpen`,
   `SelectAlignItemWithTriggerDefault`) have no accessible name distinct from their trigger/
   input's name.
7. **`aria-valid-attr-value` (1, Menu `RealWorldShadowDomPortal`)** — a floating-ui-rendered
   `<span aria-owns="...">` references an id inside a shadow root; axe can't resolve the
   reference across the shadow boundary.
8. **`scrollable-region-focusable` (Select's own listbox popup)** — Base UI intentionally sets
   `tabindex="-1"` on the Select popup/listbox container (composite/roving-tabindex keyboard
   model — focus lives on the individual options, not the container), which is exactly what
   axe's rule flags as "should be focusable." Not a bug so much as a rule/pattern mismatch, but
   worth a note for anyone auditing with axe against this component.
9. **`aria-dialog-name` (Toast `PromiseToast`)** —
   `packages/react/src/toast/utils/resolvePromiseOptions.ts` maps the `loading`/`success`/
   `error` string-shorthand options of `toastManager.promise()` to `toast.description` only,
   never `toast.title`. The **official docs demo**
   (`docs/src/app/(docs)/react/components/toast/demos/promise/css-modules/index.tsx`) uses
   exactly this shorthand and renders only `Toast.Title` + `Toast.Description` — so the docs'
   own canonical "promise" demo produces a `role="dialog"` toast with an empty `Title` and no
   accessible name. The Storybook story faithfully reproduces this (matching AGENTS.md's
   guidance to mirror the hero/docs demo rather than diverge), so it's flagged here rather than
   silently patched: either `promise()`'s string shorthand should also populate `title` (e.g.
   for the loading/success/error text), or `Toast.Title` should fall back to `description` when
   no title is set, or the docs demo should be updated to pass `{ title, description }` objects
   instead of bare strings.

## Accepted-as-is

No violations were dismissed as pure rule noise/false positives in this pass — every remaining
item above traces to a specific, explainable library mechanism (either a deliberate but
imperfect a11y pattern, a genuine gap, or a demo that intentionally mirrors documented library
behavior). The closest thing to "accepted" is #9 above (Toast `PromiseToast`): not patched
because doing so would mean the Storybook copy diverging from the canonical docs demo it's
meant to faithfully port.

## Final state

- `.storybook/preview.tsx` → `a11y.test` restored to `'todo'`.
- `npx vitest --project storybook run`: 42/42 files, 471/471 tests green.
- `npx tsc --noEmit`: clean.
