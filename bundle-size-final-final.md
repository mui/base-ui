# Gzip Bundle Size Optimization Findings for `packages/react/`

## Context

Analyzed 1083 source files in `packages/react/src` across three parallel agents, then verified the top findings by reading actual code and computing realistic gzip estimates.

**Critical insight**: Gzip LZ77 uses a ~32KB sliding window. Repeated identical strings *within the same file* are compressed to 3-5 byte backreferences — near-zero marginal cost. Only **cross-file duplicates** (ending up in separate consumer chunks) yield meaningful gzip savings, since each chunk carries its own copy.

---

## Verified Findings (corrected gzip estimates)

### Tier 1: Cross-file/cross-chunk deduplication (~2,200 bytes gzip)

#### F1. Trigger FocusGuard handlers (~595 bytes gzip)

- **Files**: `popover/trigger/PopoverTrigger.tsx` lines 155-218, `menu/trigger/MenuTrigger.tsx` lines 260-352
- **Pattern**: `handlePreFocusGuardFocus` (~350 chars) and `handleFocusTargetFocus` (~500 chars) are character-for-character identical after minification. FocusGuard JSX render blocks are similar but not identical (MenuTrigger has extra `key` props).
- **Fix**: Extract `useTriggerFocusGuards(store, preFocusGuardRef, triggerElementRef)` shared hook.
- **Cross-file, separate chunks** → 850 raw chars × 0.7 = ~595 bytes gzip

#### F2. `createXxxEventDetails` factory (~560 bytes gzip)

- **Files**: `PopoverRoot.tsx:88-101`, `TooltipRoot.tsx:168-180`, `PreviewCardRoot.tsx:123-135`, `MenuRoot.tsx:356-365`, `useDialogRoot.ts:32-42`
- **Pattern**: Each file defines its own version of: `const details = createChangeEventDetails(reason); details.preventUnmountOnClose = () => store.set('preventUnmountingOnClose', true); return details;` — ~150 chars of runtime code × 5 files.
- **Fix**: Shared `createPopupEventDetails(store, reason)` in `utils/popups`.
- **Cross-file, separate chunks** → 800 raw chars eliminated × 0.7 = ~560 bytes gzip

#### F3. Toast/SwipeDismiss `getDisplacement` + `getElementTransform` (~480 bytes gzip)

- **Files**: `toast/root/ToastRoot.tsx:34-75`, `utils/useSwipeDismiss.ts:30-69`
- **Pattern**: `getDisplacement` (~210 chars) and `getElementTransform` (~480 chars) are byte-for-byte identical in both files. ToastRoot does NOT import useSwipeDismiss — these are in separate consumer chunks.
- **Correction**: The originally-claimed "handlePointerUp" and "baseline reset" blocks (lines 277-432) have actually diverged with different variable names, threshold refs, and velocity tracking — NOT true duplicates.
- **Fix**: ToastRoot imports the two helpers from useSwipeDismiss (or a shared utility).
- **Cross-file, separate chunks** → 690 raw chars × 0.7 = ~480 bytes gzip

#### F4. Cross-cutting popup/root helpers (~570 bytes gzip total)

| Sub-finding | Files | Raw chars | Gzip est. |
|---|---|---|---|
| `removeCSSVariableInheritance` identical structure | `DrawerPopup.tsx`, `ScrollAreaViewport.tsx` | ~200 | ~140 |
| `useOnFirstRender` defaultOpen block (identical 8-line block) | 4 root files | ~170 | ~120 |
| `useOpenChangeComplete` call pattern (identical 9-line block) | 5 popup files | ~120 | ~84 |
| `popupWithTransitionStateMapping` spread | 4 popup files | ~120 | ~84 |
| `ScrollArea` state recomputation (redundant `useMemo`) | `ScrollAreaRoot.tsx`, `ScrollAreaViewport.tsx` | ~200 | ~70 (likely same chunk) |
| `setPositionerElement` inconsistent callback style | 3 positioner files | ~80 | ~56 |
| `stateAttributesMapping` `() => null` no-op entries | 7 files | ~60 | ~40 |

---

### Tier 2: Intra-file patterns (~280 bytes gzip total)

**Important**: These all suffer from the "gzip already handles it" problem. Each saves only ~10-25 bytes gzip because LZ77 backreferences within the same 32KB file are near-free. They still improve code quality/readability but the bundle impact is minimal.

| Finding | File | Raw chars | Gzip est. |
|---|---|---|---|
| `store.set('instantType', ...)` in 3 branches | `MenuRoot.tsx:344-355` | ~300 | ~15 |
| `findNonDisabledListIndex` 4x near-identical args | `useListNavigation.ts:738-773` | ~350 | ~18 |
| 5-reason predicate written twice | `NumberFieldRoot.tsx:218-245` | ~350 | ~18 |
| `applyFingerState` pattern 3x | `SliderControl.tsx:313-498` | ~450 | ~25 |
| `getNewValue` 6x with shared args + `activeStep` | `SliderThumb.tsx:380-408` | ~450 | ~25 |
| Collision padding object `+bias` 2x | `useAnchorPositioning.ts:200-271` | ~300 | ~15 |
| `collisionAvoidance.` 12x property accesses | `useAnchorPositioning.ts` | ~150 | ~8 |
| `setIndices({...})` 5x identical call | `ComboboxInput.tsx` | ~250 | ~15 |
| `clearHighlight` block 2x | `AriaCombobox.tsx:828-844` | ~350 | ~18 |
| `stringifyAsLabel` 3x | `AriaCombobox.tsx:917-945` | ~180 | ~10 |
| `portalContext?.` refs 3-4x each | `FloatingFocusManager.tsx` | ~400 | ~20 |
| `store.select('floatingElement')` 8x | `useDismiss.ts` | ~240 | ~12 |
| addEventListener/removeEventListener mirror 9 pairs | `useDismiss.ts:639-674` | ~640 | ~35 |
| `direction === 'left' \|\| direction === 'right'` 13x | `DrawerViewport.tsx` | ~560 | ~15 |
| `parseFloat(positionerStyles.*)` repeated | `SelectPopup.tsx` | ~250 | ~13 |
| Two consecutive `store.update()` mergeable | `SelectRoot.tsx:399-438` | ~200 | ~10 |

---

### Tier 3: Structural patterns (~160 bytes gzip total)

| Finding | File | Raw chars | Gzip est. |
|---|---|---|---|
| 6 orientation lookup objects creating temp objects | `useCompositeRoot.ts:179-298` | ~300 | ~15 |
| Near-identical right/left grid nav blocks | `composite.ts:290-360` | ~300 | ~15 |
| Near-identical Y/X thumb position blocks | `ScrollAreaViewport.tsx:218-246` | ~200 | ~10 |
| `{ height: scrollHeight, width: scrollWidth }` 5x | `useCollapsiblePanel.ts` | ~200 | ~10 |
| `scrollTimeout.start(SCROLL_TIMEOUT, ...)` 4x | `ScrollAreaRoot.tsx` | ~120 | ~6 |
| 4 near-identical pointer handlers | `DrawerSwipeArea.tsx:416-443` | ~120 | ~6 |
| `setSharedFixedSizes` body inlined 2x (but has legit variation) | `NavigationMenuTrigger.tsx` | ~664 | ~100-200 |

**Note on NavigationMenuTrigger**: The helper `setSharedFixedSizes` exists and IS used in some places. The remaining inline uses have structural differences (conditionals around positioner calls inside `sizeFrame.request`). Realistic gzip savings are ~100-200 bytes since it's intra-file but the repeated CssVar property name strings are long.

---

## Grand Total

| Tier | Gzip savings |
|---|---|
| Tier 1: Cross-file dedup | ~2,200 bytes |
| Tier 2: Intra-file patterns | ~280 bytes |
| Tier 3: Structural patterns | ~260 bytes |
| **Total** | **~2,740 bytes** |

## Key Takeaway

**Focus on Tier 1 cross-file deduplication.** The top 3 findings (FocusGuard handlers, createEventDetails factory, Toast/SwipeDismiss helpers) account for ~1,635 bytes — 60% of all savings — and are clean, low-risk extractions. Intra-file patterns look dramatic in raw byte counts but gzip already handles them effectively.
