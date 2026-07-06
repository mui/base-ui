# Dialog — story plan

Target set: 22 stories (+2 recreation placeholders). Naming: `Dialog/<Story>`. All stories styled after the docs hero demo CSS (CSS Modules, raw oklch values). "play?" = interaction test via play function. Doc-section = Definition-of-Done slot the story feeds.

## A. Kept functionality demos (from current docs — keep per Decision 8)

| # | Story | Render | Controlled? | Play? | Doc section |
|---|---|---|---|---|---|
| 1 | `Hero` | hero demo: Trigger → Backdrop → Popup(Title, Description, Close) | no | no | Hero example |
| 2 | `NestedDialogs` | docs `nested` demo; parent styled via `[data-nested-dialog-open]` + `--nested-dialogs` | no | yes: open parent → open child → Esc closes child only | How it works / nesting |
| 3 | `CloseConfirmation` | docs `close-confirmation` demo; both dialogs controlled; confirmation opens from `onOpenChange` close request | yes (both) | yes: type text → Esc → confirmation appears → Discard closes both | Examples; pitfalls (guarding close) |
| 4 | `OutsideScroll` | docs `outside-scroll` demo; `Viewport` as scrollable container (+ Scroll Area) | no | no | Anatomy (Viewport) / scroll layouts |
| 5 | `InsideScroll` | docs `inside-scroll` demo; popup fixed, inner scroll | no | no | Scroll layouts |
| 6 | `UncontainedContent` | docs `uncontained` demo; close button visually outside popup, `pointer-events` layering | no | no | Placing elements outside the popup; a11y |
| 7 | `DetachedTriggerSimple` | docs `detached-triggers-simple`: `createHandle()`, Trigger outside Root | no | yes: click detached trigger → dialog opens | Detached triggers |
| 8 | `DetachedTriggersControlled` | docs `detached-triggers-controlled`: `open` + `triggerId` + trigger `id`s | yes | yes: open via each trigger; assert `aria-expanded` on the active trigger only | Controlled mode with multiple triggers |

## B. One story per use case (test-bearing)

| # | Story | Render | Controlled? | Play? | Doc section |
|---|---|---|---|---|---|
| 9 | `OpenCloseInteraction` (REQUIRED full cycle) | hero anatomy | no | yes: click Trigger → assert `role="dialog"`, focus inside popup, `data-popup-open` on trigger → click Close → assert unmounted + focus returned to Trigger | Behavior; a11y contract |
| 10 | `ModalVsNonModal` (pair, side by side) | two dialogs: `modal` (default) vs `modal={false}` | no | yes: open modal → outside button not clickable/scroll locked; open non-modal → page still interactive | `modal` prop guidance |
| 11 | `TrapFocusMode` | `modal="trap-focus"` | no | yes: Tab cycles inside popup; page scroll NOT locked | `modal` prop guidance |
| 12 | `Controlled` (REQUIRED) | `open`/`onOpenChange` + external open/close buttons | yes | yes: external button opens; Esc closes; state label updates | State section |
| 13 | `FormInDialog` (REQUIRED submit-closes) | controlled dialog wrapping `<Form>`+`Field.Root`+input; submit closes on success | yes | yes: open → fill input → submit → dialog closes, value rendered | Forms integration; when-to-use |
| 14 | `DisablePointerDismissal` | `disablePointerDismissal` + visible Close | no | yes: outside click does NOT close; Close button does | Prop guidance |
| 15 | `ChangeReasonInspector` | `onOpenChange` logs `eventDetails.reason`; buttons + Esc + backdrop | yes | yes: close via Esc/backdrop/Close → assert logged reasons `escape-key`/`outside-press`/`close-press` | Customization / eventDetails |
| 16 | `CancelClose` | `eventDetails.cancel()` when reason is `outside-press` | no | yes: backdrop click keeps dialog open; Close still works | eventDetails.cancel guidance |
| 17 | `InitialAndFinalFocus` | form dialog with `initialFocus` ref to 2nd input, `finalFocus` to a designated button | no | yes: open → 2nd input focused; close → designated button focused | a11y / focus props |
| 18 | `ExitAnimation` (REQUIRED) | CSS transition via `[data-starting-style]`/`[data-ending-style]`, `onOpenChangeComplete` counter | no | yes: close → element still mounted mid-transition → wait `onOpenChangeComplete(false)` → unmounted | Animation |
| 19 | `KeepMountedMotion` | `Portal keepMounted` + render-prop `motion.div` (per handbook Motion recipe) | yes | no (visual) | Animation (JS libraries) |
| 20 | `HandleImperativePayload` (REQUIRED createHandle) | `createHandle<T>()`; two payload triggers + toolbar button calling `handle.openWithPayload()`; Root children as `({ payload }) => …` | no | yes: each trigger renders its payload text; imperative open works | Detached triggers / handles |
| 21 | `OpenFromMenu` | docs "Open from a menu" pattern: `Menu.Item onClick` sets dialog state | yes | yes: open menu → click item → dialog opens, menu closed | Composition with Menu |
| 22 | `NestedAlertDialogGuard` | Dialog containing a destructive action guarded by nested `AlertDialog` | yes | yes: cross-type nesting; parent gets `data-nested-dialog-open` | Dialog vs AlertDialog boundary |

## C. Real-world recreation placeholders (Phase D pending — see brief §11)

| # | Story | Notes |
|---|---|---|
| R1 | `RecreationSidePanel` | [G] placeholder — corpus shows sheet/side-panel wrappers on Dialog (e.g. oxidecomputer SideModal archetype): edge-positioned Dialog, slide transition, form + footer actions. Finalize from ranked.json. |
| R2 | `RecreationSettingsModal` | [G] placeholder — shadcn-style `components/ui/dialog.tsx` wrapper archetype recomposed as a settings dialog with sections + close confirmation. Finalize from ranked.json. |

Coverage check: full open/close (#9), modal vs non-modal pair (#10/#11), nested (#2, #22), controlled (#12), form-submit-closes (#13), createHandle/detached (#7, #8, #20), exit animation (#18). A11y-contract assertions concentrated in #9, #17; keyboard table exercised by #9/#11/#15.
