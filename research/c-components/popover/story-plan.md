# Popover — story plan (Tier 1)

Conventions: CSF3 stories in `popover.stories.tsx`; `play` = interaction test via play function; DoD-§ = Definition of Done section served (research/a-documentation-standard/documentation-definition-of-done.md). Styling: follow the component's hero demo styles (CSS Modules variant) per AGENTS.md.

## A. Kept functionality demos (from current docs — Decision 8)

| # | Story | Source demo | Controlled | Play | DoD-§ |
|---|---|---|---|---|---|
| 1 | `Hero` (notifications panel: Trigger→Portal→Positioner→Popup→Arrow→Title→Description) | demos/hero | no | no | 2 Hero |
| 2 | `OpenOnHover` (Trigger `openOnHover` + `delay`) | demos/open-on-hover | no | no | 8, 12 (`openOnHover`) |
| 3 | `DetachedTriggersSimple` (`createHandle()`, Trigger outside Root) | demos/detached-triggers-simple | no | no | 8 |
| 4 | `DetachedTriggersControlled` (`open` + `triggerId` + `onOpenChange(eventDetails)`) | demos/detached-triggers-controlled | yes | no | 8, 12 (`triggerId`) |
| 5 | `DetachedTriggersFull` (payload + Viewport morphing between triggers, position/size/content animation) | demos/detached-triggers-full | no | no | 8, 11 |

## B. Interaction stories (behavior + a11y pinning)

| # | Story | Render / play outline | Controlled | Play | DoD-§ |
|---|---|---|---|---|---|
| 6 | `OpenCloseInteraction` **(mandatory full cycle)** | hero shape; play: click trigger → expect `role=dialog` visible + trigger `aria-expanded=true` + `data-popup-open` → press Escape → expect closed + focus back on trigger → reopen → click outside → expect closed | no | yes | 7, 9 |
| 7 | `KeyboardTabThrough` | popup with 2 buttons + outside button after trigger; play: open with Enter, expect focus inside (first tabbable), Tab past last element → popup closes, focus lands after trigger | no | yes | 9 |
| 8 | `ModalTrue` **(modal pair, a)** | `modal` Root + visually-hidden `Popover.Close` (sr-only); play: open → assert internal backdrop present + Tab loops inside popup | no | yes | 7, 12 (`modal`) |
| 9 | `NonModalDefault` **(modal pair, b)** | identical popup, `modal={false}` (default); play: open → click outside input → popup closes, input keeps interaction | no | yes | 7, 12 |
| 10 | `TrapFocusMode` | `modal="trap-focus"` + Close; play: Tab loops, but outside click still closes; page scroll not locked (assert no scroll-lock style) | no | yes | 12 |
| 11 | `DetachedHandleImperative` **(mandatory handle story)** | toolbar button + `handle.open(triggerId)` / `handle.close()` buttons far from Root; play: click imperative-open button → popup opens anchored to the registered trigger; call close | no | yes | 8, 7 |
| 12 | `MultipleTriggersPayload` | 3 in-grid triggers sharing one handle, `payload` per trigger, Root function child renders payload; play: open via trigger 2 → popup text reflects payload 2; switch to trigger 3 → content swaps, popup DOM node reused | no | yes | 8 |
| 13 | `CancelCloseOnOutsidePress` | controlled; `onOpenChange` filters `reason==='outside-press'` (pitfall #7 recipe); play: outside click keeps open, Escape closes | yes | yes | 12, 16 Do/Don't |
| 14 | `HoverStickOnClick` | `openOnHover` trigger; play: hover-open (no focus steal asserted), then click → stays open on mouseleave (stick), click again → closes | no | yes | 7 |

## C. Use-case stories (one per evidenced scenario)

| # | Story | Use case / render | Controlled | Play | DoD-§ |
|---|---|---|---|---|---|
| 15 | `Infotip` | info-icon trigger, `openOnHover`, text-only content — the documented tooltip alternative (tooltip page "Infotips") | no | no | 4, 5 |
| 16 | `FilterPanelForm` | popover containing checkboxes + Apply button (interactive content archetype) | no | no | 4 |
| 17 | `TableRowSharedPopover` | 10-row table, one Root + detached per-row triggers with row payload (the #3577 archetype) | no | no | 4, 17 |
| 18 | `WithBackdrop` | Backdrop part styled dim + `modal`; shows backdrop data-attrs | no | no | 6 Anatomy |
| 19 | `CustomAnchor` | Positioner `anchor` pointing at a separate highlighted element (the #2157/#3577 answer) | no | no | 12 (`anchor`) |
| 20 | `PositionerPlayground` | args-driven `side`/`align`/`sideOffset`/`collisionPadding` via controls | no | no | 12 |
| 21 | `PositionMethodFixedInSticky` | popover inside a sticky header (pitfall #5, `positionMethod="fixed"`) | no | no | 10, 16 |
| 22 | `TransitionStarting/EndingStyle` | CSS transition on `data-starting-style`/`data-ending-style` + `--transform-origin` scale (handbook recipe) | no | no | 11 |
| 23 | `KeepMountedExitAnimation` | Portal `keepMounted` + `onOpenChangeComplete` logging + `actionsRef.unmount` note | yes | no | 11, 12 |
| 24 | `NestedPopovers` | popover opening a child popover (portal nesting rules, pitfall #2) | no | no | 6, 16 |
| 25 | `InitialFinalFocus` | `initialFocus` ref to second input; `finalFocus` to an external element; play: open → focus lands on ref target | no | yes | 12, 9 |
| 26 | `ViewportContentDirection` | 2 triggers left/right; Viewport `data-activation-direction` CSS slide (docs "Content" section, standalone minimal version) | no | no | 11 |
| 27 | `ArrowSides` | four popovers `side=top/right/bottom/left` with Arrow + `data-side` styling | no | no | 10 |

## D. Real-world recreation stories

| # | Story | Notes |
|---|---|---|
| 28 | `Recreation1` — [G] placeholder pending Phase D ranked.json (likely: production notification/filter popover; recreate flow incl. the open interaction) | 17 |
| 29 | `Recreation2` — [G] placeholder pending Phase D (candidate pool: 69 popover-importing repos in _corpus/repos.json) | 17 |

Total planned: 27 concrete + 2 recreation placeholders. Mandatory items covered: full open/close interaction (#6), detached-trigger/handle (#3, #11, #12), modal-vs-nonmodal pair (#8/#9).
