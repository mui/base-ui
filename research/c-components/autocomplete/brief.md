# Autocomplete — component research brief

Tier 1 (full depth). Mined 2026-07-06 from source, docs, tests, git history, and mui/base-ui issues/PRs (read-only). Evidence tags: [E] direct evidence, [I] inference, [G] gap. Comparative picker guidance lives in [`_clusters/pickers.md`](../_clusters/pickers.md).

## 1. Identity

- **Name / slug**: Autocomplete — `@base-ui/react/autocomplete`. Multi-part compound component, namespace export `Autocomplete.*`.
- **Status**: stable; shipped 2025-09-03 in v1.0.0-beta.3 (mui/base-ui#2105, commit b7393ac12) together with Combobox; no `[New]`/preview tag. [E]
- **Purpose / IA statement**: a free-form text input whose popup list *suggests* (and optionally inline-completes) the text — "An input that suggests options as you type" [E] (docs Subtitle). The typed string **is** the committed value; nothing is "selected" in a remembered sense. Taxonomy: selection & input → listbox-driven pickers (with Select and Combobox).
- **21 element parts + 2 hooks** (`packages/react/src/autocomplete/index.parts.ts` / `index.ts`; one-liners from part JSDoc):
  | Part | Renders | One-liner | Source ownership |
  |---|---|---|---|
  | Root | no element | Groups all parts | **own** (`root/AutocompleteRoot.tsx`) |
  | Value | no element | Current input value (render-prop display) | **own** |
  | Trigger | `<button>` | A button that opens the popup | own type wrapper → `ComboboxTrigger` |
  | Input | `<input>` | The text input | re-export `ComboboxInput` |
  | InputGroup | `<div>` | Wrapper for the input and its associated controls | own type wrapper → `ComboboxInputGroup` |
  | Icon | `<span>` | Decorative icon (e.g. chevron/magnifier) | re-export |
  | Clear | `<button>` | Clears the input value; not tabbable | re-export |
  | List | `<div>` | `role="listbox"` container; function-child render mode | re-export |
  | Status | `<div>` | `role="status"` polite live region (async status) | re-export |
  | Portal / Backdrop / Positioner / Popup / Arrow | `<div>`s | Standard popup layering | re-exports |
  | Group / GroupLabel / Collection / Row | `<div>`s | Grouped items; grid rows | re-exports |
  | Item | `<div>` | An individual item in the list | own type wrapper → `ComboboxItem` |
  | Empty | `<div>` | Renders children only when the list is empty; live region | re-export |
  | Separator | re-export | `Autocomplete.Separator` re-exports the standalone `Separator` | re-export |
  | `useFilter` | hook | `Intl.Collator`-based `contains`/`startsWith` matchers for external filtering | re-export of combobox `useCoreFilter` |
  | `useFilteredItems` | hook | Returns the internally filtered items inside `Root` (#3732) | re-export |
- [E] **Shared implementation layer**: both `AutocompleteRoot` and `ComboboxRoot` are thin configuration wrappers over the `@internal` **`AriaCombobox`** engine (`packages/react/src/combobox/root/AriaCombobox.tsx`). Autocomplete = `AriaCombobox` fixed to `selectionMode="none"`, `fillInputOnItemPress`, `autoComplete={mode}`, `openOnInputClick=false`, with `value` mapped to the engine's `inputValue` (`AutocompleteRoot.tsx:123-137`). Combobox = the same engine with `selectionMode="single"|"multiple"`.
- [E] Autocomplete initially re-exported Combobox parts *directly*; #4409 (v1.4.0 era) gave it "own part exports, type surface, and generated reference docs", incl. own data-attribute enums and removal of the wrongly-advertised `data-selected` from `Item`.

## 2. Intention

- [E] **Origin**: colmtuite's tracker mui/base-ui#222 "[combobox] Implement Combobox" (2024) collected 7 Base UI issues + 6 Material UI Autocomplete issues to solve; oliviertassinari warned from experience: "it took me 1,000 hr to get to a point where I started to be happy with the [Material UI Autocomplete]"; atomiks countered that Floating UI supplies the interaction primitives and "The challenge there was more so the API design".
- [E] **Why a separate component instead of a Combobox mode** — the split happened *inside* the introducing PR after internal discussion (atomiks, mui/base-ui#2105 comment, 2025-08): "`Combobox` will change to only have filterable select behavior… The input is restricted to a predefined set of values. `Autocomplete`, a new component, will be the current Combobox implementation with `selectionMode="none"`. Used when the input can have any value, not restricted to a predefined set. For example, Google Search. … This is because Combobox in its current form is taking on too many roles to the point of becoming overly monolithic (despite `role="combobox"` being flexible)." A third sibling, `FilterableMenu` (input filters *command* items), was previewed in #2105 and deferred ("will ship later"); it still hasn't shipped — Autocomplete's command-palette recipe covers that role today (#4157).
- [E] **The `value` semantics follow from the split**: michaldudak asked why the controlled prop was `selectedValue`; atomiks: "Now that they're split, `value` for selected value and `inputValue` for Combobox could work; while for Autocomplete, `value` could refer to the `inputValue` instead?" — michaldudak: "Yes, this is what I'd intuitively expect." (#2105 review thread). Shipped exactly so: Autocomplete's `value` IS the input text.
- [I] **Design pole: behave like a browser search box / omnibox.** Inferred from convergent decisions: Escape on a closed popup clears the input "to match the Chrome URL omnibox" (atomiks, mui/base-ui#4245); Enter with no highlighted item submits the owning form like Google Search (#2686→#2700, oliviertassinari citing Google's behavior); inline completion (`mode="both"`) is modeled on the Chrome omnibox (mui/base-ui#2669 screenshot); the input ships `autoComplete="off"/spellCheck=false/autoCorrect=off/autoCapitalize=none` like a search field (`AriaCombobox.tsx:1024-1029`).
- [E] **Explicit non-goals**: no remembered selection state ("Use Combobox instead… if the selection should be remembered", docs Usage guidelines); no submenus — a searchable menu with nested submenus is acknowledged unsolved ("it's more like Autocomplete needs `SubmenuRoot` parts… A separate component with different roles and behavior is probably 'cleanest'", atomiks, mui/base-ui#4157, open); no built-in "default items when no results" yet (userland via external filtering, mui/base-ui#2933, open).
- [E] Performance was an identity concern from day 0 (#222 thread; #2105 shipped a combobox-perf experiment); docs carry dedicated "Memoizing items" guidance (#5062) and a virtualization demo.

## 3. When to use

- [E] Free-form text where suggestions help but any value is legal — search fields, tag/query inputs ("the input can have any value… For example, Google Search", atomiks #2105; docs Subtitle).
- [E] Filterable command pickers / command palettes: "The input can be used as a filter for command items that perform an action when clicked when rendered inside the popup" (docs Usage guidelines); the command-palette demo (Dialog + `inline` + `autoHighlight="always"`) is the maintainer-endorsed filterable-menu recipe (#4157, #2817).
- [E] Inline autocompletion UIs (`mode="both"`/`"inline"`): "Autofill the input with the highlighted item while navigating with arrow keys" (docs Inline example).
- [E] Async/server-backed suggestions: first-class demo (controlled `value` + `filter={null}` + `Status` + AbortController + `useTransition`, docs Async search; refactored effect-free in #3636).
- [E] Large suggestion sets: `limit` prop (docs Limit example; requested by michaldudak in #2105 review), `React.memo` items (#5062), virtualization (`filteredItems` prop #3068, dynamic measurement #3130).

## 4. When not to use + alternatives

Full decision table + maintainer quotes: [`_clusters/pickers.md`](../_clusters/pickers.md).

- [E] **Selection must be remembered / restricted to the list → Combobox**: "Avoid when selection state is needed: Use Combobox instead of Autocomplete if the selection should be remembered and the input value cannot be custom. Unlike Combobox, Autocomplete's input can contain free-form text, as its suggestions only *optionally* autocomplete the text" (docs Usage guidelines, the page's own boundary statement).
- [E] **No text input rendered → Select** ("Use Select instead of Combobox if no input is being rendered", combobox docs guidelines — applies transitively; Autocomplete without its Input is meaningless since the input is the control). [I]
- [E] **Dropdown of actions without filtering → Menu**; **searchable menu with submenus → no component fits yet** (open gap, mui/base-ui#4157 — Autocomplete works "provided the menu with a search filter has no submenu triggers as items", atomiks).
- [I] **Plain text field without suggestions → Input/Field** — Autocomplete's popup machinery is pure overhead then (derived from API; no maintainer statement found [G]).
- [E] **Multi-value tokenized entry → Combobox `multiple` + Chips** — Autocomplete has no `multiple`; its value is one string (see part list; combobox Chips parts) [I from API].

## 5. Anatomy & composition

- [E] Canonical tree (docs Anatomy): `Root > (InputGroup > (Input, Trigger, Icon, Clear, Value), Portal > (Backdrop, Positioner > Popup > (Arrow, Status, Empty, List > (Row > Item, Separator, Group > GroupLabel, Collection))))`.
- [E] `Root` renders nothing; the **Input is the interactive control** and is typically wrapped in a plain `<label>` or `Field` (hero demo wraps Input in `<label>`).
- [E] **Two input placements**: (1) input outside the popup (default, hero); (2) input *inside* the popup — command-palette style; then the Popup takes `role="dialog"` (#3213) and any `Trigger` outside becomes the `role="combobox"` reference (#2973); popup-rendered inputs still submit via native FormData (#4725).
- [E] **`inline` prop drops the popup entirely** — list renders in place; "Specify `open` unconditionally in conjunction with this prop: `<Autocomplete.Root inline open>`" (Root JSDoc, documented after #5069). Used by the command-palette demo inside a Dialog.
- [E] `InputGroup` ("A wrapper for the input and its associated controls") was added later for input+buttons composition (#3745, v1.1.0); carries the same state attributes as Trigger (`data-popup-open`, `data-list-empty`, field states).
- [E] `List` supports function children as the item-render mode fed by `items` (hero: `{(tag) => <Autocomplete.Item …>}`); `Collection` re-renders the subset inside each `Group` (grouped/command-palette demos); `Row` wraps items for `grid` mode (#2683). `CompositeList` logic deliberately lives on `List`, not Popup, so the Input can participate in outer composites (#2883).
- [E] `Status` and `Empty` are polite live regions that **must remain mounted**: "Avoid hiding or removing the component itself with `display: none`, `hidden`, `aria-hidden`, or conditional rendering. Prefer updating or conditionally rendering its children instead" (part JSDoc).
- [E] `Trigger` is optional (a chevron/search button to open the popup); Clear is a non-tabbable clear affordance (single tab stop per field policy, mui/base-ui#3630 — decided on Combobox, shared part).
- Text spec for anatomy diagram: (1) InputGroup, (2) Input, (3) Trigger, (4) Icon, (5) Clear, (6) Positioner [invisible], (7) Popup, (8) Status, (9) Empty, (10) List, (11) Group, (12) GroupLabel, (13) Item, (14) Separator, (15) Arrow; second panel for input-inside-popup variant.

## 6. Behavior ("How it works")

- [E] **Value model**: `value`/`defaultValue`/`onValueChange(value: string, eventDetails)` control the *input text* — there is no separate selection state (`AutocompleteRoot.tsx`; contrast Combobox's `value` + `inputValue`). `Autocomplete.Value` exposes the live string for display (`children` function form).
- [E] **`mode` drives filtering + inline completion** (Root JSDoc): `list` (default) — items filtered by input, input never auto-changes; `both` — filtered + input temporarily shows the highlighted item (inline completion); `inline` — static items + inline completion; `none` — static items, no completion. The prop value is passed straight through as `aria-autocomplete` (`AriaCombobox.tsx:1037`). Inline completion is implemented in `AutocompleteRoot` by composing a temporary `inlineInputValue` from `onItemHighlighted` (keyboard-only; pointer highlights don't overwrite typed text — test "hovering items should not change the inline overlay"). In `both`, filtering uses only the *typed* query, not the temporary inline value (`resolvedFilter` wrapper).
- [E] **Filtering pipeline**: default filter is `useFilter().contains` — `Intl.Collator`-based, diacritic/case-robust (`internals/filter.ts`); `filter` prop swaps in custom logic (fuzzy demo); **`filter={null}` disables internal filtering** for server-side/external results (async demo; regression #4196 fixed by #4117); `limit` caps rendered items ("guide users to refine their query using `<Autocomplete.Status>`", docs); `useFilteredItems()` reads the derived filtered list (#3732); `filteredItems` prop overrides it for virtualization (#3068).
- [E] **Open/close**: typing opens the popup; clicking the input does **not** open it by default (`openOnInputClick` defaults `false` for Autocomplete, `true` for Combobox — the JSDoc-inheritance mismatch was a documented bug, #4006→#4023); `Trigger` press opens; Escape and outside press dismiss (touch uses "intentional" outside-press detection so users can scroll the page, `AriaCombobox.tsx:1056-1064`); Tab closes (test "closes popup on Tab…"); popup also closes when the query empties [I from LukasTy's #2105 review observation, behavior retained].
- [E] **Highlight = virtual focus**: DOM focus stays on the input; items get `data-highlighted` + `aria-activedescendant` linkage. `autoHighlight` (`true` = highlight first match while typing; `'always'` = always, for command palettes), `keepHighlight` (survives pointer leave), `highlightItemOnHover` (#2976). Highlight resets are still coarse — no public API to reset it manually (mui/base-ui#4745, open).
- [E] **Selection mechanics**: pressing an item (pointer or Enter on highlighted item) *fills the input* with the item's string (`fillInputOnItemPress`) and closes the popup; `Item.onClick` fires for both pointer and Enter (#2816; `AutocompleteItem` JSDoc); focus stays on the input even when pressing the List element (#3092).
- [E] **Forms**: the typed text submits under `name` (tests "submits the typed input value…"; popup/inline inputs covered via a hidden field-aware input, #4725; SSR renders the right input name pre-hydration — 4 dedicated SSR tests). Enter with **no** highlighted item closes the popup and lets native submission proceed (bugfix #2700); `submitOnItemClick` additionally submits on item press for single-field search forms — "a submit button must be present inside the form because of the hidden input" (#3018 body). Field integration drives `data-touched/dirty/filled/focused/valid/invalid` + `validationMode` on the Input (test suite "Field"); browser autofill into the hidden input is honored, and ignored when `readOnly`/`disabled` (tests; #4809).
- [E] **IME/mobile**: composition events don't block filtering on Android (#2944); iOS VoiceOver no longer closes the popup (#3859); an iOS 27 beta briefly broke item taps (external OS bug, mui/base-ui#5066, fixed in iOS dev beta 2).
- [E] **Animation**: standard popup contract (`data-open/closed/starting-style/ending-style`, `--transform-origin`, `onOpenChangeComplete`, `actionsRef.unmount()` for JS libraries — Root JSDoc). Known wart: transition flicker on input clear when no items match (mui/base-ui#4408, open).

## 7. Accessibility contract

- [E] **Pattern**: WAI-ARIA APG **Combobox** pattern, editable variant, with **all four `aria-autocomplete` values implemented** via `mode` → `aria-autocomplete` 1:1 ('list' | 'both' | 'inline' | 'none'; docs Inline example names them; `AriaCombobox.tsx:1037`). APG: https://www.w3.org/WAI/ARIA/apg/patterns/combobox/ (see "List autocomplete" / "Inline autocomplete" example variants).
- [E] **ARIA managed by the component** (source lines cited in §1/§5):
  - Input: `role="combobox"`, `aria-expanded`, `aria-haspopup="listbox"` (`"grid"` in grid mode), `aria-controls` (while open), `aria-autocomplete={mode}`, `aria-activedescendant` (virtual focus), `aria-labelledby`, `aria-readonly`/`aria-required`; DOM hygiene defaults `autoComplete="off"`, `spellCheck=false`, `autoCorrect="off"`, `autoCapitalize="none"`.
  - Popup: `role="presentation"` — or `role="dialog"` when the Input is rendered inside it (#3213). List: `role="listbox"` / `role="grid"`; Item: `role="option"` (`gridcell` within `Row`= `row`); **no `aria-selected`** — items are never "selected" in `selectionMode="none"` (#4409 removed the advertised `data-selected` too).
  - Trigger: `aria-expanded`, `aria-haspopup`; becomes the `role="combobox"` + `aria-haspopup="dialog"` reference when the input lives inside the popup (#2973).
  - Status/Empty: `role="status"`, `aria-live="polite"`, `aria-atomic` (+ a mutation trick so initial text is announced, `useInitialLiveRegionTextMutation`); initial-announcement gap was fixed after an a11y report (#4181).
- [E] **Keyboard table** (`ComboboxInput.tsx` onKeyDown; tests; APG):
  | Key | Context | Action |
  |---|---|---|
  | Printable characters | any | Edits text; opens popup with suggestions; filters (`mode: list/both`) |
  | ArrowDown / ArrowUp | closed | Opens the popup; with `autoHighlight`, ArrowDown highlights the first item (test) |
  | ArrowDown / ArrowUp | open | Moves virtual highlight (loops per `loopFocus`, #3592); in `both`/`inline` modes temporarily writes the highlighted item into the input |
  | Enter | open, item highlighted | "Clicks" the item: fills input, fires `Item.onClick`, closes; does **not** submit the form unless `submitOnItemClick` (#3018) |
  | Enter | open, no highlight | Closes the popup and allows native form submission of the typed text (#2700) |
  | Escape | open | Closes the popup; input keeps focus (APG-conform; #4240) |
  | Escape | closed | Clears the input (Chrome-omnibox parity); cancellable via `onValueChange` `reason === 'escape-key'` + `eventDetails.cancel()` (#4245); Esc bubbles to parent popups only if cleared/`inline`/no `Empty` rendered (#2935, `ComboboxInput.tsx:403-419`) |
  | Home / End | open | Moves the input **caret** to start/end (not the highlight — text-editing wins; Chrome/Safari scroll fixed #2928) |
  | Tab | open | Closes the popup, moves focus on (test "closes popup on Tab…"); Clear/Trigger are not tab stops (#3630 policy) |
- [E] **Labeling**: "Form controls must have an accessible name… created using a `<label>` element or the `Field` component" (docs Usage guidelines); `aria-label` on Input for standalone search/command inputs (command-palette demo after #4949).
- **Open a11y issues (honesty list)**: [E] #4182 (open) — command palette focus indicator relies on color alone (demo-level); #4183 (open) — command palette lacks persistently visible label; #4666 (open) — `disabled` items are highlightable; maintainers split hairs: focusable-when-disabled is APG-intentional (atomiks) but "they should not be highlightable" (mj12albert); #2669 (open) — inline completion doesn't select the appended text like Chrome does; #5146 (open) — no vim-style Ctrl+N/P navigation. Fixed a11y wave: #4181/#4247/#4248 → #4949.

## 8. Prop-level guidance (decision-relevant props)

- [E] **`mode`** — pick per aria-autocomplete semantics: `list` for classic suggestion dropdowns (default); `both` for omnibox-style inline completion over a filtered list; `inline` for static lists where only completion matters; `none` for static "recent searches"-style lists (Root JSDoc; docs Inline example).
- [E] **`filter`** — custom match function `(itemValue, query, itemToString)`; pass **`null` whenever the server/your code already filtered** or the list must show unmatched defaults (async demo; #4117/#4196; #2933 workaround); pair with `Autocomplete.useFilter()` for collator-quality matching in your own code.
- [E] **`items`** — enables `Empty`, `useFilteredItems`, `limit`, and function-children rendering; grouped shape is `[{ …, items: [...] }]` (docs Grouped; overload in `AutocompleteRoot.tsx:14-31`).
- [E] **`openOnInputClick`** (default `false`) — set `true` for browse-friendly fields where focus+click should reveal all options; default keeps the popup out of the way until the user types (default was mis-documented once, #4006).
- [E] **`autoHighlight`** — `true` while typing; `'always'` for command palettes/inline lists so Enter always has a target (docs Auto highlight; #2976; typed `'always'` rejection in Combobox typing was #4188). Combine with `keepHighlight` and `highlightItemOnHover={false}` to separate `:hover` from `data-highlighted`.
- [E] **`submitOnItemClick`** — single-field search forms only; submits on item press *and* Enter; requires a submit button in the form (#3018). Renamed from `alwaysSubmitOnEnter` (breaking, beta.5).
- [E] **`inline`** — inline list without popup; must pair with `open` (`<Autocomplete.Root inline open>`, JSDoc/#5069); typical inside `Dialog.Popup` (command palette).
- [E] **`grid` + `Row`** — 2D layouts (emoji pickers); columns inferred from Row (refactor of `cols`, #2683); caret-vs-grid navigation issue fixed (#4947).
- [E] **`limit`** — cap rendered suggestions; surface the remainder via `Status` ("Show N more…" pattern, docs Limit).
- [E] **`itemToStringValue`** — object items: string for input fill + form submission; `{ value, label }` shapes auto-use `label` (JSDoc; object-stringification tests). TypeScript inference flows from `items` — docs section admits confusion remains (#3853, open).
- [E] **`onItemHighlighted`** — `(value | undefined, { reason: 'keyboard' | 'pointer' | 'none' })`; the hook for custom inline behaviors/analytics (JSDoc; stale-data fix #2829).
- [E] **Styling contract highlights** (`Autocomplete*DataAttributes.ts`): Input/Trigger/InputGroup — `data-popup-open`, `data-pressed`, `data-popup-side` (#3491, #7df1230 added `data-list-empty` + side to Input), `data-list-empty`, field states (`data-valid/invalid/touched/dirty/filled/focused`), `data-disabled/readonly/required`; Item — `data-highlighted`, `data-disabled` **only** (no `data-selected`, #4409); Popup/Positioner — `data-open/closed/starting-style/ending-style`, `data-side/align`, `--available-width/height`, `--anchor-width`, `--transform-origin`. No `data-placeholder` exists (test pins its absence, `AutocompleteRoot.test.tsx:185`).

## 9. Decision log

- **2025-09-03 — Autocomplete ships as its own component** (#2105, atomiks, closing #222): mid-PR pivot split the monolithic Combobox into Combobox (restricted input) / Autocomplete (`selectionMode="none"`, free text) / deferred FilterableMenu — "Combobox… is taking on too many roles to the point of becoming overly monolithic". `value` renamed from `selectedValue`-era ambiguity: for Autocomplete, `value` = the input text (michaldudak + atomiks review exchange). [E]
- **2025-09-18 (beta.4) — Enter submits when nothing is highlighted** (#2700, closing #2686): framed as a bug ("Google Search behaves the proposed way", oliviertassinari); adds `alwaysSubmitOnEnter` for single-field forms. [E]
- **beta.4 — `cols` → `grid`** (#2683, breaking): columns inferred from `Row`. [E]
- **beta.4 — `CompositeList` moved onto `List`** (#2883): Input can participate in outer composite widgets. [E]
- **2025-10 (beta.5) — `alwaysSubmitOnEnter` → `submitOnItemClick`** (#3018, breaking): submission belongs to item *click* (pointer + Enter), matching search widgets; documents the hidden-input/submit-button constraint. [E]
- **beta.5 — highlight-control trio** `autoHighlight: 'always'`, `keepHighlight`, `highlightItemOnHover` (#2976) — the command-palette enablers. [E]
- **2025-11 — Esc bubbling rule** (#2935): Esc may bubble to parent popups when `Empty` is absent; **`role="dialog"` popup when input inside** (#3213); trigger gets `role="combobox"` in that layout (#2973). [E]
- **2026-01 (v1.1.0) — `InputGroup` part** (#3745); `loopFocus` (#3592); `useFilteredItems` hook (#3732). [E]
- **2026-02 (v1.2.0) — filtering correctness sweep**: internal filter respected for `mode="list"` (#3936), `useMemo` dep fix (#3862), double stringification removed (#3945); **regression**: `filter={null}` ignored (#4196) → fixed #4117 (v1.3.x). [E]
- **2026-03/04 (v1.4.0) — Autocomplete owns its exports/docs** (#4409): own part files, JSDoc, data-attribute enums; `data-selected` removed from Item's public contract. Native FormData for popup inputs (#4725, closing #4724). [E]
- **2026-05/06 — a11y & docs wave**: command-palette demo a11y (#4949, closing #4247/#4248); `inline`-requires-`open` documented (#5069); memoization guidance (#5062). [E]
- **Library-wide arcs inherited**: eventDetails `(value, eventDetails)` signature + reasons (#2382/#2698/#2796); required Portal part grammar (#1222 predates it); `ReadonlyArray` items (fc017f611/#2819). [E]

## 10. Pitfalls & FAQ

- **"My server already filters, but the list is still being filtered"** → pass `filter={null}` explicitly; also the historical regression where even `filter={null}` was ignored is fixed since #4117 (mui/base-ui#4196). [E]
- **"Users must press Enter twice to submit free text"** → fixed by #2700 (Enter with no highlight submits); for one-field search forms set `submitOnItemClick` and **include a submit button** — without one, native HTML won't submit a form containing the hidden input (#3018). [E]
- **"Escape wipes what the user typed"** → intentional Chrome-omnibox parity when the popup is closed; opt out with `onValueChange={(v, d) => d.reason === 'escape-key' && d.cancel()}` (atomiks, mui/base-ui#4245, open feature ask for a prop). [E]
- **"Escape closes my surrounding Dialog instead of the popup"** → Esc is stopped while the autocomplete has something to dismiss; if you render no `Empty` and the list is empty, Esc bubbles by design (#2935) — render `Empty` in dialogs for containment. [E/I]
- **Command palette recipe** → `<Dialog>` + `<Autocomplete.Root inline open autoHighlight="always" keepHighlight>`; `inline` without `open` renders nothing visible (#5069); give the Input an `aria-label` + `aria-describedby` for shortcuts (#4949). [E]
- **Hiding `Status`/`Empty` with CSS or conditional rendering breaks screen-reader announcements** → keep them mounted; toggle their *children* (part JSDoc). [E]
- **Grouped items need `Collection`** inside `Group` and group objects shaped `{ items: [...] }` — plain `.map` over groups won't wire filtering per group (docs Grouped; command-palette demo). [E]
- **Slow typing with big lists** → memoize items (`React.memo` + item-as-prop) up to ~1,000 items; beyond that the mount cost dominates — virtualize (docs "Memoizing items", #5062; virtualized demo + `filteredItems` #3068). [E]
- **`data-highlighted` appears on disabled items** → known, disputed behavior (focusable-when-disabled is deliberate; highlightability is being reconsidered) — style `[data-disabled]` accordingly (mui/base-ui#4666, open). [E]
- **No way to programmatically reset the highlight** when swapping item sets mid-flow (GitHub-issue-search-style multi-stage inputs) — open ask, workaround is temporarily emptying `items` (mui/base-ui#4745). [E]
- **Autocomplete popup inside third-party overlays (Radix dialog etc.)** → same portal/pointer-events interop as Combobox: portal into the overlay via `Portal container` (mui/base-ui#2854). [E]
- **TypeScript: `Item value` type must match `items` entries** when using `itemToStringValue`; the docs' inference section is itself flagged confusing (mui/base-ui#3853, open). [E]

## 11. Real-world patterns observed

- [G] **No Phase-D dataset yet**: `research/d-real-world-usage/autocomplete/` does not exist and `_corpus/repos.json` (877 repos) contains no autocomplete-specific `foundVia` entries (checked 2026-07-06) — ranked.json/examples.md pending.
- [E] Fresh code-search signal (cached: `research/d-real-world-usage/_cache/autocomplete-code-search-{1,2}.json`): 750 TSX hits for `"@base-ui/react/autocomplete"`, 112 for the legacy `@base-ui-components` specifier. Notable adopters: **WordPress/gutenberg** (`packages/ui/src/form/primitives/autocomplete/*` — a full 15-file primitive wrapper family, the design-system-wrapper archetype), **PostHog/posthog** (`lib/components/Search/Search.tsx` command-palette-style search + TaxonomicFilter headless autocomplete + quill editor primitives), **langgenius/dify**, **baptisteArno/typebot.io** (wrapper component), **gitbutlerapp/gitbutler** (`PickerDialog.tsx` — picker-in-dialog archetype), **lobehub/lobe-ui**; Databuddy on the legacy package.
- [I] Archetypes for Phase D to verify: (1) DS primitive re-export family (gutenberg), (2) app-wide search/command palette (PostHog), (3) picker dialog (gitbutler), (4) free-text form field with suggestions (typebot). These map 1:1 onto docs sections Hero / Command palette / Async.

## 12. Story plan pointer

See [`story-plan.md`](./story-plan.md) — 23 planned stories (10 kept docs demos folded into use-case stories): the mandatory type→suggest→select interaction flow, all four `mode` values incl. inline completion, empty/no-results, async + Status, free-text submit (#2700) and `submitOnItemClick`, Field/Form integration, command palette recreation, plus Phase-D recreation placeholders.
