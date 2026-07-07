# Toast — component research brief

Tier 1. Mined 2026-07-07 from source (`packages/react/src/toast/`), docs (`docs/src/app/(docs)/react/components/toast/page.mdx` + 8 demos), tests (12 test files incl. `store.test.ts`), the `experiments/toast.tsx` playground, git history (`[toast]` scope, 84 commits touching the directory), and upstream issues/PRs via `gh` (raw JSON cached in `research/d-real-world-usage/_cache/toast-*.json`). Evidence tags: [E] direct evidence, [I] inference, [G] gap. Issue/PR numbers are mui/base-ui.

## 1. Identity

- **Name / subpath**: Toast — `@base-ui/react/toast`. Multi-part compound component exported as a namespace, **plus two non-element APIs that are part of the anatomy**: `Toast.useToastManager()` (hook) and `Toast.createToastManager()` (factory for use outside React) [E] `index.parts.ts`.
- **Parts** (from `index.parts.ts`, JSDoc one-liners from each part file):
  - `Toast.Provider` — "Provides a context for creating and managing toasts." Renders no HTML element; owns the `ToastStore` (timers, stack order, hover/focus state).
  - `Toast.Portal` — "A portal element that moves the viewport to a different part of the DOM. By default, the portal element is appended to `<body>`."
  - `Toast.Viewport` — "A container viewport for toasts." Renders `<div>`; `role="region"`, `aria-label="Notifications"`, and is itself the polite **live region** (`aria-live="polite"`); the F6 focus target.
  - `Toast.Root` — "Groups all parts of an individual toast." Renders `<div>`; `role="dialog"` (or `"alertdialog"` for `priority: 'high'`), `tabIndex={0}`; hosts the swipe engine.
  - `Toast.Content` — "A container for the contents of a toast." Renders `<div>`; measures height (Resize/MutationObserver) and carries `data-behind`/`data-expanded` for stacked-fade styling. Added later for variable-height stacking (#2742).
  - `Toast.Title` — "A title that labels the toast." Renders `<h2>`; defaults its children to `toast.title`; wires `aria-labelledby`; renders nothing without content.
  - `Toast.Description` — "A description that describes the toast. Can be used as the default message for the toast when no title is provided." Renders `<p>`; defaults to `toast.description`; wires `aria-describedby`; conditional render.
  - `Toast.Action` — "Performs an action when clicked." Renders `<button>`; children/props default from `toast.actionProps`; renders nothing without content.
  - `Toast.Close` — "Closes the toast when clicked." Renders `<button>`; `aria-hidden` while the viewport is neither expanded nor focused (announcement de-noising, #2246 follow-up).
  - `Toast.Positioner` — "Positions the toast against the anchor." Renders `<div>`; full anchored-positioning surface (side/align/offsets/collision), for anchored toasts only (#3096).
  - `Toast.Arrow` — "Displays an element pointing toward the toast's anchor." Renders `<div>`; anchored toasts only.
- **Status**: stable. Introduced 2025-04-08 (PR #1467, released in v1.0.0-alpha.8) [E] history mining; never carried a Preview tag.
- **Taxonomy**: overlays/popups cluster — but the **outlier** of the cluster (see `../_clusters/overlays.md`): the only overlay with no Trigger part and no `open`/`onOpenChange`; state is an app-managed queue, not a boolean. Purpose: transient, non-interrupting status notifications. IA: a self-managing stack rendered once (usually app-wide), fed imperatively from anywhere.

## 2. Intention

- [E] **Origin**: issue #220 "[toast] Implement Toast" (colmtuite, body just "API TBD") closed by PR #1467 "[toast] Create new Toast component" (atomiks, merged 2025-04-08). The PR checklist states the design goals directly: "Refine `Toast` interface/props APIs / Ability to swipe / Ability to stack / Global queue / Docs with animated examples / Tests" — swipe gestures, sonner-style stacking, and a global imperative queue were first-class goals from day one.
- [E] **Sonner is the explicit benchmark**: #1955 (atomiks) links Emil Kowalski's CSS-transforms article for the stacking model; oliviertassinari: "I was curious to see if Sonner already supported this. Yes, they do … So no edge, but definitely a must-have." #3979's close-all API shape cites "other libraries such as Sonner and Chakra expose the same behavior through a single `dismiss` API". [I] The intention is a headless sonner: match its UX ceiling (stacking, expand, swipe, promise) while exposing every element and style hook.
- [E] **The imperative manager is deliberate and toast-specific**: when #2802 asked for the same pattern for dialogs, atomiks declined and drew the boundary: "Dialogs can range from simple to really complex, while toasts are usually always simple with a basic render structure, where the hook to pass the data payload works well" — hence Toast gets a manager and Dialog gets handles. He also names the trade-off honestly: imperative APIs close over variables so they can be stale in event handlers — "Toast has this issue but generally the API's ergonomics outweigh this downside" (#2802). Toast is the only Base UI component whose canonical API is a method call (`toastManager.add(...)`), not a trigger.
- [E] **Naming decision**: the hook was `useToast` in the PR; michaldudak objected ("It feels a bit off to call `useToast` and receive functions that operate on the whole collection"); atomiks proposed `useToastManager` "to match the Global API" — adopted (#1467 review thread).
- [E] **Announcement architecture is the a11y core**: #2246 (atomiks) rebuilt it — the per-toast visually-hidden announcer with a 50ms macOS-Safari delay hack was replaced by making `Toast.Viewport` itself the polite announce container, with high-priority toasts rendered into a separate visually hidden `role="alert"` container "as they can receive `role='alert'` when dynamically rendered and avoid being announced multiple times".
- [E] **Toasts must never steal focus** (explicit non-goal): PR #4533 adding a `focus` option to `add()` was rejected — "Toasts are used to notify users without interrupting their workflow, and moving the focus to a toast is not desired. In scenarios when users' input is required, AlertDialog is better suited" (aarongarciah), citing the APG Alert pattern's "it is crucial they do not affect keyboard focus".
- [E] **Anchored toasts extend the intention to contextual feedback**: #3026 (mnajdova) → #3096 (atomiks) added Positioner/Arrow so a toast can appear next to e.g. a copy button; the tooltip docs canonize it: "Use the Toast component's anchoring ability … to ensure the message is announced to screen readers" (tooltip page.mdx "Contextual feedback messages").
- [I] Heart of the intention: **a notification system, not a popup** — Base UI manages the queue, timers, stacking geometry, gestures, and screen-reader announcements; you own 100% of the rendering via the mapped `toasts` array (inferred from #1467 goals + the manager/renderer split in every demo).

## 3. When to use

- [E] Transient confirmations and status messages that must not interrupt work — "Toasts are used to notify users without interrupting their workflow" (#4533, aarongarciah).
- [E] Async operation progress: the `promise` method models loading → success/error as one updating toast (docs "Promise"; `type: 'loading'` never auto-dismisses, `store.ts`).
- [E] Undoable actions: `actionProps` renders an action button inside the toast (docs "Undo action" demo: delete → "Undo" button closes the toast and reverts).
- [E] Contextual "Copied"-style feedback anchored to the triggering element (anchored toasts, #3096; recommended over tooltips for feedback because toasts are announced — tooltip page.mdx).
- [E] Notifying from outside React (API clients, websocket handlers, route loaders): `createToastManager()` + `<Toast.Provider toastManager>` — "queue a toast from anywhere in the app (such as in functions outside the React tree)" (page.mdx "Global manager").
- [E] Deduplicated repeat events: `add({ id })` upserts and refreshes the timer; `updateKey` lets a renderer replay a pulse animation (#4228 → #4440; docs "Deduplicated toast").

## 4. When not to use + alternatives

Cluster comparison: [research/c-components/_clusters/overlays.md](../_clusters/overlays.md) (Toast boundary appended there). Toast-specific reasoning:

- **vs Alert Dialog** — if the user *must* respond or the message blocks progress, use AlertDialog: focus never moves to a toast (#4533 rejection), so any required decision inside one is unreachable-by-default for keyboard/SR users (#4253 confirms the failure mode). "In scenarios when users' input is required, AlertDialog is better suited" [E] #4533.
- **vs Tooltip / Popover** — a tooltip is a hover hint about a control; a toast is feedback about an *event*. The tooltip page's "Alternatives" section routes "contextual feedback messages" to anchored Toast because tooltips are sighted-only and not announced [E] tooltip page.mdx.
- **vs inline status text / Field.Error** — [I] validation and form errors belong next to the field (Field/Form docs pattern); a toast disappears and is not tied to the control. GitHub Primer *discourages toasts entirely* for such content — cited by the maintainers' own a11y-guide issue [E] #4229 (oliviertassinari links primer.style's "accessible notifications" guidance as the example to learn from).
- **vs Dialog manager** — don't build `toastManager`-style imperative confirm dialogs; that was explicitly rejected (#2802); dialogs use `createHandle()`.
- **Persistent/critical information** — [E] auto-dismissing UI is a WCAG 2.2.1 (Timing Adjustable) risk; grace-snow (#4253): docs should recommend app-level settings to extend/disable timeouts, or "on-screen messages instead of a toast". Use `timeout: 0` + `Toast.Close` at minimum, or different UI entirely.
- **One provider per stack style** — anchored and stacked toasts "should be rendered in a separate `<Toast.Provider>` from stacked toasts" [E] page.mdx (anchored section); providers are isolated (test: "keeps multiple providers isolated").

## 5. Anatomy & composition

```jsx
<Toast.Provider timeout={5000} limit={3} toastManager={optional}>
  {/* app … anywhere below, useToastManager() can add toasts */}
  <Toast.Portal>                     // appends viewport to <body>
    <Toast.Viewport>                 // region + polite live region + F6 target; hover/focus = "expanded"
      {toasts.map((toast) => (       // YOU render the stack from useToastManager().toasts
        <Toast.Root key={toast.id} toast={toast}>  // dialog/alertdialog; swipe engine; --toast-* vars
          <Toast.Content>            // height measurement; overflow clipping when collapsed
            <Toast.Title />          // <h2>, defaults to toast.title
            <Toast.Description />    // <p>, defaults to toast.description
            <Toast.Action />         // <button>, from toast.actionProps
            <Toast.Close />          // <button>, closes this toast
          </Toast.Content>
        </Toast.Root>
      ))}
      {/* anchored variant: wrap Root in a Positioner keyed by toast */}
      <Toast.Positioner toast={toast}>
        <Toast.Root toast={toast}>
          <Toast.Arrow />
          …
        </Toast.Root>
      </Toast.Positioner>
    </Toast.Viewport>
  </Toast.Portal>
</Toast.Provider>
```

- [E] The render loop is user-owned: every demo maps `useToastManager().toasts` to `Toast.Root` — there is no automatic renderer. `Toast.Root` requires the `toast` object prop (page.mdx anatomy; hero demo).
- [E] Provider placement: "can be wrapped around your entire app, ensuring all toasts are rendered in the same viewport" (page.mdx "General usage").
- [E] Title/Description/Action are self-erasing: they render `null` without content, so one generic renderer serves all toast shapes (part sources; tests "does not render if it has no children").
- [E] Content exists for stacking mechanics: it measures natural height (ResizeObserver + MutationObserver → `recalculateHeight`, `flushSync` to avoid flicker) and hides overflow of taller toasts behind the front one (`data-behind`) (#2742; ToastContent.tsx). [I] Optional for non-stacked or always-expanded designs.
- [E] Positioner wraps Root (not the reverse) and reads positioning config either from its own props or from `toast.positionerProps` supplied at `add()` time; `anchor` must be an Element (ToastPositioner.tsx). Anchored toasts ignore `swipeDirection` entirely (ToastRoot.tsx: `isAnchored` → no swipe).
- Visual-diagram spec: (1) Viewport pinned to a screen corner → (2) stack of Roots, index 0 frontmost, others peeking behind at reduced scale → (3) callouts inside the front toast: Title, Description, Action, Close → (4) expanded state: toasts fan out vertically by `--toast-offset-y` → (5) side panel: an anchored toast above a "Copy" button with Arrow.

## 6. Behavior ("How it works")

- **Imperative manager pattern (not trigger pattern)**: state is an array of `ToastObject`s in a store owned by Provider. `useToastManager()` returns `{ toasts, add, update, close, promise }`; `add()` returns the generated (or passed) id [E] useToastManager.ts. `createToastManager()` returns the same methods minus `toasts` and forwards events to the Provider via a private `' subscribe'` channel [E] createToastManager.ts; page.mdx.
- **Timers**: default `timeout` 5000ms from Provider, per-toast override in `add`; `0` disables auto-dismiss; `type: 'loading'` never gets a timer [E] store.ts. Timers **pause** while: hovering the viewport, viewport/toast has focus-visible focus, or the window is blurred (`expandedOrOutOfFocus`); they resume with remaining time on leave/blur-out/window refocus [E] store.ts `pauseTimers`/`resumeTimers`; #4438 fixed resume-after-refocus. New toasts created while paused start paused. Updating a toast reschedules its timer when timeout changes, is explicitly re-passed, was `loading`, or upserted (#3564, #4440).
- **Stacking**: newest toast is index 0 (front). Store computes `domIndex`, `visibleIndex` (ending toasts excluded), and cumulative `offsetY` from measured heights; exposed as `--toast-index`, `--toast-offset-y`, `--toast-height` (Root) and `--toast-frontmost-height` (Viewport). `expanded = hovering || focused` → `data-expanded` on Viewport/Root/Content; all layout (position, fan-out, peek, scale) is user CSS on these hooks [E] page.mdx "Stacking and animations"; store.ts selectors.
- **`limit`** (default 3): overflowing older toasts are *not removed* — they get `limited: true`, `data-limited`, and HTML `inert`, and return into view when newer ones close [E] #1953 ("Limited toasts were previously removed from the DOM and 'lost to the ether'"); ToastProvider.tsx JSDoc.
- **Dismissal paths**: timeout; `Toast.Close`; `close(id)`; `close()` closes all (#3979); Escape when focus is inside the toast; swipe past 40px threshold in an allowed `swipeDirection` (default `['down','right']`). Swipe has axis-locking, damped off-axis movement, and change-of-mind cancellation (reverse ≥10px cancels) [E] ToastRoot.tsx constants/handlers. `data-base-ui-swipe-ignore` opts an element out of swipe; interactive elements (button/a/input/textarea/[role=button]) are auto-ignored [E] page.mdx; ToastRoot.tsx.
- **Lifecycle callbacks**: `onClose` fires when closing starts; `onRemove` fires after exit animations complete and the toast leaves the array [E] useToastManager.ts JSDoc; duplicate `onClose` for already-ending toasts prevented in #4280.
- **Animation**: `toast.transitionStatus` (`starting`/`ending`) maps to `data-starting-style`/`data-ending-style`; removal from the DOM waits for animations via `useOpenChangeComplete` (ToastRoot.tsx). Swipe dismissal exposes `data-swipe-direction` + frozen `--toast-swipe-movement-x/y` so the exit animation continues from the release point (#2769).
- **`promise(promise, { loading, success, error })`**: creates a `type: 'loading'` toast, updates it to `type: 'success'`/`'error'` (functions receive the resolution/rejection value), then normal timers apply; returns the (chained) promise, **not** an id (#2833 — pass your own `id` to address it). A toast dismissed while pending won't reopen on settle (#4040).
- **Upsert/dedup**: `add({ id: existing })` updates in place, refreshes the timer, and increments `updateKey` (replay animations from it); an ending toast with that id is replaced fresh (#4440; useToastManager.test.tsx).
- **Controlled/uncontrolled**: no controlled mode exists — the manager *is* the state API [I from API surface; no `open`/`value` props anywhere].
- **SSR**: all parts are `'use client'`; toasts are runtime state so nothing renders on the server. A react-router v7 SSR crash was env-detection, fixed (#2287/#2273).

## 7. Accessibility contract

**No dedicated W3C APG "toast" pattern exists.** Maintainers anchor the behavior to the APG **Alert pattern** (https://www.w3.org/WAI/ARIA/apg/patterns/alert/) — quoted verbatim in #4533 and #4253 replies — while the focusable container uses dialog semantics so keyboard users can enter and operate it. State this honestly in docs.

- **Roles**: Viewport = `role="region"` + `aria-label="Notifications"` (static label — dynamic ones were double-announced by Safari/Firefox, #2246 thread) and `aria-live="polite"`, `aria-atomic="false"`, `aria-relevant="additions text"`. Root = `role="dialog"` (`priority: 'low'`, default) or `role="alertdialog"` (`priority: 'high'`), `aria-modal={false}`, labelled/described by Title/Description ids [E] ToastViewport.tsx / ToastRoot.tsx.
- **Announcements**: low-priority toasts announce politely via the Viewport live region (which announces inserted DOM content). High-priority toasts render `title` + `description` strings into a separate visually hidden `role="alert"` container next to the viewport, and the Root is `aria-hidden` while unfocused to prevent double announcement [E] #2246; ToastViewport.tsx. Docs warning worth keeping: for high-priority toasts "screen readers do not announce any extra content rendered inside `<Toast.Root>` … unless they intentionally navigate to the toast viewport" [E] page.mdx.
- **Announcing over modals**: Base UI's dialog `aria-hidden` outside-marking deliberately exempts `[aria-live]` elements, "so announcers like `<Toast.Viewport>` can continue to announce while a dialog is open"; this is why maintainers resist `aria-modal` [E] #4843 (atomiks; w3c/aria#1854). Pinned by tests: "toasts in dialogs are accessible and not aria-hidden" (useToastManager.test.tsx "in dialog").
- **Keyboard interaction table** [E] ToastViewport.tsx/ToastRoot.tsx + viewport tests:

| Key | Context | Result |
|---|---|---|
| F6 | anywhere in the window | Focus the viewport (records previously focused element, pauses timers, expands stack) |
| Tab | viewport focused | Focus the first non-ending, non-limited toast |
| Tab | inside a toast | Next focusable inside the toast/stack; FocusGuards return focus to the app after the last |
| Shift+Tab | viewport or first toast | Return focus to the previously focused element; resume timers |
| Escape | focus inside a toast | Close that toast; focus moves to the next/previous toast, else back to the previous element |
| Enter/Space | on `Toast.Action`/`Toast.Close` | Activate (standard buttons via `useButton`) |

  [I] There is no arrow-key navigation between toasts (tab-based only) — no roving-focus code in source.
- **Focus policy**: opening a toast never moves focus (rejected `focus` option, #4533). Closing a *focused* toast hands focus to the nearest surviving toast or back to `prevFocusElement` (store `handleFocusManagement`). `Toast.Close` is `aria-hidden` unless the viewport is expanded/focused, after michaldudak heard "Loading data. Close. Close." (#2246 thread).
- **Timing mitigations**: hover, focus-visible focus, and window blur all pause timers (WCAG 2.2.1-relevant); expanded state keeps content readable. Touch outside the viewport resumes/collapses (store.handleDocumentPointerDown).
- **Known open issues (GOV.UK-style honesty)**: #4253 (open) — keyboard/SR users can't reach an Undo action before dismissal; maintainer position: focus-move is wrong, pair important actions with long/infinite timeouts, and docs should cover 2.2.1 strategies (grace-snow's suggested wording is in-thread). #4229 (open) — "[toast] Add a11y guide": the component has no usage-level a11y documentation; Primer's guidance (which discourages toasts) is the referenced model. Docs demo mitigation already applied: undo demo timeout raised to 10s (#4975).

## 8. Prop-level guidance (decision-relevant only)

- **`Provider.timeout`** (default 5000): global auto-dismiss. Set `0` to make all toasts persistent. Per-toast `timeout` in `add()` overrides. Use ≥10s (or `0`) when a toast carries an action the user must reach (#4975; #4253).
- **`Provider.limit`** (default 3): visible-stack cap. Style the overflow with `[data-limited]` (e.g. `opacity: 0`) — limited toasts are `inert` but still mounted and will return (#1953).
- **`Provider.toastManager`**: pass a `createToastManager()` instance to drive toasts from outside React. Note (open gap): toasts added before the Provider mounts are dropped, relevant for islands architectures (#4986 open).
- **`Root.swipeDirection`** (default `['down','right']`): match your viewport corner (bottom-right stack → down/right; top-center → `['up']`). Accepts one or many; opposite pairs on one axis are supported (#3392). Ignored for anchored toasts. RTL logical values (`inline-start/end`) are an open discussion (#4402).
- **`add()` options** (= `ToastObject`):
  - `title` / `description`: `ReactNode` (upgraded from string-only, #2888 → #2929). They feed default children of Title/Description AND the high-priority announcer — keep them meaningful as plain text for SR output [E] page.mdx.
  - `type` (free string): styling/behavior discriminator surfaced as `data-type` on Root/Title/Description/Action/Close and `state.type` in render callbacks. `'loading'` is special (no auto-dismiss); `promise()` writes `loading`/`success`/`error`. Literal-union typing via module augmentation was rejected; a typed-manager generic is the intended future (#3952, michaldudak).
  - `timeout` / `priority`: `priority: 'high'` → assertive `role="alert"` announcement + `alertdialog` role — reserve for urgent, actionable failures [E] useToastManager.ts JSDoc ("announced urgently"). Default `'low'`.
  - `id`: pass to dedupe/upsert (#4440); required workaround for `promise()` not returning an id (#2833).
  - `actionProps`: full button props incl. `children` for `Toast.Action` — the undo pattern (docs demo: `onClick` closes the toast and adds an "Action undone" toast).
  - `data` (generic `Data`): arbitrary typed payload for custom renderers; `useToastManager<Data>()`/`createToastManager<Data>()` are generic (#3882); narrow per-toast with a type guard (docs "Custom" demo).
  - `onClose` vs `onRemove`: react at close-start vs after-exit-animation (e.g. analytics vs releasing resources) [E] JSDoc.
  - `positionerProps: { anchor, side, align, … }`: makes the toast anchored; use a *separate provider* for anchored toasts; keep anchored timeouts short — with a brief timeout "you don't need a close button or outside tap to dismiss", but "If you have a toast that's visible for awhile (>3-5s), then you should use `<Toast.Close>`" (atomiks, #3096).
- **Styling contract (attrs/vars that matter)**: Root — `data-expanded`, `data-limited`, `data-type`, `data-swiping`, `data-swipe-direction`, `data-starting-style`, `data-ending-style`; `--toast-index`, `--toast-offset-y`, `--toast-height`, `--toast-swipe-movement-x/-y`. Viewport — `data-expanded`; `--toast-frontmost-height`. Content — `data-expanded`, `data-behind`. Positioner/Arrow — `data-side`, `data-align`, `data-anchor-hidden`/`data-uncentered`; `--available-width/height`, `--anchor-width/height`, `--transform-origin` [E] *DataAttributes.ts / *CssVars.ts enums. The demos add user-space conventions `--gap` and `--peek` on top (anchored/undo demo CSS).
- **`user-select: none` on the toast is load-bearing**: without it swipe feels "weirdly sticky" (michaldudak, #1467 review); all demos set it (+ `-webkit-` prefix per AGENTS.md).

## 9. Decision log

- 2025-04-08 — **Component introduced**, PR #1467 (atomiks), closing #220 (colmtuite, "API TBD"). Goals in PR body: swipe, stack, global queue. `useToast` renamed `useToastManager` in review to match the global API (michaldudak/atomiks). Title/Description defaulting to toast strings judged consistent with `Field.Error`/`Select.Value` (mj12albert/atomiks). Shipped in v1.0.0-alpha.8.
- 2025-05 (beta.0, breaking ×2) — **`Portal` part added** (#1962, closes #1960), aligning Toast with the required-Portal anatomy grammar (#1222); **limited toasts stay in the DOM** with `inert` instead of being removed (#1953).
- 2025-07 — **Viewport becomes the announce container** (#2246, atomiks): removes per-toast hidden announcer + 50ms Safari delay hack; high-priority toasts get a separate hidden `role="alert"` container; `Toast.Close` made `aria-hidden` when not expanded (double-"Close" announcement); viewport label made static (Safari/Firefox double-announcing).
- 2025-09 (breaking) — **Variable-height stacking + new `Toast.Content` part** (#2742, closes #1955; sonner benchmarked by oliviertassinari). `--toast-frontmost-height` and the peek/scale CSS model land in demos. `title`/`description` widen to `ReactNode` (#2929, closes #2888).
- 2025-10/11 — **Anchored toasts**: Positioner + Arrow parts, `positionerProps` on `add()` (#3096, closes #3026 by mnajdova); design guidance: short timeout or add Close (thread). **Store refactor** to `ReactStore` (#3464, flaviendelangle) — enabler for later timer/limit fixes.
- 2026-01→03 — **Manager API maturation**: generics `useToastManager<Data>`/`createToastManager<Data>` (#3882); `close()` with no id closes all (#3979, community PR, Sonner/Chakra `dismiss` precedent); timer rescheduling on update fixed after user reports (#3564, from #2990); dismissed promise toasts stay dismissed (#4040).
- 2026-03→05 — **Dedup/upsert**: `add({ id })` upserts + `updateKey` counter (#4440, from #4228; atomiks: "passing an `id` … should allow deduping by means of 'upsert'"); timers resume after window refocus (#4438, fixes #4439); touch-swipe keeps viewport expanded (#4411); timer+limit edge cases (#4933).
- 2026-06 — **`focus` option rejected** (#4533, aarongarciah): toasts must not move focus; AlertDialog is the alternative. Companion docs fix: undo demo timeout 10s (#4975). Open counterparts: #4253 (a11y timing), #4229 (a11y guide).
- Open API debates: action-only consumers re-render on every toast change (#4234 + unmerged `useToastActions` #4233); logical `swipeDirection` values (#4402); pre-mount toast queueing for islands (#4986); toast `type` literal typing via typed manager (#3952 direction statement by michaldudak).

## 10. Pitfalls & FAQ

- **Third-party toast libraries render under Base UI backdrops** → sonner/react-toastify sit inside the `isolation: isolate` root and lose the z-index war; move the third-party toaster *outside* the isolate root, then any z-index wins (#2938, #1935 — atomiks). [I] Base UI's own Toast avoids this because `Toast.Portal` appends the viewport to `<body>` outside the app root, and live regions are exempt from the modal `aria-hidden` treatment (#4843).
- **`Portal container` seems ignored** → `container={null}` means "wait for the element"; `undefined` means "use default and don't re-check"; passing undefined-then-element needs a `key` remount (#2780, atomiks; fixed reactivity in #2847).
- **`promise()` doesn't return the toast id** → it returns the chained promise by design; pass your own `id` in the `loading` options to address the toast later (#2833).
- **Toast never closes after `update(id, { timeout })`** → historical (#2990/#3564): pre-1.1 the timer wasn't rescheduled; now updating timeout (even to the same value) resets it, and upserting via `add({ id })` always refreshes.
- **Sticky/janky swipe** → missing `user-select: none` (+`-webkit-`) on the toast (#1467 review); also don't put custom drag surfaces inside without `data-base-ui-swipe-ignore` awareness (interactive elements are auto-exempt) (page.mdx).
- **Custom component in `Description render` doesn't render** → fixed (#2809 → #2977); custom components must forward props/ref per the render-prop contract.
- **`height: 100%` on `Toast.Content` breaks height recalculation** → fixed for fixed layouts (#3336 → #3359), but Content is the measured element: give it natural height.
- **Recreating toast objects breaks stacking calculations** → fixed; store now keys metadata by id, not object identity (#3922; "object identity" regression tests in ToastRoot.test.tsx).
- **`useToastManager` throws "must be used within <Toast.Provider>"** → the hook needs the provider context; for module-scope usage create a global manager instead (error text in useToastManager.ts; page.mdx "Global manager").
- **Global-manager toasts fired before the provider mounts vanish** → no built-in queueing yet (#4986 open); wrap the manager if you have late-mounting providers (islands/SSR shells).
- **Every button using `useToastManager()` re-renders on any toast change** → the hook subscribes to `toasts` unconditionally; known limitation (#4234 open); [I] mitigate today by isolating the caller or using a module-level `createToastManager()`.
- **Undo/action toasts time out before keyboard users reach them** → use a long timeout (docs now use 10s, #4975) or `timeout: 0`; F6 is the documented shortcut; consider a persistent affordance for critical undo (#4253 discussion).

## 11. Real-world patterns observed

- [G] pending — `research/d-real-world-usage/toast/` does not exist yet (no candidates.json/ranked.json for toast at time of writing; checked 2026-07-07).
- Weak corpus signal available now: grep of `research/d-real-world-usage/_corpus/repos.json` (877 repos) surfaces 2 toast-mentioning entries — `baseui-cn/baseui-cn` (oss-design-system) and `vcode-sh/popser` (production-app). Follow up in Phase D with subpath search `from '@base-ui/react/toast'` (+ historical `@base-ui-components/react/toast`).
- [I] Expected archetypes to look for, from issue traffic: save/CRUD confirmation stacks (#4228 dedup ask), async mutation feedback via `promise` (#2990, experiment file), copy-to-clipboard anchored toasts (#3026), websocket/event-driven global managers (#4986 islands report).

## 12. Story plan

Split out to [story-plan.md](./story-plan.md) (23 stories: 8 kept docs demos + 13 use-case stories + 2 recreation placeholders).
