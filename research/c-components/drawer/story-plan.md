# Drawer — story plan

16 stories. Conventions per e-storybook pilot (switch/select): meta `Overlays/Drawer`, portal queries via `within(canvasElement.ownerDocument.body)`, play functions prefer click-open; swipe gestures are pointer-event sequences — keep gesture plays coarse (pointerdown → pointermove × n → pointerup) and assert via data attributes/CSS vars, or make gesture stories visual-only where synthetic pointers prove flaky in CI. Styling: adapt `docs/src/app/(docs)/react/components/drawer/demos/hero/css-modules/*.module.css`.

Definition-of-Done keys: [anatomy] [state] [gesture] [styling-contract] [a11y] [composition] [recreation].

1. **Hero (bottom sheet)** — kept docs demo: Trigger → bottom drawer with Title/Description/Close, backdrop fade. Play: click trigger, assert `role="dialog"` visible, click Close, assert closed. [anatomy][state]
2. **OpenClosePlay (reasons)** — controlled root logging `eventDetails.reason`; play: open via trigger, close via Esc, close via backdrop press, assert reasons `trigger-press`/`escape-key`/`outside-press`. MDX documents the drawer-only reasons `swipe` and `close-watcher` (Android back gesture). Inherited Dialog semantics proven on Drawer. [state][a11y]
3. **SideTop / 4. SideBottom / 5. SideLeft / 6. SideRight — four-sides matrix** — one story per `swipeDirection` value (`up`, `down`, `left`, `right`), shared CSS keyed off `[data-swipe-direction]`; each play opens and asserts `data-swipe-direction` on the popup. (Counts as 4 stories.) [anatomy][styling-contract]
7. **SnapPoints** — kept docs demo shape: `snapPoints={['148px', 1]}` (docs values) bottom sheet, controlled via `snapPoint`/`onSnapPointChange`, transform composed per docs (`translateY(calc(var(--drawer-snap-point-offset) + var(--drawer-swipe-movement-y)))`); play: open, assert `data-expanded` absent at initial detent; button drives `snapPoint` to `1` and asserts `data-expanded`. MDX note: `snapToSequentialPoints` for distance-based (non-velocity) snapping. [state][gesture]
8. **SwipeProgressStyling** — THE styling-contract story: backdrop `opacity: calc(1 - var(--drawer-swipe-progress))`, popup shadow/scale bound to `--drawer-swipe-movement-y`, transitions gated off under `[data-swiping]`. Visual-first; play optionally performs a small synthetic drag and asserts `data-swiping` appears. [styling-contract][gesture]
9. **SwipeToDismiss** — bottom sheet with generous drag threshold; play: synthetic pointer drag past threshold, `waitFor` closed + assert last close reason; also assert `data-swipe-dismiss` styling path exists (exit class). Skip-if-flaky note: keep assertions on state, not pixels. [gesture][state]
10. **SwipeAreaOpen** — closed drawer + visible-for-demo `Drawer.SwipeArea` strip (tinted); play: drag from edge strip, assert drawer opens; shows `data-swiping` on the strip. [gesture][anatomy]
11. **IndentProvider** — `Drawer.Provider` + `IndentBackground` + `Indent` wrapping a fake app shell; opening the drawer scales/insets the shell via `[data-active]`. Play: open, assert `data-active` on the Indent element. [composition][styling-contract]
12. **NestedDrawers** — drawer opening a second drawer; parent styled via `data-nested-drawer-open`, `--nested-drawers`, `--drawer-frontmost-height` stacked-card effect. Play: open both, assert parent attribute; close child, assert removal. [composition][styling-contract]
13. **DialogInsideDrawer** — evidenced by #4493 (dialogs excluded from drawer stack): drawer containing a Dialog.Trigger; play: open drawer, open dialog, assert drawer popup does NOT get `data-nested-drawer-open`; Esc closes only the dialog. [composition][state]
14. **DrawerWithForm (virtual keyboard)** — bottom sheet with inputs wrapped in `Drawer.VirtualKeyboardProvider`; CSS uses `--drawer-keyboard-inset`; play: focus input, submit, assert close-on-submit; keyboard inset itself is device-dependent — document as visual/manual beyond the form flow. Include close-confirmation variant per docs example #4600 if space allows (cancel-on-dirty via `eventDetails.cancel()`). [composition][a11y][state]
15. **ExitAnimation** — CSS transitions on `data-starting-style`/`data-ending-style` + distinct `data-swipe-dismiss` exit (faster, directional); play: open, close via Close button, `waitFor` unmount after transition (`onOpenChangeComplete` spy). [styling-contract][state]
16. **KeyboardAndFocus (a11y)** — modal drawer with several tabbables; play: open, assert focus moved inside, Tab loops, Esc closes, focus returns to trigger. Documents the "gestures add no keyboard surface — keep a visible Close" contract in MDX prose. [a11y]

Recreation placeholders (pending Phase D — research/d-real-world-usage/drawer/ does not exist yet):

17. **[G] RecreationA** — expected archetype: mobile navigation sheet (nav links + user section) from a ranked production repo; interactions: open via hamburger, navigate, auto-close.
18. **[G] RecreationB** — expected archetype: snap-point bottom sheet over content (map/player/filter panel) from a ranked repo; interactions: half-open browse → expand to full → swipe-dismiss.

Notes:
- Stories 3–6 share one render function parameterized by `swipeDirection` (four named exports for the matrix).
- Expansion candidates if capacity allows (both are kept docs examples): "Action sheet with separate destructive action" and "Detached triggers" (handle + payload on Drawer).
- Swipe-dismiss veto (cancel on reason `swipe`) is covered inside story 14's close-confirmation variant — evidenced by root tests "clears swipe-dismiss styles when swipe close is canceled" and docs example #4600.
- Gesture plays (9, 10) are the risk items: if synthetic pointer sequences don't trigger the native gesture engine in CI (it listens natively per #4980), demote assertions to attribute presence after `pointerdown` or mark the story visual-only with tags `['needs-work']` per setup-prompt discipline.
- MDX page: link to Dialog docs for inherited behavior; inline decision-log callouts from brief §9 (preview→stable #4293, native gesture driving #4980, controlled-swipe guard #4133).
