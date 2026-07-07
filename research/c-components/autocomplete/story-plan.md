# Autocomplete — story plan

Target set: 22 stories (+3 recreation placeholders). Naming: `Autocomplete/<Story>`. Source of truth: [`brief.md`](./brief.md). All stories styled after the docs hero demo CSS (CSS Modules, raw oklch values). "play?" = interaction test via play function. Doc-section = Definition-of-Done slot the story feeds.

## A. Kept functionality demos (from current docs `demos/` dirs)

| # | Docs demo dir | Story | Render | Controlled? | Play? | Doc section |
|---|---|---|---|---|---|---|
| 1 | `hero` | `Hero` | Root+InputGroup(Input,Trigger,Icon,Clear)+Portal+Positioner+Popup+List+Item, `items` prop, input wrapped in `<label>` | no | no | Hero example / Anatomy |
| 2 | `inline` | `InlineAutocompletion` | `mode="both"`/`"inline"`, highlighted item temporarily written into the input as the user arrows through | no | yes: type partial text → ArrowDown → assert input shows highlighted item's full text (inline completion) | Examples "Inline autocomplete" |
| 3 | `grouped` | `GroupedSuggestions` | `Group`+`GroupLabel`+`Collection`, grouped `items` array | no | no | Examples "Grouped" |
| 4 | `fuzzy-matching` | `FuzzyMatching` | custom `filter` predicate replacing the default collator `contains` match | no | no | Examples "Fuzzy matching" / prop guidance `filter` |
| 5 | `limit` | `LimitResults` | `limit` prop caps rendered items, `Status` surfaces "N more" | no | no | Examples "Limit results" |
| 6 | `auto-highlight` | `AutoHighlight` | `autoHighlight={true}` vs `'always'` compared | no | yes: type into each → assert highlight presence per mode | Examples "Auto highlight" |
| 7 | `command-palette` | `CommandPalette` | `Dialog`+`Autocomplete.Root inline open autoHighlight="always" keepHighlight`, filterable command items | yes (open) | yes: open dialog → type filter query → Enter on highlighted item → assert command fired + dialog closed | Examples "Command palette" |
| 8 | `grid` | `GridLayout` | `grid`+`Row`, emoji-picker-style 2D suggestion layout | no | yes: ArrowRight/ArrowDown move highlight across/down rows | Examples "Grid layout" |
| 9 | `virtualized` | `Virtualized` | `@tanstack/react-virtual`+`filteredItems`, 1,000+ suggestions | no | no | Examples "Virtualized" / "Memoizing items" |
| 10 | `async` | `AsyncSuggestions` | controlled `value`, `filter={null}`, `AbortController`+`useTransition`, `Status` live region | yes | no | Examples "Async search" |

## B. One story per use case (test-bearing)

| # | Story | Render | Controlled? | Play? | Doc section |
|---|---|---|---|---|---|
| 11 | `TypeSuggestSelect` (REQUIRED full cycle) | Hero anatomy | no | yes: type "ap" → assert `role="listbox"` filtered to matches, `aria-expanded=true` → ArrowDown to highlight → Enter → assert popup closed, Input filled with item text (`fillInputOnItemPress`), `onValueChange` called with (value, eventDetails) | Behavior; a11y contract |
| 12 | `FilteringModePerVariant` (pair, `mode="list"` vs `"none"`) | two autocompletes: default `list` (filters as you type) vs `none` (static items, no completion) | no | yes: type same query into each → assert `list` filters, `none` shows unchanged full list | Prop guidance `mode` |
| 13 | `EmptyNoResultsState` | `items` prop + `Empty` children rendered when no match | no | yes: type a query matching nothing → assert `Empty` content visible + polite live-region announced | Anatomy (Empty) / a11y contract |
| 14 | `FreeTextSubmit` (REQUIRED #2700) | plain `<form>`+submit button, no highlighted item on Enter | no | yes: type novel text (no suggestion highlighted) → Enter → assert form submits with typed value, popup closes | Behavior / a11y keyboard table (Enter, no highlight) |
| 15 | `SubmitOnItemClick` | `submitOnItemClick` + a visible submit button (required per #3018) | no | yes: click a suggestion → assert form submits immediately with the item's text | Prop guidance `submitOnItemClick` |
| 16 | `EscapeClearsInputWhenClosed` | closed-popup Escape clears text (Chrome-omnibox parity) | no | yes: type text, close popup, press Escape → assert input cleared, reason `escape-key` | A11y keyboard table (Escape, closed) |
| 17 | `CancelEscapeClear` | `onValueChange` cancels the `escape-key` reason via `eventDetails.cancel()` | no | yes: type text, close popup, press Escape → assert input retains its text (cancelled) | Pitfalls / eventDetails escape hatch (#4245) |
| 18 | `OpenOnInputClick` | `openOnInputClick={true}` (non-default) vs the `false` default side by side | no | yes: click into each input without typing → assert popup opens only where enabled | Prop guidance `openOnInputClick` |
| 19 | `ObjectItemsStringification` | `{ value, label }` items + `itemToStringValue`, native form submit readout | no | yes: select item → submit → assert serialized string payload | Prop guidance `itemToStringValue` |
| 20 | `HighlightTrackingWithOnItemHighlighted` | `onItemHighlighted` logging `(value, { reason })` for keyboard vs pointer highlights | no | yes: ArrowDown then hover a different item → assert log shows `keyboard` then `pointer` reasons | Prop guidance `onItemHighlighted` |
| 21 | `InFieldWithValidation` (REQUIRED forms) | `Field.Root(name)`+`Field.Label`+Autocomplete+`Field.Error`, `required`, submitted inside `<Form>` | no | yes: submit empty → assert `data-invalid` + error text shown | Forms handbook contract |
| 22 | `AnimatedPopup` | CSS transition on `data-starting-style`/`data-ending-style` + `--transform-origin`; `onOpenChangeComplete` counter | no | yes: open/close → assert element stays mounted mid-transition → `onOpenChangeComplete(false)` → unmounted | Animation handbook; styling contract |

## C. Real-world recreation stories

- [G] Pending Phase D (`research/d-real-world-usage/autocomplete/ranked.json` not yet produced). Corpus signal (750 TSX hits for the autocomplete subpath; brief §11) suggests recreating: a design-system primitive wrapper family (WordPress/Gutenberg `autocomplete/*` archetype), an app-wide search/command palette (PostHog `Search.tsx`/TaxonomicFilter archetype — distinct from the docs' own command-palette demo in that it drives real navigation), and a picker-in-dialog (gitbutler `PickerDialog.tsx` archetype). Each recreation must include its interaction (type → suggest → select → assert app-visible effect).
- Placeholder names: `RealWorldDesignSystemWrapper`, `RealWorldAppSearchPalette`, `RealWorldPickerInDialog` — finalize against `ranked.json` rationales when available.

**Totals**: 22 planned + 3 recreation placeholders. Interaction (play) stories: 15, including the mandatory type→suggest→select flow (#11), free-text submit (#14), and form integration (#21).
