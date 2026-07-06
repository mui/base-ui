# Select — component research brief

Tier 1 (full depth). Mined 2026-07-06 from source, docs, tests, experiments, git history, and mui/base-ui issues/PRs (read-only). Evidence tags: [E] direct evidence, [I] inference, [G] gap.

## 1. Identity

- **Name / slug**: Select — `@base-ui/react/select`. Multi-part compound component, namespace export `Select.*`.
- **Status**: stable since v1.0.0; no `[New]`/`[Preview]` tag. One of the oldest lineages in the repo: legacy `@mui/base` file lineage from 2023 (commit a9f731874, mui/material-ui#36873); the current component is a ground-up rewrite (see §2). [E]
- **Purpose / IA statement**: a form control for choosing one (or several) of a set of predefined values from a dropdown listbox — "A common form component for choosing a predefined value in a dropdown menu" [E] (`docs/src/app/(docs)/react/components/select/page.mdx` Subtitle). Taxonomy: **selection & input** cluster (popup-based picker); see `research/c-components/_clusters/pickers.md`.
- **19 parts** (from `packages/react/src/select/index.parts.ts`; one-liners from part JSDoc):
  | Part | Renders | One-liner |
  |---|---|---|
  | Root | no element | Groups all parts of the select |
  | Label | `<div>` | Accessible label auto-associated with the trigger |
  | Trigger | `<button>` | A button that opens the select popup |
  | Value | `<span>` | Text label of the currently selected item |
  | Icon | `<span>` | Icon indicating the trigger opens a select popup |
  | Portal | `<div>` | Moves the popup to a different part of the DOM (default: `<body>`) |
  | Backdrop | `<div>` | Overlay beneath the popup |
  | Positioner | `<div>` | Positions the select popup |
  | Popup | `<div>` | Container for the select list |
  | List | `<div>` | Container for the select items (the scroll context) |
  | Item | `<div>` | An individual option in the popup |
  | ItemText | `<div>` | Text label of the item |
  | ItemIndicator | `<span>` | Indicates whether the item is selected |
  | Arrow | `<div>` | Element positioned against the anchor (rare for select) |
  | ScrollUpArrow / ScrollDownArrow | `<div>` | Scroll the popup when hovered; not rendered on touch input |
  | Group | `<div>` | Groups related items with a label |
  | GroupLabel | `<div>` | Label auto-associated with its parent group |
  | Separator | re-export | `Select.Separator` re-exports the standalone `Separator` component [E] (`index.parts.ts`) |
- Internal-only: `scroll-arrow/SelectScrollArrow` is `@internal`, wrapped by the two public directional arrows. [E]

## 2. Intention

- [E] **Introducing PR**: mui/base-ui#541 "[select] Create new `Select` component" (atomiks, merged 2024-11-14, commit d9ba2feb8). The body closes **15 accumulated issues** from the legacy `@mui/base` select (#547, #476, #327, #328, #217, #8, #82, #66, #65, #64, #56, #54, #37, #14, #7) — the new component is a wholesale answer to years of select pain, not an incremental fix. oliviertassinari annotated it "the v2 of mui/material-ui#8023" (Material UI's famously long select rewrite).
- [E] Field/Form integration was in scope from day one ("TODO: Integrate with `useField`", #541 body); today the Root wires directly into `useFieldRootContext` (`SelectRoot.tsx`).
- [I] **Design pole: behave like a native `<select>`, but styleable.** Inferred from convergent decisions: opens on `mousedown` with drag-to-select — press trigger, drag, release on item (`useClick(…, { event: 'mousedown' })` in `SelectRoot.tsx`; #3969 fires `onClick` during drag-to-select); closed-trigger typeahead commits a value without opening (test "commits typeahead on a closed trigger", `SelectRoot.test.tsx`); typeahead skips disabled items "like native `<select>`" (source comment, #5025); macOS-native-style item-aligned popup (`alignItemWithTrigger`, §6); hidden input participates in native form submission, constraint validation and **browser autofill** (#2084, #4005); touch modality matches iOS native behavior (#3012: "This is intentional — it matches modal behavior of anchored popups on iOS", atomiks).
- [E] This fits the library's stated scope test (a headless lib provides primitives where the HTML element can't be styled — the native select popup can't be): see `research/b-library-principles/_mining/issues-prs.md` (#2138/#2225 arc).
- [E] **Explicit non-goals**: no built-in filtering ("Select is not filterable, aside from basic keyboard typeahead", docs Usage guidelines); no built-in Clear button — "generally Selects — native HTML and OS ones — just don't have a clear button" (mj12albert, mui/base-ui#2734); no tree/select-all built-ins (listbox children can only be options, mj12albert, mui/base-ui#4927).
- [E] Performance is treated as part of the component's identity: dedicated experiments `select-perf.tsx` and `long-select.tsx` (`docs/src/app/(private)/experiments/`), the highlight fast-path rework (#1570), deferred mounting (#1906), re-render avoidance (#1961, #2972).

## 3. When to use

- [E] Choosing a predefined value in a dropdown, especially inside forms (docs Subtitle; hidden-input form contract, handbook `forms/page.mdx`).
- [E] When the item count is small enough that keyboard typeahead suffices instead of filtering (select docs Usage guidelines bullet 1, inverse).
- [E] When no text input is rendered: "Use Select instead of Combobox if no input is being rendered, which includes accessibility features specific to a listbox without an input" (combobox docs Usage guidelines).
- [E] Multiple selection without filtering — `multiple` prop (#2173, closing feature request #1956).
- [E] When you need object values, custom trigger labels, grouped options, or scroll arrows — capabilities the native `<select>` can't offer (docs Examples: object values, grouped, formatting the value).

## 4. When not to use + alternatives

Full comparative guidance: [`research/c-components/_clusters/pickers.md`](../_clusters/pickers.md).

- [E] **Large, filterable lists → Combobox**: "Prefer Combobox instead of Select when the number of items is sufficiently large to warrant filtering" (select docs Usage guidelines); mirrored on the combobox page ("Combobox is a filterable Select").
- [E] **Free-form text with suggestions → Autocomplete** ("Unlike Combobox, Autocomplete's input can contain free-form text", autocomplete docs).
- [E] **Need a Clear affordance → Combobox (possibly without its input)**: maintainers suggest `Combobox.Root` with `Trigger`+`Value`+`Clear` and no visible input for "clearable select" cases (mj12albert, mui/base-ui#2734); colmtuite calls clear-but-no-filter "a kind of gray area between two use cases" (same thread, open).
- [E] **List of actions (not a persisted value) → Menu**: "A list of actions in a dropdown" (menu docs Subtitle). [I] The dividing line is whether choosing writes a `value` that persists and submits with a form (Select) or performs a command (Menu).
- [I] **Binary or tiny option sets → RadioGroup / Switch / Checkbox** — derived from API affordances (a popup is overhead when all options can be visible); no maintainer statement found [G] (searched issues for "select vs radio").

## 5. Anatomy & composition

- [E] Canonical tree (docs Anatomy):
  `Root > (Label, Trigger > (Value, Icon), Portal > (Backdrop, Positioner > Popup > (ScrollUpArrow, Arrow, List > (Item > (ItemText, ItemIndicator), Separator, Group > GroupLabel), ScrollDownArrow)))`.
- [E] **Portal is mandatory** for the popup subtree — required part since alpha.5 (#1222); `keepMounted` lives only on Portal (CHANGELOG v1.0.0-alpha.5).
- [E] **Popup vs List**: `Select.List` was added in beta.4 (#2596) so that `Arrow`/`ScrollArrow` parts "escape the `overflow: scroll` context" — Popup is the outer visual container, List is the scrollable listbox. When List is present, Popup becomes `role="presentation"` and the ARIA listbox attributes move to List (#2855; pinned by `SelectPopup.test.tsx` "places aria attributes on Select.List instead if it is present"). List is optional: omit it (and ScrollArrows) in simple selects — Popup then carries `role="listbox"` itself.
- [E] Scroll arrows: only render for mouse input ("Does not render when using touch input", part JSDoc); since #2596 they may also show in fallback positioning mode — style them `display: none` by default and visible via `[data-side="none"]` or `[data-visible]` (#2596 breaking-change note).
- [E] `Select.Value` renders the selected label inside the Trigger; label resolution order: `children` (string or function) > `items` lookup > raw value (`SelectValue.tsx` JSDoc; tests "prop: children (takes precedence over items)").
- [E] Inline-style caveat: `Select.Popup`/`Select.List` inject a scrollbar-hiding `<style>` tag when `alignItemWithTrigger` is active — relevant under strict CSP (`csp-provider/page.mdx`).
- Text spec for a future anatomy diagram: (1) Label, (2) Trigger, (3) Value, (4) Icon, (5) Backdrop [invisible], (6) Positioner [invisible box], (7) Popup, (8) ScrollUpArrow, (9) List, (10) Item, (11) ItemText, (12) ItemIndicator, (13) GroupLabel, (14) Separator, (15) ScrollDownArrow.

## 6. Behavior ("How it works")

- [E] **Controlled/uncontrolled**: uncontrolled by default; `value`/`onValueChange`/`defaultValue` and `open`/`onOpenChange`/`defaultOpen` triplets (SelectRoot props JSDoc). Change handlers receive `(value, eventDetails)`; reasons: `trigger-press | outside-press | escape-key | window-resize | item-press | focus-out | list-navigation | cancel-open | none` (`SelectRootChangeEventReason`, `SelectRoot.tsx`). `eventDetails.cancel()` vetoes state changes while staying uncontrolled (test "onOpenChange cancel() prevents opening while uncontrolled").
- [E] **Mount lifecycle is unique among popups**: the portal subtree defers mounting until the trigger is focused (typeahead needs item labels), then **stays mounted after the first open** for performance (#1906; rationale in #1590: closed-trigger typeahead "requires registering the items… upon mount", atomiks). The animation handbook singles this out: "The Select component is initially unmounted but remains mounted after interaction" (`handbook/animation/page.mdx`). #5119 stopped force-mounting on programmatic value changes.
- [E] **Positioning — `alignItemWithTrigger`** (Positioner prop, default `true`): the popup overlaps the trigger so the selected item's text aligns with the trigger's value text (macOS-select style). Deactivates (falls back to standard anchored positioning) when: opened by touch; insufficient viewport height (tunable via `min-height` on Positioner); trigger closer than 20px to the top/bottom viewport edge (docs Positioning section, added in #2721). While active, `side`/`align` are **ignored** and `data-side` is `"none"` (docs; #2712 answer by atomiks). Set it to `false` for a conventional dropdown.
- [E] **Selection mechanics**: opens on `mousedown`; supports drag-to-select in one gesture (`SelectItem.test.tsx` drag-to-select suite; #3969); guards against accidental select on quick mouseup ("should not select an item on quick mouseup…", `SelectItem.test.tsx`). Item highlight uses a direct-DOM fast path — `data-highlighted` is set by mutating the item element, bypassing React re-render, "as fast as CSS `:hover`" (#1570). Highlight follows DOM focus (items receive real focus; desync fixed in #2569).
- [E] **Modality**: `modal` defaults to `true` — page scroll locked, outside pointer interactions disabled via an internal backdrop (Root JSDoc; internal backdrop introduced #1161, cut out around the trigger in #2141 so trigger hover/click still work). On touch, a modal select blocks outside taps but leaves the page scrollable unless the popup spans nearly the full viewport width, "matching native iOS behavior" (Root JSDoc; #3012; #3100).
- [E] **Multiple mode** (`multiple`): value becomes an array; popup stays open on item selection (test "should not close popup when selecting items in multiple mode"); typeahead works only while open (`useTypeahead` `enabled: open || !multiple`, #2274); trigger renders comma-separated labels via `items` (`SelectValue.test.tsx` multiple suite); empty array serializes to `""` for forms; hidden input stays `required` only while nothing is selected (#2925 area, tests).
- [E] **Forms**: a visually-hidden `<input>` carries `name`/`value` for native submission, constraint validation, and browser autofill (autofill matched against serialized value, then rendered label; `SelectRoot.tsx` onChange handler; #2084, #4560, #4934). `autoComplete` provides the browser hint (#4005). Field integration drives `data-touched/dirty/filled/focused/valid/invalid` on the Trigger; validation runs when the popup blurs (test "validates when the popup is blurred"); opening the popup does not fire Field `onBlur` (#3609).
- [E] **Focus**: opening focuses the selected item ("should focus the selected item upon opening the popup", `SelectItem.test.tsx`); closing returns focus to the trigger, customizable via `finalFocus` (#3785; `SelectPopup.test.tsx` finalFocus suite). Focusing the hidden input redirects to the trigger (`SelectRoot.tsx`).
- [E] **Animation**: standard popup hooks — `data-open/closed/starting-style/ending-style` on Popup/Backdrop, `--transform-origin` on Positioner; `transitionStatus` also on ItemIndicator (#1925). Transform/max-height animations work with `alignItemWithTrigger` after a fix series (#3532, #3573, #3637, #3831). `actionsRef.unmount()` + `onOpenChangeComplete` for JS animation libraries.
- [E] **SSR**: hidden inputs ship `suppressHydrationWarning` (#4482); `Select.Label` linkage intentionally not established before hydration (test "does not link Select.Label before hydration").

## 7. Accessibility contract

- [E] **Pattern**: WAI-ARIA APG **Combobox** pattern in its *select-only* form — trigger is a `role="combobox"` button opening a `role="listbox"` popup. Maintainer statement: "`<Select.Trigger>` is `role='combobox'` while `<Select.List>` is `role='listbox'`. The trigger is the combobox, not a listbox" (atomiks, mui/base-ui#4754). APG links: https://www.w3.org/WAI/ARIA/apg/patterns/combobox/ and the select-only example https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-select-only/.
- [E] **ARIA managed by the component** (`SelectTrigger.tsx:144-152`, `SelectList.tsx:35-36`, `SelectItem.tsx:162-163`, `SelectGroup.tsx:33`):
  - Trigger: `role="combobox"`, `aria-expanded`, `aria-haspopup="listbox"`, `aria-controls` (while open), `aria-labelledby` (auto-linked from Select.Label/Field.Label), `aria-readonly`, `aria-required`. Renders a native `<button>` by default since beta.5 (#3177, previously blocked by a Safari bug).
  - List (or Popup when no List): `role="listbox"`, `aria-multiselectable` in multiple mode; Popup demotes to `role="presentation"` when List is present (#2855).
  - Item: `role="option"`, `aria-selected`; Group: `role="group"` with GroupLabel association.
  - Hidden form input: `aria-hidden`, `tabIndex={-1}`; focus is forwarded to the trigger.
- [E] **Keyboard interaction table** (evidence: `useClick`/`useDismiss`/`useListNavigation`/`useTypeahead` wiring in `SelectRoot.tsx`; vendored `floating-ui-react` `useListNavigation.ts` Home/End at L569–575; tests as noted):

  | Key | Context | Action |
  |---|---|---|
  | Enter / Space | trigger closed | Opens the popup (native button activation; readOnly blocks it — test "should not open the select when using keyboard") |
  | ArrowDown / ArrowUp | trigger closed | Opens the popup (`openOnArrowKeyDown` default true) |
  | Printable characters | trigger closed | Typeahead selects a matching value **without opening**; skips disabled items; disabled in `multiple` mode (tests "commits typeahead on a closed trigger…", #5025) |
  | ArrowDown / ArrowUp | popup open | Move highlight/DOM focus through items (skips disabled-but-focusable items per `focusableWhenDisabled` composite rule; disabled items can be focused, not selected — tests "should focus disabled items", "should not select disabled item") |
  | Home / End | popup open | Highlight first / last item |
  | Printable characters | popup open | Typeahead moves highlight (works in multiple mode too, #2274) |
  | Enter / Space | popup open | Selects highlighted item; closes in single mode, stays open in multiple mode |
  | Escape | popup open | Closes the popup (reason `escape-key`); propagation to parent popups stopped by default |
  | Tab / focus out | popup open | Closes (reason `focus-out`); no tabbable option is left behind when closed+kept-mounted (test #4931 area) |
- [E] **Screen reader notes**: label the trigger via `<Select.Label>` (a `<div>`, auto-associated; clicking it focuses the trigger without opening — docs "Labeling a select" + test), `<Field.Label>`, or `aria-label` on the Trigger when no visible label exists (docs Usage guidelines; handbook forms labeling table). Disabled items stay focusable so AT users can discover them (composite-widget policy, #656 in principles mining).
- [E] **Touch**: scroll arrows don't render on touch; `alignItemWithTrigger` disabled for touch opens; modal touch behavior mirrors iOS (§6).
- **Open a11y-adjacent issues (honesty list)**: [E] #5139 (open) — request for `focusableWhenDisabled` on Select/Menu items to be configurable; #1761 (open, has workaround) — focus indicator lost on trigger while popup open; #1425 (open) — Field does not invalidate certain required controls incl. Select. [G] Searched `label:"component: select" label:accessibility` and "select voiceover/nvda/jaws" — no open screen-reader-specific select bugs found beyond the answered #4754.

## 8. Prop-level guidance (decision-relevant props)

- [E] **`items` (Root)** — supply when `<Select.Value>` should render the item's *label* instead of the raw value; accepts `Record<string, ReactNode>`, `Array<{ label, value }>`, or grouped arrays (#2087 made raw-value-by-default; #3884 fixed group typing). Without `items`, format via a `children` function on Value.
- [E] **`multiple` (Root)** — array values, popup stays open, comma-separated trigger label; added #2173. Conditional typing supported (`Select.Root.Props<Value, Multiple>`, #2369; typed-wrapper example in docs).
- [E] **`alignItemWithTrigger` (Positioner, default `true`)** — set `false` when you want a conventional anchored dropdown (`side`/`align`/`sideOffset` only work then or in fallback, #2712); also the escape hatch for environments firing spurious resize events (Firefox extension popups, #3546) and was the workaround for dynamic-items mis-positioning (#1922, since fixed).
- [E] **`modal` (Root, default `true`)** — set `false` to keep the rest of the page interactive/scrollable while open (Root JSDoc). Tests pin non-modal behavior inside popovers ("does not bubble Escape from a non-modal select to the popover").
- [E] **`value={null}` clears** — use `null`, never `''`, to clear ("clear value with `null`, not `''`", #1922 maintainer answer); an empty string is treated as a real value and marks the field `data-filled`; docs recommend a `{ value: null }` item for user-clearable selects (docs "Placeholder values"; #4644 asked to change `""` semantics, closed expected-behavior).
- [E] **`placeholder` (Value)** — display-only placeholder when no value is selected; "with placeholders, users cannot clear selected values using the select itself" (docs). API history: required children (#1906) → reverted (#1985) → raw value + `items` (#2087) → dedicated `placeholder` prop (#3604, beta.7).
- [E] **Object values** — `isItemEqualToValue` for non-referential matching (defaults to `Object.is`), `itemToStringLabel` (trigger display), `itemToStringValue` (form serialization); `{ value, label }`-shaped objects work automatically (#2704; argument order fixed #4056; `onFormSubmit` respects `itemToStringValue` #3441).
- [E] **`highlightItemOnHover` (Root, default `true`)** — set `false` to differentiate CSS `:hover` from the keyboard `data-highlighted` state (prop JSDoc; added #3377; mouse selection still works without highlight #4699).
- [E] **Form wiring** — `name` (submission key), `form` (owning form id when rendered outside it), `required`, `readOnly` (blocks opening, #2717), `disabled`, `autoComplete` (autofill hint, #4005 — added after docs/types mismatch #4129), `inputRef` (hidden input access, #1683).
- [E] **Lifecycle** — `actionsRef` (`unmount()` for JS exit animations), `onOpenChangeComplete`, `finalFocus` (Popup; #3785).
- [E] **Trigger `nativeButton`** — declare when `render` swaps the trigger element away from `<button>` so ARIA/keyboard adapt (`NativeButtonProps`; library-wide convention #1909).
- [E] **Styling contract highlights** (from `*DataAttributes.ts` / `*CssVars.ts`): Trigger — `data-popup-open`, `data-pressed`, `data-placeholder` (no value, #2737), `data-popup-side` (#4671), Field states (`data-valid/invalid/touched/dirty/filled/focused`), `data-disabled/readonly/required`; Item — `data-selected`, `data-highlighted` (not customizable, #1570), `data-disabled`; Popup/Positioner — `data-open/closed/starting-style/ending-style`, `data-side` (`"none"` while item-aligned), `data-align`; ScrollArrows — `data-visible`, `data-direction`, `data-side`; Positioner CSS vars — `--available-width/height`, `--anchor-width/height`, `--transform-origin`.

## 9. Decision log

- **2024-11-14 — new Select ships** (#541, atomiks): rewrite closing 15 legacy issues; item-aligned positioning (then `alignOptionToTrigger`) and Field integration from the start. [E]
- **2024-12-09 — `Select.Option` → `Select.Item`** (#1014, closing #1011): vocabulary unified with Menu/Combobox. [E]
- **2025-01 (alpha.5) — `Portal` becomes a required part; `keepMounted` moves to Portal** (#1222): explicit-anatomy policy, render-time error if missing. [E]
- **2025-04-08 (alpha.8) — highlighted state removed for performance** (#1570, breaking): `data-highlighted` set by direct DOM mutation, "as fast as CSS `:hover`"; customizing it is no longer possible; Menu synced. [E]
- **2025-04-29 (beta.0) — `Root.alignItemToTrigger` → `Positioner.alignItemWithTrigger`** (#1713, closing #1710/#1711): positioning config belongs on Positioner; renamed To→With. [E]
- **2025-05-21 (beta.0) — deferred mounting until typeahead needs items; stays mounted after first open** (#1906): 35% of previous scripting time for 1,000 items at load, traded against slower first open; made `Select.Value` children the SSR label. Follow-up #1985 reverted the `placeholder`-required API. [E]
- **2025-06-24 (beta.1) — `Select.Value` prints the raw value; `items` prop introduced for label lookup** (#2087, closing #2011, breaking). [E]
- **2025-07-08 (beta.2) — `multiple` prop** (#2173, closing #1956; also cited as solving Radix primitives#1270): one prop rather than a separate MultiSelect component, per the library-wide `multiple` convention (#1075). [E]
- **2025-09-24 (beta.4) — `Select.List` part added** (#2596, breaking): lets Arrow/ScrollArrows escape the scroll context; scroll arrows may now appear in fallback mode (style contract change). ARIA listbox attributes move to List when present (#2855). [E]
- **2025-11-12 (beta.5) — Trigger renders a native `<button>` by default** (#3177, breaking, mnajdova): "There was a Safari bug that prevented us to use button by default, but it seems to be working now." [E]
- **2025-11 (beta.6) — `placeholder` prop returns on `Select.Value`** (#3604); `null` accepted for controlled `value` (#3488); `highlightItemOnHover` prop (#3377). [E]
- **2026-03 (v1.3.0) — `Select.Label` part** (#4167, shared PR with Combobox/Slider): first-class visible labeling without Field. [E]
- **Library-wide arcs that reshaped Select**: eventDetails `(value, eventDetails)` signature (#2382/#2698/#2796); `OpenChangeReason` refinement (#1782); internal backdrop for pointer modality (#1161) with trigger cutout (#2141). [E]

## 10. Pitfalls & FAQ

- **Select popup renders behind a Dialog** → don't set `z-index` at all (it layers correctly); if you must, put it on `Positioner`, never `Popup` (mui/base-ui#2450). [E]
- **Select unresponsive inside a Radix/vaul drawer (shadcn)** → the drawer sets `pointer-events: none` on `<body>`; portal the select into the drawer via `<Select.Portal container={...}>` (mui/base-ui#3725; maintainer LukasTy floated an interop FAQ page there). [E]
- **Popup closes instantly inside a Firefox extension popup** → spurious `window-resize` close reason; cancel it in `onOpenChange` via `eventDetails.cancel()` within ~400ms of open, or set `alignItemWithTrigger={false}` (mui/base-ui#3546, wontfix). [E]
- **`side`/`align` "don't work"** → they're ignored while `alignItemWithTrigger` (default) is active; set it to `false` (mui/base-ui#2712; docs Positioning section came from #2713→#2721). [E]
- **Clearing with `''` doesn't clear** → clear with `null`; `''` is a legitimate value and keeps `data-filled` (mui/base-ui#1922, #4644). [E]
- **Dependent/dynamic selects mis-position or show stale items** → fixed upstream (#1922, #2397, #2577 "Reset state when selected item is removed"); pattern to keep: reset dependent value to `null` when parent changes. [E]
- **Trying to control `data-highlighted` or style highlight via React state** → impossible since #1570; style `[data-highlighted]` in CSS only; to separate hover from keyboard highlight use `highlightItemOnHover={false}` (#2731 context, #3377). [E]
- **Expecting the popup to unmount on close** → it stays mounted after first interaction (typeahead + perf, #1590/#1906); memoize heavy items, or drive unmount via `actionsRef` if truly needed. [E]
- **Focus ring appears on the trigger after selection / missing while open** → known quirk, workaround in #1761 (open); Safari/Firefox focus-visible restoration handled library-wide (#5093). [E]
- **Mouse selection is a no-op in React StrictMode dev** → open bug #4698 (dev-only). [E]
- **`multiple` mode has no closed-trigger typeahead** — intentional (`enabled: open || !multiple`); open the popup first (#2274). [E]
- **Trigger `<button>` nesting errors** after beta.5 — trigger is a native button now; if you `render` a different element, set `nativeButton={false}` (#3177 + #1909 convention). [E]
- **Docs feedback on record**: users asked for a conditional-prop-types example (#2474, open) and Select-vs-Combobox guidance (#2734, open). [E]

## 11. Real-world patterns observed

- [E] Corpus status: `research/d-real-world-usage/_corpus/repos.json` exists (877 repos); **137 repos were discovered via select subpath imports** (`foundVia: code-import-*-select`). No per-component `select/` dataset yet — **[G] ranked.json/examples.md pending Phase D**.
- [E] Highest-star select importers in the corpus (category `production-app` unless noted): astrofox-io/astrofox (1.9k★, MIT, astrofox.io), databuddy-analytics/Databuddy (1.1k★, AGPL), graphql/graphql.github.io (887★ — graphql.org), Codennnn/Green-Wall (806★), PrefectHQ/prefab (562★, Apache-2.0), WINOFFRG/limeplay (276★, oss-design-system), plus shadcn-ui/ui (118k★) which wraps Base UI wholesale.
- [I] Expected archetypes to verify in Phase D: settings/theme pickers (docs' own examples), form country/locale selects (autofill story #4005 suggests real demand), dashboard filters (Databuddy/prefab), design-system wrappers (shadcn-style registries re-exporting all 19 parts).

## 12. Story plan pointer

See [`story-plan.md`](./story-plan.md) — 26 planned stories: 4 kept docs demos, use-case stories per §8 props and §10 pitfalls, one full open→select→close interaction story (required), plus Phase-D recreation placeholders.
