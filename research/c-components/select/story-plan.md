# Select — story plan

Feeds Phase E. Source of truth: [`brief.md`](./brief.md). Styling: follow the docs hero demo CSS (CSS Modules, raw oklch values).

## 1. Kept functionality demos (from current docs `demos/` dirs)

| Docs demo dir | Story |
|---|---|
| `demos/hero` | `Basic` (labeled select, items prop, placeholder, scroll arrows) |
| `demos/multiple` | `MultipleSelection` |
| `demos/object-values` | `ObjectValues` |
| `demos/grouped` | `GroupedItems` |

## 2. One story per use case

Columns: name — renders — controlled? — play? — doc section served.

1. **Basic** — hero recreation: Root+Label+Trigger(Value placeholder, Icon)+Portal+Positioner+Popup+ScrollArrows+List+Item(ItemText, ItemIndicator), `items` prop — uncontrolled — no — Hero / Anatomy.
2. **OpenSelectClose** *(required interaction story)* — Basic + play: click trigger → assert `role="listbox"` visible + trigger `aria-expanded=true` → ArrowDown to highlight → Enter → assert popup closed, trigger shows chosen label, `onValueChange` called with (value, eventDetails) — uncontrolled — **play** — Behavior / A11y contract.
3. **ControlledValue** — external `value` state + buttons setting/clearing (`null`) outside the select — controlled — play (programmatic set; assert no popup force-mount, #5119) — Behavior; Pitfall "clear with null".
4. **ControlledOpen** — `open` + `onOpenChange` logging `eventDetails.reason`; cancel `outside-press` variant via `eventDetails.cancel()` — controlled(open) — play — Behavior / eventDetails escape hatch.
5. **PlaceholderValue** — `<Select.Value placeholder>` — uncontrolled — no — Examples "Placeholder values"; `data-placeholder` styling.
6. **ClearableNullItem** — `{ value: null, label: 'Select theme' }` item rendered in list — uncontrolled — play (select real value, then null item clears) — Examples "Placeholder values" / prop guidance `value={null}`.
7. **FormattedValue** — `Select.Value` children function rendering styled label (docs font-family example) — uncontrolled — no — Examples "Formatting the value".
8. **MultipleSelection** — `multiple` + defaultValue array; comma-separated trigger label — uncontrolled — play (select two items; assert popup stays open) — Examples "Multiple selection".
9. **MultipleControlledWithClearAll** — multiple + external "Clear all" button (the #2734 ask, done in userland) — controlled — play — When-not-to-use boundary / FAQ.
10. **ObjectValues** — object item values + `isItemEqualToValue`, `itemToStringLabel`, `itemToStringValue` — uncontrolled — no — Examples "Object values" / prop guidance.
11. **GroupedItems** — Group + GroupLabel + Separator, grouped `items` array — uncontrolled — no — Examples "Grouped".
12. **LongListScrollArrows** — 100+ items (recreates `experiments/long-select.tsx`), styled ScrollUp/DownArrows with `[data-visible]`/`[data-side="none"]` rules — uncontrolled — play (open; assert down-arrow visible) — Anatomy (List/#2596 contract).
13. **ConventionalDropdownPositioning** — `alignItemWithTrigger={false}` + `side="bottom" align="start" sideOffset={4}`, optional Arrow — uncontrolled — no — Positioning concept section (#1713, #2712).
14. **AlignItemWithTriggerDefault** — default item-aligned mode with a pre-selected middle item; document `data-side="none"` styling — uncontrolled — play (open; assert overlap/aligned item) — Positioning.
15. **TypeaheadKeyboard** — Basic list of countries — uncontrolled — **play**: focus closed trigger, type "ger" → value committed without opening (single mode); open and type to move highlight — A11y keyboard table (#5025, #2274).
16. **DisabledOptions** — some `<Select.Item disabled>` + fully `disabled` select variant — uncontrolled — play (disabled item focusable but not selectable) — A11y contract / prop guidance.
17. **ReadOnly** — `readOnly` select with a value — uncontrolled — play (click/keyboard don't open; #2717) — Prop guidance.
18. **InFieldWithValidation** — Field.Root(name) + Field.Label + Select + Field.Description + Field.Error, `required`, submit in `<Form>`; styles on `data-invalid`/`data-touched`/`data-filled` — uncontrolled — play (submit empty → error shown) — Forms handbook contract.
19. **NativeFormSubmission** — plain `<form>` + `name` + `onSubmit` readout of hidden-input value; `itemToStringValue` serialization for object values — uncontrolled — play (select, submit, assert payload) — Behavior/forms (#3441).
20. **BrowserAutofillHint** — country select with `autoComplete="country"`; note explaining hidden-input autofill matching — uncontrolled — no — Prop guidance (#4005).
21. **NonModal** — `modal={false}` next to scrollable page content — uncontrolled — no — Prop guidance `modal`.
22. **HoverVersusHighlight** — `highlightItemOnHover={false}` with distinct `:hover` and `[data-highlighted]` styles — uncontrolled — no — Prop guidance (#3377, #2731).
23. **AnimatedPopup** — CSS transition on `data-starting-style`/`data-ending-style` + `transform-origin: var(--transform-origin)`; `onOpenChangeComplete` log — uncontrolled — play (open/close; assert transition classes) — Animation handbook; styling contract.
24. **InsideDialog** — Select nested in Dialog.Popup, no z-index anywhere (pitfall #2450 demo) — uncontrolled — play (open dialog → open select → select) — Pitfalls/interop.
25. **TypedWrapper** — `MySelect<Value, Multiple>` wrapper from docs "Typed wrapper component"; story renders it compiling with generic inference — uncontrolled — no — Examples/TypeScript (#2474 ask).
26. **RTLItemAlignment** — DirectionProvider + `dir="rtl"` recreation of `experiments/select-rtl-align-item-with-trigger.tsx` — uncontrolled — no — Positioning edge (#4531).

## 3. Real-world recreation stories

- [G] Pending Phase D (`research/d-real-world-usage/select/ranked.json` not yet produced). Corpus signal (137 select-importing repos) suggests recreating: a dashboard filter select (Databuddy/prefab archetype), a settings/theme picker (docs archetype), and a shadcn-style wrapped Select registry component. Each recreation must include its interaction (open → choose → assert app-visible effect).
- Placeholder names: `RealWorldDashboardFilter`, `RealWorldThemePicker`, `RealWorldWrappedRegistrySelect` — finalize against `ranked.json` rationales when available.

**Totals**: 26 planned + 3 recreation placeholders. Interaction (play) stories: 14, including the mandatory full open→select→close flow (#2).
