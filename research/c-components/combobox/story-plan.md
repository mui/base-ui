# Combobox — story plan

Target set: 26 stories (+3 recreation placeholders). Naming: `Combobox/<Story>`. Source of truth: [`brief.md`](./brief.md). All stories styled after the docs hero demo CSS (CSS Modules, raw oklch values). "play?" = interaction test via play function. Doc-section = Definition-of-Done slot the story feeds.

## A. Kept functionality demos (from current docs `demos/` dirs)

| # | Docs demo dir | Story | Render | Controlled? | Play? | Doc section |
|---|---|---|---|---|---|---|
| 1 | `hero` | `Hero` | Root+Label+InputGroup(Input,Trigger,Icon,Clear)+Portal+Positioner+Popup+List+Item(ItemIndicator), `items` prop | no | no | Hero example / Anatomy |
| 2 | `multiple` | `MultipleSelectionChips` | `multiple` + `Chips`/`Chip`/`ChipRemove` anatomy, comma-free tokenized display | no | no | Examples "Multiple select" |
| 3 | `grouped` | `GroupedItems` | `Group`+`GroupLabel`+`Collection`, grouped `items` array | no | no | Examples "Grouped" |
| 4 | `async-single` | `AsyncSearchSingle` | controlled `value`, `filteredItems` from a simulated fetch, `Status` live region | yes | no | Examples "Async search (single)" |
| 5 | `async-multiple` | `AsyncSearchMultiple` | as above + `multiple`, values retained across result changes (#3824) | yes | no | Examples "Async search (multiple)" |
| 6 | `creatable` | `CreatableEntries` | filter-miss opens a creation Dialog; new item appended to `items` | no | yes: type a novel value → assert "Create…" affordance → confirm → assert new item selected | Examples "Creatable" |
| 7 | `virtualized` | `Virtualized` | `@tanstack/react-virtual` + `useFilteredItems`, 1,000+ items | no | no | Examples "Virtualized" / "Memoizing items" |
| 8 | `input-inside-popup` | `InputInsidePopup` | Input rendered inside `Popup`; Trigger gets `role="combobox"`, Popup gets `role="dialog"` | no | yes: click Trigger → assert popup `role="dialog"` + focus in Input | Examples "Input inside popup" |

## B. One story per use case (test-bearing)

| # | Story | Render | Controlled? | Play? | Doc section |
|---|---|---|---|---|---|
| 9 | `OpenFilterSelectClose` (REQUIRED full cycle) | Hero anatomy | no | yes: click Trigger → assert `role="listbox"` visible + `aria-expanded=true` → type "ap" to filter → assert filtered options → ArrowDown to highlight → Enter → assert popup closed, Input shows chosen label, `onValueChange` called with (value, eventDetails) | Behavior; a11y contract |
| 10 | `ControlledValueAndInput` | external `value`+`inputValue` state, buttons setting/clearing (`null`) outside the combobox | yes | yes: click "Set value" button → assert Input label updates without opening the popup | Behavior; prop guidance `value`/`inputValue` |
| 11 | `ControlledOpenWithEventDetails` | `open`+`onOpenChange` logging `eventDetails.reason`; cancel `outside-press` via `eventDetails.cancel()` | yes (open) | yes: click backdrop area → assert popup stays open (cancelled) → Close button still works | Behavior / eventDetails escape hatch |
| 12 | `ExternalFilterWithUseFilter` | `Combobox.useFilter({ multiple, value, locale })` result passed to `filter` prop | no | yes: type query → assert externally-filtered list matches collator semantics | Prop guidance `filter` / `useFilter` |
| 13 | `UseFilteredItemsForVirtualizer` | reads `useFilteredItems()` outside `Root` children to drive a custom virtualizer row count | no | no | Prop guidance `useFilteredItems` |
| 14 | `EmptyState` | `items` prop + `Empty` children rendered when no match | no | yes: type a query matching nothing → assert `Empty` content visible + live-region announced | Anatomy (Empty) / a11y contract |
| 15 | `ChipsKeyboardFlow` (REQUIRED chips interaction) | `multiple` + several pre-selected chips | yes | yes: focus Input with caret at start → ArrowLeft moves real DOM focus onto last chip → Backspace removes it → assert `Chips` `role="toolbar"` and remaining chip count | A11y keyboard table (chip removal, NVDA #3629/#3647) |
| 16 | `IsItemEqualToValueObjects` | object item values, no referential identity (cloned state) + `isItemEqualToValue` | yes | yes: select an item, replace `value` with a fresh clone, assert selection still highlighted | Prop guidance `isItemEqualToValue` |
| 17 | `ObjectValuesStringification` | `{ value, label }` items + `itemToStringLabel`/`itemToStringValue`, native form submit readout | no | yes: select item → submit → assert serialized `itemToStringValue` payload | Prop guidance / forms |
| 18 | `AutoHighlightModes` (pair) | `autoHighlight={false}` vs `'always'` side by side | no | yes: type into each → assert highlight presence/absence per mode | Prop guidance `autoHighlight` |
| 19 | `GridLayout` | `grid` + `Row`, emoji-picker-style 2D list | no | yes: ArrowRight/ArrowDown move highlight across/down rows | Anatomy (Row) / prop guidance `grid` |
| 20 | `InlineNoPopup` | `inline` + `open` unconditionally set, list renders in-flow (no Portal/Positioner/Popup) | yes (open) | yes: type query → assert list updates in place with no popup element | Behavior `inline` mode |
| 21 | `InlineInsideDialog` | `Dialog.Popup` containing `Combobox.Root inline open`, combobox `open` bound to dialog's | yes | yes: open dialog → type in inline combobox → close dialog → reopen → assert transient state reset | Pitfalls (`inline`+Dialog, #5069/#3966) |
| 22 | `ClearableSelection` | `Clear` button + populated value | no | yes: click Clear → assert value/input reset; keyboard: Esc (closed) clears too | A11y keyboard table (Clear non-tabbable, #3630) |
| 23 | `DisabledAndReadOnly` (pair) | one `disabled` combobox, one `readOnly` with a value | no | yes: assert disabled doesn't open on any input; `readOnly` blocks typing/opening but shows value | Prop guidance `disabled`/`readOnly` |
| 24 | `InFieldWithValidation` (REQUIRED forms) | `Field.Root(name)`+`Field.Label`+Combobox+`Field.Error`, `required`, submitted inside `<Form>` | no | yes: submit empty → assert `data-invalid` + error text shown | Forms handbook contract |
| 25 | `AnimatedPopup` | CSS transition on `data-starting-style`/`data-ending-style` + `--transform-origin`; `onOpenChangeComplete` counter | no | yes: open/close → assert element stays mounted mid-transition → `onOpenChangeComplete(false)` → unmounted | Animation handbook; styling contract |
| 26 | `TypedWrapperComponent` | `Combobox.Root.Props<Value, Multiple>` generic wrapper from docs "Typed wrapper component" snippet | no | no | Examples/TypeScript (#2474 ask) |

## C. Real-world recreation stories

- [G] Pending Phase D (`research/d-real-world-usage/combobox/ranked.json` not yet produced). Corpus signal (28 repos found via combobox subpath import; brief §11) suggests recreating: a tag/label multi-select with chips (dify/PostHog-dashboard archetype), a country/user picker with async search (WordPress/Gutenberg attribute-picker archetype), and a design-system wrapper component re-exporting the full part set (coss/shadcn-derived registry archetype). Each recreation must include its interaction (open → filter → select → assert app-visible effect).
- Placeholder names: `RealWorldTagChipsMultiSelect`, `RealWorldAsyncUserPicker`, `RealWorldWrappedRegistryCombobox` — finalize against `ranked.json` rationales when available.

**Totals**: 26 planned + 3 recreation placeholders. Interaction (play) stories: 19, including the mandatory full open→filter→select→close flow (#9), multiple-selection chips keyboard flow (#15), and form integration (#24).
