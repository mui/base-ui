# PR #4336 Bundle Size Analysis — Why 3.44 KB Gzipped Reduction

## Overview

PR #4336 "[all components] Reduce shared bundle size" achieves **-9.27 KB parsed / -3.44 KB gzipped** across `@base-ui/react` through three strategies applied to shared infrastructure used by popup-heavy components.

---

## Strategy 1: Replace `tabbable` npm dependency (~1.6 KB gzip)

**The biggest single win.**

- **Removed**: `tabbable` v6.4.0 from `packages/react/package.json`
- **Replaced with**: Internal helper functions in `packages/react/src/floating-ui-react/utils/tabbable.ts`
- **Why it saves so much**: The external `tabbable` library implements a full-featured focus management API (shadow DOM traversal, display checks, tab order calculation). Base UI only needs a subset of this functionality.
- **Affected components**: All popup components using `FloatingFocusManager` (Dialog, AlertDialog, Drawer, Popover, Menu, ContextMenu, Combobox, Select, etc.)
- The internal replacement handles shadow DOM, hidden elements, slotted elements, and radio tab stops (commits 3-6 in the PR).

---

## Strategy 2: Store module splitting (~0.8–1.0 KB gzip)

### The Problem

`packages/utils/src/store/index.ts` is a barrel that re-exports 5 modules:
```
createSelector.ts  (215 lines, imports `reselect` library)
useStore.ts        (197 lines, React hook)
Store.ts           (124 lines, core observer)
ReactStore.ts      (279 lines, React store class)
StoreInspector.tsx  (~573 lines, dev-only inspector)
```

All components import from `@base-ui/utils/store`, pulling in **everything** — even if they only need `useStore`.

**Critical issue**: `createSelector.ts` imports `reselect` (external dep) and calls `createSelectorCreator()` at module load time — a top-level side effect that bundlers can't tree-shake away.

### The Fix

Changed ~50+ component files to import from granular subpaths:
```ts
// Before (pulls in entire barrel including reselect)
import { useStore } from '@base-ui/utils/store';

// After (only pulls in the hook module)
import { useStore } from '@base-ui/utils/store/useStore';
```

Works because `package.json` has wildcard export: `"./*": "./src/*.ts"`

### Impact by component type
- **Leaf components** (only need `useStore`): Avoid `reselect`, `ReactStore`, `createSelector`
- **Store definition files**: Import only `Store` + `createSelector`
- **Root components**: Import `ReactStore` (which internally imports `Store` + `useStore`)
- **Simple components** (Slider, Accordion): ~75–82B savings
- **Popup components**: Minimal additional savings here (they still need full store), main savings come from Strategy 1

---

## Strategy 3: Utility simplifications (~200–400B gzip)

### A. Floating-UI internal module splitting

Split large shared utility files into focused modules:
| Module | Contents |
|--------|----------|
| `floating-ui-react/utils/element.ts` (132 lines) | `activeElement`, `contains`, `getTarget`, `isTypeableElement` |
| `floating-ui-react/utils/event.ts` (60 lines) | `stopEvent`, `isVirtualClick`, `isClickLikeEvent` |
| `floating-ui-react/utils/tabbable.ts` (101 lines) | Focus management (uses `tabbable` npm — gets replaced) |
| `floating-ui-react/utils/nodes.ts` | Tree node utilities |

**Effect**: Components importing only `isClickLikeEvent` (e.g., `FloatingRootStore.ts`) no longer transitively pull in the `tabbable` dependency.

### B. `getTabbableOptions()` elimination

The internal tabbable replacement doesn't need the external library's options parameter:
```ts
// Before
const list = tabbable(container, getTabbableOptions());

// After
const list = getTabbableElements(container);
```

Removes both the options factory and per-call overhead.

### C. `useValueAsRef` replacement (tried and reverted)

- Initial commit replaced `useValueAsRef` (a hook with layout effect) with inline `React.useRef()` + direct assignment in ~13 files
- Final commit **restored** `useValueAsRef` because direct assignment during render has different semantics (concurrent mode tearing risk)
- Net bundle impact: **0B** (reverted for correctness)

---

## Bundle Impact by Component

| Component | Gzip Reduction | Primary Savings Source |
|-----------|---------------|----------------------|
| dialog | -3.28 KB | tabbable replacement + store splitting |
| alert-dialog | -3.27 KB | tabbable replacement + store splitting |
| drawer | -3.26 KB | tabbable replacement + store splitting |
| popover | -3.23 KB | tabbable replacement + store splitting |
| menu | -3.18 KB | tabbable replacement + store splitting |
| combobox | -3.06 KB | tabbable replacement + store splitting |
| select | -3.03 KB | tabbable replacement + store splitting |
| toast | -1.92 KB | Partial popup infra (less focus mgmt) |
| tooltip | -1.74 KB | Partial popup infra |
| slider | -75B | Store splitting only |
| accordion | -82B | Store splitting only |

---

## Key Files

| File | Role |
|------|------|
| `packages/react/package.json` | Removed `tabbable` dependency |
| `packages/utils/src/store/index.ts` | Barrel export (the problem) |
| `packages/utils/src/store/{useStore,Store,ReactStore,createSelector}.ts` | Individual modules (the solution) |
| `packages/utils/package.json` | Wildcard export `"./*"` enables granular imports |
| `packages/react/src/floating-ui-react/utils/tabbable.ts` | Current external `tabbable` usage (to be replaced) |
| `packages/react/src/floating-ui-react/utils/{element,event}.ts` | Split utility modules |
| `packages/react/src/floating-ui-react/components/FloatingFocusManager.tsx` | Main consumer of tabbable + focus utilities |

---

## Summary

| Strategy | Gzip Savings | % of Total |
|----------|-------------|------------|
| Replace `tabbable` npm dep | ~1.6 KB | ~46% |
| Store module splitting | ~0.8–1.0 KB | ~26% |
| Utility module splitting | ~0.2–0.4 KB | ~9% |
| Cumulative deduplication | ~0.4–0.6 KB | ~17% |
| **Total** | **~3.44 KB** | **100%** |
