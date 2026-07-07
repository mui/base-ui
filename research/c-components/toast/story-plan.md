# Toast — story plan

Target set: 21 stories (+2 recreation placeholders). Naming: `Toast/<Story>`. All stories styled after the docs hero demo CSS (CSS Modules, raw oklch values, `user-select: none` + `-webkit-` on Root — swipe feels sticky without it, #1467 review). Every story needs a `Toast.Provider` + Portal + Viewport + mapped renderer — extract one shared `<ToastRenderer />` helper per file, mirroring the hero demo. "Play?" = interaction test. Doc-section = Definition-of-Done slot the story feeds. Timer-dependent plays should use short `timeout` values and `waitFor`, not mocked clocks, unless the test runner provides fake timers.

## A. Kept functionality demos (from current docs — keep per Decision 8)

| # | Story | Render | Play? | Doc section |
|---|---|---|---|---|
| 1 | `Hero` | hero demo: button → `useToastManager().add({ title, description })`; bottom-right stack | yes: click "Create toast" → assert `role="dialog"` toast with title text appears in `[role="region"][aria-label="Notifications"]` | Hero; imperative creation |
| 2 | `AnchoredToast` | docs `anchored` demo: `positionerProps: { anchor }`, Positioner + Arrow, 1.5s timeout, separate provider/manager | yes: click "Copy" → toast with `data-side` appears near button → auto-disappears | Anchored toasts; Positioner/Arrow anatomy |
| 3 | `CustomPosition` | docs `position` demo: top-center viewport, `swipeDirection={['up']}` | no | Custom position; swipeDirection guidance |
| 4 | `UndoAction` | docs `undo` demo: `actionProps: { children: 'Undo', onClick }`, `timeout: 10000`, closes + adds "Action undone" | yes: perform action → click Undo inside toast → undo toast replaces it | Undo pattern; actionProps; a11y timing (#4975) |
| 5 | `PromiseToast` | docs `promise` demo: `toastManager.promise(p, { loading, success, error })`, `data-type` styling | yes: trigger → "Loading" visible → resolves → success text + auto-dismiss | Promise; `type` styling contract |
| 6 | `CustomDataToast` | docs `custom` demo: typed `data` payload + type-guard renderer | yes: create → description renders `data.userId` | Custom data; generics |
| 7 | `DeduplicateToast` | docs `deduplicate` demo: `add({ id: 'save-status' })` upsert; pulse via `updateKey` parity | yes: click twice → still exactly one toast; className switches pulse variant | Dedup/upsert (#4440); updateKey |
| 8 | `VaryingHeights` | docs `varying-heights` demo: short + tall toasts; Content `overflow: hidden`, heights match frontmost | no (visual) | Stacking with variable heights (#2742) |

## B. One story per use case (test-bearing)

| # | Story | Render | Play? | Doc section |
|---|---|---|---|---|
| 9 | `StackingAndExpand` (REQUIRED) | create 3 toasts; collapsed peek/scale from `--toast-index`; hover viewport → fan out via `--toast-offset-y` | yes: add 3 → assert 3 roots with distinct `--toast-index`; hover viewport → `data-expanded` present on roots | Stacking & animations; expanded state |
| 10 | `LimitOverflow` | `Provider limit={2}`, create 3 | yes: third add → oldest root gains `data-limited` + `inert`; close newest → it returns | `limit` prop; #1953 behavior |
| 11 | `PersistentToast` | `add({ timeout: 0 })` + `Toast.Close` rendered | yes: create → wait past default 5s → still present → click Close → gone | Custom duration/persistent; WCAG 2.2.1 guidance |
| 12 | `CustomDuration` | two buttons: `timeout: 1000` vs `timeout: 8000` | yes: short one auto-dismisses (waitFor), long one still visible | timeout guidance |
| 13 | `HoverPausesTimers` | `timeout: 1500` toast; hover keeps it alive | yes: create → hover viewport immediately → wait 2s → still mounted → unhover → dismisses | Timer pause/resume behavior |
| 14 | `SwipeToDismiss` | hero stack with `swipeDirection={['down','right']}`; docs swipe CSS (`--toast-swipe-movement-*`, `data-swipe-direction`) | optional: pointer-event sequence past 40px threshold → toast closes (jsdom-fragile; mark chromium-only, cf. ToastRoot.test.tsx browser tests) | Swipe mechanics; styling contract |
| 15 | `GlobalManager` (REQUIRED) | module-scope `createToastManager()`; plain non-React function `notify()` called from a button outside the provider subtree | yes: click → toast appears; assert `add` worked without hook | Global manager; createToastManager |
| 16 | `CloseAllToasts` | create several; toolbar button calls `toastManager.close()` | yes: 3 toasts → close() → all removed | `close` method (#3979) |
| 17 | `UpdateToast` | `add` returns id; button calls `update(id, { description })` | yes: update → new text rendered; updateKey incremented (visual class) | `update` method; timer reschedule (#3564) |
| 18 | `PriorityAnnouncements` | two buttons: `priority: 'low'` vs `'high'` (e.g. "Saved" vs "Session expired") | yes: high → root has `role="alertdialog"`; hidden `[role="alert"]` container holds title/description strings | A11y contract; priority guidance |
| 19 | `KeyboardNavigation` (REQUIRED a11y) | hero stack + focusable page button | yes: create 2 toasts → F6 → viewport focused → Tab → first toast focused → Escape → toast closes, focus moves to next toast → Shift+Tab → focus returns to page button | Keyboard table; F6 landmark |
| 20 | `OnCloseVsOnRemove` | toast with exit transition; log panel records `onClose`/`onRemove` timestamps | yes: close → `onClose` logged immediately, `onRemove` after transition (waitFor) | Lifecycle callbacks; animation |
| 21 | `TypeStyling` | buttons for `type: 'success' | 'error' | 'info'`; CSS keyed on `[data-type]` on Root/Title/Close | yes: each button → root carries matching `data-type` | `type` prop; data-attribute styling |

## C. Real-world recreation placeholders (Phase D pending — brief §11 is [G])

| # | Story | Notes |
|---|---|---|
| 22 | `RecreationSaveFlow` | placeholder: form save → promise toast → undo, composed with `Form`/`Field` — pick from ranked toast corpus once `d-real-world-usage/toast/` exists |
| 23 | `RecreationCopyFeedback` | placeholder: anchored "Copied" toast on a code-block copy button (archetype from #3026); confirm against a ranked live example |

Coverage notes: every §7 keyboard row is exercised by #19; the two announcement paths by #18; all documented CSS vars/data attrs appear across #9/#14/#21; manager API surface (`add`/`update`/`close`/`promise`/generics/global) across #1/#5/#6/#15/#16/#17. Anchored + stacked separation (two providers) is honored in #2 per docs guidance.
