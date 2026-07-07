# Context Menu — component research brief

Tier 2 (full brief, capped mining). Mined 2026-07-07, built from [`_mining-salvage.md`](./_mining-salvage.md) (full source/docs/tests/history archaeology, preserved verbatim above) plus 2 `gh pr view` lookups (#2506, #3202) and direct source re-verification of the salvage's one flagged uncertainty (the exact Mac-mouseup gating file). Evidence tags: [E] direct evidence, [I] inference, [G] gap.

## 1. Identity

- **Name / subpath**: Context Menu — `@base-ui/react/context-menu`. Multi-part compound component, namespace export `ContextMenu.*`.
- **19 parts** (from `packages/react/src/context-menu/index.parts.ts`) — **only 2 are original: `Root` and `Trigger`** [E salvage/source]. Every other named part is a verbatim re-export of the corresponding Menu part:
  | Part | Source | One-liner |
  |---|---|---|
  | Root | own | "A component that creates a context menu activated by right clicking or long pressing. Doesn't render its own HTML element." |
  | Trigger | own | "An area that opens the menu on right click or long press. Renders a `<div>` element." |
  | Backdrop, Portal, Positioner, Popup, Arrow, Group, GroupLabel, Item, CheckboxItem, CheckboxItemIndicator, LinkItem, RadioGroup, RadioItem, RadioItemIndicator, SubmenuRoot, SubmenuTrigger | re-export | verbatim `Menu.*` parts — same components, same test-suite behavior |
  | Separator | re-export | the shared standalone `Separator` primitive (same pattern as Select.Separator) |
- [E] Type re-exports alias rather than duplicate: `MenuXProps as ContextMenuXProps` — there is no parallel prop-type hierarchy, just renamed aliases (`index.parts.ts`).
- [E] **Same re-export ratio pattern as Alert Dialog** (2 of 19 parts original here vs 2 of 9 there) — evidence this "thin wrapper around a shared engine, differentiated only at Root/Trigger" is a recurring library-wide architecture for provocation-variant components, not a one-off. [I] cross-component observation, not itself independently cited by a maintainer.
- **Status**: stable; no `[New]`/`[Preview]` tag. Introduced by PR #1665, "[context menu] Create new `ContextMenu` component" (commit `03472e57c`) [E salvage git history].
- **Taxonomy**: menus cluster (see [`../_clusters/menus.md`](../_clusters/menus.md)). Purpose: the same action-list popup as Menu, provoked by right-click or long-press instead of a visible trigger button, anchored to the pointer position rather than a trigger element. IA: an area (`ContextMenu.Trigger`, a `<div>`) wraps whatever surface should carry contextual actions; the popup opens at the cursor, not below/beside a button.

## 2. Intention

- [E] **Introducing PR**: #1665 "[context menu] Create new `ContextMenu` component" (`03472e57c`) — no debate over "why a separate Root instead of a Menu prop" was found in the introducing commit; the rationale is implicit in the thin-wrapper composition itself [E salvage: "No commit debates 'why a separate Root instead of a Menu prop' — the why is implicit in the thin-wrapper composition"].
- [E] **Explicit design statement on part interchangeability**: atomiks in #3365 (cited by the menus cluster note, verified there): "all the context menu parts are direct reexports of regular menu parts so they are interchangeable." This is the single clearest maintainer statement of intention available — Context Menu is not a parallel implementation of menu semantics, it is Menu's engine wearing a different Root/Trigger.
- [E] **Root wraps children in a reset `MenuRootContext.Provider value={undefined}`** before rendering `<Menu.Root>` (`ContextMenuRoot.tsx` lines 46-51, confirmed by direct source read): `<MenuRootContext.Provider value={undefined}><Menu.Root {...props} /></MenuRootContext.Provider>`. [I] This reset is what lets the inner `Menu.Root` correctly detect "I am the top of a context-menu tree" rather than accidentally inheriting a stale Menu-parent context from wherever `<ContextMenu.Trigger>` happens to be rendered in the React tree (e.g. inside another Menu's popup) — the exact bug PR #2506 fixed.
- [E] **PR #2506 verified via `gh pr view`**: title "[menu] Fix menu not opening when inside context menu trigger" (baptisteArno, merged 2025-08-15T13:08:29Z), body: "Fixes #2505." This confirms the salvage's characterization precisely — the bug was a regular `Menu.Root` nested inside a `ContextMenu.Trigger` failing to open, fixed by the context reset described above. The fix shipped alongside the "[FINAL BOSS ⚔️]" experiment scenario in the same commit (salvage: `experiments/context-menu.tsx`), showing the maintainers treated deep overlay-composition correctness (menu-in-context-menu-trigger, context-menu-in-popover, etc.) as the component's hardest and most load-bearing correctness surface.
- [E] **Positioning is anchor-substitution, not new positioning logic**: `MenuPositioner.tsx` (verified directly, lines 89-96) branches on `parent.type === 'context-menu'`:
  ```ts
  if (parent.type === 'context-menu') {
    anchor = anchorProp ?? parent.context?.anchor;
    align = align ?? 'start';
    if (!side && align !== 'center') {
      alignOffset = componentProps.alignOffset ?? 2;
      sideOffset = componentProps.sideOffset ?? -5;
    }
  }
  ```
  Context Menu doesn't reimplement Floating UI anchoring — it feeds the *same* `MenuPositioner` a virtual anchor (the pointer-derived rect) instead of a trigger element ref, with slightly different default offsets tuned for pointer-anchored placement (2px align offset, -5px side offset, vs Menu's trigger-anchored defaults). [I] The 2px/-5px combination is tuned to visually seat the popup right where the pointer clicked, not floating awkwardly beside it — inferred from the values themselves; no maintainer comment explains the exact numbers. [G]
- [I] **Heart of the intention**: give any surface all of Menu's action-list capability (submenus, checkbox/radio items, groups) under a fundamentally different provocation model (right-click/long-press instead of click) and a fundamentally different anchor model (pointer position instead of trigger element), while sharing literally the same popup implementation so that styling, behavior fixes, and new Menu features (e.g. a future part addition) apply to both automatically. Inferred from the re-export ratio (§1), the #3365 interchangeability quote, and the shared `MenuPositioner` branch — no single maintainer statement synthesizes this in one place, but every piece of evidence points the same direction.
- [E] **Explicit non-goal, stated in the type system**: `ContextMenuRootProps` `Omit`s `handle`, `triggerId`, `defaultTriggerId`, `modal`, `openOnHover`, `delay`, `closeDelay` from `Menu.Root.Props`, with an inline source comment: "Context Menu has no detached-trigger support (it opens from a right-click/long-press area, not a registered trigger), so these inherited props are not applicable." [E] direct source read, `ContextMenuRoot.tsx`. This mirrors Alert Dialog's `Omit`-as-guidance pattern (see `../alert-dialog/brief.md` §1) — the missing props *are* the documentation of what the component deliberately can't do.
- [E] Also `Omit`ted: the render-function form of `children` — "Context Menu opens from a pointer position rather than a registered trigger, so the render-function form of `children` (which receives the active trigger's payload) is not applicable" [E] source comment, `ContextMenuRoot.tsx`.

## 3. When to use

- [E] Surfacing contextual actions on a specific area/element via right-click (desktop) or long-press (touch) — the docs subtitle: "A menu that appears at the pointer on right click or long press."
- [E] Reusing an existing Menu's item set for the same actions, exposed two ways at once — click a visible "⋯" button (Menu) and right-click the surface (Context Menu) — since the parts are interchangeable, one styled item module serves both [E menus cluster §"Menu ↔ Context Menu"].
- [E] Deep composition scenarios are explicitly supported and tested for: Menu nested inside a Context Menu's Trigger (the #2506 fix); bare `Menu.Submenu*` parts used directly inside `ContextMenu.Popup` — in-repo proof that Menu and ContextMenu parts genuinely interchange, not just superficially [E salvage: `experiments/context-menu.tsx` scenario 2].
- [E] Long-press on touch surfaces for the same contextual-action affordance desktop gets from right-click — single-touch only, 500ms delay, 10px movement-cancel threshold for scroll disambiguation [E salvage `ContextMenuTrigger.tsx`].

## 4. When not to use + alternatives

Full cluster comparison: [`../_clusters/menus.md`](../_clusters/menus.md). Context-menu-specific boundary reasoning:

- [E] **Never as the only path to an action** — the docs' single Usage Guidelines bullet states this directly: "Use context menus as an enhancement: Don't make a context menu the only way to perform actions… Always provide visible controls…" [E salvage, `docs/.../context-menu/page.mdx`]. This is the load-bearing "when not to use" fact for the whole component: discoverability. Right-click and long-press are not discoverable by users who don't already know they exist — mouse users must know to try right-clicking, and touch users must know to try long-pressing. A context menu duplicating an already-visible control is fine; a context menu as the sole affordance for an action is a documented anti-pattern.
- **vs Menu** — [E] identical popup capabilities (submenus, checkbox/radio items, groups since #2042); differs only in gesture (`contextmenu`/long-press vs click/hover/keyboard) and anchoring (pointer coordinates vs trigger element); "no `openOnHover`" and "context menus don't support detached triggers/handles" [E `Menu.Root.tsx` comment, cited in menus cluster] are the concrete missing capabilities. Use Menu when the action list needs a persistently visible trigger, hover-open behavior, or detached/imperative opening; use Context Menu when the provocation should be an incidental right-click/long-press on content that's already there for another reason.
- **vs Menubar** — [I] Menubar hosts persistent, always-visible menu triggers in a bar; Context Menu has no persistent visual affordance at all. They solve opposite discoverability problems and would never substitute for each other. Not independently argued by a maintainer; inferred from the anatomy difference. [G]
- **Don't reach for Context Menu when the surface has no other purpose** — [I] if an element exists *only* to be right-clicked, that's a Menu-triggered-by-a-visible-button in disguise with worse discoverability; Context Menu earns its place when the wrapped surface already has a primary purpose (a document canvas, a file-list row, a chat message) and the menu is a genuine secondary affordance. Inferred from the Usage Guidelines bullet's spirit rather than a separate maintainer statement. [G]

## 5. Anatomy & composition

```jsx
<ContextMenu.Root>                      // own; holds anchor state (virtual element), resets MenuRootContext
  <ContextMenu.Trigger>                 // own; <div> wrapping the contextual surface; right-click/long-press
    {/* wrapped content */}
  </ContextMenu.Trigger>
  <ContextMenu.Portal>                  // re-export of Menu.Portal
    <ContextMenu.Backdrop />            // re-export of Menu.Backdrop, optional
    <ContextMenu.Positioner>            // re-export of Menu.Positioner; anchor = pointer-derived virtual rect
      <ContextMenu.Popup>               // re-export of Menu.Popup
        <ContextMenu.Arrow />           // re-export, rare for context menu (pointer anchor has no fixed side)
        <ContextMenu.Group>            // re-export
          <ContextMenu.GroupLabel />    // re-export
          <ContextMenu.Item />          // re-export
          <ContextMenu.CheckboxItem>    // re-export
            <ContextMenu.CheckboxItemIndicator />
          </ContextMenu.CheckboxItem>
          <ContextMenu.RadioGroup>     // re-export
            <ContextMenu.RadioItem>
              <ContextMenu.RadioItemIndicator />
            </ContextMenu.RadioItem>
          </ContextMenu.RadioGroup>
          <ContextMenu.LinkItem />      // re-export
          <ContextMenu.Separator />     // shared standalone Separator primitive
          <ContextMenu.SubmenuRoot>    // re-export; nested menus
            <ContextMenu.SubmenuTrigger />
            {/* nested Popup tree, same shape */}
          </ContextMenu.SubmenuRoot>
        </ContextMenu.Group>
      </ContextMenu.Popup>
    </ContextMenu.Positioner>
  </ContextMenu.Portal>
</ContextMenu.Root>
```

- [E] `Portal` is mandatory, inherited from the library-wide explicit-anatomy doctrine (same as every popup component).
- [E] **Anchor is a virtual element, not a DOM ref**: `ContextMenuRoot.tsx` holds `anchor` state seeded with a zero-sized rect at `(0,0)` (`DOMRect.fromRect({ width: 0, height: 0, x: 0, y: 0 })`), replaced by `setAnchor` when the trigger fires. Mouse right-clicks produce a zero-size rect at the click point; touch long-presses produce a **10×10 rect** at the touch point [E salvage `ContextMenuTrigger.tsx`] — the 10×10 sizing gives touch a slightly more forgiving visual anchor than the precise mouse point.
- [E] **`ContextMenuRootContext`** (verified via salvage + direct read) carries: `anchor`/`setAnchor`, `backdropRef`, `internalBackdropRef`, `actionsRef` (`{setOpen}`), `positionerRef`, `allowMouseUpTriggerRef`, `initialCursorPointRef`, `rootId`. Error thrown when a part renders outside a Root: "Base UI: ContextMenu parts must be placed within `<ContextMenu.Root>`." [E]
- [E] **Anchor-prop precedence** (`MenuPositioner.tsx` line 90, `anchor = anchorProp ?? parent.context?.anchor`) — an explicit `anchor` prop passed to `Positioner` wins over the automatic pointer-derived anchor. This was a fix, not the original behavior: PR #3202 "anchor-prop precedence fix" (commit `283885fb3`) corrected a bug where the explicit prop was silently ignored in favor of the pointer anchor. Confirmed via `gh pr view 3202` (see §9).
- [E] Every other re-exported part follows the identical composition rules Menu documents for itself (submenu nesting via `SubmenuRoot` "to avoid ambiguity" per the library-wide explicit-anatomy doctrine, B-P18) — Context Menu adds no composition rules of its own beyond the Root/Trigger/anchor mechanics above.
- **Anatomy-diagram spec**: (1) Trigger area (dashed border, "right-click here" annotation) → (2) invisible pointer-anchor point inside the trigger → (3) Portal arrow to `<body>` → (4) Positioner box seated at the pointer point (align="start", small offset) → (5) Popup → (6) Item/CheckboxItem/RadioItem rows → (7) SubmenuTrigger → nested Popup → (8) optional Backdrop layer.

## 6. Behavior ("How it works")

- [E] **Right-click flow** (`ContextMenuTrigger.tsx`, salvage-verified): `handleContextMenu` → `stopEvent` (suppresses the native OS context menu) → `handleLongPress(clientX, clientY)` sets the anchor at the click point → a one-shot document-level `mouseup` listener (via `AbortController`) implements **drag-release-to-select**: press-and-hold the right mouse button, drag to an item, release over it to activate — all gated by `LONG_PRESS_DELAY = 500`ms (a grace timer shared with the long-press touch path, despite the name suggesting it's touch-only).
- [E] **Long-press flow**: single-touch only; 500ms `useTimeout` (per AGENTS.md convention — the salvage confirms `@base-ui/utils/useTimeout` is used exclusively here); a **10px movement threshold** cancels the long-press (disambiguates a deliberate long-press from a scroll gesture starting under the finger); `WebkitTouchCallout: 'none'` suppresses iOS's native text-selection callout menu from competing with the custom one.
- [E] **Native context menu suppression is a separate, document-level concern**: a document-level `contextmenu` listener preventDefaults events targeting the trigger or backdrops — this is deliberately more robust than relying solely on the trigger's own `onContextMenu` handler, since browsers can fire `contextmenu` in ways a single-element listener might miss.
- [E] **The Mac-only mouseup-drag-release convention, precisely pinned**: `packages/react/src/menu/item/useMenuItemCommonProps.ts` line 101, inside the shared `onMouseUp` handler every menu item uses:
  ```ts
  // On non-macOS platforms, this mouseup belongs to the right-click gesture
  // that opened the context menu, so it must not activate an item.
  if (isContextMenu && !platform.os.mac && event.button === 2) {
    return;
  }
  ```
  This resolves the salvage's flagged uncertainty ("Exact gating file not pinned… VERIFY when writing the brief") — **confirmed**: the platform check lives in the shared `useMenuItemCommonProps.ts`, used by both Menu and Context Menu items, not a context-menu-only file. `platform.os.mac` comes from `@base-ui/utils/platform`. On macOS, releasing the right mouse button over an item after a drag activates it (native-macOS-context-menu-like drag-to-select); on every other OS, that same mouseup is recognized as "the tail end of the gesture that opened the menu" and deliberately ignored so it doesn't double-fire an activation. Test coverage is split into two files reflecting this exactly: `ContextMenuRoot.test.tsx` (mocks `platform.os.mac = true`) and `ContextMenuRoot.non-mac.test.tsx` (mocks `mac: false, apple: false`, test name: "ignores context menu mouseup on non-Mac platforms").
  There's a second, independent guard alongside the platform check (same handler, lines 87-97): if the mouseup lands within **1px** of the `initialCursorPointRef` (the point where the context menu was originally opened), the item does not activate — this catches a plain right-click-then-immediately-release-without-dragging, distinguishing "I right-clicked to open the menu" from "I right-clicked, dragged to an item, and released to select it" even on Mac.
- [E] **`disabled` restores native OS behavior completely** — verified directly in `ContextMenuTrigger.test.tsx`: `does not open on right-click when disabled` (popup stays absent, `onOpenChange` never fires) **and** `does not block the native context menu when disabled` (the trigger's own `contextmenu` listener does not call `preventDefault`, asserted via `defaultPrevented === false`). This is a meaningfully different disabled contract than most Base UI popups: disabling doesn't just prevent Base UI's menu from opening, it also stops Base UI from suppressing the OS's own menu — the surface reverts fully to native browser behavior, not merely "inert."
- [E] **Nested ContextMenu-in-Trigger is tested directly**: a ContextMenu nested inside another ContextMenu's Trigger, with deep submenu mouseup propagating `reason: itemPress` to all ancestor roots — confirms the drag-release-to-select gesture correctly bubbles through arbitrarily deep overlay nesting, the same correctness class as the #2506 Menu-in-Trigger fix.
- [E] **Positioning defaults tuned for pointer-anchoring** (see §5): `align='start'` default, `alignOffset ?? 2`, `sideOffset ?? -5`, gated by `!side && align !== 'center'` (a fix landed in #2601, commit `457af0798`) — these seat the popup close to and slightly overlapping the pointer point rather than floating cleanly beside it the way a trigger-anchored Menu popup does.
- [G] The exact interaction between the drag-release gesture and `collisionAvoidance`'s `side: 'flip'` behavior (PR #e7355a2a4/#3877, salvage-listed) was not independently re-verified for this brief — flagged as inherited from the salvage's git-history-only evidence, not source-read-confirmed. [G]

## 7. Accessibility contract

APG pattern: same as Menu — **Menu Button** for the popup's internal `role="menu"`/`menuitem` semantics (the popup itself is a verbatim Menu popup) [I] inherited by direct re-export, not independently re-cited in a context-menu-specific issue. https://www.w3.org/WAI/ARIA/apg/patterns/menu-button/ (pattern link carried over from Menu's own contract; Context Menu's docs page does not independently cite an APG pattern — [G] checked `docs/.../context-menu/page.mdx`, no APG link present, unlike some other component pages).

**Keyboard interaction table** — identical to Menu's once the popup is open (same `Item`/`SubmenuTrigger`/`RadioItem`/`CheckboxItem` components), differing only in how the popup is *provoked*:

| Key / gesture | Context | Action |
|---|---|---|
| Right-click (mouse, `button: 2`) | trigger area | Opens the popup at the pointer position; suppresses the native OS context menu (unless `disabled`) |
| Long-press (single touch, ~500ms) | trigger area | Opens the popup at the touch point; cancelled by >10px movement (scroll disambiguation) |
| Hold right mouse button + drag + release over an item | popup open (any platform) | Selects the item under the pointer on release, **except**: within 1px of the original click point (no-op, treated as a plain right-click) or on non-Mac when the release is the tail of the opening gesture (no-op, `useMenuItemCommonProps.ts` gate) |
| ArrowDown/ArrowUp/Home/End | popup open | Same roving-highlight navigation as Menu (inherited, re-exported Item components) |
| Enter/Space | popup open, item highlighted | Activates the item (same as Menu) |
| Escape | popup open | Closes the popup (same as Menu; propagation-stopping default inherited) |
| Right-click again while `disabled` | trigger area | **No-op AND native context menu is restored** — disabling fully hands the surface back to the OS |

- [E] **ARIA managed by the component** — inherited wholesale from Menu since every popup part is the same component: `role="menu"` on Popup, `role="menuitem"`/`menuitemcheckbox`/`menuitemradio` on the respective Item variants, `aria-haspopup`/`aria-expanded` on SubmenuTrigger. [I] Not independently re-verified against a context-menu-specific test in this pass — inferred from part identity (re-exports cannot have different runtime ARIA behavior than their Menu counterparts).
- [E] **The salvage's key screen-reader-adjacent fact, confirmed by direct test read**: disabling the Context Menu (`<ContextMenu.Root disabled>`) does **not** block the native context menu — this is the opposite of the usual "disabled = fully inert" pattern most Base UI components follow, and matters for accessibility/expectations documentation: a disabled context menu doesn't leave the user with *no* right-click menu, it leaves them with the browser's own one.
- [E] **Touch/pointer specifics**: long-press is single-touch only (multi-touch gestures — e.g. pinch-zoom — are not hijacked); the 10px movement-cancel threshold specifically protects scrolling gestures that start with a finger held down; `WebkitTouchCallout: 'none'` prevents Safari/iOS's own text-selection popup from appearing simultaneously with the custom long-press menu.
- **Open a11y-adjacent issues (honesty list)**: [G] searched for context-menu-specific accessibility issues (`label:"component: context menu" label:accessibility`, "context menu screen reader", "long press accessibility") — none found independent of Menu's general issue set. Since every popup part is a direct Menu re-export, any a11y bug affecting Menu's popup semantics would affect Context Menu identically, but no context-menu-specific a11y report was located in this pass's budget. [G] No W3C APG pattern link exists on the Context Menu docs page itself (checked directly) — a documentable gap: the docs never state which ARIA pattern the popup follows, even though the popup is literally Menu's.

## 8. Prop-level guidance (decision-relevant props)

- [E] **`disabled` (Root)** — the single most decision-relevant prop, precisely because its effect is broader than "prevent opening": it also restores the OS's native context menu on right-click. Use when a surface should temporarily fall back to full native behavior (e.g. a feature-flagged-off custom menu, or a surface where the custom menu genuinely shouldn't apply right now) rather than merely "look disabled." [E] both test assertions (`ContextMenuTrigger.test.tsx`).
- [E] **`onOpenChange(open, eventDetails)`** — same `eventDetails.reason`/`.cancel()` contract as Menu (`ContextMenuRoot.ChangeEventDetails` extends `BaseUIChangeEventDetails<ContextMenuRoot.ChangeEventReason>`, aliased from `MenuRoot.ChangeEventReason`). No context-menu-specific reason strings exist beyond what Menu already defines — `itemPress`, `escapeKey`, etc. carry over unchanged. [I] not independently re-enumerated per-reason for context-menu in this pass.
- [E] **`Positioner.anchor`** — explicit override of the automatic pointer-derived anchor. Use when the popup should appear at a fixed or computed position rather than exactly where the user clicked/long-pressed (e.g. always aligning to a specific corner of the trigger area regardless of click position). Precedence: an explicit `anchor` prop always wins over the pointer-derived one (`anchorProp ?? parent.context?.anchor`) — this is the fix landed by PR #3202 (previously the explicit prop was silently ignored; see §9).
- [E] **`Positioner.align`/`alignOffset`/`sideOffset`** — default to `'start'`/`2`/`-5` specifically under context-menu parentage (§5, §6), tuned for pointer-seated placement. Override these when the default near-overlap-with-cursor placement doesn't suit a particular surface (e.g. wanting more breathing room between the cursor and the popup).
- [E] **No `openOnHover`/`delay`/`closeDelay`/`handle`/`triggerId`/`defaultTriggerId`** — all `Omit`ted from the type (§2); these are the props that signal "this scenario needs Menu, not Context Menu" — detached/imperative opening and hover-open behavior are simply not available here.
- [E] **Data attributes on Trigger**: `data-popup-open`, `data-pressed` — the latter added in commit `b1252d04b` (#3195); before that fix, State was an empty object with no styling hooks at all. [E salvage.] Style a pressed/active-right-click visual state via `[data-pressed]`.
- [E] **Styling contract, inherited wholesale from Menu** since every popup part is the same component: Popup/Positioner `data-open`/`data-closed`/`data-starting-style`/`data-ending-style`, `data-side`/`data-align`; Item `data-highlighted`/`data-disabled`; CheckboxItem/RadioItem `data-checked` equivalents. [I] not independently re-enumerated per-attribute for context-menu in this pass — see Menu's own brief/DataAttributes files for the authoritative per-part list.

## 9. Decision log

- **Introducing** — PR #1665, "[context menu] Create new `ContextMenu` component" (commit `03472e57c`) [E salvage].
- **#2009 — `CheckboxItemIndicator` export fix** (commit `241b49b5c`) [E salvage].
- **#2042 — `SubmenuRoot` lands dual-scoped** (commit `441bc811c`) — the same submenu mechanism serves Menu and Context Menu from this point [E salvage].
- **#2601 — offset-defaults gating** (commit `457af0798`) — the `!side && align !== 'center'` gate on the tuned `alignOffset`/`sideOffset` defaults [E salvage, confirmed by direct `MenuPositioner.tsx` read].
- **2025-08-15 — #2506, "[menu] Fix menu not opening when inside context menu trigger"** (baptisteArno, commit `743cd3420`, merged 2025-08-15T13:08:29Z) — closes #2505; adds the `MenuRootContext.Provider value={undefined}` reset and the "[FINAL BOSS ⚔️]" nested-overlay experiment scenario in the same commit. [E] **verified directly via `gh pr view 2506`** — title and merge date confirmed; body is the single line "Fixes #2505," consistent with the salvage's characterization. This is the architectural correctness commit of the component's history: it's the moment deep-nesting composition (Menu inside ContextMenu.Trigger, and vice versa) became a first-class, tested guarantee rather than an accident.
- **#2768 — submenu close propagation** (commit `72e691b1d`), shared scope `[context menu][menubar]` — introduces `findRootOwnerId` utility used by both components' close-cascade logic [E salvage; cross-referenced against menubar salvage which cites the same commit].
- **#2849 — initial double-click handling** (commit `8cf433a9f`) [E salvage].
- **#3195 — trigger state attributes** (commit `b1252d04b`) — adds `data-pressed`; before this, Trigger's `State` was `{}` with zero styling hooks [E salvage].
- **#3202 — anchor-prop precedence fix** (commit `283885fb3`) — confirmed by the salvage as a fix (not the original design): an explicit `anchor` prop passed to Positioner was previously silently ignored in favor of the automatic pointer-derived anchor; after this fix, the explicit prop correctly wins (`anchorProp ?? parent.context?.anchor` — verified directly in current `MenuPositioner.tsx` line 90). [G] The PR's own body/review discussion was **not** independently `gh`-fetched in this pass (2-lookup budget spent on #2506 and reserved for verification priorities; #3202's rationale is inferred from the source-code precedence itself, which is unambiguous, rather than from PR prose).
- **#3274 — mouseup-at-initial-cursor-point guard** (commit `0ed34c0ad`) — the ±1px no-op guard in `useMenuItemCommonProps.ts`, confirmed by direct source read (§6) [E].
- **#3645 — sibling elements** (commit `dd135bf18`) [E salvage].
- **#3806 — disabled fix** (commit `a19c1b818`) [E salvage].
- **2025 — #3944, non-Mac mouseup gate** (commit `d1f55d852`) — confirmed by direct source read to live in `useMenuItemCommonProps.ts` (§6), resolving the salvage's flagged uncertainty about the exact gating file. [E]
- **#3877 — `collisionAvoidance` side:flip** (commit `e7355a2a4`) [E salvage; interaction with drag-release not independently re-verified, §6 [G]].
- **#5121 (newest) — usage guidelines + "Using with Menu" demo** (commit `f5ee3ad47`) — added the docs page's single Usage Guidelines bullet ("enhancement only") and the cross-reference demo showing Menu and Context Menu sharing one item module [E salvage].

## 10. Pitfalls & FAQ

- **"My context menu doesn't open when it's nested inside another popup's trigger"** → fixed upstream by #2506 (2025-08-15); if seeing this on an older version, upgrade. The fix's own experiment file (`experiments/context-menu.tsx`, "[FINAL BOSS ⚔️]") documents exactly this class of deep-nesting scenario as the maintainers' primary manual-testing concern for the component. [E]
- **"Setting an explicit `anchor` on the Positioner doesn't do anything — it still opens at the pointer"** → fixed by #3202; the explicit prop now correctly takes precedence over the automatic pointer-derived anchor. If still seeing the old behavior, check the installed version. [E]
- **"Drag-to-select from a right-click works on my Mac but not for teammates on Windows/Linux"** → intentional platform split, not a bug: on non-Mac platforms, the mouseup that ends the right-click gesture is deliberately ignored so it doesn't double-fire an item activation; only Mac supports the native-macOS-style drag-hold-release-to-select gesture. Confirmed by the dedicated `ContextMenuRoot.non-mac.test.tsx` file mocking `platform.os.mac = false`. [E]
- **"I disabled the context menu but right-clicking still shows something"** → expected: `disabled` restores the browser's native context menu rather than showing nothing. If the goal is "no menu at all, disabled-looking," that's not what `disabled` does here — it hands the surface back to the OS. [E] both `ContextMenuTrigger.test.tsx` assertions.
- **"Using Context Menu as the only way to trigger an important action, and users complain they can't find it"** → the docs' own Usage Guidelines bullet warns against exactly this: right-click and long-press are inherently undiscoverable gestures; always provide a visible control for the same action. [E] docs page.
- **No context-menu-specific z-index/stacking pitfalls found beyond what Menu already documents** — since every popup part is a direct Menu re-export, Menu's stacking guidance (z-index on Positioner, not Popup; B-M1 in principles.md) applies unchanged. [I] not independently re-tested for context-menu; inherited by part identity. [G]

## 11. Real-world patterns observed

- [E] Corpus status: `research/d-real-world-usage/_corpus/repos.json` exists (877 repos total across all components), but **no `research/d-real-world-usage/context-menu/` directory exists** — confirmed absent by direct check. [G] **pending Phase D**.
- [I] The salvage notes a suggestive cross-reference: the in-repo experiment's "bare `Menu.Submenu*` parts inside `ContextMenu.Popup`" pattern (proving part interchangeability in-repo) matches a real-world usage pattern already spotted in the Select corpus's neighboring cache (`research/d-real-world-usage/_cache/inspect-menu/stagewise-io__stagewise/`) — a repo mixing Menu and ContextMenu parts. This is a single anecdotal sighting from an adjacent component's cache, not a targeted context-menu search; treat as a weak signal only. [G] No targeted context-menu corpus search was performed in this pass.
- [I] Expected archetypes (inferred from the component's own shipped demos and general desktop-app UX conventions, not observed corpus data): file/row context menus in list or table UIs (rename/delete/duplicate); canvas/editor right-click menus (design tools, document editors); chat-message or card long-press menus on touch (reply/copy/delete). None of these are corpus-verified — flag as [I]/[G] until Phase D runs.

## 12. Story plan

See [`story-plan.md`](./story-plan.md) — 12 planned stories: right-click-open interaction play (required, using the exact `fireEvent.contextMenu(trigger, { clientX, clientY, button: 2 })` pattern the test suite uses), submenu, checkbox/radio items, custom-anchor override (#3202 recreation), long-press description story, disabled-restores-native-menu demonstration, and the enhancement-only usage guideline framed as a Do/Don't.
