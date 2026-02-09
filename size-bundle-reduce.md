# Bundle Size Reduction Findings for `packages/react/`

**Target**: At least 50KB minified reduction
**Scope**: Research only — no code changes
**Update**: Revised to focus on gzipped bundle size (what users actually download), not minified size

---

## ⚠️ Important Note on Metrics

This analysis was initially optimized for **minified size**. However, testing revealed that minified size is a misleading metric. **Gzipped bundle size** is what users actually download in production. Many optimizations that reduce minified bytes can actually *increase* gzipped size due to reduced repetition that gzip exploits.

**All estimates below now target gzipped bundle size.**

---

## Codebase Statistics

- **929 TypeScript files** (467 .tsx, 462 .ts)
- **~500 non-test source files**
- **48 public component exports**, 40+ component directories
- **Dependencies**: `@floating-ui/react-dom`, `@floating-ui/utils`, `tabbable`, `use-sync-external-store`, `@babel/runtime`
- **Build**: Babel (with error minification plugin + React constant elements hoisting), `sideEffects: false`

---

## FINDING 1: Floating-UI Internal Fork (8,271 lines) — ~5-10KB gzipped

The largest chunk is `packages/react/src/floating-ui-react/` — a full fork of `@floating-ui/react` with 35 files:

| File | Lines | Used by |
|------|-------|---------|
| `FloatingFocusManager.tsx` | 1,018 | Dialog, Menu, Popover, Select, Combobox popups |
| `useListNavigation.ts` | 1,003 | Menu, Select, Combobox |
| `useDismiss.ts` | 741 | Dialog, Menu, Popover, Select, Combobox, Tooltip, PreviewCard, Toast |
| `useHover.ts` | 623 | Only by useHoverReferenceInteraction/useHoverFloatingInteraction |
| `useHoverReferenceInteraction.ts` | 407 | Menu, Popover, Tooltip, PreviewCard triggers |
| `safePolygon.ts` | 402 | Menu, Popover, Tooltip, PreviewCard triggers |
| `FloatingPortal.tsx` | 294 | All portal components |
| `useFocus.ts` | 263 | Tooltip, PreviewCard, Button, Toolbar |
| `useClientPoint.ts` | 258 | Tooltip only |
| `FloatingDelayGroup.tsx` | 253 | Tooltip only |
| `useTypeahead.ts` | 251 | Menu, Select, Combobox |
| `useClick.ts` | 201 | Dialog, Combobox triggers only |
| `markOthers.ts` | 169 | FloatingFocusManager |
| `useRole.ts` | 140 | Dialog, Menu, Popover |
| `useInteractions.ts` | 142 | 49 component files |
| `composite.ts` (utils) | 441 | useListNavigation |

### Opportunities

- **`useHover.ts` (623 lines)** acts as a monolith that was split into `useHoverReferenceInteraction` + `useHoverFloatingInteraction`, but the original `useHover.ts` is STILL exported and imported. Verify if `useHover` can be removed entirely in favor of the split hooks.
- **`useClientPoint.ts` (258 lines)** is used ONLY by `TooltipRoot.tsx`. This adds 258 lines for a single component.
- **`FloatingDelayGroup.tsx` (253 lines)** is used ONLY by `TooltipTrigger.tsx` and `TooltipProvider.tsx`.
- **`useClick.ts` (201 lines)** is used only by `DialogTrigger.tsx` and `ComboboxTrigger.tsx`.
- **`composite.ts` (441 lines)** contains grid navigation utilities used only by `useListNavigation`. Much of the grid logic (`createGridCellMap`, `getGridCellIndices`, `getGridCellIndexOfCorner`, `getGridNavigatedIndex`) could be lazy-loaded or split out since grid navigation is a niche feature.
- **`markOthers.ts` (169 lines)** is an `aria-hidden` fork used only by `FloatingFocusManager`. The module-level state (`counters`, `markerMap`, `lockCount`) uses WeakMaps and module globals that persist — could be simplified.
- **`safePolygon.ts` (402 lines)** includes geometry calculations (point-in-polygon, polygon generation). Used by 6 trigger components. The `isPointInPolygon` and triangle generation could be optimized/simplified.

### Estimated savings

Removing unused code paths, lazy-loading grid utilities, and trimming `useHover` overlap: **~5-10KB gzipped**.

---

## FINDING 2: Context Boilerplate (73 files, 2,331 lines) — ~4-6KB gzipped

73 context files each repeat the identical pattern:

```ts
export const XxxContext = React.createContext<XxxContext | undefined>(undefined);

export function useXxxContext(optional?: false): XxxContext;
export function useXxxContext(optional: true): XxxContext | undefined;
export function useXxxContext(optional?: boolean) {
  const context = React.useContext(XxxContext);
  if (context === undefined && !optional) {
    throw new Error('Base UI: XxxContext is missing. ...');
  }
  return context;
}
```

### Files (non-exhaustive)

`DialogRootContext.ts`, `MenuRootContext.ts`, `PopoverRootContext.ts`, `TooltipRootContext.ts`, `SelectRootContext.ts`, `ComboboxRootContext.tsx`, `SliderRootContext.ts`, `TabsRootContext.ts`, `AccordionRootContext.ts`, `AccordionItemContext.ts`, `CheckboxGroupContext.ts`, `CheckboxRootContext.ts`, `CollapsibleRootContext.ts`, `FieldRootContext.ts`, `FieldsetRootContext.ts`, `FormContext.ts`, `MenuCheckboxItemContext.ts`, `MenuGroupContext.ts`, `MenuPositionerContext.ts`, `MenuRadioGroupContext.ts`, `MenuRadioItemContext.ts`, `NumberFieldRootContext.ts`, `NumberFieldScrubAreaContext.ts`, `PopoverPositionerContext.ts`, `PreviewCardRootContext.ts`, `PreviewCardPositionerContext.ts`, `ProgressRootContext.ts`, `RadioRootContext.ts`, `RadioGroupContext.ts`, `ScrollAreaRootContext.ts`, `ScrollAreaScrollbarContext.ts`, `ScrollAreaViewportContext.ts`, `SelectGroupContext.ts`, `SelectItemContext.ts`, `SelectPositionerContext.ts`, `SwitchRootContext.ts`, `TabsListContext.ts`, `ToastPositionerContext.ts`, `ToastProviderContext.ts`, `ToastRootContext.ts`, `ToastViewportContext.ts`, `ToggleGroupContext.ts`, `ToolbarGroupContext.ts`, `ToolbarRootContext.ts`, `TooltipPositionerContext.ts`, `TooltipProviderContext.ts`, `AvatarRootContext.ts`, `CompositeRootContext.ts`, `CompositeListContext.ts`, `ContextMenuRootContext.ts`, `MeterRootContext.ts`, `NavigationMenuRootContext.ts`, `NavigationMenuItemContext.ts`, `NavigationMenuPositionerContext.ts`, `MenubarContext.ts`, `LabelableContext.ts`, and 7 Portal contexts + several more.

### Optimization

Create a `createContext` factory function:

```ts
function createBaseUIContext<T>(name: string, errorMessage: string) {
  const Context = React.createContext<T | undefined>(undefined);
  function useContext(optional?: boolean) {
    const ctx = React.useContext(Context);
    if (ctx === undefined && !optional) throw new Error(errorMessage);
    return ctx;
  }
  return [Context, useContext] as const;
}
```

This consolidates 73 repetitive implementations into a single factory function. The repetition across 73 files compresses well with gzip, but having one implementation compresses even better.

### Estimated savings

**~4-6KB gzipped** (consolidating 73 repetitive patterns).

---

## FINDING 3: Portal Components (10 nearly identical files) — ~2-3KB gzipped

10 portal components with 85-95% identical code:

| File | Lines | Difference from base pattern |
|------|-------|------------------------------|
| `MenuPortal.tsx` | 50 | Base pattern |
| `PopoverPortal.tsx` | 50 | Base pattern |
| `ComboboxPortal.tsx` | 52 | Base pattern |
| `TooltipPortal.tsx` | 50 | Uses `FloatingPortalLite` instead of `FloatingPortal` |
| `PreviewCardPortal.tsx` | ~50 | Base pattern |
| `NavigationMenuPortal.tsx` | ~50 | Base pattern |
| `SelectPortal.tsx` | 45 | Different store API (`useStore` + `selectors`), no `keepMounted` prop |
| `DialogPortal.tsx` | 63 | Extra: `InternalBackdrop`, `modal` check, `inertValue` |
| `AlertDialogPortal.tsx` | ~63 | Same as Dialog |
| `ContextMenuPortal.tsx` | ~50 | Similar to Menu |

### Common pattern (8 of 10)

```tsx
const { keepMounted = false, ...portalProps } = props;
const { store } = useXxxRootContext();
const mounted = store.useState('mounted');
const shouldRender = mounted || keepMounted;
if (!shouldRender) return null;
return (
  <XxxPortalContext.Provider value={keepMounted}>
    <FloatingPortal ref={forwardedRef} {...portalProps} />
  </XxxPortalContext.Provider>
);
```

Plus 10 matching `XxxPortalContext.ts` files (12 lines each = 120 lines) that are simple boolean contexts.

### Optimization

Create a `createPortalComponent` factory that accepts the context and store hook. Reduces 10 files + 10 context files to 1 factory + 10 one-liner instantiations.

### Estimated savings

**~2-3KB gzipped** (consolidating 10 repetitive portal implementations).

---

## ⚠️ FINDING 4 & 5: REMOVED — DataAttributes and CssVars Enum Conversion

**Status**: Verified FALSE via actual testing

Initially proposed converting 125 DataAttributes and 22 CssVars `enum` files to `as const` objects for size savings.

**Actual result** (tested with `DialogPopupDataAttributes`):
- Minified size: -117B ✓
- **Gzipped size: +18B** ✗

**Why this fails**:
- TypeScript `enum` compiles to an IIFE wrapper with highly repetitive patterns
- Gzip compresses repetitive byte sequences extremely well
- `as const` objects have less repetition, resulting in worse gzip compression
- **The net effect is NEGATIVE for production bundles** (what users actually download)

**Lesson**: Optimizing for minified/parsed size is misleading. Always measure gzipped bundle size — that's the metric that matters for real users.

**Recommendation**: **Do not pursue this optimization.** The enum structure, while verbose in source, is already well-compressed in production.

---

## FINDING 6: `useAnchorPositioning.ts` (704 lines) — ~1-2KB gzipped savings potential

Used by 38 components (all positioned components: Popover, Menu, Tooltip, Select, Combobox, PreviewCard, NavigationMenu, Toast positioners/arrows/popups).

### Opportunities within this file

- **Lines 180-350**: Middleware array construction happens on every render. The middleware array (`[offset, flip, shift, size, arrow, transformOrigin, hide, adaptiveOrigin]`) is rebuilt from scratch each time. Could be memoized or constructed conditionally.
- **Lines 400-500**: `collisionPadding` calculation with RTL bias logic (~100 lines) is called on every position update. Could be extracted and memoized.
- **Lines 500-600**: `autoUpdate` subscription setup/teardown (~100 lines) with `keepMounted` handling. Duplicates logic between the `mounted` and `keepMounted` code paths.
- **Type definitions (lines 58-170)**: ~112 lines of type definitions that compile away but add to source bloat.

### Estimated savings

Middleware memoization + deduplication of autoUpdate paths: **~1-2KB gzipped** (removing duplicated conditionals and middleware rebuilds).

---

## FINDING 7: `@babel/runtime` Dependency — ~1-3KB gzipped depending on usage

`@babel/runtime` is a production dependency. It provides helper functions for:
- `_extends` (object spread)
- `_objectWithoutPropertiesLoose` (destructuring rest)
- `_inheritsLoose` (class extension)
- async/await transforms

Each Babel-compiled file imports these helpers from `@babel/runtime` instead of inlining them. However, if the target environment supports modern JS (which it should — React 17+ requires it), many of these helpers are unnecessary.

### Optimization

Update the Babel config to target modern browsers and eliminate unnecessary helper imports. If `@babel/runtime` is only needed for `_extends`, the entire dependency can potentially be dropped by using native object spread in the output.

### Estimated savings

**~1-3KB gzipped** depending on which helpers are actively used.

---

## FINDING 8: `tabbable` Dependency (~6KB minified) — ~1-2KB gzipped savings

`tabbable` is imported in only 6 files:

1. **`FloatingFocusManager.tsx`** — Full import: `tabbable`, `isTabbable`, `focusable`, `FocusableElement`
2. **`packages/react/src/floating-ui-react/utils/tabbable.ts`** — `tabbable`, `FocusableElement`
3. **`PopoverTrigger.tsx`** — Type-only: `FocusableElement`
4. **`MenuTrigger.tsx`** — Type-only: `FocusableElement`
5. **`NavigationMenuTrigger.tsx`** — Value: `isTabbable`
6. **`packages/react/src/floating-ui-react/utils/enqueueFocus.ts`** — Type-only: `FocusableElement`

4 of 6 imports are type-only (removed at compile time). Only `FloatingFocusManager.tsx` and `NavigationMenuTrigger.tsx` use runtime values.

### Optimization

- The `isTabbable` check in `NavigationMenuTrigger.tsx` could be replaced with a lightweight inline check (~5 lines).
- `FloatingFocusManager` uses `tabbable()`, `isTabbable()`, and `focusable()` — these are harder to replace but could be implemented as a lighter custom version focused only on the needed features.

### Estimated savings

**~1-2KB gzipped** (reducing dependencies).

---

## FINDING 9: `use-sync-external-store` Dependency (~1.5KB) — ~0.8-1.2KB gzipped

Only imported in ONE place: `packages/react/src/unstable-use-media-query/index.ts`.

Since the library supports React 17+, this shim is needed for React 17 compatibility. But for React 18+ (which includes `useSyncExternalStore` natively), this is dead weight.

### Optimization

Use conditional import or check `React.useSyncExternalStore` existence at runtime. Since this is an "unstable" API, consider dropping React 17 support for this specific hook.

### Estimated savings

**~0.8-1.2KB gzipped**.

---

## FINDING 10: Namespace + forwardRef Boilerplate (~199 components) — Future optimization

Every component follows this boilerplate:

```tsx
export const XxxYyy = React.forwardRef(function XxxYyy(
  props: XxxYyy.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) { ... });

export namespace XxxYyy {
  export interface State { ... }
}
export interface XxxYyyProps extends ... { ... }
export namespace XxxYyy {
  export type Props = XxxYyyProps;
}
```

**`React.forwardRef` wrapper**: 199 usages. Each adds overhead to the bundle. React 19 doesn't need `forwardRef` — refs can be passed as regular props.

**Namespace declarations**: 234 `export namespace` blocks. These are TypeScript-only and compile to nothing when all members are types — **no runtime cost**. Verified: **zero runtime cost** for pure type namespaces.

### Optimization

When dropping React 17/18 support, remove `React.forwardRef` wrappers (199 instances).

### Estimated savings

**~0KB now** (blocked by backward compat). **~3-5KB gzipped in the future** when React 19 becomes the minimum.

---

## FINDING 11: `'use client'` Directives (332 files) — ~0.2-0.3KB gzipped

332 files start with `'use client';\n` (14 bytes each including newline). Total: 332 x 14 = **4,648 bytes raw**.

After minification this stays the same (string directives cannot be minified). These are required for React Server Components and cannot be removed without breaking RSC. However, files that are purely types or don't use React hooks/state/effects don't need them.

Estimate ~20-30 files have unnecessary `'use client'` directives.

### Estimated savings

**~0.2-0.3KB gzipped** (removing ~30 unnecessary directives).

---

## FINDING 12: Trigger Component Duplication (~5 triggers, 150+ lines overlap) — ~1-2KB gzipped

5 trigger components share 60-70% identical code:
- `DialogTrigger.tsx` (127 lines)
- `MenuTrigger.tsx` (467 lines)
- `PopoverTrigger.tsx` (284 lines)
- `TooltipTrigger.tsx` (~200 lines)
- `PreviewCardTrigger.tsx` (~200 lines)

### Shared patterns

- `useTriggerDataForwarding()` call with identical setup (11 usages across 6 files)
- `useButton()` integration
- `useHoverReferenceInteraction()` / `useClick()` patterns
- FocusGuard wrapper logic
- Event handler forwarding to store

### Optimization

Extract a `useTriggerBase()` hook that consolidates common trigger setup. Consolidating repetitive code improves gzip compression.

### Estimated savings

**~1-2KB gzipped**.

---

## FINDING 13: Popup Component Duplication (~8 popups) — ~1KB gzipped

8 popup components share similar state extraction + rendering patterns:
- `DialogPopup.tsx`, `MenuPopup.tsx`, `PopoverPopup.tsx`, `ComboboxPopup.tsx`, `SelectPopup.tsx`, `TooltipPopup.tsx`, `PreviewCardPopup.tsx`, `NavigationMenuPopup.tsx`

### Common pattern

```tsx
const open = store.useState('open');
const transitionStatus = store.useState('transitionStatus');
const mounted = store.useState('mounted');
const popupProps = store.useState('popupProps');
// ... FloatingFocusManager wrapping + useRenderElement
```

### Optimization

Extract shared popup setup into a common hook.

### Estimated savings

**~1KB gzipped**.

---

## FINDING 14: Error Messages in Production — Already Handled

The codebase has 89 error codes in `docs/src/error-codes.json`. The Babel plugin `@mui/internal-babel-plugin-minify-errors` transforms error strings to numeric codes in production builds:

```js
// Dev:  throw new Error('Base UI: DialogRootContext is missing...')
// Prod: throw new Error(formatErrorMessage(27))
```

This is already working correctly. **No additional savings here** for production builds.

---

## FINDING 15: Duplicated Import Chains from `@floating-ui/utils/dom`

Multiple files redundantly import the same utilities:
- `isHTMLElement`: imported in 10+ files
- `isElement`: imported in 8+ files
- `getComputedStyle`: imported in 4+ files
- `getNodeName`: imported in 3+ files
- `getParentNode`: imported in 2+ files

While bundlers deduplicate the actual module, the import statements and module resolution adds overhead to the module graph.

### Optimization

Create a single barrel re-export in the floating-ui-react utils that consolidates all `@floating-ui/utils/dom` imports.

### Estimated savings

**~0.3-0.5KB gzipped** (module graph simplification).

---

## FINDING 16: `InternalBackdrop` Component

`packages/react/src/utils/InternalBackdrop.tsx` is used only by `DialogPortal.tsx` (and AlertDialog which extends Dialog). Small and functionally necessary. **No significant savings**.

---

## FINDING 17: Viewport Components with Heavy Animation Logic — ~1KB gzipped

`PopoverViewport.tsx` (315 lines), `TooltipViewport.tsx`, `PreviewCardViewport.tsx`, `ToastViewport.tsx` share viewport transition/animation code:
- `calculateRelativePosition()` function (identical across files)
- DOM cloning and measurement sequences
- Content capture and previous state comparison

### Optimization

Extract shared viewport animation utilities into a common hook. Consolidating repetitive code improves gzip compression.

### Estimated savings

**~1KB gzipped**.

---

## Summary

| # | Finding | Est. Savings (gzipped) | Effort | Priority |
|---|---------|------------------------|--------|----------|
| 1 | Floating-UI fork dead code + optimization | 5-10KB | High | **HIGH** |
| 2 | Context boilerplate factory | 4-6KB | Medium | **HIGH** |
| 3 | Portal component factory | 2-3KB | Low | **HIGH** |
| 4 & 5 | ~~DataAttributes/CssVars enum->as const~~ | 0KB (FALSE) | N/A | **REMOVED** |
| 6 | useAnchorPositioning optimization | 1-2KB | Medium | MEDIUM |
| 7 | @babel/runtime reduction | 1-3KB | Medium | MEDIUM |
| 8 | tabbable lighter impl | 1-2KB | High | MEDIUM |
| 9 | use-sync-external-store removal | 0.8-1.2KB | Low | LOW |
| 10 | forwardRef removal (React 19 only) | 0KB now / 3-5KB future | Low | FUTURE |
| 11 | Unnecessary 'use client' removal | 0.2-0.3KB | Low | LOW |
| 12 | Trigger component dedup | 1-2KB | Medium | MEDIUM |
| 13 | Popup component dedup | 1KB | Medium | MEDIUM |
| 14 | Error messages | 0KB (already handled) | N/A | N/A |
| 15 | Import chain consolidation | 0.3-0.5KB | Low | LOW |
| 16 | InternalBackdrop | 0KB | N/A | N/A |
| 17 | Viewport animation dedup | 1KB | Medium | MEDIUM |
| | **TOTAL** | **~20-35KB gzipped** | | |

## Realistic Assessment

After removing the false-positive enum optimizations and recalibrating to gzipped size:

- **High-effort findings (1, 8)**: ~6-12KB gzipped
- **High-priority consolidations (2, 3)**: ~6-9KB gzipped
- **Medium-priority optimizations (6, 7, 12, 13, 17)**: ~5-8KB gzipped
- **Low-priority items (9, 11, 15)**: ~1-2KB gzipped

**Total realistic savings: ~20-35KB gzipped**

---

## Recommended Approach

### Phase 1 — High Impact Consolidations (2, 3)
Context factory and portal factory are relatively low-effort with high gzip compression benefits. Start here: **~6-9KB gzipped**.

### Phase 2 — Dependency Cleanup (7, 8, 9)
Reducing external dependencies improves bundle size across the board: **~3-6KB gzipped**.

### Phase 3 — Component Deduplication (12, 13, 17)
Consolidating repetitive component patterns aids gzip compression: **~3-4KB gzipped**.

### Phase 4 — Floating-UI Fork Analysis (1)
Most complex, requires deep testing. Can yield significant savings but needs careful validation: **~5-10KB gzipped**.

### Phase 5 — Polish (6, 9, 11, 15)
Minor optimizations: **~2-3KB gzipped**.

### Total Expected: ~20-35KB gzipped reduction
