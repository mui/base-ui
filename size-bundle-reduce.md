# Bundle Size Reduction Findings for `packages/react/`

**Target**: At least 50KB minified reduction
**Scope**: Research only — no code changes

---

## Codebase Statistics

- **929 TypeScript files** (467 .tsx, 462 .ts)
- **~500 non-test source files**
- **48 public component exports**, 40+ component directories
- **Dependencies**: `@floating-ui/react-dom`, `@floating-ui/utils`, `tabbable`, `use-sync-external-store`, `@babel/runtime`
- **Build**: Babel (with error minification plugin + React constant elements hoisting), `sideEffects: false`

---

## FINDING 1: Floating-UI Internal Fork (8,271 lines) — ~25-30KB minified

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

Removing unused code paths, lazy-loading grid utilities, and trimming `useHover` overlap: **~5-8KB minified**.

---

## FINDING 2: Context Boilerplate (73 files, 2,331 lines) — ~7-9KB minified

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

Each context currently compiles to ~200-300 bytes minified (function overloads, createContext call, useContext wrapper, error throw). With a factory, each context reduces to ~50-80 bytes (just the factory call + type param).

### Estimated savings

73 contexts x ~180 bytes saved per context = **~13KB minified**. After error minification in production: **~9KB minified**.

---

## FINDING 3: Portal Components (10 nearly identical files) — ~3-4KB minified

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

~500 lines source -> ~100 lines. **~3-4KB minified**.

---

## FINDING 4: DataAttributes Enums (125 files, ~2,940 lines) — ~5-7KB minified

125 enum files like `DialogPopupDataAttributes.ts`, each defining string enums:

```ts
export enum DialogPopupDataAttributes {
  open = 'data-open',
  closed = 'data-closed',
  startingStyle = 'data-starting-style',
  endingStyle = 'data-ending-style',
  nested = 'data-nested',
  nestedDialogOpen = 'data-nested-dialog-open',
}
```

TypeScript `enum` compiles to a JavaScript object with IIFE:

```js
var DialogPopupDataAttributes;
(function(DialogPopupDataAttributes) {
  DialogPopupDataAttributes["open"] = "data-open";
  // ...
})(DialogPopupDataAttributes || (DialogPopupDataAttributes = {}));
```

### Key issue

Most DataAttributes enums are exported as public API for documentation but only ~73 of 125 files are actually imported by source code at runtime. The remaining ~52 files are dead code that relies on tree-shaking.

Since they reference `CommonPopupDataAttributes` and `TransitionStatusDataAttributes` from shared files, enum cross-references prevent tree-shaking in some bundlers.

### Optimization

Convert `enum` to `as const` objects:

```ts
export const DialogPopupDataAttributes = {
  open: 'data-open',
  closed: 'data-closed',
} as const;
```

`as const` objects are simpler in output (no IIFE wrapper), and unused ones are more reliably tree-shaken. For the ~52 files not imported internally, they should be export-only types or moved to a documentation-only path.

### Estimated savings

**~5-7KB minified** (IIFE overhead removal + better tree-shaking of unused enums).

---

## FINDING 5: CssVars Enums (22 files, 443 lines) — ~1.5-2KB minified

Same pattern as DataAttributes — 22 `enum` files with CSS custom property names:

```ts
export enum PopoverPositionerCssVars {
  availableWidth = '--available-width',
  availableHeight = '--available-height',
  // ...
}
```

Most are exported for documentation but only ~16 are imported at runtime.

### Optimization

Same as DataAttributes — convert to `as const` objects.

### Estimated savings

**~1.5-2KB minified**.

---

## FINDING 6: `useAnchorPositioning.ts` (704 lines) — ~2-3KB minified savings potential

Used by 38 components (all positioned components: Popover, Menu, Tooltip, Select, Combobox, PreviewCard, NavigationMenu, Toast positioners/arrows/popups).

### Opportunities within this file

- **Lines 180-350**: Middleware array construction happens on every render. The middleware array (`[offset, flip, shift, size, arrow, transformOrigin, hide, adaptiveOrigin]`) is rebuilt from scratch each time. Could be memoized or constructed conditionally.
- **Lines 400-500**: `collisionPadding` calculation with RTL bias logic (~100 lines) is called on every position update. Could be extracted and memoized.
- **Lines 500-600**: `autoUpdate` subscription setup/teardown (~100 lines) with `keepMounted` handling. Duplicates logic between the `mounted` and `keepMounted` code paths.
- **Type definitions (lines 58-170)**: ~112 lines of type definitions that compile away but add to source bloat.

### Estimated savings

Middleware memoization + deduplication of autoUpdate paths: **~2-3KB minified**.

---

## FINDING 7: `@babel/runtime` Dependency — ~2-5KB depending on usage

`@babel/runtime` is a production dependency. It provides helper functions for:
- `_extends` (object spread)
- `_objectWithoutPropertiesLoose` (destructuring rest)
- `_inheritsLoose` (class extension)
- async/await transforms

Each Babel-compiled file imports these helpers from `@babel/runtime` instead of inlining them. However, if the target environment supports modern JS (which it should — React 17+ requires it), many of these helpers are unnecessary.

### Optimization

Update the Babel config to target modern browsers and eliminate unnecessary helper imports. If `@babel/runtime` is only needed for `_extends`, the entire dependency can potentially be dropped by using native object spread in the output.

### Estimated savings

**~2-5KB minified** depending on which helpers are actively used.

---

## FINDING 8: `tabbable` Dependency (~6KB minified) — ~2-3KB savings

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

Slim, since only components that use focus management pull in tabbable. But a lighter implementation could save **~2-3KB**.

---

## FINDING 9: `use-sync-external-store` Dependency (~1.5KB) — ~1.5KB savings

Only imported in ONE place: `packages/react/src/unstable-use-media-query/index.ts`.

Since the library supports React 17+, this shim is needed for React 17 compatibility. But for React 18+ (which includes `useSyncExternalStore` natively), this is dead weight.

### Optimization

Use conditional import or check `React.useSyncExternalStore` existence at runtime. Since this is an "unstable" API, consider dropping React 17 support for this specific hook.

### Estimated savings

**~1.5KB minified**.

---

## FINDING 10: Namespace + forwardRef Boilerplate (~199 components) — ~3-4KB minified

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

**`React.forwardRef` wrapper**: 199 usages. Each adds ~50 bytes minified (the wrapper function + displayName). React 19 doesn't need `forwardRef` — refs can be passed as regular props.

**Namespace declarations**: 234 `export namespace` blocks. These are TypeScript-only and compile to nothing when all members are types — **no runtime cost**. Verified: **zero runtime cost** for pure type namespaces.

### Optimization

When dropping React 17/18 support, remove `React.forwardRef` wrappers (199 instances x ~50 bytes = ~10KB). For now, this is blocked by the peer dependency range (`^17 || ^18 || ^19`).

### Estimated savings

**~0KB now** (blocked by backward compat). **~10KB in the future** when React 19 becomes the minimum.

---

## FINDING 11: `'use client'` Directives (332 files) — ~4.3KB raw

332 files start with `'use client';\n` (14 bytes each including newline). Total: 332 x 14 = **4,648 bytes raw**.

After minification this stays the same (string directives cannot be minified). After gzip, repeated identical strings compress well.

These are required for React Server Components and cannot be removed without breaking RSC. However, files that are purely types or don't use React hooks/state/effects may not need them.

Estimate ~20-30 files have unnecessary `'use client'` directives (context files that only define a context + hook but where the directive is redundant because they're imported by client files anyway).

### Estimated savings

**~0.3-0.4KB** (removing ~30 unnecessary directives).

---

## FINDING 12: Trigger Component Duplication (~5 triggers, 150+ lines overlap) — ~2-3KB minified

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

Extract a `useTriggerBase()` hook that consolidates common trigger setup (~80-100 lines of shared logic).

### Estimated savings

**~2-3KB minified**.

---

## FINDING 13: Popup Component Duplication (~8 popups) — ~2KB minified

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

**~2KB minified**.

---

## FINDING 14: Error Messages in Production — Already Handled

The codebase has 89 error codes in `docs/src/error-codes.json`. The Babel plugin `@mui/internal-babel-plugin-minify-errors` transforms error strings to numeric codes in production builds:

```js
// Dev:  throw new Error('Base UI: DialogRootContext is missing...')
// Prod: throw new Error(formatErrorMessage(27))
```

This is already working correctly. **No additional savings here** for production builds.

The `formatErrorMessage` function generates a URL (`https://base-ui.com/production-error?code=27`), which itself is ~50 bytes per error call. With 89 errors, that's ~4.5KB in URL construction code. But this is already minimal.

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

Create a single barrel re-export in the floating-ui-react utils that consolidates all `@floating-ui/utils/dom` imports. This simplifies the module graph but doesn't reduce minified size significantly.

### Estimated savings

**~0.5KB** (module graph simplification).

---

## FINDING 16: `InternalBackdrop` Component — ~0.5KB

`packages/react/src/utils/InternalBackdrop.tsx` is used only by `DialogPortal.tsx` (and AlertDialog which extends Dialog). It creates an invisible backdrop for modal dialogs.

This is small and functionally necessary. **No significant savings**.

---

## FINDING 17: Viewport Components with Heavy Animation Logic — ~2KB savings

`PopoverViewport.tsx` (315 lines), `TooltipViewport.tsx`, `PreviewCardViewport.tsx`, `ToastViewport.tsx` share viewport transition/animation code:
- `calculateRelativePosition()` function (identical across files)
- DOM cloning and measurement sequences
- Content capture and previous state comparison

### Optimization

Extract shared viewport animation utilities into a common hook.

### Estimated savings

**~2KB minified**.

---

## Summary

| # | Finding | Est. Savings (minified) | Effort | Priority |
|---|---------|------------------------|--------|----------|
| 1 | Floating-UI fork dead code + optimization | 5-8KB | High | **HIGH** |
| 2 | Context boilerplate factory | 9KB | Medium | **HIGH** |
| 3 | Portal component factory | 3-4KB | Low | **HIGH** |
| 4 | DataAttributes enum -> as const | 5-7KB | Low | **HIGH** |
| 5 | CssVars enum -> as const | 1.5-2KB | Low | **HIGH** |
| 6 | useAnchorPositioning optimization | 2-3KB | Medium | MEDIUM |
| 7 | @babel/runtime reduction | 2-5KB | Medium | MEDIUM |
| 8 | tabbable lighter impl | 2-3KB | High | MEDIUM |
| 9 | use-sync-external-store removal | 1.5KB | Low | LOW |
| 10 | forwardRef removal (React 19 only) | 0KB now / 10KB future | Low | FUTURE |
| 11 | Unnecessary 'use client' removal | 0.3-0.4KB | Low | LOW |
| 12 | Trigger component dedup | 2-3KB | Medium | MEDIUM |
| 13 | Popup component dedup | 2KB | Medium | MEDIUM |
| 14 | Error messages | 0KB (already handled) | N/A | N/A |
| 15 | Import chain consolidation | 0.5KB | Low | LOW |
| 16 | InternalBackdrop | 0KB | N/A | N/A |
| 17 | Viewport animation dedup | 2KB | Medium | MEDIUM |
| | **TOTAL** | **~36-50KB minified** | | |

## Recommended Approach

### Phase 1 — Quick Wins (HIGH priority, ~24-30KB)
Items 2-5 are relatively low-effort changes with high impact. The context factory (2) alone saves ~9KB, and the enum conversions (4, 5) are mechanical find-and-replace operations.

### Phase 2 — Medium Effort (MEDIUM priority, ~10-14KB)
Items 6-8 and 12-13 require more careful refactoring but offer meaningful savings.

### Phase 3 — Floating-UI Fork Cleanup (HIGH priority, ~5-8KB)
Item 1 requires deep analysis of which forked code is actually reachable. Best done with careful testing.

### Phase 4 — Future (when React 19 is minimum)
Item 10 unlocks ~10KB by removing `React.forwardRef` wrappers across 199 components.

### Total realistic savings

After gzip compression (~60-70% ratio), real-world savings: **~12-17KB gzipped**.

To reliably hit 50KB minified reduction, combine HIGH priority items (1-5) for ~25-30KB, plus MEDIUM items (6-8, 12-13, 17) for ~10-14KB, reaching ~35-44KB. Adding the FUTURE item (React 19 forwardRef removal) pushes to 45-54KB.
