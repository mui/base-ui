# Combobox — component research brief

Tier 1 (full depth). Mined 2026-07-06 from source, docs, tests, experiments, git history (89 `[combobox]`-scoped commits), and mui/base-ui issues/PRs (read-only). Evidence tags: [E] direct evidence, [I] inference, [G] gap.

## 1. Identity

- **Name / slug**: Combobox — `@base-ui/react/combobox`. Multi-part compound component, namespace export `Combobox.*`.
- **Status**: stable; shipped pre-1.0 in v1.0.0-beta.3 (2025-09-03) — one of the youngest pre-1.0 components (only Drawer/OTP Field are younger, and those shipped as previews). No `[New]`/`[Preview]` tag today. [E] (history.md birth table; CHANGELOG beta.3)
- **Purpose / IA statement**: a text input combined with a popup listbox of predefined items — "An input combined with a list of predefined items to select" [E] (docs Subtitle). The docs' own framing: "**Combobox is a filterable Select**" [E] (docs Usage guidelines). Taxonomy: **selection & input** cluster (popup-based picker); comparative guidance in [`_clusters/pickers.md`](../_clusters/pickers.md).
- **25 element parts** (from `packages/react/src/combobox/index.parts.ts`; one-liners from part JSDoc):

  | Part | Renders | One-liner |
  |---|---|---|
  | Root | no element | Groups all parts; owns value/inputValue/open state |
  | Label | `<div>` | Accessible label auto-associated with the combobox trigger (for input-inside-popup) |
  | Value | no element | The current value; function child renders selected value(s) (used for chips) |
  | Input | `<input>` | "A text input to search for items in the list" — the ARIA combobox |
  | InputGroup | `<div>` | Wrapper for the input and its associated controls; becomes default positioning anchor |
  | Trigger | `<button>` | A button that opens the popup |
  | Icon | `<span>` | Icon indicating the trigger opens a popup |
  | Clear | `<button>` | Clears the value when clicked; deliberately not tabbable |
  | Chips / Chip / ChipRemove | `<div>`/`<div>`/`<button>` | Tokenized display of multiple selections; Chips gets `role="toolbar"` when chips exist |
  | Portal | `<div>` | Moves the popup subtree elsewhere in the DOM (default `<body>`) |
  | Backdrop | `<div>` | Overlay beneath the popup |
  | Positioner | `<div>` | Positions the popup against the trigger/InputGroup |
  | Popup | `<div>` | Container for the list; `role="presentation"` or `"dialog"` (input-inside-popup) |
  | Arrow | `<div>` | Pointer element positioned against the anchor |
  | Status | `<div>` | Polite live region for async list status; must stay mounted |
  | Empty | `<div>` | Renders children only when the filtered list is empty; polite live region; requires `items` |
  | List | `<div>` | The `role="listbox"` container; function child renders each filtered item |
  | Row | `<div>` | A single row of items in grid mode (`grid` on Root) |
  | Item | `<div>` | `role="option"`; `React.memo`-wrapped for filtering performance |
  | ItemIndicator | `<span>` | Indicates whether the item is selected |
  | Group / GroupLabel | `<div>` | Groups related items with an auto-associated label |
  | Collection | no element | Renders filtered list items (needed when a wrapper sits between List and items) |
  | Separator | re-export | `Combobox.Separator` re-exports the standalone `Separator` [E] (`index.parts.ts`) |
- **Non-element exports**: `Combobox.useFilter` (Intl.Collator matching: `contains`/`startsWith`/`endsWith`, multiple-aware) and `Combobox.useFilteredItems` (reads the internally filtered items inside `<Combobox.Root>`) [E] (`root/utils/useFilter.ts`, `useFilteredItems.ts`; docs API reference). Types `Combobox.Root.Props<Value, Multiple>`, `ChangeEventReason/Details`, `HighlightEventReason/Details`.
- [E] **Shared engine**: `ComboboxRoot` is a thin wrapper over an internal `AriaCombobox` component parameterized by `selectionMode: 'single' | 'multiple' | 'none'`; Autocomplete is the *same engine* with `selectionMode="none"` (`combobox/root/AriaCombobox.tsx`; `autocomplete/root/AutocompleteRoot.tsx` imports it). Combobox = the engine that *remembers a selection*.

## 2. Intention

- [E] **Introducing PR**: mui/base-ui#2105 "[combobox] New `Combobox` and `Autocomplete` components" (atomiks, merged 2025-09-03), closing #222 "[combobox] Implement Combobox". A third sibling, **FilterableMenu, was previewed in the PR and deferred** ("will ship later" — strikethrough in the PR body); the searchable-menu demand still queues at #4157 (open). The PR body also records a deferred idea: "`Combobox` + `Tabs` — different semantics to the regular `Tabs` with virtual focus".
- [E] **Born from accumulated pain**: #222 (opened 2024) is a meta-issue listing 7 Base UI issues to close *and* 6 Material UI Autocomplete issues to learn from (mui/material-ui#23708, #23916, #25365, #31192, #31383, #32280) — the component is a designed answer to a decade of MUI Autocomplete history, not a fresh guess.
- [E] **Performance was a design pole before a line was written**: oliviertassinari in #222 — "One challenge will be performance… it took me 1,000 hr to get to a point where I started to be happy with the [Material UI Autocomplete]"; and "this needs to be performant with 1,000 records without virtualization, and 10,000 with virtualization." atomiks countered that Floating UI already supplies the interaction primitives: "The challenge there was more so the API design". The PR shipped with a dedicated perf experiment page (`experiments/combobox-perf`); items are `React.memo`-wrapped internally; later PRs kept paying the tax (#4964 "Avoid re-rendering every item on each keystroke"; docs "Memoizing items" section states the mount-cost-vs-typing-cost tradeoff and the ~1,000-item threshold for virtualization).
- [E] **Deliberately late**: colmtuite in #222 (2025): "We are planning to ship it this year. But it will likely be Q4" — combobox waited until the popup machinery (Select, floating-ui vendoring, event details) had stabilized. [I] Its API inherits every convention arc that preceded it (Portal→Positioner→Popup, eventDetails, `multiple`, object-value trio) — inferred from the prop surface matching Select's (#2704/#3604/#4005/#4056 land on both).
- [E] **The three-way split is the core design decision** (Combobox vs Autocomplete vs Select): one engine, three contracts. Combobox "does not allow free-form text input" (docs guidelines) — the *committed value* is always one of the predefined items; Autocomplete is `selectionMode="none"` where the text itself is the value; Select is the no-input variant. See §4.
- [E] **Explicit non-goals**: input-less usage ("we explicitly don't support a Combobox without the `Input` rendered somewhere. Accessibility features are missing for the listbox in that case (keyboard text navigation namely), so you should use Select" — atomiks, mui/base-ui#4086); trees ("trees are out of combobox scope" — mj12albert, mui/base-ui#2695; tree-popup feature request #4489 open, unactioned); select-all rows (a listbox may only contain options — mui/base-ui#4927); Suspense-first async (#3559 open, `waiting for 👍`-style).

## 3. When to use

- [E] Choosing predefined value(s) when the item count is "sufficiently large to warrant filtering" (docs Usage guidelines; mirrored on the select page).
- [E] Multiple selection with tokenized display — the `Chips` sub-anatomy exists precisely for this (docs "Multiple select" example; #2105 shipped it day one).
- [E] Async/remote item search with selection state — docs "Async search (single/multiple)" examples; `Status`/`Empty` live-region parts exist for this; maintainer-recommended pattern for paginated APIs (atomiks in #2677, #3818: keep selected items in `items`, drive display via `filteredItems`).
- [E] Searchable select popup (input *inside* the popup, trigger as form control) — docs "Input inside popup" example; roles switch to trigger `role="combobox"` + popup `role="dialog"` (#2973, #3213).
- [E] Filterable pickers embedded in a Dialog or rendered inline (no popup) via `inline` — supported and tested ("dialog pattern" suite, `ComboboxRoot.test.tsx:5369`; experiments `dialog-combobox.tsx`, `dialog-combobox-multiple.tsx`; `inline` JSDoc documents the Dialog composition); docs examples still pending (#3966 open — atomiks: "I agree, we should add docs for it").
- [E] Grid layouts (emoji-picker-style) via `grid` + `Row` (#2683 renamed `cols`→`grid`; grid navigation tests `ComboboxRoot.test.tsx:2856`).
- [E] Creatable entries — filter misses open a creation Dialog (docs "Creatable" example; experiment `creatable-tags.tsx`).
- [E] Large datasets with virtualization (`virtualized` prop + `useFilteredItems`; docs Virtualized example with `@tanstack/react-virtual`).

## 4. When not to use + alternatives

Full comparative guidance: [`_clusters/pickers.md`](../_clusters/pickers.md) (decision table + maintainer quotes). Combobox-side highlights:

- [E] **Free-form text (search boxes, novel tags) → Autocomplete**: "Combobox does not allow free-form text input. For search widgets, consider using Autocomplete instead" (docs Usage guidelines). Users who fight the input being reset to the selected value on close are in the wrong component (mj12albert redirected exactly this in #2677: "Any particular reason you are using combobox instead of autocomplete?").
- [E] **No visible input → Select**: docs guideline + the hard statement in #4086 (atomiks): input-less Combobox is unsupported and loses listbox a11y (typeahead). The one sanctioned exception: composing `Trigger`+`Value`+`Clear` without an input as a "clearable select" recipe (mj12albert, mui/base-ui#2734 — acknowledged gray area).
- [E] **Actions rather than a persisted value → Menu**; a filterable menu was deferred from #2105 and remains open demand (#4157).
- [E] **Hierarchical/tree selection or select-all → not this component** (#2695, #4489, #4927); compose userland recipes at your own risk (mj12albert supplied a hacked select-all `Combobox.Item` in #4927 with the ARIA caveats).
- [I] Very small, static option sets → Select or RadioGroup; filtering overhead buys nothing (inverse of the "sufficiently large" guideline). [G] No explicit maintainer statement on a numeric threshold (searched #2734 and docs; only "sufficiently large" + the perf numbers in #222).

## 5. Anatomy & composition

- [E] Canonical tree (docs Anatomy): `Root > (Label, InputGroup > (Input, Trigger, Icon, Clear, Value > Chips > Chip > ChipRemove), Portal > (Backdrop, Positioner > Popup > (Arrow, Status, Empty, List > (Row > Item > ItemIndicator, Separator, Group > GroupLabel, Collection))))`.
- [E] **Two legal homes for `Input`** — outside the popup (classic filterable field; the input is the form control, label it with `<label>`/`Field.Label`) or inside `Popup` (searchable-select; the *trigger* is the form control, label it with `Combobox.Label`) (docs Usage guidelines bullet 4; handbook forms labeling table). Roles re-arrange automatically (§7).
- [E] **`InputGroup`** (added #3745, 2026-03-11) exists so single- and multiple-selection fields can share one styled container "instead of styling the `Chips` part or `Input` part separately depending on the selection mode"; it also **becomes the default `anchor` for `Positioner`** when present (PR body). Clicks in its padding area focus the input / open the popup (#4296, fixing #4289).
- [E] **Chips anatomy**: `Chips` wraps `Chip`s; in the docs demos `Combobox.Value` (render-prop, no element) maps selected values to `Chip`s with `ChipRemove` buttons plus the `Input` as the last sibling (docs "Multiple select"; "Limiting visible chips" snippet slices the array — experiment `limited-chips.tsx`).
- [E] **`Status` and `Empty` are live regions with a mounting contract**: "This component's root element must remain mounted in the DOM to announce changes consistently across screen readers. Avoid hiding or removing the component itself… Prefer updating or conditionally rendering its children instead" (part JSDoc, both). `Empty` requires the `items` prop.
- [E] **`Collection`** renders the filtered items when a wrapper element sits between `List` and the items; "If rendering a flat list, pass a function child to the `List` component instead, which implicitly wraps it" (JSDoc). Used in the grouped demo (`Group > Collection`).
- [E] **`Row`** only matters with `grid` — grid semantics derive rows from DOM rows (Root `grid` JSDoc; `Row` JSDoc).
- [E] **Portal is mandatory** for popup rendering (library-wide policy #1222) — except `inline` mode, where the popup parts may be omitted entirely and the list rendered in-flow (Root `inline` JSDoc; test "bubbles Escape key when rendered inline without Positioner/Popup").
- [E] **Invisible machinery** users should know about: (1) a visually-hidden `<input>` carries the serialized value for forms/autofill — in `multiple` mode one hidden input *per selected value*, plus the main hidden input (`AriaCombobox.tsx:1266-1381`; its absolute positioning can confound drag-and-drop libs, #3019 has-workaround); (2) while open + modal, visually hidden "Dismiss" buttons render before the input and after the popup as an AT escape hatch (#4084; test "renders internal dismiss buttons before the input and after the popup"); (3) with the input outside the popup, the rest of the page — including `Trigger` — is made inert while open (test "hides the trigger when popup is open…").
- Text spec for a future anatomy diagram: (1) Label, (2) InputGroup, (3) Input, (4) Chips/Chip/ChipRemove, (5) Clear, (6) Trigger, (7) Icon, (8) Positioner [invisible frame], (9) Popup, (10) Status, (11) Empty, (12) List, (13) Group/GroupLabel, (14) Row [grid only], (15) Item, (16) ItemIndicator, (17) hidden form input [call out as invisible].

## 6. Behavior ("How it works")

- [E] **Three coordinated state axes**, each controllable: `value`/`defaultValue`/`onValueChange` (the committed selection), `inputValue`/`defaultInputValue`/`onInputValueChange` (the text), `open`/`defaultOpen`/`onOpenChange` (the popup). All handlers receive `(value, eventDetails)`; reasons union: `trigger-press | outside-press | item-press | close-press | escape-key | list-navigation | focus-out | input-change | input-clear | clear-press | chip-remove-press | none` (`AriaCombobox.ChangeEventReason`), plus `input-press` for clicks on the input specifically (#4015 distinguished it from `trigger-press`; `useClick(..., { reason: REASONS.inputPress })`).
- [E] **Input-value derivation**: on first mount the input text is derived from `value`/`defaultValue` (label-resolved via `items`/`itemToStringLabel`) unless `defaultInputValue`/`inputValue` is provided; not derived in multiple mode or input-inside-popup ("initial input value derivation" test suite; #2680 closing #2672; #3067). On close without selection the input resets to the selected value's label ("should reset input value to selected value when popup closes without selection"); pitfalls arise when users expect free text to survive — that's Autocomplete's contract (#2677).
- [E] **Filtering model**: by default items are filtered internally against the input query using an `Intl.Collator`-based `contains` match (locale-aware via `locale` prop); single-select uses a wrapper that shows *all* items when the query equals the selected label ("should show all items when query matches current selection" test; `createSingleSelectionCollatorFilter`). Override points: `filter` (predicate per item), `filteredItems` (fully external filtering — "the list will use these items instead of filtering the `items` prop internally", added #3068 to kill double-filtering in virtualized/async cases), `limit` (max rendered items, default -1; grouped-limit fix #5086), and `Combobox.useFilter()` for building external filters with the same collator semantics.
- [E] **`autoComplete` prop = APG autocomplete behavior dial**: `'list'` (default: filter the list, input untouched), `'both'` (filter + inline-autocomplete the input from the highlighted item), `'inline'` (static list + inline autocompletion), `'none'` (static list, no input mutation) (Root JSDoc).
- [E] **Highlight model is virtual focus**: `useListNavigation(..., { virtual: true })` — DOM focus never leaves the input; the highlighted item is marked `data-highlighted` and referenced by `aria-activedescendant` (`AriaCombobox.tsx:1084`; mui/base-ui#2731: "items are never DOM-focused"). Typing clears the highlight so "virtual focus returns to the input" (source comment, `ComboboxInput.tsx:362`). `autoHighlight` (`false`/`true`/`'always'`) keeps the first match highlighted while filtering (#2668 closing #2633; `'always'` typing gap tracked in #4188, open). `highlightItemOnHover` (default true) unifies hover+keyboard into one `data-highlighted` state; `keepHighlight` preserves it on pointer leave.
- [E] **Open/close semantics**: clicking the input opens by default (`openOnInputClick`, default true; `mousedown-only` with a 100ms touch delay "to let mobile viewport/keyboard positioning settle", #4351); typing opens (`input-change`); ArrowDown/ArrowUp open and move; outside press uses "sloppy" mouse / "intentional" touch dismissal; focus-out closes. In `multiple` mode item selection keeps the popup open — *except* when the list is filtered, where it closes to avoid the layout-shift of the filter resetting (atomiks: "This was 'intentional'… I am open to changing the behavior", mui/base-ui#3181, open; matches Material UI Autocomplete). Input-inside-popup multiple keeps it open and preserves the query (#3306 test; `closeQuery` preserved #4715).
- [E] **Selection mechanics**: Enter selects the highlighted item; Enter with *no* highlight closes the popup and lets the form submit (`ComboboxInput.tsx:466-478`; `submitOnItemClick` opts item clicks into submitting). Drag-to-select (press-drag-release in one gesture) supported since #3167, matching Select. Item taps don't blur the input (#4578).
- [E] **Value retention vs `items`**: since #3824 (v1.2.0-era) the selected value is **not cleared when the item disappears from `items`** — deliberately matching native `<select>`, which "retain[s] the previous `value` in state when the `<option>` gets removed" (PR body; reversing the behavior users hit in #3818/#3502). This is what makes paginated-async selection viable.
- [E] **Browser autofill** is first-class: the hidden input's `onChange` matches autofilled text against serialized values *and* rendered labels (case-insensitive), force-mounting the list if needed to learn labels; canceled autofill doesn't dirty the field (`AriaCombobox.tsx:1301-1363`; ~10 dedicated tests; #4972, #4560, #3924 "Prevent opening popup on autofill change").
- [E] **Modality**: `modal` defaults to **`false`** (unlike Select's `true`) — "user interaction with the rest of the document is allowed" by default (Root JSDoc). `modal` + touch: scroll lock applies only when a touch-opened popup spans nearly the viewport width, mirroring iOS (JSDoc; "scroll locking" Chromium tests; scroll-lock re-render fix #4507).
- [E] **`inline` mode**: renders the list in-flow without the popup; **`open` must be passed unconditionally** (`<Combobox.Root inline open>`), and inside a Dialog you bind the combobox's `open`/`onOpenChange` to the dialog's so transient state (query, highlight, input value) resets on close (Root JSDoc, documented in #5069 after #3966 asked; Escape bubbles in inline mode).
- [E] **Focus/touch**: opening via touch (input-inside-popup) focuses the popup, not the input, "to prevent the virtual keyboard from opening (required for Android; iOS handles this automatically)" (`ComboboxPopup.tsx:112-118`); iOS visual-viewport handling has dedicated fixes (#4351, #3227 open).
- [E] **Animation**: standard hooks — `data-open/closed/starting-style/ending-style` on Popup/Positioner, `--transform-origin`/`--available-height` CSS vars, `actionsRef.unmount()` + `onOpenChangeComplete` for JS libraries (Root JSDoc; `ComboboxPopupDataAttributes.ts`); a transition/status edge is open at #3811.
- [E] **SSR**: combobox ARIA attributes corrected during SSR (#4179); `Combobox.Label` not linked before hydration (test); hidden input ships `suppressHydrationWarning`.

## 7. Accessibility contract

- [E] **Pattern**: W3C APG **Combobox** pattern, editable variant with list autocomplete — https://www.w3.org/WAI/ARIA/apg/patterns/combobox/. The Root `loopFocus` JSDoc cites it directly: "The input is always included in the focus loop per [ARIA Authoring Practices]". Clear-button behavior "matches [the] ARIA combobox pattern" (atomiks, mui/base-ui#3630; downshift author silviuaavram concurred in-thread).
- [E] **ARIA managed by the component** (pinned by "aria attributes" test suite, `ComboboxRoot.test.tsx:1318-1486`):
  - Input: `role="combobox"`, `aria-expanded`, `aria-autocomplete="list"` (follows the `autoComplete` prop), `aria-haspopup="listbox"`, `aria-controls` (open), `aria-activedescendant` → highlighted option id (virtual focus), `aria-labelledby` auto-link, `aria-readonly`/`aria-required` as set.
  - List: `role="listbox"` (+ `aria-multiselectable` in multiple mode); Popup: `role="presentation"` — or **`role="dialog"` when the input is inside the popup** (#3213), with the Trigger then taking `role="combobox"` + `aria-controls` → dialog popup (#2973; `ComboboxTrigger.tsx:173`, `ComboboxPopup.tsx:94`).
  - Item: `role="option"`, `aria-selected`; grid mode emits `row`/`gridcell` roles (#2856 tests). Group/GroupLabel auto-associate.
  - Chips: container `role="toolbar"` when chips exist — added specifically so NVDA's browse-mode doesn't swallow arrow keys (#3647 closing #3629); chips take **real DOM focus** (`tabIndex={-1}`, focused programmatically) unlike list items.
  - Hidden form input: `aria-hidden`, `tabIndex={-1}`, focus forwarded to input/trigger.
- [E] **Keyboard interaction table** (evidence: `ComboboxInput.tsx` key handling; `useListNavigation`/`useDismiss` wiring; "keyboard interaction" test suite):

  | Key | Context | Action |
  |---|---|---|
  | Printable characters | any | Filter the list (opens popup on `input-change`); typing clears the item highlight so virtual focus returns to the input |
  | ArrowDown / ArrowUp | closed | Open the popup and highlight first/last item ("focuses first item on ArrowDown and last item on ArrowUp") |
  | ArrowDown / ArrowUp | open | Move virtual highlight; with `loopFocus` (default) focus loops through the input itself at list edges |
  | Enter | open, item highlighted | Select the item (single: close; multiple: stay open unless filtered, §6) |
  | Enter | open, no highlight | Close popup, allow native form submission ("Allow form submission when no item is highlighted") |
  | Escape | open | Close the popup (`escape-key`); propagation stopped unless `Empty` is absent and list hidden (#2935: Esc bubbles to parent popups if `Empty` isn't used) |
  | Escape | closed | **Clear input and selected value** (reason `escape-key`); stops propagation only if something was cleared (`ComboboxInput.tsx:403-419`) |
  | Home / End | any | Move the input caret to start/end (the input owns Home/End — not list navigation; Chrome/Safari scroll fix #2928) |
  | ArrowLeft / ArrowRight | multiple, caret at text start | Move real DOM focus across chips (RTL-aware); in grid mode without highlight they stay on the caret (#4948) |
  | Backspace / Delete | chip focused | Remove that chip, move highlight to the neighbor |
  | Backspace | input empty, no chip focused | Remove the last chip (`ComboboxInput.tsx:421-448`) |
  | Delete (or Esc) | — | Keyboard path for clearing, since `Clear` is not tabbable (mui/base-ui#3630) |
  | Tab / focus out | open | Close (`focus-out`) |
- [E] **Deliberate keyboard stances**: `Combobox.Clear` and `ChipRemove` are `tabIndex={-1}` — "one tab stop per field"; keyboard users clear via Esc/Delete; "matches ARIA combobox pattern" and screen-reader-user expectations (mnajdova/atomiks, mui/base-ui#3630, closed not-planned).
- [E] **Screen-reader hardening on record**: initial live-region announcements fixed (#4286); TalkBack option-wrapper structure fixed in docs demos (#4607 — extra wrappers between List and Item broke Android announcement); iOS VoiceOver was closing the popup on double-tap (#3859, fixed); NVDA chips navigation (#3629 → toolbar role). Modal flows get visually-hidden Dismiss buttons so AT focus is never trapped without an exit (#4084).
- [E] **Labeling contract**: input-outside → native `<label>`/`Field.Label`/`aria-label` on the Input; input-inside-popup → `Combobox.Label` (a `<div>`; clicking focuses the trigger without opening) labels the Trigger (docs Usage guidelines; forms handbook). A label linked to a hidden input opening the popup was fixed via #3727.
- **Open a11y-adjacent issues (honesty list)**: [E] #4657 (open) — passing `index` to Item breaks hover highlight; #3227 (open) — `--available-height` misbehaves when the iOS keyboard opens; #2991 (open) — mobile popup-as-aside layout bug; #3181 (open) — multiple+filtered close behavior debated (UX, affects SR flow continuity); #4938 (open, has workaround) — clearing value in input-inside-popup pattern. [G] No open screen-reader-specific bug found beyond these (searched `label:"component: combobox"` open issues, "combobox NVDA/VoiceOver/TalkBack").

## 8. Prop-level guidance (decision-relevant props)

- [E] **`items` (Root)** — supply whenever possible: enables internal filtering + `Empty`, label lookup for value→text derivation, and autofill label matching. Grouped shape: `[{ value: 'Fruits', items: [...] }]` (docs Grouped). Omitting it and filtering statically still works ("highlights the first matching item for a static list without the items prop") but `Empty` won't.
- [E] **`filter`** — custom predicate `(itemValue, query, itemToString) => boolean`; pair with `Combobox.useFilter({ multiple, value, locale })` for collator-correct externally-built filters (docs useFilter section: "This hook is used when externally filtering items. Pass the result to the `filter` prop").
- [E] **`filteredItems`** — hand the component pre-filtered items and it stops filtering internally; the async-search pattern is `items` = all-known+selected, `filteredItems` = current results (#3068 rationale: kills double-filtering and stringify cost; atomiks prescribes it in #3818). Reopening after selection resets external instances (#3272, #3732 tests).
- [E] **`useFilteredItems()`** — inverse direction: read the internal filter's output, for virtualizers that need the visible set (#3732, closing #3669; virtualized demo).
- [E] **`multiple`** — array value, chips anatomy, one hidden input per value for form posts ("should create multiple hidden inputs"); `required` releases once ≥1 selected (#2404 tests). Type-level: `Combobox.Root.Props<Value, Multiple>`; write a typed wrapper for reuse (docs TypeScript section; generics can't cross context — mui/base-ui#3951).
- [E] **`autoComplete` (behavior) vs `autoComplete` (public Root prop = browser autofill hint on the hidden input)** — the public `autoComplete` string maps to the internal `formAutoComplete`; the APG behavior dial (`'list' | 'both' | 'inline' | 'none'`) is internal for Combobox (fixed to list-style filtering) and surfaced as Autocomplete's `mode` prop. Don't confuse them (`ComboboxRoot.tsx:19,30,74`; `AutocompleteRoot.tsx:40,131`).
- [E] **`isItemEqualToValue`** — required whenever value objects aren't referentially identical to items (cloned state, RHF form rehydration, async): "Useful when item values are objects without matching referentially. Defaults to `Object.is`" (JSDoc; demanded in #2754, honored in multiple-mode #2893, arg order fixed #4056). The #3818 flash-of-empty fix in userland was exactly this prop.
- [E] **`itemToStringLabel` / `itemToStringValue`** — object display text vs form serialization; `{ value, label }`-shaped objects work automatically (JSDoc; `onFormSubmit` respects `itemToStringValue` #3441). Raw-primitive `value` with `items` lookup renders the raw value in the input, not the label — use object values or `itemToStringLabel` (#4735 open expected-behavior).
- [E] **`autoHighlight`** — `true` highlights the first match while typing ("Enter then selects it"); `'always'` highlights as soon as the list opens (runtime supports it; typing/docs lag tracked in #4188). Leave `false` for APG-default "no surprise selection".
- [E] **`openOnInputClick={false}`** — turn the field into type-to-open only ("does not open on input click when false, but opens on typing").
- [E] **`inline` + `open`** — in-flow list without popup; always pass `open` (#5069 JSDoc addition); bind to Dialog state in dialog compositions.
- [E] **`grid` + `Row`** — arrow keys become 2D; uneven rows and RTL supported (tests); wrapping across rows is intended grid behavior (atomiks reply to michaldudak's #2105 review).
- [E] **`virtualized`** — disables internal index assumptions; pair with `useFilteredItems`/`filteredItems` and per-item `index` props… but note `index` currently breaks hover highlight (#4657 open).
- [E] **`modal` (default `false`)** — set `true` only for immersive pickers; combined with `Popover`-style focus trap + hidden Dismiss buttons (#4084).
- [E] **`loopFocus` (default `true`)** — disable to stop Arrow keys wrapping through the input (#3592, added on request).
- [E] **`name`/`form`/`required`/`readOnly`/`disabled`** — full native-form citizenship via the hidden input; `readOnly` blocks opening and value changes but keeps the popup browsable state consistent (prop suites at 2297–2562). Field integration drives `data-valid/invalid/touched/dirty/filled/focused` on Input and Trigger; Trigger can be the Field control when input is inside the popup (#2968 fixed; `data-filled` suite).
- [E] **Styling contract highlights** (from `*DataAttributes.ts`): Input/Trigger — `data-popup-open`, `data-pressed`, `data-popup-side`, `data-list-empty`, field states; Trigger also `data-placeholder`; Item — `data-selected`, `data-highlighted`, `data-disabled`; Positioner/Popup — `data-open/closed/starting-style/ending-style`, `data-side`, `data-align`, `data-empty`, Popup `data-instant`; Clear — `data-visible` (visibility state exposed by #4664, animatable via starting/ending-style); Positioner CSS vars — `--available-width/height`, `--anchor-width/height`, `--transform-origin`.

## 9. Decision log

- **2024 — #222 opened**: Combobox specced as the closer of 7 Base UI issues and heir to 6 Material UI Autocomplete lessons; perf named the top risk (oliviertassinari's 1,000-hour warning). [E]
- **2025-09-03 (beta.3) — #2105 ships Combobox + Autocomplete together** (atomiks): one internal engine, two public contracts; FilterableMenu previewed and deferred; grid/creatable/virtualized demos from day one. [E]
- **2025-09-10 — `autoHighlight` prop** (#2668, closing #2633): opt-in first-match highlight, requested from the first PR review ("similar to MUI Autocomplete", michael-land). [E]
- **2025-09-11 — input value derived from `value`/`defaultValue`** (#2680, closing #2672): controlled combobox shows its label on first paint. [E]
- **2025-09-23 (beta.4, breaking) — `cols` → `grid`** (#2683): columns inferred from rendered `Row`s instead of a magic number. [E]
- **2025-10-14 — Trigger gets `role="combobox"` when Input is inside Popup** (#2973), completed by **popup `role="dialog"`** (#3213, 2025-11-16): the searchable-select pattern got its own ARIA shape. [E]
- **2025-11-02 — `filteredItems` prop** (#3068): external filtering became first-class to fix virtualized double-filtering + object serialization cost. [E]
- **2025-11-13 — drag-to-select** (#3167): press-drag-release parity with Select/native. [E]
- **2025-12-28 — `loopFocus` prop** (#3592); **2026-01-13 — `role="toolbar"` on Chips** (#3647, closing NVDA bug #3629). [E]
- **2026-01-23 — `useFilteredItems` hook** (#3732, closing #3669): virtualization without owning the filter. [E]
- **2026-01-28 — value survives `items` changes** (#3824, closing #3818/#3502): reversed the clear-on-removal behavior to match native `<select>` value retention; unblocked paginated async comboboxes. [E]
- **2026-02-09 — `input-press` open reason** (#4015): input clicks distinguishable from trigger clicks in `onOpenChange`. [E]
- **2026-03-11 — `InputGroup` part** (#3745): one styleable field container across selection modes; auto-anchor for the Positioner. Same day: **hidden Dismiss buttons + modal focus-trap rework** (#4084, closing #3693/#2722/#4096). [E]
- **2026-04-01 — initial live-region announcement fix** (#4286); **2026-04 — iOS viewport settling delay** (#4351). [E]
- **2026-06-17 — per-keystroke item re-render elimination** (#4964); **2026-06-23 — grouped `limit` fix** (#5086); **`inline`+`open` requirement documented** (#5069). [E]
- **Standing decisions**: Clear stays non-tabbable (#3630, not-planned); multiple+filtered close stays (for now) to avoid layout-shift disorientation (#3181, open); no input-less combobox (#4086); no trees (#2695/#4489). [E]

## 10. Pitfalls & FAQ

- **"My value disappears when async results change"** → keep selected items inside `items` and pass search results via `filteredItems`; since #3824 values also survive item removal (mui/base-ui#3818, #2677, #3502). For object values from a server, set `isItemEqualToValue` or you'll see flash-of-null / duplicate selections (#3818 comment, #2754, #3865 open). [E]
- **"Input shows the raw value, not the label"** → primitive item `value`s render as-is even when `items` provides labels; use object values (`{ value, label }`) or `itemToStringLabel` (mui/base-ui#4735, open expected-behavior). [E]
- **"I removed the Input and filtering breaks / typeahead is gone"** → unsupported composition; use Select (mui/base-ui#4086, atomiks). [E]
- **"Popup closes after each pick in multiple mode"** → only when the list is filtered; intentional to avoid layout shift; input-inside-popup variant keeps it open and preserves the query — or track mui/base-ui#3181 (open). [E]
- **"Clear button isn't Tab-reachable"** → by design (one tab stop per field); Esc (closed popup) or Delete clears via keyboard (mui/base-ui#3630). [E]
- **"Can't style hover separately from keyboard highlight"** → items never receive DOM focus; one unified `data-highlighted` by design; set `highlightItemOnHover={false}` to split them (mui/base-ui#2731). [E]
- **"Escape wipes my typed text"** — with the popup closed, Esc clears input *and* value (reason `escape-key`); cancel via `eventDetails.cancel()` in `onValueChange`/`onInputValueChange` if that's wrong for your form (source `ComboboxInput.tsx:403`; related opt-out ask for Autocomplete: #4245). [E]
- **"Enter needs pressing twice to submit my form"** → Enter with no highlighted item closes the popup and lets submission proceed; with `autoHighlight` an item is always highlighted, so Enter selects instead — decide which contract you want (`ComboboxInput.tsx:470-478`; sibling issue mui/base-ui#2686 for Autocomplete). [E]
- **"Combobox popup inside a Radix/other dialog isn't clickable"** → third-party `pointer-events: none` body lock; portal into that dialog's container (mui/base-ui#2854). z-index: never on Popup, on Positioner if at all (#2450 pattern). [E]
- **"Hidden input breaks my drag-and-drop / :nth-child styling"** → a visually-hidden `<input>` (plus one per value in multiple mode) lives inside Root; don't write DOM-position-dependent CSS/dnd logic around it (mui/base-ui#3019, has workaround). [E]
- **"Items list re-renders on every keystroke is slow"** → memoize items (`React.memo` + item-as-prop) up to ~1,000 items; virtualize beyond that because *mount cost dominates opening* (docs "Memoizing items"; #4964 removed a library-side per-keystroke re-render). [E]
- **"Typing `any` on `items`"** → inference flows from `value`/`defaultValue`; write the documented typed wrapper (`Combobox.Root.Props<Value, Multiple>`); generics cannot cross React context in compound components (mui/base-ui#3951; docs TypeScript section). [E]
- **"Inline list never shows"** → `inline` requires `open` to be set (`<Combobox.Root inline open>`); inside a Dialog, bind open state to the dialog's (#5069, #3966). [E]
- **Docs feedback on record**: inline single/multi examples requested (#3966, open); custom-value rendering example (#2759, open); Tab-to-select behavior question (#2894, open); async pagination guidance (#3719, open). [E]

## 11. Real-world patterns observed

- [E] Corpus status: `research/d-real-world-usage/_corpus/repos.json` — **28 repos discovered via the combobox subpath import** (`foundVia: code-import-baseui-react-combobox`). No per-component `combobox/` dataset yet — **[G] candidates.json / ranked.json / examples.md pending Phase D**.
- [E] Highest-star combobox importers: langgenius/dify (147.9k★), amruthpillai/reactive-resume (39.4k★, MIT), PostHog/posthog (35.4k★), mastra-ai/mastra (25.9k★), gitbutlerapp/gitbutler (21.3k★), pingdotgg/t3code (13.3k★, MIT), **WordPress/gutenberg (11.7k★)**, woocommerce/woocommerce (10.4k★), electric-sql/electric (10.3k★, Apache-2.0), cosscom/coss (10.2k★, oss-design-system), typebot.io (10.1k★).
- [I] WordPress involvement is bidirectional: Gutenberg imports the combobox subpath, and @mirka (WordPress design-tools) is a participant shaping behavior debate in #3181 — design-system adopters are treating Base UI Combobox as their token-field/attribute-picker engine. Verify file paths during Phase D.
- [I] Expected archetypes to verify in Phase D: tag/label multi-select with chips (dify/PostHog-style dashboards), country/user pickers with async search, command-ish filter fields inside dialogs, design-system wrapper components (coss, shadcn-derived registries re-exporting the full part set).

## 12. Story plan pointer

See [`story-plan.md`](./story-plan.md) — 26 planned stories: 8 kept docs demos, use-case stories per §6/§8 behaviors (filtering, async, chips keyboard flow, inline, grid, form integration), one full open→filter→select→close interaction story (required), plus Phase-D recreation placeholders.
