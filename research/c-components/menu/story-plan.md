# Menu — story plan

Styling: reuse the docs hero demo CSS (CSS Modules, raw oklch values) per AGENTS.md. All popup stories must exercise the full Root→Trigger→Portal→Positioner→Popup tree. `play` = interaction test planned. Doc-section keys reference the Definition of Done sections the story serves.

## Kept functionality demos (from docs `demos/`)

| # | Story | Render | Controlled | Play | Doc section |
|---|---|---|---|---|---|
| 1 | `Hero` | hero demo: trigger + items + separator (Song menu) | no | no | Hero example |
| 2 | `OpenOnHover` | `Trigger openOnHover delay={100}` | no | yes: hover → open; unhover → close | How it works / props (`openOnHover`) |
| 3 | `CheckboxItems` | 2–3 `CheckboxItem` + indicators (REQUIRED) | no | yes: click toggles `aria-checked`, menu stays open (`closeOnClick=false` default) | Examples; props (`closeOnClick`) |
| 4 | `RadioItems` | `RadioGroup` + 3 `RadioItem` + indicators (REQUIRED) | optional `value` variant | yes: arrow to item, Enter selects, `aria-checked` moves | Examples |
| 5 | `GroupLabels` | `Group` + `GroupLabel` + items; second group inside `RadioGroup` (#4826) (REQUIRED) | no | no (a11y snapshot: `role=group` + `aria-labelledby`) | Examples; a11y contract |
| 6 | `Submenu` | `SubmenuRoot` + `SubmenuTrigger` + nested Portal tree | no | yes (see 12) | Examples |
| 7 | `Arrow` | popup with `Menu.Arrow` | no | no | Examples |
| 8 | `LinkItem` | `LinkItem href` items ("Navigate to another page") | no | yes: link has `role=menuitem`, closes per default | Examples |
| 9 | `DetachedTriggersSimple` | `createHandle()`; trigger and root in separate containers | no | yes: click detached trigger opens menu | Examples (handles) |
| 10 | `DetachedTriggersPayload` | 2 triggers with `payload`, function-child Root rendering per-payload items | no | yes: each trigger renders its own items | Examples; decision log (#3170) |
| 11 | `ControlledMultiTrigger` | `open` + `triggerId` + `onOpenChange` reading `eventDetails.trigger` | yes | yes: switch triggers updates anchor | Examples; prop guidance |
| 12 | `ViewportContentTransition` | detached-triggers-full: `Viewport`, positioner `width/height: var(--positioner-*)`, morph animation | no | no (visual; animation) | Animating the menu; Viewport note |

## One story per use case (test-bearing)

| # | Story | Render | Controlled | Play | Doc section |
|---|---|---|---|---|---|
| 13 | `OpenClose` (REQUIRED interaction) | hero tree | no | yes: click open → `role=menu` visible, `aria-expanded=true`, `data-popup-open` on trigger; Esc closes and refocuses trigger; outside click closes | Behavior; keyboard table |
| 14 | `KeyboardNavigation` | 5 items incl. one disabled | no | yes: ArrowDown open→first focused; Arrow/Home/End roving incl. disabled item; loop | A11y keyboard table |
| 15 | `SubmenuKeyboard` (REQUIRED) | story 6 tree | no | yes: ArrowRight on SubmenuTrigger opens + focuses first child; ArrowLeft closes + refocuses; Esc closes one level only (`closeParentOnEsc=false`) | Keyboard table; §8 `closeParentOnEsc` |
| 16 | `Typeahead` | items "Aa/Ba/Bb/Ca/Cd" + one `label`-overridden icon item | no | yes: type "c","d" moves highlight; Space during typing doesn't activate | Keyboard table; `label` prop |
| 17 | `CloseOnClickConfig` | `Item closeOnClick={false}` + `CheckboxItem closeOnClick` | no | yes: asymmetric defaults demonstrated | Prop guidance |
| 18 | `DisabledItems` | disabled Item/CheckboxItem/SubmenuTrigger | no | yes: highlightable, `aria-disabled`, not activatable | Pitfalls #3; a11y honesty |
| 19 | `NonModal` | `Root modal={false}` beside interactive page content | no | yes: outside button clickable while open | `modal` prop guidance |
| 20 | `EventDetailsReasons` | `onOpenChange` logging `reason`; cancel `outside-press` variant | yes (log) | yes: `eventDetails.cancel()` keeps menu open | Behavior; customization principles |
| 21 | `OpenDialogFromMenu` | docs recipe: `Menu.Item onClick` → controlled `Dialog` | yes (dialog) | yes: item click opens dialog, menu closed | Examples ("Open a dialog") |
| 22 | `TransitionAnimation` | popup with `data-starting-style`/`data-ending-style` CSS transition + `data-instant` guard | no | no (visual) | Animation model |
| 23 | `RTLSubmenu` | `DirectionProvider direction="rtl"` + submenu | no | yes: ArrowLeft opens submenu in RTL | Keyboard table (RTL row) |
| 24 | `HighlightItemOnHoverDisabled` | `Root highlightItemOnHover={false}` with distinct `:hover` vs `[data-highlighted]` styles | no | no (visual) | Prop guidance |
| 25 | `ImperativeHandle` | `handle.open(triggerId)`/`close()` buttons + `isOpen` readout | no | yes: imperative open works only while root mounted | Handles; pitfalls #11 |

## Real-world recreation placeholders (fill from Phase D ranked.json)

| # | Story | Notes |
|---|---|---|
| 26 | `Recreation_RowActionsTable` | [G pending Phase D] expected archetype: table row "…" action menu (detached triggers over N rows, one menu) — candidates: oxidecomputer/console DropdownMenu |
| 27 | `Recreation_EditorCommandMenu` | [G pending Phase D] editor/app chrome menu with submenus + checkbox settings — candidates: seek-oss/playroom, astrofox |
| 28 | `Recreation_RegistryWrapper` | [G pending Phase D] shadcn-style styled wrapper module re-exporting all parts — candidates: animate-ui, makeplane/plane propel |

Total: 25 concrete + 3 recreation placeholders. Priorities if cut: keep 1, 3, 4, 5, 13, 14, 15 (the REQUIRED set), then 9–11, 16–21.
