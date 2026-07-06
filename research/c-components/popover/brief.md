# Popover — research brief (Tier 1)

Legend: [E] direct evidence (quote/paraphrase + citation) · [I] inference (stated basis) · [G] gap (looked, found nothing). Issue/PR numbers are mui/base-ui unless prefixed. Repo paths are relative to repo root.

## 1. Identity

- **Name:** Popover. **Package subpath:** `@base-ui/react/popover`. [E] docs/src/app/(docs)/react/components/popover/page.mdx (anatomy import)
- **Docs subtitle:** "An accessible popup anchored to a button." [E] page.mdx line 3
- **Multi-part component** (11 parts + a factory):
  - `Root` — "Groups all parts of the popover. Doesn't render its own HTML element." [E] packages/react/src/popover/root/PopoverRoot.tsx JSDoc
  - `Trigger` — "A button that opens the popover. Renders a `<button>`." Can live inside Root or detached via `handle`. [E] trigger/PopoverTrigger.tsx JSDoc
  - `Backdrop` — "An overlay displayed beneath the popover." `<div>`. Optional/presentational. [E] backdrop/PopoverBackdrop.tsx JSDoc
  - `Portal` — "moves the popup to a different part of the DOM"; appended to `<body>` by default. **Required part** (see §9 #1222). [E] portal/PopoverPortal.tsx JSDoc
  - `Positioner` — "Positions the popover against the trigger." `<div>`. [E] positioner/PopoverPositioner.tsx JSDoc
  - `Popup` — "A container for the popover contents." `<div>`, `role="dialog"`. [E] popup/PopoverPopup.tsx JSDoc + line 105
  - `Arrow` — "Displays an element positioned against the popover anchor." Optional. [E] arrow/PopoverArrow.tsx JSDoc
  - `Title` — "A heading that labels the popover." `<h2>`; wired to popup `aria-labelledby`. [E] title/PopoverTitle.tsx; popup/PopoverPopup.tsx:107
  - `Description` — "A paragraph with additional information." `<p>`; wired to `aria-describedby`. [E] description/PopoverDescription.tsx; PopoverPopup.tsx:108
  - `Close` — "A button that closes the popover." Also the a11y escape hatch that enables modal focus trapping (§8). [E] close/PopoverClose.tsx; root JSDoc for `modal`
  - `Viewport` — "A viewport for displaying content transitions. Only required if one popup can be opened by multiple triggers, its content changes based on the trigger, and switching between them is animated." [E] viewport/PopoverViewport.tsx JSDoc
  - `Popover.createHandle<Payload>()` → `PopoverHandle` class with `open(triggerId)`, `close()`, `isOpen`. [E] store/PopoverHandle.ts
- **Status:** stable since v1.0.0 (2025-12-11); source component introduced 2024-06-25, commit 322673611, PR #381. [E] research/b-library-principles/_mining/history.md component table
- **Taxonomy category (Phase A):** Overlays & popups — "anchored, click, interactive content". [E] research/a-documentation-standard/taxonomy.md line 37
- **Purpose/IA statement:** [I] (from subtitle + role=dialog + #3530) an anchored, accessible mini-dialog: interactive or essential content positioned against the trigger whose sole purpose is to open it.

## 2. Intention

- **Founding issue:** #35 "[popover] Implement Popover" (michaldudak): "This is the place to gather ideas, measure interest and discuss the API and implementation details of the popover component and hook," linking umbrella #10 and mui/material-ui#6218 (the unstyled-components problem statement). [E] #35
- **Introducing PR:** #381 "[popover] Component and Hook" (atomiks, merged 2024-06-25), closes #35. [E] #381
- **Merged the legacy Popper/Popover split:** asked which of `@mui/base` Popper vs Popover to use, atomiks answered the rewrite merges them — "they won't be separate components." [E] discussion #553 via research/b-library-principles/_mining/discussions.md
- **The maintainer mental model (the heart):** "**Popovers with `openOnHover`** are attached to a button whose purpose is to show the popover itself (like an info icon that is _not optional_ — every user regardless of their input modality needs to see it). The button doesn't perform a separate action: its purpose is to show the popover, not do something else. Focus moves into the popover when it opens so users can navigate and read its text/content with a screen reader." … "A simple mental model is: a popover's trigger's purpose is to open the popover itself (and every platform is supported), while a tooltip's trigger's purpose is unrelated to the tooltip (and touch platforms are excluded)." (atomiks) [E] #3530
- **Accessibility-first framing of interactivity:** "'Hover-based UIs' are not accessible because if the only trigger is hover, touch users and keyboard users cannot interact with the content inside the Popover. That is why the `openOnHover` prop is hybrid. You can open and close via hover only. But you can also click, and when you trigger via click, it remains open until you click again." (colmtuite) [E] #2623
- **Popover as a carrier of the handle pattern:** RFC #2069 ("public state interface") was rejected in favor of `createHandle()`; Popover was the first component to ship detached triggers, multiple triggers, and typed payloads (#2336, merged 2025-10-06), positioned by michaldudak as making "the controlled mode almost unnecessary." [E] #2069/#2336/#2974 via _mining/issues-prs.md
- **Explicit non-goals:**
  - Hover-only open/close ("pure hover" popovers): rejected — see colmtuite quote above; Tooltip/PreviewCard are the hover-only components. [E] #2623 (open, but maintainer position stated)
  - Rendering without `Portal`: "It caused various bugs, so we restricted the API to require `Portal`" (atomiks); required part since #1222 (alpha.5). [E] #4750, #1222
  - Attaching to non-React DOM nodes tippy-style: props flow top-down in React; use the `Positioner` `anchor` prop or detached triggers instead (atomiks). [E] #2157, #3577
  - No `disabled` prop on Root and no dedicated `disablePointerDismissal` — dismissal exceptions are handled via `onOpenChange` reason filtering / `eventDetails.cancel()`. [I] from #3025 (open, unanswered), #3716 (self-answered with reason filtering), #2314 (atomiks endorses reason filtering)

## 3. When to use

- **Infotips (essential info behind an info icon):** "Popups that open when hovering an info icon should use Popover with the `openOnHover` prop on the trigger instead of a tooltip. This way, touch users and screen reader users can access the content." [E] tooltip page.mdx "Alternatives to tooltips"
- **Description text too long for inline:** "use inline text or Popover if space is limited, so the information is accessible to everyone." [E] tooltip page.mdx
- **Interactive anchored panels:** hero demo is a "Notifications" panel (Trigger + Title + Description); the docs' hidden SEO keywords ("Popover Menu", "Anchored Popup", "Dropdown", "Floating Panel", "Info Box", "Callout") map the intended query space. [E] demos/hero; page.mdx metadata.keywords
- **One shared popup for many triggers** (e.g., 20–100 table rows each opening the same panel with per-row context): the detached-triggers + payload pattern exists precisely for this; issue author's table-rows use case answered with detached triggers and is now "linked in docs". [E] #3577; page.mdx "Multiple triggers"
- **Popover that must behave like a small modal** (block outside interaction while open): `modal` prop added on request. [E] #1459 closing #623
- **"Tooltip Alternative":** the page's keywords include the literal phrase — evidence users arrive comparing the two; the decision belongs to the overlays cluster note. [E] page.mdx metadata; see research/c-components/_clusters/overlays.md

## 4. When not to use + alternatives

Full comparative guidance: **research/c-components/_clusters/overlays.md** (tooltip / preview-card / dialog / alert-dialog / drawer / popover, with menu noted). Summary of the popover-side boundaries:

- **Not for visual hints labeling a control that does something else** → Tooltip. "The tooltip is an optional/secondary visual-only hint that users don't _need_ to see"; tooltips never appear on touch (iOS has no OS tooltips; long-press conflicts with native context menus). [E] #3530 (atomiks)
- **Not for link previews** → PreviewCard ("A popup that appears when a link is hovered, showing a preview for sighted users"; trigger renders `<a>`). [E] preview-card page.mdx subtitle; PreviewCardTrigger.tsx
- **Not for page-blocking flows or centered prompts** → Dialog ("A popup that opens on top of the entire page", modal by default). [I] from Dialog subtitle + `modal` default `true` (DialogRoot.tsx:43) vs Popover default `false`
- **Not for action lists** → Menu (role="menu", typeahead, submenu machinery). [I] from part vocabulary; popover popup is role="dialog" with no item semantics
- **Not for edge-anchored, gesture-dismissed panels** → Drawer. [E] drawer page.mdx usage guidelines
- **Not for pure hover reveal of non-essential content** → Tooltip/PreviewCard; a hover-only interactive popover was declined. [E] #2623

## 5. Anatomy & composition

Canonical tree (page.mdx "Anatomy"):

```
Popover.Root                    (no DOM; state owner; FloatingTree provider when not nested)
└─ Popover.Trigger              (button; 0..n; can also live OUTSIDE Root via handle)
└─ Popover.Portal               (REQUIRED for popup; carries keepMounted)
   ├─ Popover.Backdrop          (optional, presentational overlay)
   └─ Popover.Positioner        (anchoring box; all position props live here)
      └─ Popover.Popup          (role=dialog; focus-managed container)
         ├─ Popover.Arrow       (optional anchor pointer; data-side/data-uncentered)
         └─ Popover.Viewport    (optional; only for animated multi-trigger content swaps)
            ├─ Popover.Title    (optional; auto aria-labelledby)
            ├─ Popover.Description (optional; auto aria-describedby)
            └─ Popover.Close    (optional; REQUIRED inside Popup for modal focus trap)
```

- Composition rules: Portal → (Backdrop) → Positioner → Popup layering is the library-wide popup grammar; `keepMounted` lives on Portal ("single home", #1222). [E] _mining/issues-prs.md PR #1222 note
- Root accepts children as node **or** function `({ payload }) => ReactNode` (payload pattern). [E] PopoverRoot.tsx `children` JSDoc
- Viewport contract: wraps content in `div`s marked `data-current`/`data-previous`; docs warn to freeze Positioner to `var(--positioner-width/height)` during transitions "otherwise content-driven resizing can make the popup thrash or flip to another side." [E] page.mdx lines 184–243
- Nested popovers: Root detects a floating parent and joins its FloatingTree; nested portals auto-append inside the parent's portal — set a custom `container` only on the root Portal. [E] PopoverRoot.tsx (useFloatingParentNodeId); #1930 (atomiks)
- **Visual anatomy diagram spec:** numbered callouts — (1) Trigger button with `data-popup-open` state; (2) Positioner as invisible measuring box, arrow to (3) Popup card; (4) Arrow at popup/anchor seam; (5) Title top of card; (6) Description body; (7) Close in card corner; (8) dashed outline around Portal indicating body-level mount; (9) optional Backdrop layer behind. [I] derived from part tree above

## 6. Behavior ("How it works")

- **Open/close model:** uncontrolled by default (`defaultOpen`); controlled via `open` + `onOpenChange(open, eventDetails)`; `onOpenChangeComplete(open)` fires after animations (#1305). Reasons: `trigger-hover | trigger-focus | trigger-press | outside-press | escape-key | close-press | focus-out | imperative-action | none`. [E] PopoverRoot.tsx types + REASONS union
- **Three activation tiers:** (1) in-tree `<Popover.Trigger>` (uncontrolled), (2) controlled `open`+`triggerId`, (3) `createHandle()` + detached triggers + imperative `open(triggerId)`/`close()`. A confused user asked "Why are there 3 ways to open a popover?" — the docs should teach the tiers explicitly. [E] #3577 (MonstraG comment); tiering framing from #2069→#2336 arc in _mining/issues-prs.md
- **Handle lifecycle:** imperative calls made while no Root is attached are ignored (not replayed); each mount starts fresh; the handle is a store the Root attaches to ("swapping the handle re-attaches rather than recreating state"). Multiple mounted roots on one handle warn. [E] page.mdx lines 58–59; PopoverRoot.tsx comment lines 122–124; PopoverRoot.detached-triggers.test.tsx ("ignores imperative handle calls…", "warns when a handle stays attached to more than one mounted root")
- **Hover open (`openOnHover` on Trigger):** hybrid by design (§2). `delay` default 300ms (rest-style), `closeDelay` 0; safe-polygon pathing; mouse only (`mouseOnly: true` — hover never opens on touch); hover-open does **not** move focus and hover-close doesn't disturb focus (tests: "does not move focus to the popover when opened with hover"). Click during hover "sticks" it open; clicks within ~500ms of hover-open are ignored as "impatient clicks" so the popup doesn't flash closed (#973 closing #955). [E] PopoverTrigger.tsx lines 82–100 + OPEN_DELAY; PopoverRoot.test.tsx; #973
- **Focus:** on open, focus moves to first tabbable element inside the popup — except touch-opened popovers focus the popup itself "to avoid opening the virtual keyboard"; configurable via `initialFocus` (bool | ref | fn(interactionType)); on close, focus returns to trigger/previous element, configurable via `finalFocus`. Tabbing out of a non-modal popover closes it and continues the natural tab order past the trigger (extensive tests). [E] PopoverPopup.tsx `initialFocus`/`finalFocus` JSDoc; PopoverRoot.test.tsx "focus management" describe block
- **Dismissal:** outside press uses the `click` event (not mousedown) for "intentional" dismissal with mouse; sloppy for touch; Escape closes; non-modal popovers also close on focus-out. Right-click inside doesn't cause outside-press misfires (#2508). Swiping/scrolling on a nested popup doesn't dismiss on touch (#3011). Cancel any of these with `eventDetails.cancel()` or by filtering `reason` in controlled mode. [E] PopoverRoot.tsx useDismiss config; #2275; #2314 (atomiks recipe); #4466 (mj12albert recipe)
- **Modality (`modal` on Root, default `false`):** `true` = scroll lock + outside pointer interaction disabled (internal backdrop + `data-base-ui-inert` marking of outside elements); `'trap-focus'` = focus loop only, no scroll/pointer lock (#1571). Focus trapping under `modal` activates **only when `<Popover.Close>` is rendered inside the Popup** (may be visually hidden, e.g. `sr-only`) so AT users always have an escape hatch (#4084). Hover-opened popovers never engage modality even when `modal` (openReason check; #1459 body). The internal backdrop has a cutout over the trigger so hover styles and `onClick` work while open (#2141). [E] PopoverRoot.tsx `modal` JSDoc; PRs cited
- **Touch specifics:** `modal={true}` on touch blocks outside taps but leaves the page scrollable "unless the popup spans nearly the full viewport width, matching native iOS behavior" (within 20px of viewport width → scroll lock re-enabled, #3100). [E] PopoverRoot.tsx JSDoc; #3100
- **Positioning (Positioner):** defaults `side="bottom"`, `align="center"`, `sideOffset=0`, `collisionPadding=5`, `positionMethod="absolute"`. `sideOffset`/`alignOffset` accept functions receiving anchor/popup rects (#1223, born from support question #1195). `anchor` prop repositions against any element/ref/virtual element (the sanctioned "external anchor" route; #3577). Anchor tracking on by default (`disableAnchorTracking` to opt out). CSS vars: `--available-width/height`, `--anchor-width/height`, `--transform-origin`, `--positioner-width/height`. [E] PopoverPositioner.tsx defaults; PopoverPositionerCssVars.ts
- **Animation hooks:** `data-open`/`data-closed`, `data-starting-style`/`data-ending-style`, `data-instant` (`click|dismiss|focus|trigger-change`); popup unmounts on close by default; `keepMounted` on Portal keeps it; `actionsRef.unmount()` for JS-animation control (#1236); `ChangeEventDetails.preventUnmountOnClose()` exists for advanced close choreography (tests cover cancel/reopen cycles). Trigger-to-trigger morphing animates Positioner `top/left` + Popup `width/height` (`--popup-width/height`), content swap via Viewport `data-activation-direction` (`~=` matching). [E] PopoverPopupDataAttributes.ts; page.mdx "Animating the Popover"; PopoverRoot.tsx types
- **SSR:** popup content renders in a portal, so it is not part of server HTML; atomiks: the "main (only?) reason you might want to omit a portal is for SSR behavior, so content is present in the server HTML before hydration" — and that's not supported. [E] #4750

## 7. Accessibility contract

- **ARIA wiring (managed for you):**
  - Trigger: `aria-haspopup="dialog"`, `aria-expanded` (true only on the trigger that opened it), `aria-controls={popupId}`. [E] PopoverTrigger.tsx lines 144–146; detached-triggers tests "synchronizes ARIA attributes in controlled mode"
  - Popup: `role="dialog"`, `aria-labelledby` ← Title id, `aria-describedby` ← Description id. [E] PopoverPopup.tsx lines 105–108
  - Arrow: `aria-hidden` (#1196). Hidden focus-guard `<span>`s render around triggers/popup — required "touch screen-reader escape" machinery (#3693, mj12albert/atomiks).
- **Keyboard table** (from tests + FloatingFocusManager config):

| Key | Context | Result |
|---|---|---|
| Enter / Space | trigger focused | toggles popover (`trigger-press`) |
| Escape | popover open | closes; focus returns to active trigger |
| Tab | just opened | focus is already inside (first tabbable) unless opened by touch/hover |
| Tab (last element) | non-modal popup | closes popup, focus continues after the trigger in document order |
| Shift+Tab (first element) | non-modal popup | focus returns to trigger; popup closes on focus-out |
| Tab | `modal` + Close present, or `trap-focus` | focus loops inside the popup |

  [E] PopoverRoot.test.tsx "focus management"/"non-modal focus transitions"; PopoverPopup.tsx FloatingFocusManager props
- **APG mapping (honest):** there is **no dedicated W3C APG "popover" pattern**. What applies: the **Dialog (Modal) pattern** (https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/) for the `role="dialog"` semantics and, when `modal`/`trap-focus`, its focus-trapping expectations; the **Disclosure pattern** (https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/) for the trigger's expanded/collapsed relationship in the plain non-modal case. Base UI's non-modal default is effectively a "non-modal dialog", which APG describes only in prose under the dialog pattern. [I] from role/attribute wiring above
- **Screen-reader behavior:** focus enters the dialog on open so SR users "can navigate and read its text/content" (contrast with tooltip, which is aria-describedby-only). [E] #3530 (atomiks)
- **Known issues / history:** #4084 (merged 2026-03-11) fixed the modal escape-hatch gap, closing a11y issues #2722/#3693/#4096. Open: #3199 "Focus is not set to the interactive element when it is in another component"; #3104 `onOpenChange` touch-event propagation. The Feb–Mar 2026 external audit wave (#4169–#4253) included #4169 (programmatic-open focus target, closed fixed — popover/dialog handles). [E] issue tracker searches (component: popover, state open, 2026-07-06)
- [G] No open issue labeled both `component: popover` and accessibility as of 2026-07-06 (searched `gh search issues 'popover accessibility'` and open label list).

## 8. Prop-level guidance (decision-relevant only)

- **`modal` (Root, default `false`)** — use `true` for click-opened popovers that must behave like a small modal (blocks outside pointer + scroll); pair with a (possibly `sr-only`) `<Popover.Close>` or focus will NOT be trapped; use `'trap-focus'` when you want keyboard containment without locking the page (e.g. dense toolbars). Never meaningful for hover-opened popovers (modality is skipped for hover). [E] PopoverRoot.tsx JSDoc; #1459; #1571; #4084
- **`openOnHover` + `delay`/`closeDelay` (Trigger, not Root)** — infotip pattern; moved to Trigger in #2336 "as they can be different per trigger" (breaking, beta.5). Default delay 300ms rest. Keep click-to-stick behavior in mind when testing. [E] #2336 body; PopoverTrigger.tsx
- **`handle` + `payload` (Trigger/Root)** — the modern answer to "open a popover from anywhere" and to shared popups over n triggers; strong typing only via `createHandle<P>()`; supersedes controlled-state boilerplate ("should make the controlled mode almost unnecessary" — michaldudak). [E] #2336; #2974 note in _mining/issues-prs.md
- **`triggerId`/`defaultTriggerId` (Root)** — required only in controlled mode with multiple triggers; there is deliberately no `onTriggerIdChange`: the trigger arrives in `eventDetails`. Forgetting `triggerId` positions the popup at 0,0 (#3577 mnajdova repro). [E] page.mdx "Controlled mode"; #3577
- **`initialFocus`/`finalFocus` (Popup)** — override focus targets per interaction type (fn form receives `mouse|touch|pen|keyboard`); `finalFocus` "remains the preferred way to restore focus when the trigger itself gets removed." [E] PopoverPopup.tsx JSDoc; #4084 body
- **`keepMounted` (Portal)** — needed for CSS-only presence, SEO-ish inspection, or JS exit animations; interacts with `actionsRef.unmount()`. [E] handbook animation extracts in _mining/handbook-extracts.md
- **`positionMethod="fixed"` (Positioner)** — the fix when a sticky/fixed-positioned ancestor makes the popup flicker on scroll; Radix defaults to fixed, Base UI chose `absolute` because it "is worse in typical scenarios" (atomiks). [E] #3653
- **`anchor` (Positioner)** — position against an element other than the trigger (existing DOM node, virtual element, per-row cell). [E] #3577, #2157
- **Styling contract:** Trigger `data-popup-open`, `data-pressed` (kept distinct deliberately, #3036); Popup/Positioner/Arrow `data-open/closed/starting-style/ending-style/side/align/instant`, Arrow `data-uncentered`, Positioner `data-anchor-hidden`; Viewport `data-current/previous/activation-direction/transitioning`. CSS vars listed in §6. z-index goes on **Positioner** (recurring confusion, #2486 open docs issue). [E] *DataAttributes.ts enums; #2486

## 9. Decision log (dated, cited)

- **2024-05→06 — #381**: Popover component introduced (atomiks), closing #35; merges legacy Popper+Popover into one anchored component (d553).
- **2024-10/11 — #730, #732, #773**: `delayType` prop removed across hover popups (2024-10-15); `initialFocus` (2024-11-01) then `finalFocus` (2024-11-08) added alongside Dialog/AlertDialog.
- **2024-12 — #973**: "impatient click" blending — clicks <500ms after hover-open are ignored instead of closing ("feeling the most natural"), closing #955.
- **2025-01 — #1222 (alpha.5)**: `Portal` becomes a required part; `keepMounted` moves onto Portal; missing Portal throws ("lets them know the tree is invalid in a very obvious way" — atomiks).
- **2025-02 — #1236 / #1305**: `actionsRef` and `onOpenChangeComplete` land popup-wide.
- **2025-03 — #1459**: `modal` prop added (closing modality RFC #623 by vladmoroz); hover-open never engages modality; adopts Menu's stick behavior.
- **2025-04 — #1571**: `modal="trap-focus"` value (focus loop without scroll/pointer lock), requested in #1554.
- **2025-06 — #2141**: internal modal backdrop gets a trigger cutout (trigger hover/click work while open, fixing #1965-class complaints).
- **2025-07 — #2275**: outside-press dismissal moves to the `click` event (was mousedown) for intentional dismissal.
- **2025-10 — #2336**: detached triggers, multiple triggers, typed payloads via `createHandle()`; **breaking:** `openOnHover`/`delay`/`closeDelay` move Root→Trigger (beta.5). Store-based state under the hood. Origin arc: RFC #2069 rejected → handles accepted.
- **2025-10 — #3065**: handle API reshaped into the `PopoverHandle` class with imperative methods, matching Dialog's #2974; deliberately no trigger-less `open()` for popovers ("likely less common than in dialogs" — michaldudak).
- **2026-03 — #4084**: modal focus trapping activates only with a rendered `Popover.Close` (visually hidable) — reachable escape hatch for AT; closes #2722/#3693/#4096.
- **2026-04 — #3100**: full-width touch popups re-gain scroll lock (fixes #3098); narrower popups keep swipe-outside dismissal.
- **2026-05 — #4741**: `Popover.Close` press preserves the active trigger (matches Dialog), fixing #4738.
All [E]; PR/issue bodies quoted above or in _mining/issues-prs.md / _mining/history.md.

## 10. Pitfalls & FAQ (symptom → correction → citation)

1. Popup hidden under other stacked UI → set z-index on **Positioner** (`<Popover.Positioner className="z-50">`); users expect a prop and dig through source. → [E] #2486 (open docs feedback)
2. Nested popover closes instantly when a custom portal `container` is set → pass `container` only to the **root** Popover.Portal; nested portals auto-nest. → [E] #1930
3. Rich-text editors (ProseMirror/tiptap) resync when a popover opens → Base UI marks outside elements `data-base-ui-inert` (so browser-extension popups stay clickable); marking was moved to top-level nodes to reduce breakage; know it exists when embedding editors. → [E] #3950, #3955
4. `:nth-child`/`space-x-*` styling breaks around triggers → hidden focus-guard spans are rendered next to triggers by design (touch SR escape); avoid DOM-position-dependent CSS there. → [E] #3693
5. Popup flickers while scrolling inside a sticky-positioned parent → `positionMethod="fixed"` on Positioner. → [E] #3653
6. Controlled popover can't be closed by clicking its own custom (non-Trigger) button → outside-press fires before click; cancel it: check `reason === 'outside-press' && buttonRef.current.contains(event.target)` then `eventDetails.cancel()`. → [E] #4466 (mj12albert)
7. "How do I stop outside-press/Escape closing it?" → no `disablePointerDismissal` on Popover; filter `eventDetails.reason` in `onOpenChange` (controlled) or call `eventDetails.cancel()`. → [E] #2314, #3716
8. "I need the popover aligned start-of-popup to center-of-trigger" → `alignOffset`/`sideOffset` accept functions receiving anchor+popup rects. → [E] #1195 → #1223
9. "Why can't the popup live outside `Portal`?" → required part; omitting caused real bugs; only loss is pre-hydration HTML. → [E] #4750, #1222
10. "Why are there 3 ways to open a popover?" → tiers: in-tree trigger (default) → controlled `open`+`triggerId` → handle+imperative; pick the lowest tier that works. → [E] #3577; [I] tier framing from #2069→#2336
11. Controlled + multiple triggers positioned at 0,0 → you forgot `triggerId`. → [E] #3577 (mnajdova)
12. Hover-opened popover won't stay open for clicks / modality "not working" → hover-open intentionally skips modality and focus moves; click the trigger (stick) for modal behavior. → [E] #1459 body; PopoverRoot.test.tsx hover-focus tests

## 11. Real-world patterns observed

- [G] pending Phase D — research/d-real-world-usage/popover/ does not exist yet (checked 2026-07-06; only `dialog/`, `_corpus/`, `methodology.md` present).
- Corpus-level signal already available: **69 repos** in research/d-real-world-usage/_corpus/repos.json carry the `code-import-buc-react-popover` / popover import marker — per-component candidate collection and ranking still to run. [E] repos.json grep count
- Anticipated archetypes to look for [I]: notification/inbox panels (hero shape), filter/settings popovers in dashboards, table-row shared popovers (the #3577 shape), infotips replacing tooltips, date-picker shells (experiments/popover/calendar.tsx shows maintainers hand-testing exactly this).

## 12. Story plan

See **research/c-components/popover/story-plan.md** (kept demos, one story per use case, mandatory open/close-interaction, handle/detached-trigger, and modal-vs-nonmodal pair, with Definition-of-Done section mapping). Experiments worth mining for stories: `docs/src/app/(private)/experiments/popover/` (popovers.tsx = handle playground with settings; calendar.tsx; dynamic-size.tsx; nested-open-on-hover.tsx; vertical.tsx) and `experiments/perf/detached-triggers.tsx` (100-trigger perf grid). [E] experiments dir listing
