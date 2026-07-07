# Drawer — component research brief

Tier 1. Mined 2026-07-07 from source (`packages/react/src/drawer/`), docs (`docs/src/app/(docs)/react/components/drawer/page.mdx`), tests, git history (`[drawer]` scope), PR #3680 via `gh`, and the already-mined `b-library-principles/_mining/history.md` + `_clusters/overlays.md`. Evidence tags: [E] direct evidence, [I] inference, [G] gap.

**Read with the Dialog brief**: Drawer runs Dialog's root engine — `useRenderDialogRoot(props, mode)` with mode `'drawer'` [E] (documented in [dialog/brief.md](../dialog/brief.md) §1). This brief documents the **delta**: gestures, snap points, indent, sides, swipe styling contract, and the Preview→stable lifecycle. Focus/dismissal/portal/handle behavior that is identical to Dialog is cross-referenced, not repeated.

## 1. Identity

- **Name / subpath**: Drawer — `@base-ui/react/drawer`. Multi-part compound component exported as a namespace.
- **Parts** (from `index.parts.ts`, 15 element/provider parts + handle API — vs Dialog's 9):
  - `Drawer.Root` — "Groups all parts of the drawer." No DOM element.
  - `Drawer.Trigger` — "A button that opens the drawer." Re-export of `DialogTrigger` [E] (`DrawerTrigger.tsx`).
  - `Drawer.Portal` — "A portal element that moves the popup to a different part of the DOM." Re-export of `DialogPortal` [E].
  - `Drawer.Backdrop` — "An overlay displayed beneath the popup." Drawer-specific (carries `--drawer-swipe-progress`).
  - `Drawer.Viewport` — "A positioning container for the drawer popup that can be made scrollable." Drawer-specific; **required** (dev warning when Popup lacks it, PR #4495 "[drawer] Warn when popup is missing viewport").
  - `Drawer.Popup` — "A container for the drawer contents." The gesture surface; carries the swipe CSS vars.
  - `Drawer.Content` — "A container for the drawer contents." Marks the scrollable content region via `data-drawer-content` (`DRAWER_CONTENT_ATTRIBUTE`) so scrolling and swipe gestures can be disambiguated [E source, I on purpose — see §5].
  - `Drawer.Title` — "A heading that labels the drawer." Re-export of `DialogTitle` [E].
  - `Drawer.Description` — "A paragraph with additional information about the drawer." Re-export of `DialogDescription` [E].
  - `Drawer.Close` — "A button that closes the drawer." Re-export of `DialogClose` [E].
  - `Drawer.SwipeArea` — "An invisible area that listens for swipe gestures to **open** the drawer." Drawer-only concept (removed then restored in PR #4102).
  - `Drawer.Provider` — "Provides a shared context for coordinating global Drawer UI, such as indent/background effects based on whether any Drawer is open." No DOM element.
  - `Drawer.Indent` — "A wrapper element intended to contain your app's main UI. Applies `data-active` when any drawer within the nearest `<Drawer.Provider>` is open." (vaul-style body-scaling effect.)
  - `Drawer.IndentBackground` — "An element placed before `<Drawer.Indent>` to render a background layer that can be styled based on whether any drawer is open."
  - `Drawer.VirtualKeyboardProvider` — "Provides keyboard-aware focus and scroll handling for bottom-sheet drawers with form fields." (PR #4353.)
  - Non-element API: `Drawer.createHandle()` → `Drawer.Handle` — subclass of `DialogHandle` with a nominal type brand so Dialog/Drawer handles can't be swapped [E] (`handle.ts`).
- **Status**: stable since v1.3.0. Born 2026-02-13 as **`DrawerPreview`** (`export * as DrawerPreview from './index.parts'`, commit 5bbe076fd, PR #3680, v1.2.0); unmarked in PR #4293 (v1.3.0) as a formal breaking change [E] (`_mining/history.md` rows: "Preview unmarking as formal breaking changes"). The youngest stable overlay component.
- **Taxonomy**: overlays/popups cluster. Docs subtitle: "A panel that slides in from the edge of the screen" with "swipe-to-dismiss gestures" [E] (page.mdx via `_clusters/overlays.md`). Purpose: an edge-attached, gesture-driven Dialog — the touch-first member of the dialog family. IA: same page-level portal model as Dialog; adds a Provider/Indent layer that reaches *outside* the overlay into the app shell.

## 2. Intention

- [E] **Origin**: issue #38 "[drawer] Create the unstyled Drawer / Sheet component" — an RFC-style issue ("This is the place to gather ideas, measure interest and discuss the API and implementation details"), closed by PR #3680 "[drawer] Create new Drawer / Sheet component" (atomiks, merged 2026-02-13; body = "Closes #38" + checklist: nested drawer demo/logic/styling; background indent provider; text selection with swiping; momentum when swipe dismissing; snap points — the checklist IS the feature-scope statement).
- [E] **The vaul succession is explicit**: #38's "User requests" section quotes Reddit verbatim — "I beg you please copy Vaul, make your own swipe-able drawer with handle and snap points and make sure it's smooth on mobile because Vaul is practically deprecated" — and links shadcn-ui#9191, shadcn-ui#8455, vaul#630 as "people... looking for a way to move forward with Vaul". A private Notion "core Drawer" benchmarks doc is linked. Base UI's answer integrates gestures natively into its own Dialog engine instead of wrapping a third-party dialog (mode `'drawer'` in `useRenderDialogRoot`) [E source].
- [E] **Why Dialog wasn't enough** (pre-history in #38): michaldudak — Dialog "is already flexible enough to enable creating layouts such as mobile navigation on base-ui.com", but "We're not going to provide any animations out of the box — as the components are unstyled, we can only provide style hooks"; atomiks — "currently `Dialog` can create Drawer-like components with different styles, but there's no gesture support", and gestures would be "similar gestures that `Toast` has (`swipe-movement-x/y`)" — the swipe CSS-var naming lineage comes from Toast. colmtuite (2025): "We decided today to prioritise this. We'll likely begin working on it in late May."
- [E] **Boundary stated at birth**: "Drawer extends Dialog: it adds gesture support, snap points, and indent effects. If you don't need these, use Dialog instead." (drawer page.mdx Usage guidelines, stated symmetrically on the Dialog page.)
- [E] **Native-performance gestures are a design goal, not a nicety**: a sustained series of perf PRs — #4099 "Disable inheritance for swipe CSS vars" (`@property` registration), #4867 "Improve swipe dismiss drag performance", #4980 "Drive swipe gestures natively to stop per-frame re-rasterization" — show the team treats 60fps drag as core. The styling contract (CSS variables driven during drag) exists so user styles animate on the compositor rather than through React re-renders [I from the PR titles + contract shape].
- [E] **Touch-first, keyboard-safe**: `VirtualKeyboardProvider` (#4353) exists solely for the bottom-sheet-with-form-fields case on mobile keyboards; touch scrolling and text selection got dedicated fixes (#4382, #4104, #4187).
- [E] **Non-goals**: out-of-the-box animations ("we can only provide style hooks that you can use to create your own animations", michaldudak, #38); replacing positioned Dialogs — "A panel that slides in from the edge of the screen and doesn't need gesture support is a positioned Dialog" [E page.mdx]. [I] Parent-bound (absolute-positioned, `container`-portaled) drawers remain an unanswered #38 thread request (dartess's `positionMethod='fixed' | 'absolute'` ask).

## 3. When to use

- [E] Edge-of-screen panels **that need gestures**: swipe-to-dismiss, swipe-to-open (SwipeArea), snap points (page.mdx Usage guidelines; the boundary statement).
- [E] Mobile-first bottom sheets: the docs feature snap points, an iOS-bottom-bar-aware demo (#4870), and a "Mobile navigation" example (referenced in `_clusters/overlays.md` Popover-vs-Drawer note).
- [E] Bottom sheets containing forms on mobile: wrap in `Drawer.VirtualKeyboardProvider` for software-keyboard-aware focus/scroll (#4353; `--drawer-keyboard-inset` var).
- [E] vaul-style app-shell presentation: `Provider` + `Indent` + `IndentBackground` scale/inset the main UI behind an open drawer (`data-active` on Indent).
- [E] Nested drawer stacks (dedicated data attributes `data-nested-drawer-open` / `data-nested-drawer-swiping`, `--nested-drawers`, `--drawer-frontmost-height`; nesting isolated from Dialog stacks in #4493).
- [E] The docs example roster maps the sanctioned scenarios (page.mdx outline): State (un/controlled), Position (four `swipeDirection` values), Nested drawers, Snap points, Virtual keyboard aware, Indent effect, Non-modal, Mobile navigation, Swipe to open, Close confirmation, **Action sheet with separate destructive action**, Detached triggers, Stacking and animations.
- [I] The touch-first surface of the overlay family: "Drawer is the touch-first surface: swipe gestures, snap points" (`_clusters/overlays.md` row 8, itself [E] to page.mdx).

## 4. When not to use + alternatives

Cluster-level comparison: [research/c-components/_clusters/overlays.md](../_clusters/overlays.md) — see especially the "Dialog vs Drawer — gestures" and "Popover vs Drawer" entries. Drawer-specific boundary:

- **vs Dialog** [E]: "Drawer extends Dialog: it adds gesture support, snap points, and indent effects. If you don't need these, use Dialog instead. A panel that slides in from the edge of the screen and doesn't need gesture support is a positioned Dialog." (Stated symmetrically on both docs pages — the only symmetric pair-boundary statement in the docs.) The boundary is **gestures, not visual position**.
- **vs Popover** [I]: both hold real interactive content, but Popover is anchored to its trigger; Drawer is edge-attached and page-scoped. A desktop popover often becomes a mobile drawer (cluster note; Drawer's mobile-navigation example).
- **vs AlertDialog** [I]: Drawer's swipe-to-dismiss is the opposite of AlertDialog's "no light dismiss" contract; never present a required-response flow as a swipeable sheet.
- **Don't reach for vaul + Base UI Dialog together** [E]: vaul sets `pointer-events: none` on `<body>` and breaks embedded Base UI popups (#3725/#2854, documented in the dialog brief §10); the native Drawer removes the need for that interop.

## 5. Anatomy & composition

Official anatomy (page.mdx — note Root nests **inside** Indent, so the app UI and its drawers share the indent wrapper):

```jsx
<Drawer.Provider>                   // optional app-shell coordinator (indent effects)
  <Drawer.IndentBackground />       // optional, placed before Indent: styleable background layer
  <Drawer.Indent>                   // optional wrapper for your app's main UI; [data-active] when a drawer is open
    <Drawer.Root>                   // state owner; no DOM
      <Drawer.Trigger />            // optional (handle/controlled also work) — Dialog re-export
      <Drawer.SwipeArea />          // optional invisible edge strip: swipe to OPEN
      <Drawer.Portal>               // REQUIRED wrapper for floating parts (inherited rule)
        <Drawer.Backdrop />         // optional; carries --drawer-swipe-progress for gesture-linked fades
        <Drawer.Viewport>           // REQUIRED positioning container (dev warning if missing, #4495)
          <Drawer.Popup>            // the role="dialog" gesture surface; swipe CSS vars live here
            <Drawer.Content>       // content region; mouse text selection without swipe interference
              <Drawer.Title />      // optional but recommended (labels)
              <Drawer.Description /> // optional (describes)
              <Drawer.Close />      // recommended visible close (gesture alternative) — Dialog re-export
            </Drawer.Content>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  </Drawer.Indent>
</Drawer.Provider>
```

- [E] Five parts are literal Dialog re-exports (Trigger, Portal, Title, Description, Close) — the delta parts are Backdrop/Viewport/Popup (reimplemented for gestures) plus the seven drawer-only parts (Content, SwipeArea, Provider, Indent, IndentBackground, VirtualKeyboardProvider, Handle).
- [E] `Viewport` is effectively required: PR #4495 added a warning when Popup is rendered without it (unlike Dialog, where Viewport is optional).
- [E] `Content` (stamps `data-drawer-content`): "allows text selection of its children without swipe interference when using a mouse pointer" (page.mdx); for full opt-out, "add `data-base-ui-swipe-ignore` to a descendant when you need to opt that element out of swipe dismissal for all input types" (page.mdx; made explicit for touch in #4295).
- [E] `SwipeArea` is for opening: "An invisible area that listens for swipe gestures to open the drawer" (JSDoc); removed during preview and restored in #4102.
- [E] Provider/Indent/IndentBackground form an app-shell subsystem that lives **outside** the Root — coordination is global ("any drawer within the nearest `<Drawer.Provider>`", Indent JSDoc).
- **Anatomy-diagram spec**: (1) app UI wrapped in Indent, (2) IndentBackground behind it, (3) Trigger, (4) invisible SwipeArea strip at screen edge, (5) Backdrop, (6) Viewport region, (7) Popup sheet sliding from edge with grabber, (8) Content scroll region containing (9) Title, (10) Description, (11) Close, (12) portal arrow to `<body>`, (13) swipe arrow + `--drawer-swipe-*` callout.

## 6. Behavior ("How it works")

Inherited from Dialog (see [dialog/brief.md](../dialog/brief.md) §6): state tiers (uncontrolled → controlled → handle), close reasons + `eventDetails.cancel()`, topmost-only Esc/outside-press dismissal, focus trap and return-focus, scroll lock when modal, mount/unmount + `data-starting-style`/`data-ending-style` transitions, `onOpenChangeComplete`, `actionsRef`. Drawer delta:

- [E] **Side is a gesture concept, not a positioning one**: "Positioning is handled by your styles. `swipeDirection` defaults to `\"down\"` for bottom sheets. Use `\"up\"`, `\"left\"`, or `\"right\"` for other drawer positions" (page.mdx Position). `swipeDirection` is "the swipe direction used to dismiss the drawer" (JSDoc); `data-swipe-direction` reflects it on Popup and SwipeArea. There is no Positioner part — you place the panel with CSS, exactly like Dialog.
- [E] **Close reasons** (`DrawerRootChangeEventReason`, source): Dialog's set (`trigger-press`, `outside-press`, `escape-key`, `close-press`, `focus-out`, `imperative-action`, `none`) **plus `swipe` and `close-watcher`**. Swipe dismissal is vetoable like any other reason — `eventDetails.cancel()` on reason `swipe` keeps it open and "clears swipe-dismiss styles" (root tests).
- [E] **Android back gesture built in**: `DrawerProviderReporter` wires a `CloseWatcher` when the topmost drawer is open — source comment: "CloseWatcher enables the Android back gesture (Chromium-only). Keep this Android-only for now to avoid interfering with Escape/nesting semantics on desktop due to `useDismiss`." Notable delta: Dialog's CloseWatcher request (#3905) is still an open discussion, but Drawer ships it.
- [E] **Swipe-to-dismiss**: dragging the Popup past a **size-based threshold** (root test "uses a size-based swipe threshold") closes it (reason `swipe`); during drag the popup follows the pointer via `--drawer-swipe-movement-x/y`; release either springs back or commits (`data-swipe-dismiss` present when dismissed by swiping; `--drawer-swipe-strength` scales the release transition). Commit happens on primary-button release (#5057); interrupted swipes clean up (#4467); multi-grab flashing fixed (#5112); dismissal momentum was a launch checklist item (#3680).
- [E] **Swipe-to-open**: `SwipeArea` listens at the closed edge; reliability reworked in #5105.
- [E] **Snap points**: `snapPoints` array — "numbers between 0 and 1 represent fractions of the viewport height, numbers greater than 1 are treated as pixel values", strings support `px`/`rem` (JSDoc + page.mdx). Controlled via `snapPoint`/`defaultSnapPoint`/`onSnapPointChange(snapPoint, eventDetails)`; `--drawer-snap-point-offset` translates the popup (compose it with `--drawer-swipe-movement-y` in your transform, page.mdx); `data-expanded` marks the full-height snap point. Velocity-based point skipping is on by default; `snapToSequentialPoints` disables it "so the snap target is determined by drag distance". Tests: snap point resets when closing, resets to the default when provided, emits event details, and does **not** reset when a close is canceled; low-velocity swipes near a snap point keep the drawer open.
- [E] **Gesture engine is native, not React**: drag updates are driven outside React to avoid per-frame re-rasterization (#4980); swipe CSS vars are registered with `@property` and non-inheriting for perf (#4099); cross-axis scrolling preserved mid-gesture (#4187); text selection during drags handled (#4104).
- [E] **Controlled-mode guard**: swiping cannot dismiss a controlled drawer that the owner didn't close (#4133 "Prevent dismiss through swipe when the component is controlled").
- [E] **Nesting**: parent drawers track child drawers separately from dialogs (#4493); parent gets `data-nested-drawer-open`/`data-nested-drawer-swiping` + `--nested-drawers` + `--drawer-frontmost-height` (border included since #4202) for vaul-style stacked-card presentation.
- [E] **Virtual keyboard**: `VirtualKeyboardProvider` exposes `--drawer-keyboard-inset` on Viewport, "measured from the bottom edge of the layout viewport. Present only when the drawer is wrapped in `Drawer.VirtualKeyboardProvider`" (CssVars JSDoc) so a bottom sheet can rise above the software keyboard.
- [E] **React 17 supported** after #4178; SSR: same client-mount model as Dialog [I inherited].

## 7. Accessibility contract

APG pattern: [Dialog (Modal)](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) — the drawer is a modal dialog with a gesture skin; there is no APG "drawer/sheet" pattern [I taxonomy; role wiring is [E] inherited from `useRenderDialogRoot` mode `'drawer'`].

**Keyboard** — identical to Dialog's table (dialog/brief.md §7): Tab/Shift+Tab trapped and looping while modal; Esc closes the topmost drawer (`escape-key` reason); Enter/Space activate the real-`<button>` Trigger/Close. Gestures add **no keyboard surface**: snap points and swipe have no arrow-key equivalent [E from props/tests — no key handling in gesture code; see honesty note below].

**ARIA wiring** [E inherited]: Popup `role="dialog"` + `aria-labelledby`/`aria-describedby` auto-wired from Title/Description; Trigger `aria-haspopup="dialog"`, `aria-expanded`, `aria-controls`; Backdrop/Viewport presentational; no `aria-modal` (deliberate, dialog brief §7); outside content inert-marked with `aria-live` exception.

**Gesture honesty** (GOV.UK-style):
- Swipe-to-dismiss is pointer-only. Keyboard and screen-reader users need the inherited affordances: a visible `Drawer.Close`, Esc, and (when modal) the touch-SR escape guards. Render `Drawer.Close` inside the popup — same rule as Dialog's `modal` JSDoc [E inherited].
- The Android back gesture closes the topmost drawer via `CloseWatcher` (Chromium-only) — a platform-convention affordance Dialog does not have [E source + root test "closes when CloseWatcher emits a close event"].
- Snap-point changes are visual state only; no announcement is made when the sheet moves between detents [I from source — no live region in snap code; mark for doc guidance].
- `SwipeArea` is an invisible pointer-only affordance; it must never be the sole way to open the drawer (pair with a Trigger) [I].
- Open a11y issues: the Dialog family issues apply verbatim (#4678 aria-hidden tabbables, #4843 aria-modal, #4583 multi-Esc). No drawer-specific open a11y issue found in `[drawer]`-scoped git/issue history [E search].

## 8. Prop-level guidance

Root props inherited from Dialog and identical in meaning: `defaultOpen`, `open`, `onOpenChange(open, eventDetails)`, `onOpenChangeComplete`, `actionsRef`, `handle`, `triggerId`/`defaultTriggerId`, `modal`, `disablePointerDismissal` — see dialog/brief.md §8. Drawer-specific decision props [E `DrawerRoot.tsx` props]:

- **`swipeDirection`** (default `'down'`): "the swipe direction used to dismiss the drawer" — pick per edge: `'down'` bottom sheet, `'up'` top sheet, `'left'`/`'right'` side sheets; your CSS does the actual positioning. Gesture axis and `data-swipe-direction` follow it.
- **`snapPoints`** (`DrawerSnapPoint[]`): 0–1 = viewport-height fractions, >1 = px, strings in `px`/`rem` (e.g. `['148px', 1]`, the docs example). Provide when a sheet should rest partially open. `data-expanded` styles the full-height detent; `--drawer-snap-point-offset` does the translation — compose your transform as `translateY(calc(var(--drawer-snap-point-offset) + var(--drawer-swipe-movement-y)))` (page.mdx).
- **`snapPoint` / `defaultSnapPoint` / `onSnapPointChange(snapPoint, eventDetails)`**: controlled/uncontrolled detent (`Drawer.Root.SnapPoint`, nullable). Use to programmatically expand (e.g. expand to full when a search input focuses) [I usage; API E]. Snap point auto-resets on close (tests).
- **`snapToSequentialPoints`** (default `false`): disable velocity-based skipping "so the snap target is determined by drag distance (you can still drag past multiple points)" [E page.mdx]. Use for tall multi-detent sheets where skipping feels jumpy [I].
- **To veto swipe-dismiss**: there is no `disableSwipeDismissal` prop — cancel in `onOpenChange` when `eventDetails.reason === 'swipe'` (`eventDetails.cancel()`; swipe-dismiss styles are cleaned up, root tests) [E].
- **`Popup` styling contract** (`DrawerPopupCssVars.ts` / `DrawerPopupDataAttributes.ts`, complete):
  - CSS vars: `--drawer-height`; `--drawer-frontmost-height` (frontmost of the nested stack, border-inclusive #4202); `--nested-drawers` (count); `--drawer-swipe-movement-x` / `--drawer-swipe-movement-y` (live drag translation, CSS lengths); `--drawer-snap-point-offset`; `--drawer-swipe-strength` (scalar 0.1–1 "used to scale the swipe release transition duration").
  - Data attrs: `data-open`/`data-closed`/`data-starting-style`/`data-ending-style` (transition lifecycle, as Dialog); `data-expanded` (at full-height snap point); `data-swiping` (during drag — use to kill transitions so the popup tracks the finger); `data-swipe-direction` (`up|down|left|right`); `data-swipe-dismiss` (closed via swipe — style the exit differently); `data-nested-drawer-open` / `data-nested-drawer-swiping` (parent-of-stack styling).
- **`Backdrop`**: `--drawer-swipe-progress` (number) — THE gesture-linked styling hook: `opacity: calc(1 - var(--drawer-swipe-progress))` fades the backdrop as the user drags. Plus the four transition data attrs.
- **`Viewport`**: `data-nested` + transition attrs; `--drawer-keyboard-inset` (only under VirtualKeyboardProvider); forwards `style` since #4841.
- **`SwipeArea`**: `data-open`/`data-closed`/`data-disabled`/`data-swiping`/`data-swipe-direction`; size it with CSS (an invisible fixed strip at the drawer's edge).
- **Escape hatch**: `data-base-ui-swipe-ignore` on any element inside the popup opts it out of gesture capture (explicit for touch since #4295) — use on carousels/sliders/maps inside a sheet.

## 9. Decision log

- **Pre-history — the RFC**: issue #38 "[drawer] Create the unstyled Drawer / Sheet component" collects user demand (the "please copy Vaul… Vaul is practically deprecated" Reddit quote; shadcn-ui#9191/#8455; vaul#630) and design positions: no built-in animations (michaldudak), Toast-style `swipe-movement-x/y` gestures (atomiks). colmtuite: "We decided today to prioritise this. We'll likely begin working on it in late May [2025]." [E gh]
- **2026-02-13 — born as preview**: PR #3680 "[drawer] Create new Drawer / Sheet component" (atomiks), commit 5bbe076fd, closes #38; shipped in v1.2.0 as `DrawerPreview` under the post-1.0 preview-namespace convention. Launch checklist: nested drawers, background indent provider, text selection during swipes, dismissal momentum, snap points [E PR body + history.md].
- **2026-02/03 — preview-period churn** (breaking changes allowed while preview, history.md §Post-1.0): JSDoc standardization for Provider/Indent (#4075); swipe CSS vars made non-inheriting for perf (#4099); **SwipeArea removed then restored** (#4102 "Restore SwipeArea component"); touch selection (#4104); controlled-swipe dismissal guard (#4133); React 17 fix (#4178); cross-axis scroll preservation (#4187); frontmost-height includes border (#4202).
- **2026-03 — stable**: PR #4293 "Unmark Drawer preview" — v1.3.0, logged as a breaking change (`DrawerPreview` → `Drawer`) [E history.md]. Same release: `data-base-ui-swipe-ignore` made explicit for touch (#4295).
- **2026-04 — keyboard + isolation**: `VirtualKeyboardProvider` added (#4353); touch scroll in portaled popups (#4382); nested swipe cancel state (#4410); interrupted swipe cleanup (#4467); dialogs excluded from nested *drawer* stack (#4493); Viewport-missing warning (#4495).
- **2026-05/06 — perf + polish**: Viewport `style` forwarding (#4841); swipe drag perf (#4867); snap-points iOS bottom-bar paint fix in docs (#4870); **native gesture driving to stop per-frame re-rasterization** (#4980); close-confirmation docs example (#4600).
- **2026-06/07 — gesture correctness**: commit swipe on primary-button release (#5057); unreliable swipe-to-open fixed (#5105); popup flash on swipe-area re-grab fixed (#5112); Root owns the store (#5109, shared with dialog/alert-dialog).

## 10. Pitfalls & FAQ

- **Popup without Viewport** → gestures/positioning misbehave; the library now warns in dev. Always wrap Popup in `Drawer.Viewport` [E #4495].
- **Transitions fighting the finger** → if you transition `transform` unconditionally, the popup lags the drag. Gate transitions off while `[data-swiping]`, and compose transforms with `--drawer-swipe-movement-x/y` / `--drawer-snap-point-offset` [I from contract shape + docs demo CSS].
- **Interactive widgets inside the sheet capture the swipe** (sliders, carousels, maps) → mark them `data-base-ui-swipe-ignore` [E #4295].
- **Text selection or scrolling fights the swipe gesture** → wrap content in `Drawer.Content` ("allows text selection of its children without swipe interference when using a mouse pointer", page.mdx); touch scrolling inside portaled popups was specifically fixed (#4382) [E].
- **Controlled drawer "ignores" swipe-dismiss** → intentional: swipe cannot force-close a controlled drawer; close it in `onOpenChange` (reason-based) instead [E #4133].
- **Expecting the drawer to dodge the mobile keyboard by itself** → wrap in `Drawer.VirtualKeyboardProvider` and use `--drawer-keyboard-inset` [E #4353 + CssVars JSDoc].
- **Bare `var(--drawer-keyboard-inset)` breaks styles** → "the provider only sets `--drawer-keyboard-inset` while the keyboard is aligned, so a bare `var(--drawer-keyboard-inset)` is invalid before the first alignment and after cleanup" — always write `var(--drawer-keyboard-inset, 0px)` [E page.mdx].
- **Pinned footer input under the keyboard** → fixed-position footers must be positioned against the popup (its `transform` contains fixed descendants) and offset by the keyboard inset — the docs demo switches the focused footer to `position: fixed` [E page.mdx Virtual keyboard aware].
- **Nested drawer stack styled like nested dialogs** → drawers use their own counters (`--nested-drawers`, not `--nested-dialogs`); dialogs opened inside a drawer deliberately don't shift the drawer stack [E #4493].
- **Swipe-to-open feels flaky on some devices** → fixed in #5105 (and #5112 for re-grab flashing); require ≥ that version rather than adding user-land workarounds [E].
- **Assuming a11y comes from the gesture** → it doesn't; keep a visible Close and rely on the inherited Esc/focus contract (§7) [I, GOV.UK-style].
- **vaul interop hacks carried over** → not needed; the drawer is native to the dismissal/focus system (see dialog brief §10 vaul entries) [I].

## 11. Real-world patterns observed

[G] **Pending Phase D** — `research/d-real-world-usage/drawer/` does not exist yet (checked 2026-07-07; only select/dialog/menu/popover have ranked datasets per RESUME-PLAYBOOK §D). Expected archetypes to verify when D lands: shadcn-style `components/ui/drawer.tsx` wrappers migrating from vaul; mobile navigation sheets; filter/settings bottom sheets in dashboards; music-player-style snap-point sheets. Update this section when Phase D lands.

## 12. Story plan

See [story-plan.md](./story-plan.md) — 16 planned stories: kept docs demos (hero, snap points, indent, mobile nav), four-sides matrix, gesture-styling contract stories (swipe-progress backdrop fade, swiping-state transitions), keyboard/form coverage (virtual keyboard, close confirmation), nesting, and 2 recreation placeholders pending Phase D.
