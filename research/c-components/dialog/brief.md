# Dialog — component research brief

Tier 1. Mined 2026-07-06 from source (`packages/react/src/dialog/`), docs (`docs/src/app/(docs)/react/components/dialog/page.mdx`), tests, experiments, git history (`[dialog]` scope), and upstream issues/PRs via `gh`. Evidence tags: [E] direct evidence, [I] inference, [G] gap.

## 1. Identity

- **Name / subpath**: Dialog — `@base-ui/react/dialog`. Multi-part compound component exported as a namespace.
- **Parts** (from `index.parts.ts`):
  - `Dialog.Root` — groups all parts; owns state; renders no HTML element.
  - `Dialog.Trigger` — "A button that opens the dialog." Renders `<button>`.
  - `Dialog.Portal` — "A portal element that moves the popup to a different part of the DOM. By default, the portal element is appended to `<body>`."
  - `Dialog.Backdrop` — "An overlay displayed beneath the popup." Renders `<div>`. Optional.
  - `Dialog.Viewport` — "A positioning container for the dialog popup that can be made scrollable." Renders `<div>`. Optional (added v1.x, PR #2808).
  - `Dialog.Popup` — "A container for the dialog contents." Renders `<div>`; carries `role="dialog"`.
  - `Dialog.Title` — "A heading that labels the dialog." Renders `<h2>`; auto-wires `aria-labelledby`.
  - `Dialog.Description` — "A paragraph with additional information about the dialog." Renders `<p>`; auto-wires `aria-describedby`.
  - `Dialog.Close` — "A button that closes the dialog." Renders `<button>`.
  - Non-element API: `Dialog.createHandle()` → `Dialog.Handle` class with `open(triggerId)`, `openWithPayload(payload)`, `close()`, `isOpen` (`store/DialogHandle.ts`).
- **Status**: stable; one of the founding-era components (created 2024-06-17, PR #372, alongside Alert Dialog). No `[New]`/`[Preview]` tag.
- **Taxonomy**: overlays/popups cluster (with popover, tooltip, preview-card, alert-dialog, drawer, menu…). Purpose: interrupt or focus the user on a self-contained task/message layered **over the entire page** (not anchored to an element). IA: page-level overlay; content is a subtree teleported to `<body>` via Portal; the docs subtitle is "A popup that opens on top of the entire page" [E] (`page.mdx`).
- **Cross-component role**: Dialog's root is the shared engine for three public components — `useRenderDialogRoot(props, mode)` accepts `'dialog' | 'alert-dialog' | 'drawer'` [E] (`root/useRenderDialogRoot.tsx`). AlertDialog re-exports Dialog's parts (PR #3237 "[alert dialog] Re-export dialog parts") and Drawer detection flows through `IsDrawerContext`.

## 2. Intention

- [E] **Origin**: PR #372 "[dialog] Create new component and hook" (michaldudak, 2024-06-17) closes issue #215 "[dialog] Implement Dialog" (colmtuite), whose body opens with the W3C link: "[ARIA Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)" and an internal Notion API-design doc. The component was designed against the APG Dialog (Modal) pattern from day one.
- [E] **Not the native `<dialog>` element — deliberately**: issue #485 (open since 2022). atomiks: "The dialog component needs to be fully general in that it interops with everything correctly" — third-party extension content (Grammarly etc.) renders under the top layer and becomes inaccessible; oliviertassinari cites react-spectrum reaching the same conclusion (top-layer interop, animation limits, background scroll). Base UI dialogs are `div[role="dialog"]` plus its own focus/scroll management by design. Related rejections: native Popover API #4760, CloseWatcher #3905 (open).
- [E] **Modality decomposed into three axes**: issue #623 (vladmoroz) and #1554 (atomiks) define the design: "there are actually three different user inputs that can be 'modal'… modal `focus`… modal `scroll`… modal `pointer`" (#1554). The `modal` prop encodes the chosen combinations: `true` (all three), `false` (none), `'trap-focus'` (focus only) — landed via PR #977 "Modality changes" and PR #1571 "`modal="trap-focus"` prop value" ("`modal={false}` now disables focus trapping, whereas previously it was always enabled", atomiks).
- [E] **Backdrop is presentation-only**: #623 decided "`Backdrop` part becomes optional and is only for presentation — outside clicks should be prevented regardless of whether `Backdrop` is present". Pointer modality is enforced by an invisible `InternalBackdrop` (PR #1161) because `pointer-events: none` on outside elements "causes perf issues in Firefox and Safari" and breaks interop with popups from "extensions, other libraries or custom elements".
- [E] **Imperative/detached opening is a first-class need, answered by handles, not a manager**: issue #2802 asked for a toast-style `dialogManager`; atomiks declined (imperative APIs "close over variables… so they're stale inside event handlers"; dialogs "can range from simple to really complex" unlike toasts). PR #2974 (michaldudak) shipped detached triggers + `createHandle()` with imperative `open/openWithPayload/close`: "This should make the controlled mode almost unnecessary and will make it much more convenient to implement scenarios like those described in #2802 and #2069."
- [E] **Explicit non-goals**: gesture support ("Dialog doesn't support gestures: Use Drawer", `page.mdx` Usage guidelines); a styled theme layer (library-wide, #2292); draggable dialogs deferred to community demand (#2689, `waiting for 👍`); anchored positioning — no Positioner part (#3596 open, unanswered; Dialog is positioned by your CSS, not by an anchor) [I from API shape + issue silence].
- [I] The heart of the intention: **a maximally interoperable, screen-reader-safe modal layer whose every behavior (focus, scroll, pointer, dismissal, mounting) is independently controllable** — inferred from the modality decomposition (#623/#1554), the interop-first rejections (#485, #1161), and the three-tier state model (uncontrolled → controlled → handle).

## 3. When to use

- [E] Self-contained tasks or messages that sit "on top of the entire page" (docs subtitle) — settings panels, confirmation-with-input flows, notification centers (hero demo), forms in overlays (docs "Controlled dialog" example submits a form then closes).
- [E] When the overlay must be reachable from far-away UI or multiple places: detached triggers + `handle`, multiple triggers with per-trigger `payload` (docs "Detached triggers"/"Multiple triggers" sections; PR #2974).
- [E] Opening from inside a Menu ("Open from a menu" docs example — control the dialog and set state in `Menu.Item onClick`).
- [E] Stacked flows: nested dialogs are supported "normally", with styling hooks to present the parent behind the child (`[data-nested-dialog-open]`, `--nested-dialogs`) (docs "Nested dialogs"; PRs #1140/#1144). Close-confirmation is the canonical nested use case (docs demo).
- [E] Edge-anchored panels **without** gestures: "A panel that slides in from the edge of the screen and doesn't need gesture support is a positioned Dialog" (`page.mdx`; repeated on the Drawer page).
- [E] Scrollable long content, two sanctioned layouts: outside-scroll (Viewport scrolls, popup can extend past the bottom edge) and inside-scroll (popup fixed, inner area scrolls) (docs sections; PR #2808).

## 4. When not to use + alternatives

Cluster-level comparison lives in [research/c-components/_clusters/overlays.md](../_clusters/overlays.md) (written separately). Dialog-specific boundary reasoning, self-contained:

- **vs Alert Dialog**: AlertDialog is Dialog with three things hard-coded — `role="alertdialog"`, `modal` forced `true`, and pointer dismissal forced off: `modal = isAlertDialog ? true : modalProp; disablePointerDismissal = isAlertDialog || …` [E] (`useRenderDialogRoot.tsx`; `AlertDialogRoot.Props` *omits* `modal` and `disablePointerDismissal`). Use AlertDialog when the user **must** respond (docs subtitle: "A dialog that requires a user response to proceed") — destructive confirmations, unsaved-changes warnings. Use Dialog for everything dismissible. [E] This distinction is an acknowledged docs gap: issue #1687 "[dialog][docs] Document the difference(s) between `Dialog` and `AlertDialog`" (open) — the asker correctly reverse-engineered exactly the three differences above and asked for them to be stated.
- **vs Drawer**: "Drawer extends Dialog: It adds gesture support, snap points, and indent effects. If you don't need these, use Dialog instead" [E] (drawer `page.mdx` Usage guidelines). Drawer literally runs Dialog's root in `'drawer'` mode [E] (`useRenderDialogRoot.tsx`). Boundary = gestures/snap points, not visual position.
- **vs Popover**: Popover is **anchored** to its trigger (Positioner/anchor/collision machinery, non-modal by default); Dialog is page-level (no Positioner — #3596) and modal by default. If content should point at or flow from a specific element, use Popover; if it commands the whole page, Dialog. [I from API affordances; #3596 open confirms Dialog deliberately lacks anchored-positioning parts today.]
- **vs Toast**: passive, self-expiring notifications belong to Toast (which *does* have an imperative manager); dialogs are for content that waits for the user. [E] #2802 (atomiks): toasts "are usually always simple with a basic render structure", dialogs are unbounded — hence no `dialogManager`.
- **Don't build a `dialogManager.confirm()` abstraction**: rejected in #2802; teach handles + payloads instead [E].
- **Don't reach for Dialog when CSS suffices** [I]: a non-modal, non-focus-trapping inline panel is just markup; Dialog's value is focus/scroll/pointer management (library scope test, #2138/#2225).

## 5. Anatomy & composition

```jsx
<Dialog.Root>                 // state owner; no DOM
  <Dialog.Trigger />          // optional if opened via handle/controlled state
  <Dialog.Portal>             // REQUIRED wrapper for all floating parts (#1222)
    <Dialog.Backdrop />       // optional, presentation-only dimming layer
    <Dialog.Viewport>         // optional positioning/scroll container (#2808)
      <Dialog.Popup>          // the role="dialog" surface
        <Dialog.Title />      // optional but strongly recommended (labels)
        <Dialog.Description /> // optional (describes)
        <Dialog.Close />      // required inside popup for touch-SR escape when modal (JSDoc on `modal`)
      </Dialog.Popup>
    </Dialog.Viewport>
  </Dialog.Portal>
</Dialog.Root>
```

- [E] `Portal` is mandatory for popup parts; missing it throws at render (library-wide decision, PR #1222); `keepMounted` lives on Portal.
- [E] `Viewport` (PR #2808, atomiks): "allows you to create a scrollable container for the popup with animation attributes on it to fade out content outside the popup (e.g. a close button, scrollbars). `Backdrop` remains a sibling for independent animation/layout." The same PR moved the `InternalBackdrop` into `Portal` *before* the user's Backdrop "so hover styles on user backdrops work" (closes #2940).
- [E] Backdrop auto-suppression when nested: `enabled: forceRender || !nested` (`DialogBackdrop.tsx`) — "Backdrops of the child dialogs won't be rendered so that you can present the parent dialog in a clean way" (`page.mdx`); `forceRender` opts back in (PR #2037).
- [E] Handle pattern: `const h = Dialog.createHandle()` → pass to `<Dialog.Trigger handle={h}>` anywhere in the app and `<Dialog.Root handle={h}>`; triggers may also live inside Root without a handle; multiple triggers per dialog either way (docs "Detached triggers"/"Multiple triggers").
- [E] Root children can be a **function** `({ payload }) => …` rendering per-trigger content (docs "Multiple triggers"; `PayloadChildRenderFunction`).
- [E] Elements visually "outside" the popup (e.g. a floating close button) must stay **inside `Dialog.Popup`** for tab order and SR announcement; Popup gets `pointer-events: none` + inner content `pointer-events: auto` (docs "Placing elements outside the popup", `uncontained` demo).
- **Anatomy-diagram spec**: (1) Trigger button → (2) Backdrop covering page → (3) Viewport (dashed, scroll arrow) → (4) Popup card → (5) Title, (6) Description, (7) Close in card corner → (8) detached Trigger + handle wire to Root → (9) portal arrow from app root to `<body>`.

## 6. Behavior ("How it works")

- **State tiers**: uncontrolled (`defaultOpen`) → controlled (`open` + `onOpenChange`) → handle-imperative (`handle.open(triggerId)/openWithPayload/close`) [E] (docs State + Detached triggers; #2974). With multiple triggers in controlled mode you must also manage `triggerId` on Root + `id` on each Trigger; "there is no separate `onTriggerIdChange`" — read `eventDetails.trigger` instead [E] (`page.mdx`).
- **Close reasons** (`DialogRoot.ChangeEventReason`): `trigger-press`, `outside-press`, `escape-key`, `close-press`, `focus-out`, `imperative-action`, `none` [E] (`DialogRoot.tsx`). `eventDetails.cancel()` vetoes a change while staying uncontrolled; Esc propagation stopping is customizable via `allowPropagation()` (handbook customization page).
- **Dismissal**: outside press closes only the **topmost** dialog and only via the dialog's *owning* backdrop when modal — deliberately supporting multiple simultaneously-open, non-nested modal dialogs (issue #1320 → PR #1327; logic in `useDialogRoot.ts` cites #1320). Dismissal fires on `click`, not `mousedown` ("intentional" press; PR #2275), with sloppy-vs-intentional handling for touch and `trap-focus` (`useDialogRoot.ts`); multi-touch taps are filtered (PR #5096). Esc handled only by the topmost dialog (`escapeKey: isTopmost`).
- **Focus**: when open, focus moves to the first tabbable element inside the popup — except touch-opened dialogs focus the popup itself "to avoid opening the virtual keyboard" [E] (JSDoc `initialFocus`); focus is trapped/looped whenever `modal` is `true` or `'trap-focus'` (`FloatingFocusManager modal={modal !== false}`); on close, focus returns to the trigger or previously focused element (`finalFocus` default). Focus restores to the popup if the focused element is removed (PR #2479) or hidden by CSS (PR #3313).
- **Non-modal (`modal={false}`)**: no trap, no scroll lock, page interactive; focus-out can close it (`disablePointerDismissal` "also prevents the dialog from closing when focus moves outside of it" [E] JSDoc); Esc from an inactive detached trigger still closes (test).
- **Scroll lock**: only when `modal === true` — `useScrollLock(open && modal === true)` [E] (`useDialogRoot.ts`). iOS scroll locking is a known minefield: #1893 (atomiks self-filed; "we may need to document it"); PR #1735 lets the document slide inputs into view when the iOS keyboard opens; iOS 26+ Safari needs `position: absolute` backdrops + `body { position: relative }` (quick-start docs).
- **Mount/unmount + animation**: popup unmounts on close by default; `keepMounted` (Portal) keeps it; transition attributes `data-open/closed/starting-style/ending-style` + `transitionStatus` state; `onOpenChangeComplete` fires after animations settle; `actionsRef.current.unmount()` for JS-animation-controlled unmounting and `actionsRef.current.close()` for imperative close [E] (JSDoc; handbook animation). `eventDetails.preventUnmountOnClose()` keeps it mounted while an external close animation plays [E] (`DialogRoot.ChangeEventDetails`; `popupStoreUtils.ts`).
- **Nesting**: parent tracks open descendants (`nestedOpenDialogCount` → `--nested-dialogs` CSS var + `data-nested-dialog-open`); counts cross dialog/alert-dialog types (tests) and drawers are counted separately (#4493). Nested popups (Menu/Select inside Dialog) don't dismiss the dialog when dismissed outside themselves (tests).
- **SSR**: rendering an initially open dialog on the server is not supported today — issue #3326 (open, `waiting for 👍`) [E]. Root store creation is client-safe (#3241 "Do not use client-side code in stores").

## 7. Accessibility contract

APG pattern: [Dialog (Modal)](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) — cited in the founding issue #215 [E].

**Keyboard** (from `FloatingFocusManager` behavior + tests):

| Key | Behavior |
| --- | --- |
| `Tab` / `Shift+Tab` | Moves through tabbables inside the popup; **loops** (trapped) when `modal` is `true` or `'trap-focus'`; can leave the popup when `modal={false}` (leaving may close it via `focus-out` unless `disablePointerDismissal`) |
| `Esc` | Closes the topmost open dialog only (reason `escape-key`); propagation to parent popups stopped by default |
| `Enter`/`Space` on Trigger/Close | Native button activation (parts render real `<button>`s; `nativeButton` adapts when re-rendered) |
| Composite keys (arrows etc.) inside popup | Stopped from propagating to wrapping composite widgets [E] (`DialogPopup.tsx` `COMPOSITE_KEYS` handler) |

**ARIA wiring** [E] (source):
- Popup: `role="dialog"` (or `"alertdialog"` in AlertDialog mode), `aria-labelledby` ← `Dialog.Title` id, `aria-describedby` ← `Dialog.Description` id (auto-generated, `useSyncedValueWithCleanup`); missing Title/Description simply omit the attributes — provide `aria-label` yourself if you skip Title [I].
- Trigger: `aria-haspopup="dialog"`, `aria-expanded`, `aria-controls` (per-trigger accurate with multiple/detached triggers — tests "synchronizes ARIA attributes on the active trigger").
- Backdrop/Viewport: `role="presentation"`.
- **No `aria-modal`** — deliberate: modal dialogs instead mark outside elements `aria-hidden`/inert, with an exception so `[aria-live]` regions (e.g. `Toast.Viewport`) keep announcing; atomiks in #4843: relying on `aria-modal` would let AT "treat live announcers outside the dialog as hidden" (w3c/aria#1854), and React Spectrum avoids it too due to a Safari bug. Issue open as a feature request.
- Focus guards: hidden `<span>`s are rendered around triggers/popups as "required a11y (touch screen-reader escape)" — they can break `:nth-child`/`space-x-*` CSS [E] (#3693, mj12albert/atomiks).
- Touch screen readers: "When `modal` is `true` or `'trap-focus'`, render `<Dialog.Close>` inside `<Dialog.Popup>` so touch screen readers can escape the popup" [E] (JSDoc on `modal`).

**Open a11y issues** (GOV.UK-style honesty):
- #4678 (open): modal marks background `aria-hidden` but doesn't remove focusable elements from tab order (aXe `aria_hidden_nontabbable` violation).
- #4843 (open): `aria-modal` feature request (see above).
- #4583 (open, bug): Esc closes multiple sibling dialogs when 3+ are open simultaneously.
- #3750 (open, `waiting for 👍`): allow designated outside elements to stay focusable while a modal dialog is open.
- #3905 (open, discussion): CloseWatcher / Android back-button support.

## 8. Prop-level guidance

- **`modal`** (Root, default `true`): the central decision. `true` = focus trap + scroll lock + pointer block (InternalBackdrop rendered); `false` = "user interaction with the rest of the document is allowed"; `'trap-focus'` = trap focus only, page still scrolls/clicks [E] (JSDoc; #1571). Use `false` for inspector/tool panels the user works alongside; `'trap-focus'` for keyboard-contained but visually non-blocking flows (e.g. Figma-style non-dismissible popups, #623). AlertDialog removes the choice.
- **`disablePointerDismissal`** (Root, default `false`): keep the dialog open on outside press (and, for non-modal, on focus-out). Renamed from `dismissible` in the beta-5 `disable*` convention sweep [E] (PR #3190, part of #3186–#3190). Use for forms where accidental backdrop clicks would lose input; pair with a close-confirmation pattern instead of trapping users [I from close-confirmation demo].
- **`onOpenChange(open, eventDetails)`**: read `eventDetails.reason` to branch (e.g. show confirmation only for `escape-key`/`outside-press`); `eventDetails.cancel()` to veto while uncontrolled (test: "cancel() prevents opening while uncontrolled"). Preferred over `useEffect`-watching [E] (`page.mdx` State section).
- **`onOpenChangeComplete(open)`**: run code after enter/exit animations finish (extensive test coverage incl. restarted/interrupted animations).
- **`actionsRef`**: `{ unmount, close }` — `unmount` after externally controlled exit animations; `close` for imperative close without a handle [E] (JSDoc). Escape hatch for the conditional-rendering pitfall (#2186).
- **`handle` + `Trigger.payload` + `triggerId`/`defaultTriggerId`**: the detached-trigger kit (#2974). `createHandle<P>()` types the payload; handle methods only work while a Root using the handle is mounted — early/late calls are ignored with a dev warning [E] (`DialogHandle.ts` JSDoc; docs "Detached triggers"). Payload is reactive: changes to the active trigger's `payload` re-render Root children [E] (PR #2974 body).
- **`Popup.initialFocus` / `Popup.finalFocus`**: `boolean | ref | (interactionType) => …` — steer focus per input type (`mouse`/`touch`/`pen`/`keyboard`); `false` = don't move focus [E] (JSDoc; functions landed PR #2536, boolean fallbacks PR #2599). Use `initialFocus` to focus the primary input of a form dialog; leave default for touch correctness.
- **`Portal.keepMounted`** (default `false`): keep closed dialog in DOM (JS animation libs, SEO-ish content); **`Portal.container`**: portal into a custom container — the interop fix when embedding inside third-party overlays (Radix/vaul drawers, #3725/#2854).
- **`Backdrop.forceRender`**: render a nested dialog's backdrop anyway (PR #2037).
- **Styling contract** (data attributes / CSS vars): Popup & Viewport & Backdrop: `data-open`, `data-closed`, `data-starting-style`, `data-ending-style`; Popup & Viewport additionally `data-nested`, `data-nested-dialog-open`; Popup CSS var `--nested-dialogs` (count) [E] (`*DataAttributes.ts`, `DialogPopupCssVars.ts`). Trigger: `data-popup-open`, `data-disabled`; Close: `data-disabled`. Style nested stacks with `[data-nested-dialog-open]` + `calc()` on `--nested-dialogs` (nested demo).

## 9. Decision log

- **2024-06-17 — born**: PR #372 (michaldudak) creates Dialog + AlertDialog against APG + Notion API doc (#215, colmtuite).
- **2024-12 — backdrop/modality rework**: #841 unifies backdrop implementation across popups; #1161 replaces `pointer-events: none` outside-marking with a portaled `InternalBackdrop` (Firefox/Safari perf + third-party-popup interop); #977 adds `reason` to `onOpenChange` and traps keyboard focus regardless of `modal` (per #623's focus/scroll/pointer decomposition); #1109 disables modality of closing dialogs.
- **2024-12 — nesting hooks**: #1140 `nested` style hook; #1144 `data-has-nested-dialogs`; #1167 fixes nesting of *different* dialog types; renamed to `data-nested-dialog-open` in #1686 (alpha.8).
- **2025-01 — multiple non-nested modals**: #1320 (aarongarciah) → PR #1327: outside-press closes only via the dialog's owning backdrop, so sibling modal dialogs coexist.
- **2025-01/04 — Portal required** (#1222, library-wide); **`modal="trap-focus"`** (#1571, closing #1554's `trap` proposal — the prop name `modal` survived but gained the third value); iOS keyboard input-slide (#1735).
- **2025-07/08 — dismissal & focus polish**: outside press on `click` not `mousedown` (#2275); touch outside-press improvements (#2334); `initialFocus`/`finalFocus` accept functions (#2536) then boolean fallbacks (#2599); focus restoration when active element removed (#2479).
- **2025-10 — store + Viewport + handles**: state moved to a store (#2834, enabler); `Viewport` part + scrollable demos + InternalBackdrop moved before user Backdrop fixing backdrop hover styles (#2808, closes #2800/#2940); **detached triggers + `createHandle` with imperative methods and reactive payload** (#2974, closes #2802 dialog-manager and #2069 RFC).
- **2025-11 — naming convention**: `dismissible` → `disablePointerDismissal` (#3190, beta.5 `disable*` sweep); alert-dialog re-exports dialog parts (#3237).
- **2025-12 → 2026 — hardening**: all root tests run in detached-trigger mode too (#3485); close-on-focusable-outside-press (#3380); Suspense update-depth fix (#3700); HMR-recreated handles (#4472); confirmation return-focus (#5024); root slimmed + default initial focus deduped (#5034); touch outside-press without backdrop (#5096); Root owns the store (#5109, dialog/alert-dialog/drawer together).

## 10. Pitfalls & FAQ

- **Conditionally rendering `Dialog.Popup` leaves the Portal stuck mounted** → unmount detection watches the popup's animations; conditionally render the whole portal tree, or drive unmount via `actionsRef` [E] (#2186, atomiks, open).
- **`z-index` fights inside/around dialogs** → don't set z-index on popups; if you must, it belongs on the positioned element, and third-party toasters must live **outside** the `isolation: isolate` root to layer above the backdrop [E] (#2450 select-in-dialog; #2938 sonner; #1935 react-toastify; setup rationale #2293).
- **Base UI popup inside a Radix/vaul drawer won't respond** → Radix sets `pointer-events: none` on `<body>`; portal into the drawer via `Portal container` [E] (#3725, #2854; maintainer LukasTy endorsed an interop FAQ).
- **Hidden focus-guard `<span>`s break `:nth-child` striping / Tailwind `space-x-*`** → required for touch-SR escape; don't write DOM-position-dependent CSS around triggers [E] (#3693).
- **Hover styles on a custom Backdrop don't apply** → fixed by #2808 (InternalBackdrop now renders beneath user backdrops); historically #2940.
- **`data-base-ui-inert` mutations outside the dialog surprise editors (ProseMirror/tiptap)** → outside-marking keeps extension popups usable and preserves `aria-live`; scoped to top-level nodes in #3955 [E] (#3950).
- **iOS scroll-lock glitches (collapsed navbar, focused inputs)** → known platform minefield; external ScrollLock workaround; largely fixed by iOS 26.4; docs callout still missing [E] (#1893 — atomiks: "we may need to document it").
- **Wanting `dialogManager.confirm()`** → use handles + payloads; manager rejected [E] (#2802).
- **Expecting SSR to render an open dialog** → not supported; portal content mounts client-side [E] (#3326 open).
- **Non-modal scroll-lock confusion**: scroll is locked only at `modal === true`; `'trap-focus'` and `false` never lock scroll [E] (source; #1571 PR body).
- **Clicking inside the popup fires wrapper `onClick`** (event propagation through portals) → React portals propagate through the React tree; stop propagation on the popup if needed [E] (#2312, open).
- **Payload not available in `onOpenChange`** → known limitation; workaround = read from handle/trigger state [E] (#4984, open, `has workaround`).

## 11. Real-world patterns observed

[G] **Pending Phase D** — `research/d-real-world-usage/dialog/` (candidates.json / ranked.json / examples.md) does not exist yet. Looked at `research/d-real-world-usage/_corpus/repos.json` (877 repos, built) and the raw code-search cache `_cache/code-import-baseui-react-dialog-p1.json`, which already shows the dominant archetypes to expect: shadcn-style `components/ui/dialog.tsx` wrapper modules (iurvish/uselayouts, KartikLabhshetwar/oneurl, DariusLukasukas/nextjs-weather-app…), **sheet/side-panel wrappers built on Dialog** (OperationCode/front-end `sheet.tsx`, turbostarter/loading-ui — confirming the "positioned Dialog as edge panel" guidance), and hand-rolled design-system modals (oxidecomputer/console `Modal.tsx`/`SideModal.tsx`). Update this section when Phase D lands.

## 12. Story plan

See [story-plan.md](./story-plan.md) — 22 planned stories: 8 kept docs demos, per-use-case behavior stories (modal spectrum, dismissal, focus, animation, nesting, handles/payloads, form integration), and 2 recreation placeholders pending Phase D.
