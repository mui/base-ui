# Bundle Size Reduction Findings

Sorted by estimated gzipped savings (highest first). Total estimated: ~5-10KB gzipped.

---

## 1. StoreInspector shipped in production module graph (~2-3KB gzipped)

`packages/utils/src/store/StoreInspector.tsx` is 572 lines of dev-only UI (embedded CSS strings, SVG icons, drag/resize portal). It was barrel-exported via `packages/utils/src/store/index.ts`. It is **never imported** by any code in `packages/react`. Any consumer importing from `@base-ui/utils/store` pulls it into the module graph.

**Fix:** The re-export has already been removed from `store/index.ts`. Additionally, add a separate entry in `packages/utils/package.json`:
```json
"./store/inspector": "./src/store/StoreInspector.tsx"
```

---

## 2. `reselect` dependency coupled to `createSelector` (~2KB gzipped)

`packages/utils/src/store/createSelector.ts` line 1:
```ts
import { lruMemoize, createSelectorCreator, Selector } from 'reselect';
```
This import exists only for `createSelectorMemoized` (lines 135-214), which is **never used anywhere** in the codebase (zero imports found). But since `createSelector` (which IS used by every component's store) is in the same file, importing `createSelector` always pulls in `reselect` (~2KB gzipped).

Additionally, `packages/react/package.json` line 91 lists `reselect` as a direct dependency despite never importing it.

**Fix:**
1. Move `createSelectorMemoized` + its reselect imports to the new file `packages/utils/src/store/createSelectorMemoized.ts` (already created)
2. Remove reselect import from `createSelector.ts`
3. The re-export in `store/index.ts` has already been updated
4. Remove `"reselect": "^5.1.1"` from `packages/react/package.json` dependencies

---

## 3. Viewport transition logic duplicated 3x (~1-2KB gzipped)

Three files contain nearly identical code (~300 lines each, ~200 lines duplicated):
- `packages/react/src/popover/viewport/PopoverViewport.tsx` (315 lines)
- `packages/react/src/tooltip/viewport/TooltipViewport.tsx` (313 lines)
- `packages/react/src/preview-card/viewport/PreviewCardViewport.tsx` (355 lines)

Duplicated across all three:
- Helper functions `getActivationDirection`, `getValueWithTolerance`, `calculateRelativePosition` + `Offset` type (~55 lines each, verbatim identical)
- DOM capture/clone logic: `capturedNodeRef`, `previousContentNode`, `showStartingStyleAttribute` state, `currentContainerRef`/`previousContainerRef`
- `handleMeasureLayout` / `handleMeasureLayoutComplete` callbacks (identical)
- Transition rendering pattern (data-current, data-previous, data-starting-style, data-ending-style)

**Fix:** Extract shared helpers into `packages/react/src/utils/viewportHelpers.ts` and shared hook logic into `packages/react/src/utils/useViewportTransition.ts`. Each viewport component would only keep its context hookup and component-specific state.

---

## 4. Context boilerplate repeated 78+ times (~1-2KB gzipped)

78+ context files follow the same pattern:
```ts
'use client';
import * as React from 'react';
const XxxContext = React.createContext<T | undefined>(undefined);
export function useXxxContext() {
  const ctx = React.useContext(XxxContext);
  if (ctx === undefined) {
    throw new Error('Base UI: XxxContext is missing. Xxx parts must be placed within <Xxx.Root>.');
  }
  return ctx;
}
```

While error messages are minified by babel plugin in production, the function boilerplate (~60 bytes minified per context) is duplicated 78+ times.

**Fix:** Create `packages/react/src/utils/createContext.ts` factory:
```ts
function createRequiredContext<T>(errorMessage: string) {
  const Context = React.createContext<T | undefined>(undefined);
  function useRequiredContext(): T { ... }
  return [Context, useRequiredContext] as const;
}
```
Migrate simple cases first (~50 files with no optional parameter overloads).

**Caveat:** Error messages must remain static string literals (not template literals with variables) to preserve the babel error minification plugin. The factory should accept the full error message string as a parameter.

---

## Verified as NOT worth changing

| Idea | Why it doesn't help |
|------|---------------------|
| **Remove floating-ui-react vendor** | All 20+ exports are actively used across components |
| **Remove `tabbable` dependency** | Used in 6 files for critical focus management |
| **Drop `use-sync-external-store` shim** | Would break React 17/18 support (peer dep) |
| **Deduplicate positioner components** | Heavy logic already shared via `useAnchorPositioning.ts` (704 lines) |
| **Deduplicate store classes** | Base class `ReactStore` (278 lines) already captures shared patterns |
| **Refactor safePolygon** | Vendored code; maintenance cost > savings (~0.5KB) |
| **Remove DataAttributes files** (2,946 lines) | Type-only exports, zero runtime/bundle impact |
| **Strip JSDoc comments** | Already stripped by consumers' minifiers |
| **Remove `@babel/runtime`** | Used by build system for helper dedup, already optimal |
| **Dead code in floating-ui-react** | All exports verified as used |
