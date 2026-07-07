# context-menu — salvaged mining notes (brief.md NOT yet written)

Provenance: a sub-miner of the killed "Lean briefs: dialog/menu variants" batch agent completed after its parent was stopped (session paused 2026-07-07 ~09:45 by user request). Its full report is preserved below verbatim so the future brief-writer starts from evidence, not from scratch. All file paths and commit shas were reported as verified by the miner; the three flagged `gh` lookups (#2506, #3202, #3944 PR bodies) were NOT performed.

---

## Source code (part-by-part re-export precision)

`packages/react/src/context-menu/index.parts.ts`: **only 2 of 19 parts are original: `Root` and `Trigger`** — Backdrop/Portal/Positioner/Popup/Arrow/Group/GroupLabel/Item/CheckboxItem/CheckboxItemIndicator/LinkItem/RadioGroup/RadioItem/RadioItemIndicator/SubmenuRoot/SubmenuTrigger are verbatim Menu re-exports; `Separator` is the shared primitive. Type re-exports alias (`MenuXProps as ContextMenuXProps`) — no parallel prop-type hierarchy.

`ContextMenuRoot.tsx` (94 lines): JSDoc "A component that creates a context menu activated by right clicking or long pressing. Doesn't render its own HTML element." Holds `anchor` = virtual element `{ getBoundingClientRect }` (zero-sized rect at (0,0) initially). Wraps children in `<MenuRootContext.Provider value={undefined}>` before rendering `<Menu.Root>` — the reset that lets MenuRoot detect context-menu parentage (#2506 guard). Props = `Omit<Menu.Root.Props, 'handle' | 'triggerId' | 'defaultTriggerId' | 'modal' | 'openOnHover' | 'delay' | 'closeDelay' | ...>` with inline comments: no detached-trigger support (opens from pointer position, not a registered trigger).

`ContextMenuTrigger.tsx` (232 lines): JSDoc "An area that opens the menu on right click or long press. Renders a `<div>` element."
- Right-click: `handleContextMenu` → `stopEvent` → `handleLongPress(clientX, clientY)` → one-shot document `mouseup` listener (AbortController) implementing drag-release-to-select, guarded by `LONG_PRESS_DELAY = 500`ms grace timer.
- Long-press: single-touch only; 500ms `useTimeout`; **10px movement threshold** cancels (scroll disambiguation); `WebkitTouchCallout: 'none'` suppresses iOS callout.
- Mouse anchors get a zero-size rect; touch gets a **10×10 rect** at the touch point.
- Separate document-level `contextmenu` listener preventDefaults events targeting trigger/backdrops (suppresses native menu robustly).
- Data attributes: `data-popup-open`, `data-pressed` (added in #3195 / b1252d04b; before that, State was `{}`).
- Uses `@base-ui/utils/useTimeout` exclusively (repo convention confirmed in practice).

`MenuPositioner.tsx` lines 89–96 branch on `parent.type === 'context-menu'`: `anchor = anchorProp ?? parent.context?.anchor` (explicit prop wins — fixed by #3202/283885fb3, previously silently ignored); defaults `align='start'`, `alignOffset ?? 2`, `sideOffset ?? -5` (gated `!side && align !== 'center'` since #2601/457af0798). So re-exported parts carry live context-menu-aware conditionals — same components, internal branches.

`ContextMenuRootContext.ts`: anchor/setAnchor, backdropRef, internalBackdropRef, actionsRef({setOpen}), positionerRef, allowMouseUpTriggerRef, initialCursorPointRef, rootId. Error: "Base UI: ContextMenu parts must be placed within `<ContextMenu.Root>`."

## Docs page

`docs/src/app/(docs)/react/components/context-menu/page.mdx` (169 lines). Subtitle: "A menu that appears at the pointer on right click or long press."
- Usage guidelines: ONE bullet — "**Use context menus as an enhancement**: Don't make a context menu the only way to perform actions… Always provide visible controls…"
- Examples: cross-ref line "[Menu](/react/components/menu#examples) displays additional demos, many of which apply to the context menu as well" (no dedicated checkbox/radio demos) + `### Using with Menu` (DemoContextMenuWithMenu, added #5121 June 2026) + `### Nested menu` (DemoContextMenuSubmenu). Demos dirs: hero/, submenu/, with-menu/.
- API reference lists all parts EXCEPT Backdrop (in Anatomy but missing from API headings — likely docs omission).

## Tests

- Right-click simulation: **`fireEvent.contextMenu(trigger, { clientX, clientY, button: 2 })`** (NOT userEvent.pointer). Mouseup cancellation via `fireEvent.mouseUp(item, { button: 2, clientX, clientY })`.
- Long-press: `new Touch({ identifier: 0, target, clientX, clientY })` + `fireEvent.touchStart` + `clock.tick(500)`; movement-cancel tested with 20px move; ALL long-press tests `describe.skipIf(isJSDOM)`.
- Fake timers: `clock.withFakeTimers()` + `clockOptions: { shouldAdvanceTime: true }`.
- **Platform split (major)**: `ContextMenuRoot.test.tsx` mocks mac:true (mouseup-drag-release selects); `ContextMenuRoot.non-mac.test.tsx` mocks mac:false — popup stays open on mouseup; behavior is **Mac-only** (d1f55d852 / #3944). Exact gating file not pinned (candidates: useMenuItem.ts onMouseUp / MenuRoot.tsx) — VERIFY when writing the brief.
- `disabled`: right-click doesn't open AND native context menu is NOT blocked (defaultPrevented === false asserted) — disabling restores OS behavior.
- Nested ContextMenu-in-Trigger tested; deep submenu mouseup propagates `reason: itemPress` to all roots.

## Experiments

`docs/src/app/(private)/experiments/context-menu.tsx` (401 lines): 5 scenarios escalating to "[FINAL BOSS ⚔️] Nested context menus, popover with a menu and a context menu inside" (added in the same commit as fix #2506) — deep nesting/overlay composition was the dominant manual-testing concern. Scenario 2 uses bare `Menu.Submenu*` parts inside `ContextMenu.Popup` — in-repo proof of part interchangeability (matches the stagewise real-world pattern in `research/d-real-world-usage/_cache/inspect-menu/stagewise-io__stagewise/`).

## Git history (scope is `[context menu]` with a space; hyphenated never used)

- Introducing: `03472e57c` — "[context menu] Create new `ContextMenu` component" (#1665).
- `241b49b5c` (#2009) CheckboxItemIndicator export fix; `441bc811c` (#2042) SubmenuRoot lands dual-scoped; `457af0798` (#2601) offset-defaults gating; `743cd3420` (#2506) Menu-inside-ContextMenu.Trigger fix + FINAL BOSS experiment + `!parentContext` guard; `72e691b1d` (#2768) submenu close propagation; `8cf433a9f` (#2849) initial double-click; `283885fb3` (#3202) anchor-prop precedence fix; `b1252d04b` (#3195) trigger state attrs; `0ed34c0ad` (#3274) block mouseup at initial cursor point (±1px, in useMenuItem.ts); `dd135bf18` (#3645) sibling elements; `a19c1b818` (#3806) disabled fix; `d1f55d852` (#3944) non-Mac mouseup gate; `e7355a2a4` (#3877) collisionAvoidance side:flip; `f5ee3ad47` (#5121) usage guidelines + with-menu demo (newest).
- No commit debates "why a separate Root instead of a Menu prop" — the why is implicit in the thin-wrapper composition (+ atomiks quote in #3365 per the menu brief).

## Recommended gh lookups for the brief-writer (not yet performed)

1. PR #2506 body (architecture: MenuRootContext undefined reset rationale).
2. PR #3202 body (anchor-precedence pitfall).
3. PR #3944 body (Mac-only mouseup convention + which file gates it).
