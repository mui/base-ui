# Bundle Size Findings — `packages/react/src`

> **Goal:** Optimize for gzip compression. No implementation — findings only.
>
> **Important caveat:** Converting `enum` to `as const` can *increase* gzip size (verified in this repo). The real wins come from **eliminating duplicate enum IIFEs entirely**, not changing their format. See MEMORY.md for details.

---

## Table of Contents

1. [HIGH — Duplicate Enum IIFEs (Cross-Component)](#1-high--duplicate-enum-iifes-cross-component)
2. [HIGH — Duplicate CssVars Enums](#2-high--duplicate-cssvars-enums)
3. [HIGH — Pre-Merge Shared stateAttributesMapping Spreads](#3-high--pre-merge-shared-stateattributesmapping-spreads)
4. [MEDIUM — Pure-Alias Enums (Delegate-Only, No Own Keys)](#4-medium--pure-alias-enums-delegate-only-no-own-keys)
5. [MEDIUM — Single-Member Enums (Documentation-Only)](#5-medium--single-member-enums-documentation-only)
6. [MEDIUM — Object Allocations on Hot Paths](#6-medium--object-allocations-on-hot-paths)
7. [LOW — Redundant Variables / Minor Code Savings](#7-low--redundant-variables--minor-code-savings)
8. [LOW — Copy-Pasted Functions Across Components](#8-low--copy-pasted-functions-across-components)
9. [INFORMATIONAL — Inconsistency / Correctness](#9-informational--inconsistency--correctness)

---

## 1. HIGH — Duplicate Enum IIFEs (Cross-Component)

These are groups of enums that are **structurally identical** (same keys, same values) but defined independently in separate files. Each produces its own IIFE in compiled JS. Consolidating to a single shared enum eliminates N-1 IIFEs per group.

### 1a. Progress DataAttributes — 5 identical 3-key enums

All contain `{ complete = 'data-complete', indeterminate = 'data-indeterminate', progressing = 'data-progressing' }`.

| File |
|------|
| `progress/root/ProgressRootDataAttributes.ts` |
| `progress/indicator/ProgressIndicatorDataAttributes.ts` |
| `progress/track/ProgressTrackDataAttributes.ts` |
| `progress/value/ProgressValueDataAttributes.ts` |
| `progress/label/ProgressLabelDataAttributes.ts` |

**Fix:** Create a single `ProgressDataAttributes` enum; re-export from each sub-component file.

### 1b. Slider DataAttributes — 5 identical 8-key enums (+ Thumb with 1 extra)

All contain `{ dragging, orientation, disabled, valid, invalid, touched, dirty, focused }`.

| File |
|------|
| `slider/root/SliderRootDataAttributes.ts` |
| `slider/control/SliderControlDataAttributes.ts` |
| `slider/indicator/SliderIndicatorDataAttributes.ts` |
| `slider/track/SliderTrackDataAttributes.ts` |
| `slider/value/SliderValueDataAttributes.ts` |
| `slider/thumb/SliderThumbDataAttributes.ts` (adds `index`) |

**Fix:** Create `SliderCommonDataAttributes`; Thumb extends with `index`.

### 1c. Switch Root ≡ Switch Thumb — exact duplicate (10 keys)

| File |
|------|
| `switch/root/SwitchRootDataAttributes.ts` |
| `switch/thumb/SwitchThumbDataAttributes.ts` |

**Fix:** Thumb re-exports Root enum.

### 1d. AccordionHeader ≡ AccordionItem — exact duplicate (3 keys)

| File |
|------|
| `accordion/header/AccordionHeaderDataAttributes.ts` |
| `accordion/item/AccordionItemDataAttributes.ts` |

**Fix:** Header re-exports Item enum (or vice versa).

### 1e. DialogPopupDataAttributes ≡ DialogViewportDataAttributes — exact duplicate (6 keys)

| File |
|------|
| `dialog/popup/DialogPopupDataAttributes.ts` |
| `dialog/viewport/DialogViewportDataAttributes.ts` |

**Fix:** Viewport imports from Popup. In `DialogViewport.tsx`, replace `DialogViewportDataAttributes` references with `DialogPopupDataAttributes`.

### 1f. Toast single-entry enums — 4 files, all `{ type = 'data-type' }`

| File |
|------|
| `toast/action/ToastActionDataAttributes.ts` |
| `toast/close/ToastCloseDataAttributes.ts` |
| `toast/title/ToastTitleDataAttributes.ts` |
| `toast/description/ToastDescriptionDataAttributes.ts` |

**Fix:** Single shared `ToastCommonDataAttributes` or inline the literal `'data-type'`.

### 1g. Field validity keys — 6 keys duplicated across 15+ enums

The keys `valid`, `invalid`, `touched`, `dirty`, `filled`, `focused` (all `'data-*'`) appear independently in:

`FieldRootDataAttributes`, `FieldControlDataAttributes`, `InputDataAttributes`, `SwitchRootDataAttributes`, `SwitchThumbDataAttributes`, `RadioRootDataAttributes`, `RadioIndicatorDataAttributes`, `NumberFieldRootDataAttributes`, `SliderRootDataAttributes`, `SliderControlDataAttributes`, `SliderIndicatorDataAttributes`, `SliderTrackDataAttributes`, `SliderValueDataAttributes`, `SelectTriggerDataAttributes`, `ComboboxInputDataAttributes`, `ComboboxTriggerDataAttributes`

**Fix:** Create a shared `FieldValidityDataAttributes` enum; each component references it for these 6 keys (same pattern as `CommonPopupDataAttributes`).

### 1h. Viewport DataAttributes — 4 identical 4-5 key enums

All contain `{ current, previous, activationDirection, transitioning, instant }`.

| File |
|------|
| `menu/viewport/MenuViewportDataAttributes.ts` |
| `popover/viewport/PopoverViewportDataAttributes.ts` |
| `tooltip/viewport/TooltipViewportDataAttributes.ts` |
| `preview-card/viewport/PreviewCardViewportDataAttributes.ts` |

**Fix:** Create `CommonViewportDataAttributes`.

### 1i. Tabs DataAttributes — `activationDirection` + `orientation` repeated across 4 enums

| File |
|------|
| `tabs/root/TabsRootDataAttributes.ts` |
| `tabs/list/TabsListDataAttributes.ts` |
| `tabs/tab/TabsTabDataAttributes.ts` |
| `tabs/indicator/TabsIndicatorDataAttributes.ts` |

**Fix:** Shared `TabsCommonDataAttributes`.

### 1j. ScrollArea overflow keys — 6 keys repeated across 3 enums

Keys: `hasOverflowX`, `hasOverflowY`, `overflowXStart`, `overflowXEnd`, `overflowYStart`, `overflowYEnd`.

| File |
|------|
| `scroll-area/root/ScrollAreaRootDataAttributes.ts` |
| `scroll-area/scrollbar/ScrollAreaScrollbarDataAttributes.ts` |
| `scroll-area/viewport/ScrollAreaViewportDataAttributes.ts` |

**Fix:** Shared `ScrollAreaOverflowDataAttributes`.

### 1k. Select ScrollUp/ScrollDown Arrow — 2 identical enums

| File |
|------|
| `select/scroll-up-arrow/SelectScrollUpArrowDataAttributes.ts` |
| `select/scroll-down-arrow/SelectScrollDownArrowDataAttributes.ts` |

**Fix:** Single `SelectScrollArrowDataAttributes`.

---

## 2. HIGH — Duplicate CssVars Enums

### 2a. Positioner CssVars — 6 identical 5-entry enums

All contain `{ availableWidth, availableHeight, anchorWidth, anchorHeight, transformOrigin }` with the same `'--*'` string values.

| File |
|------|
| `menu/positioner/MenuPositionerCssVars.ts` |
| `tooltip/positioner/TooltipPositionerCssVars.ts` |
| `select/positioner/SelectPositionerCssVars.ts` |
| `preview-card/positioner/PreviewCardPositionerCssVars.ts` |
| `combobox/positioner/ComboboxPositionerCssVars.ts` |
| `toast/positioner/ToastPositionerCssVars.ts` |
| `popover/positioner/PopoverPositionerCssVars.ts` (adds `positionerWidth`, `positionerHeight`) |
| `navigation-menu/positioner/NavigationMenuPositionerCssVars.ts` (adds same 2) |

**Fix:** Create `CommonPositionerCssVars` with 5 base keys. Popover/NavMenu extend with 2 extra.

### 2b. Viewport/Popup CssVars — 5+ identical 2-entry enums

All contain `{ popupWidth = '--popup-width', popupHeight = '--popup-height' }`.

| File |
|------|
| `menu/viewport/MenuViewportCssVars.ts` |
| `popover/viewport/PopoverViewportCssVars.ts` |
| `tooltip/viewport/TooltipViewportCssVars.ts` |
| `preview-card/viewport/PreviewCardViewportCssVars.ts` |
| `navigation-menu/popup/NavigationMenuPopupCssVars.ts` |

**Fix:** Create `CommonPopupSizeCssVars`.

---

## 3. HIGH — Pre-Merge Shared stateAttributesMapping Spreads

The pattern `{ ...baseMapping, ...transitionStatusMapping }` is spread into a new module-level object in 10+ files:

| File | Line |
|------|------|
| `menu/popup/MenuPopup.tsx` | ~22 |
| `popover/popup/PopoverPopup.tsx` | ~22 |
| `tooltip/popup/TooltipPopup.tsx` | ~16 |
| `preview-card/popup/PreviewCardPopup.tsx` | ~17 |
| `menu/backdrop/MenuBackdrop.tsx` | ~13 |
| `popover/backdrop/PopoverBackdrop.tsx` | ~12 |
| `select/backdrop/SelectBackdrop.tsx` | ~13 |
| `select/popup/SelectPopup.tsx` | ~39 |
| `combobox/popup/ComboboxPopup.tsx` | ~25 |
| `navigation-menu/popup/NavigationMenuPopup.tsx` | ~15 |

Each creates a separate merged object at module load time with the same content.

**Fix:** Export a pre-merged `popupWithTransitionStateMapping` from `utils/popupStateMapping.ts`. All 10+ files import the single reference.

---

## 4. MEDIUM — Pure-Alias Enums (Delegate-Only, No Own Keys)

These enums add zero new string values — every key delegates to another enum. The entire IIFE is pure overhead.

### 4a. Backdrop DataAttributes — 6 files, all delegating 4 keys to CommonPopupDataAttributes

| File |
|------|
| `dialog/backdrop/DialogBackdropDataAttributes.ts` |
| `drawer/backdrop/DrawerBackdropDataAttributes.ts` |
| `combobox/backdrop/ComboboxBackdropDataAttributes.ts` |
| `menu/backdrop/MenuBackdropDataAttributes.ts` |
| `popover/backdrop/PopoverBackdropDataAttributes.ts` |
| `select/backdrop/SelectBackdropDataAttributes.ts` |

None are referenced outside their own files (documentation-only exports).

**Fix:** Remove or consolidate into a single `CommonBackdropDataAttributes`.

### 4b. Positioner DataAttributes — 6 files delegating 5 keys to CommonPopupDataAttributes

| File |
|------|
| `menu/positioner/MenuPositionerDataAttributes.ts` |
| `popover/positioner/PopoverPositionerDataAttributes.ts` |
| `tooltip/positioner/TooltipPositionerDataAttributes.ts` |
| `select/positioner/SelectPositionerDataAttributes.ts` |
| `preview-card/positioner/PreviewCardPositionerDataAttributes.ts` |
| `combobox/positioner/ComboboxPositionerDataAttributes.ts` (adds `empty`) |

**Fix:** Create `CommonPositionerDataAttributes`.

### 4c. Arrow DataAttributes — 7 files delegating 4-5 keys to CommonPopupDataAttributes + own `uncentered`

| File |
|------|
| `menu/arrow/MenuArrowDataAttributes.ts` |
| `popover/arrow/PopoverArrowDataAttributes.ts` |
| `tooltip/arrow/TooltipArrowDataAttributes.ts` |
| `select/arrow/SelectArrowDataAttributes.ts` |
| `preview-card/arrow/PreviewCardArrowDataAttributes.ts` |
| `navigation-menu/arrow/NavigationMenuArrowDataAttributes.ts` |
| `combobox/arrow/ComboboxArrowDataAttributes.ts` |

**Fix:** Create `CommonArrowDataAttributes`.

### 4d. Trigger DataAttributes — 3 identical files delegating 2 keys to CommonTriggerDataAttributes

| File |
|------|
| `menu/trigger/MenuTriggerDataAttributes.ts` |
| `popover/trigger/PopoverTriggerDataAttributes.ts` |
| `navigation-menu/trigger/NavigationMenuTriggerDataAttributes.ts` |
| `context-menu/trigger/ContextMenuTriggerDataAttributes.ts` |

**Fix:** Direct re-export or shared `CommonTriggerDataAttributes` alias.

### 4e. Transition-only aliases

| File | Delegates to |
|------|-------------|
| `avatar/image/AvatarImageDataAttributes.ts` | `TransitionStatusDataAttributes` (2 keys) |
| `combobox/item-indicator/ComboboxItemIndicatorDataAttributes.ts` | `TransitionStatusDataAttributes` (2 keys) |

Not referenced outside their own files.

**Fix:** Remove or `as const` (safe for 2 members).

---

## 5. MEDIUM — Single-Member Enums (Documentation-Only)

These 1-entry enums generate a full IIFE for a single string value and are not referenced at runtime (only for public API docs).

| File | Member |
|------|--------|
| `checkbox-group/CheckboxGroupDataAttributes.ts` | `disabled = 'data-disabled'` |
| `button/ButtonDataAttributes.tsx` | `disabled = 'data-disabled'` |
| `dialog/close/DialogCloseDataAttributes.ts` | `disabled = 'data-disabled'` |
| `calendar/decrement-month/CalendarDecrementMonthDataAttributes.ts` | `disabled = 'data-disabled'` |
| `calendar/increment-month/CalendarIncrementMonthDataAttributes.ts` | `disabled = 'data-disabled'` |
| `collapsible/trigger/CollapsibleTriggerDataAttributes.ts` | `panelOpen = 'data-panel-open'` |
| `dialog/popup/DialogPopupCssVars.ts` | `nestedDialogs = '--nested-dialogs'` |
| `drawer/backdrop/DrawerBackdropCssVars.ts` | `swipeProgress = '--drawer-swipe-progress'` |

**Fix:** Convert to `as const` (safe for 1 member — no gzip regression risk) or inline the literal string at usage sites.

### Transitive import cost

`utils/collapsibleOpenStateMapping.ts` imports `CollapsiblePanelDataAttributes` and `CollapsibleTriggerDataAttributes` just for their string values. This forces those enum IIFEs to load for any component using collapsible state mapping.

**Fix:** Inline `'data-open'`, `'data-closed'`, `'data-panel-open'` directly in `collapsibleOpenStateMapping.ts`.

---

## 6. MEDIUM — Object Allocations on Hot Paths

### 6a. `composite/composite.ts` — `getStyles()` called twice for same elements

Lines 80-81 and 134-135: When both `isOverflowingX` and `isOverflowingY` are true, `getComputedStyle` is called 4 times (2 per axis) for the same elements, creating 4 separate 8-property objects.

**Fix:** Hoist `getStyles()` calls above both `if` blocks:
```ts
const containerStyles = getStyles(scrollContainer);
const elementStyles = getStyles(element);
```

### 6b. `composite/root/useCompositeRoot.ts` — Object literals on every keydown

Lines 177-295: The `onKeyDown` handler creates 4+ intermediate objects (lookup maps for `forwardKey`, `backwardKey`, `forwardKeys`, `backwardKeys`, `preventedKeys`) on every keypress.

**Fix:** Replace object-lookup pattern with conditionals:
```ts
const forwardKey = orientation === 'vertical' ? ARROW_DOWN : horizontalForwardKey;
const backwardKey = orientation === 'vertical' ? ARROW_UP : horizontalBackwardKey;
```

### 6c. `useAnchorPositioning.ts` — `getLogicalSide` creates object per positioning tick

Lines 37-44: Creates a 4-key object literal on every call to map `renderedSide` to a `Side`.

**Fix:** Replace with `switch`/conditionals:
```ts
if (renderedSide === 'top' || renderedSide === 'bottom') return renderedSide;
if (renderedSide === 'right') return isLogicalSideParam ? (isRtl ? 'inline-start' : 'inline-end') : 'right';
return isLogicalSideParam ? (isRtl ? 'inline-end' : 'inline-start') : 'left';
```

### 6d. `useSwipeDismiss.ts` — Repeated `{ x: 0, y: 0 }` allocations

Lines 150-151, 257-279: ~10 allocations of `{ x: 0, y: 0 }` and `{ x: 0, y: 0, scale: 1 }` in `reset()`.

**Fix:** Hoist module-level constants:
```ts
const ZERO_OFFSET = { x: 0, y: 0 };
const IDENTITY_TRANSFORM = { x: 0, y: 0, scale: 1 };
```

### 6e. `useSwipeDismiss.ts` — `getPointerProps`/`getTouchProps` return `{}` when disabled

Lines 1011, 1025: Each call allocates a new empty object.

**Fix:** Return `EMPTY_OBJECT` constant.

### 6f. `usePopupViewport.tsx` — Intermediate `fromCenter`/`toCenter` objects in `calculateRelativePosition`

Lines 317-333: 2 intermediate objects can be eliminated by inlining the math.

**Fix:**
```ts
return {
  horizontal: (toRect.left + toRect.width / 2) - (fromRect.left + fromRect.width / 2),
  vertical: (toRect.top + toRect.height / 2) - (fromRect.top + fromRect.height / 2),
};
```

### 6g. `adaptiveOriginMiddleware.ts` — Initial `offsetDimensions` always overwritten

Lines 37-53: `{ width: 0, height: 0 }` allocated then immediately replaced.

**Fix:** Use two scalar variables `offsetWidth`/`offsetHeight` instead.

### 6h. `createBaseUIEventDetails.ts` — `new Event('base-ui')` fallback per call

Lines 130, 160: Creates a new `Event` object each time no event is provided.

**Fix:** Hoist `const FALLBACK_EVENT = new Event('base-ui')` at module level (safe if never mutated).

---

## 7. LOW — Redundant Variables / Minor Code Savings

### 7a. `useSwipeDismiss.ts` line 117 — `ignoreSelector` aliases `DEFAULT_IGNORE_SELECTOR`

`const ignoreSelector = DEFAULT_IGNORE_SELECTOR;` — use `DEFAULT_IGNORE_SELECTOR` directly.

### 7b. `formatNumber.ts` lines 3-4 — Extra wrapper object in cache key

`JSON.stringify({ locale, options })` wraps in an unnecessary object.

**Fix:** `\`${String(locale)}|${JSON.stringify(options)}\``

### 7c. `accordion/panel/AccordionPanel.tsx` line 159 — Redundant condition

`keepMounted || hiddenUntilFound || (!keepMounted && mounted)` simplifies to `keepMounted || hiddenUntilFound || mounted`.

### 7d. Backdrop style objects recreated every render

`menu/backdrop/MenuBackdrop.tsx` ~50-58 and `popover/backdrop/PopoverBackdrop.tsx` ~48-52 both create `{ userSelect: 'none', WebkitUserSelect: 'none', pointerEvents: ... }` inline.

**Fix:** Hoist constant portions or pre-build two frozen style objects (with/without `pointerEvents: 'none'`).

---

## 8. LOW — Copy-Pasted Functions Across Components

### 8a. `defaultInitialFocus` — identical in DialogPopup and PopoverPopup

`dialog/popup/DialogPopup.tsx` lines 69-74 and `popover/popup/PopoverPopup.tsx` lines 77-84 contain the exact same function.

**Fix:** Extract to shared utility, e.g. `createDefaultInitialFocus(popupRef)`.

### 8b. `usePopupAutoResize.ts` — `setPopupCssSize` / `setPositionerCssSize` near-identical

Lines 266-278: Two functions differ only in CSS variable names and fallback string.

**Fix:** Single generic `setElementCssSize(element, size, widthVar, heightVar)`.

---

## 9. INFORMATIONAL — Inconsistency / Correctness

### 9a. `PopoverPopupDataAttributes` uses hardcoded strings instead of delegating

File: `popover/popup/PopoverPopupDataAttributes.ts` lines 24-29:
```ts
side = 'data-side',   // should be: CommonPopupDataAttributes.side
align = 'data-align', // should be: CommonPopupDataAttributes.align
```

If the strings in `CommonPopupDataAttributes` ever change, `PopoverPopupDataAttributes` would silently diverge. This is a correctness risk.

### 9b. Filename typo

`navigation-menu/link/NavigationMenuLinikDataAttributes.ts` — `Linik` should be `Link`.

### 9c. `ComboboxClearDataAtributes.ts` — filename typo

Missing second `t`: should be `ComboboxClearDataAttributes.ts`.

---

## Impact Summary

| Category | Files | Estimated Savings |
|---|---|---|
| Duplicate enum IIFEs (sections 1, 4) | ~70 files | **Highest** — eliminates dozens of redundant IIFEs |
| Duplicate CssVars enums (section 2) | ~11 files | **High** — 6 identical 5-entry IIFEs + 5 identical 2-entry IIFEs |
| Pre-merged stateAttributesMapping (section 3) | ~10 files | **High** — eliminates 10+ duplicate merged objects |
| Hot-path object allocations (section 6) | ~6 files | **Medium** — runtime perf + minor gzip from less code |
| Single-member enums (section 5) | ~8 files | **Medium** — small per-file, adds up |
| Minor code savings (sections 7, 8) | ~8 files | **Low** — marginal gzip improvement |
