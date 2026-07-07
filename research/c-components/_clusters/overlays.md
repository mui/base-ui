# Overlays cluster — choosing between Popover / Tooltip / Preview Card / Dialog / Alert Dialog / Drawer

Self-contained decision guidance for the overlap cluster. Legend: [E] direct evidence + citation, [I] inference (basis stated). Docs paths relative to repo root; issue/PR numbers are mui/base-ui. Menu is out of scope here (action lists, `role="menu"`) but noted where users confuse it.

## Purpose one-liners (the components' own subtitles)

- **Tooltip** — "A popup that appears when an element is hovered or focused, showing a hint for sighted users." [E] docs/…/tooltip/page.mdx
- **Popover** — "An accessible popup anchored to a button." [E] docs/…/popover/page.mdx
- **Preview Card** — "A popup that appears when a link is hovered, showing a preview for sighted users." [E] docs/…/preview-card/page.mdx
- **Dialog** — "A popup that opens on top of the entire page." [E] docs/…/dialog/page.mdx
- **Alert Dialog** — "A dialog that requires a user response to proceed." [E] docs/…/alert-dialog/page.mdx
- **Drawer** — "A panel that slides in from the edge of the screen." (meta: "with swipe-to-dismiss gestures") [E] docs/…/drawer/page.mdx

## Decision dimensions

1. **Informational vs interactive.** Tooltip and Preview Card content is a visual-only supplement — "not accessible to touch or screen reader users" [E] tooltip & preview-card usage guidelines. Popover/Dialog/Alert Dialog/Drawer contain real (focusable, essential) content; focus moves into them on open. [E] #3530; PopoverPopup/DialogPopup focus managers
2. **Trigger purpose (the master heuristic).** "A popover's trigger's purpose is to open the popover itself (and every platform is supported), while a tooltip's trigger's purpose is unrelated to the tooltip (and touch platforms are excluded)." (atomiks) [E] #3530. Preview Card's trigger is a **link** whose purpose is navigation (`<a>`). [E] PreviewCardTrigger.tsx
3. **Hover vs click.** Hover-only: Tooltip, Preview Card. Click (optionally hybrid hover via `openOnHover`): Popover. Click/imperative only: Dialog, Alert Dialog, Drawer. Hover-only *interactive* UIs were explicitly declined: "'Hover-based UIs' are not accessible … That is why the `openOnHover` prop is hybrid." (colmtuite) [E] #2623
4. **Anchored vs centered vs edge.** Anchored to a trigger/anchor (Positioner part, side/align): Tooltip, Popover, Preview Card. Centered over the page (no Positioner): Dialog, Alert Dialog. Edge of the screen: Drawer. [E] anatomy sections of each page.mdx (Dialog/AlertDialog/Drawer have no Positioner part)
5. **Dismissal semantics.** Light dismiss (outside press, Escape, focus-out when non-modal): Tooltip (hover-out), Popover, Preview Card (hover-out), Dialog (configurable via `disablePointerDismissal`), Drawer (plus swipe-to-dismiss). Alert Dialog: **no light dismiss by outside press** — "dialog will let user click outside … while alert dialog won't" [E] #2146; `AlertDialogRoot.Props` omits `disablePointerDismissal` and `modal` entirely [E] AlertDialogRoot.tsx Omit<…>
6. **Modality defaults.** Popover `modal={false}` by default [E] PopoverRoot.tsx; Dialog `modal={true}` by default [E] DialogRoot.tsx JSDoc; Alert Dialog always modal (prop removed) [E] useRenderDialogRoot.tsx `modal = isAlertDialog ? true : modalProp`; Drawer inherits Dialog's model + gestures [E] drawer usage guidelines. Tooltip/Preview Card are never modal. [I] no modal prop exists on either
7. **Severity / interruption.** Alert Dialog exists for interruptions requiring a decision; "The main reason for separating them [from Dialog] is accessibility" — `role="alertdialog"` (michaldudak, citing MDN) [E] #2146; role wiring [E] useRenderDialogRoot.tsx:32
8. **Touch behavior.** Tooltips **never show on touch** — "iOS has no OS-level tooltips; long-press conflicts with native context menus" [E] #3530; tooltip page.mdx "Alternatives". Preview Card likewise hover-only [E] its subtitle. Popover works on every input; touch-opened modal popovers skip scroll lock unless effectively full-width (native-iOS-like) [E] PopoverRoot JSDoc; #3100. Drawer is the touch-first surface: swipe gestures, snap points [E] drawer page.mdx

## Decision table

| | Tooltip | Popover | Preview Card | Dialog | Alert Dialog | Drawer |
|---|---|---|---|---|---|---|
| Content | visual hint | essential/interactive | link preview | anything | decision prompt | anything |
| Opens on | hover/focus | click (+opt. hover) | link hover | click/imperative | click/imperative | click/imperative/swipe |
| Placement | anchored | anchored | anchored | centered | centered | screen edge |
| Popup role | none (visual only) | `dialog` | none (visual only) | `dialog` | `alertdialog` | `dialog` [I] Dialog-derived |
| `modal` default | n/a | `false` | n/a | `true` | forced `true` | Dialog-like |
| Outside-press closes | n/a (hover-out) | yes (cancelable) | n/a (hover-out) | yes (`disablePointerDismissal` to stop) | **no** | yes + swipe |
| Focus moves into popup | never | yes (except hover-open) | never | yes | yes | yes |
| Shown on touch | **never** | yes | never | yes | yes | yes (gesture-native) |
| Essential info allowed | **no** | yes | no (must exist at destination) | yes | yes | yes |

Sources: rows 1–3 [E] subtitles + #3530; roles [E] PopoverPopup.tsx:105, useRenderDialogRoot.tsx:32, TooltipPopup.tsx (no role/aria attrs); modality [E] respective Root prop JSDoc; alert dialog dismissal [E] #2146 + AlertDialogRoot.tsx; touch [E] #3530, #3100, drawer page.mdx.

## Per-pair boundaries

**Tooltip vs Popover** (the most-asked; docs page hides "Tooltip Alternative" in popover SEO keywords [E] popover page.mdx metadata)
- Tooltip = label for a tool that does something else; optional, sighted-only; trigger needs its own `aria-label` [E] tooltip usage guidelines. Popover (openOnHover) = info icon whose whole purpose is the popup; content is *not optional*, every input modality must reach it; focus moves in so screen readers can read it [E] #3530 (atomiks, full mental model), canonized in tooltip page "Infotips": "If the trigger's purpose is to open the popup itself, it's a popover. If the trigger's purpose is unrelated to opening the popup, it's a tooltip."
- Litmus: would a touch user lose anything? If yes → Popover. [E] #3530; oliviertassinari adds tooltip use should be "niche" (#3530 comment).

**Tooltip vs Preview Card** — both hover-only, sighted-only. Preview Card is specifically for **link** hover previews (`<a>` trigger; hoverable rich content); content must also exist at the link destination [E] preview-card usage guideline. Tooltip content should never be interactive "unless … there are other means of accessing that content (see: description for Preview Card)" [E] #3530.

**Popover vs Dialog** — anchoring and blocking. Popover positions against its trigger and defaults non-modal (page stays usable); Dialog centers "on top of the entire page" and defaults modal with focus trap [E] subtitles + `modal` defaults. Dialog offers `disablePointerDismissal`; Popover intentionally handles dismissal exceptions via `onOpenChange` reason filtering [E] DialogRoot.tsx:55–59; #2314/#3716. Dialog handles support trigger-less imperative `open()`; Popover's handle deliberately requires a `triggerId` (needs an anchor) — "likely less common than in dialogs" (michaldudak) [E] #3065. [I] Rule: if it must stay attached to what opened it → Popover; if it should command the whole page → Dialog (inferred from the above APIs).

**Dialog vs Alert Dialog** — severity + response obligation. Alert Dialog is a Dialog specialization: `role="alertdialog"`, always modal, cannot be dismissed by clicking outside; it "requires a user response to proceed" [E] subtitle; #2146 (michaldudak: separation exists for accessibility); AlertDialogRoot omits `modal`/`disablePointerDismissal`. Use Dialog for everything else. Maintainers acknowledge this distinction is under-documented (#1687 open docs issue; unification "considered", not planned — mj12albert, #2146) [E].

**Dialog vs Drawer** — gestures. "Drawer extends Dialog: it adds gesture support, snap points, and indent effects. If you don't need these, use Dialog instead. A panel that slides in from the edge of the screen and doesn't need gesture support is a positioned Dialog." [E] drawer + dialog usage guidelines (stated symmetrically on both pages).

**Popover vs Drawer** — [G] no direct maintainer statement found (searched 'dialog vs drawer', 'popover drawer'); [I] from the dimensions: both can hold interactive content, but Drawer is edge-attached, gesture-dismissed, and page-scoped (Dialog family), while Popover stays anchored to its trigger; on small screens a pattern that is a popover on desktop often becomes a drawer (supported by Drawer's "Mobile navigation" example, drawer page.mdx).

**Popover vs Menu (adjacent, common confusion)** — Menu is an anchored **action list** (`role="menu"`, roving highlight, typeahead); Popover is a mini-dialog (`role="dialog"`) for free-form content. [I] from part vocabulary/roles; users searching "Popover Menu"/"Dropdown" land on popover per its SEO keywords [E] popover page.mdx metadata. Legacy note: `@mui/base` Popper vs Popover were merged into today's Popover — "they won't be separate components" [E] discussion #553.

**Toast (adjacent) — the self-managed stack vs user-triggered overlays.** Every component above opens *because the user acted on a trigger* and closes when the interaction ends; Toast is the inverse: the **app** opens it imperatively (`useToastManager().add()` / `createToastManager()` — it has no Trigger part and no `open` prop), and it closes *itself* (timeout, limit, swipe) [E] toast page.mdx anatomy; `useToastManager.ts`. Boundaries stated by maintainers: (1) vs **Alert Dialog** — "Toasts are used to notify users without interrupting their workflow, and moving the focus to a toast is not desired. In scenarios when users' input is required, AlertDialog is better suited" (aarongarciah, rejecting a focus-on-open option) [E] #4533; open a11y issue #4253 documents why decisions inside toasts fail for keyboard/SR users. (2) vs **Dialog** — toasts get an imperative manager because they're "usually always simple with a basic render structure"; dialogs are unbounded and get handles instead (atomiks) [E] #2802. (3) vs **Tooltip** — transient contextual feedback ("Copied") should be an *anchored Toast*, not a tooltip, "to ensure the message is announced to screen readers" [E] tooltip page.mdx "Contextual feedback messages"; toast #3096. Layering note: `Toast.Viewport` is an `aria-live` region that the dialogs' outside-`aria-hidden` marking deliberately exempts, so Base UI toasts keep announcing over open modals [E] #4843 (atomiks) — whereas third-party toasters (sonner, react-toastify) inside the `isolation: isolate` root end up under Base UI backdrops and must be moved outside it [E] #2938, #1935. Full component treatment: [../toast/brief.md](../toast/brief.md).

## Ready-made prose sources for the writer

- #3530 thread (atomiks ×3, oliviertassinari) — documentation-grade Tooltip-vs-Popover text incl. iOS long-press argument.
- tooltip page "Alternatives to tooltips" (Infotips / Description text / Contextual feedback → anchored Toast) — already-shipped canonical guidance.
- #2623 (colmtuite) — why hover-only interactive popups don't exist.
- #2146 / #1687 — Dialog-vs-AlertDialog gap acknowledged; MDN alertdialog role is the cited rationale.
- drawer & dialog usage guidelines — the only symmetric pair-boundary statement currently in the docs.
