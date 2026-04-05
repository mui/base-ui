# Store Module Splitting Plan for MUI X Charts

## Context

The `@mui/x-internals/store` module is a barrel export (`src/store/index.ts`) that re-exports 4 modules:

```
createSelector.ts  (218 lines — imports `reselect` library, has top-level side effect)
useStore.ts        (74 lines — React hook)
useStoreEffect.ts  (58 lines — effect hook, depends on @mui/utils)
Store.ts           (86 lines — core observer class)
```

**The problem:** Every file that does `import { createSelector } from '@mui/x-internals/store'` also pulls in `useStore`, `useStoreEffect`, `Store`, and critically — the `reselect` dependency via `createSelector.ts` line 13:

```ts
const reselectCreateSelector = createSelectorCreator({ ... });
```

This is a **top-level side effect** that bundlers can't tree-shake, even with `sideEffects: false`.

**The opportunity:** Across x-charts (29 files), x-charts-pro (4 files), and x-charts-premium (0 files), the imports break down as:

| Export used | Files | Packages |
|------------|-------|----------|
| `createSelector` | 24 | x-charts, x-charts-pro |
| `createSelectorMemoized` | 14 | x-charts, x-charts-pro |
| `createSelectorMemoizedWithOptions` | 2 | x-charts |
| `Store` (runtime) | 1 | x-charts (`useCharts.ts`) |
| `Store` (type-only) | 4 | x-charts |
| `useStoreEffect` | 1 | x-charts |
| `useStore` (from x-internals) | 0 | (consumed via local wrapper) |

**Key insight:** 22 of 29 files in x-charts are `.selectors.ts` files that only need `createSelector`/`createSelectorMemoized`. They don't need `useStore`, `useStoreEffect`, or `Store` at all. But through the barrel, they pull in all of them.

---

## Implementation Plan

### Step 1: Add explicit subpath exports to x-internals package.json

**File:** `packages/x-internals/package.json`

The current exports pattern `"./*": "./src/*/index.ts"` only resolves directory-level imports (e.g., `@mui/x-internals/store` → `src/store/index.ts`). It does NOT support `@mui/x-internals/store/createSelector` because that would try to find `src/store/createSelector/index.ts` which doesn't exist.

**Change the exports field to add granular store subpaths:**

```json
"exports": {
  "./*": "./src/*/index.ts",
  "./store": "./src/store/index.ts",
  "./store/createSelector": "./src/store/createSelector.ts",
  "./store/useStore": "./src/store/useStore.ts",
  "./store/useStoreEffect": "./src/store/useStoreEffect.ts",
  "./store/Store": "./src/store/Store.ts"
}
```

> **Note:** Explicit exports take priority over wildcard patterns per Node.js resolution rules. The barrel `./store` still works for consumers that want everything.

**TypeScript path mapping:** The root `tsconfig.json` (line 52) already has `"@mui/x-internals/*": ["./packages/x-internals/src/*"]`. With `moduleResolution: "bundler"`, this resolves `@mui/x-internals/store/createSelector` → `packages/x-internals/src/store/createSelector.ts` automatically. **No tsconfig changes needed.**

---

### Step 2: Update x-charts selector files (22 files)

All `.selectors.ts` files only need `createSelector` and/or `createSelectorMemoized`. Change their imports:

```ts
// Before
import { createSelector } from '@mui/x-internals/store';
import { createSelector, createSelectorMemoized } from '@mui/x-internals/store';

// After
import { createSelector } from '@mui/x-internals/store/createSelector';
import { createSelector, createSelectorMemoized } from '@mui/x-internals/store/createSelector';
```

**Files to update in `packages/x-charts/src/`:**

1. `internals/seriesSelectorOfType.ts` — `createSelector, createSelectorMemoized`
2. `internals/plugins/corePlugins/useChartAnimation/useChartAnimation.selectors.ts` — `createSelector`
3. `internals/plugins/corePlugins/useChartDimensions/useChartDimensions.selectors.ts` — `createSelector, createSelectorMemoized`
4. `internals/plugins/corePlugins/useChartSeriesConfig/useChartSeriesConfig.selectors.ts` — `createSelector`
5. `internals/plugins/corePlugins/useChartId/useChartId.selectors.ts` — `createSelector`
6. `internals/plugins/corePlugins/useChartSeries/useChartSeries.selectors.ts` — `createSelectorMemoized, createSelector`
7. `internals/plugins/corePlugins/useChartExperimentalFeature/useChartExperimentalFeature.selectors.ts` — `createSelector`
8. `internals/plugins/featurePlugins/useChartZAxis/useChartZAxis.selectors.ts` — `createSelector`
9. `internals/plugins/featurePlugins/useChartHighlight/useChartHighlight.selectors.ts` — `createSelector, createSelectorMemoized`
10. `internals/plugins/featurePlugins/useChartBrush/useChartBrush.selectors.ts` — `createSelector, createSelectorMemoized`
11. `internals/plugins/featurePlugins/useChartKeyboardNavigation/useChartKeyboardNavigation.selectors.ts` — `createSelector`
12. `internals/plugins/featurePlugins/useChartCartesianAxis/useChartAxisSize.selectors.ts` — `createSelector, createSelectorMemoized`
13. `internals/plugins/featurePlugins/useChartTooltip/useChartTooltip.selectors.ts` — `createSelector, createSelectorMemoized`
14. `internals/plugins/featurePlugins/useChartCartesianAxis/useChartCartesianTooltip.selectors.ts` — `createSelector, createSelectorMemoized, createSelectorMemoizedWithOptions`
15. `internals/plugins/featurePlugins/useChartClosestPoint/useChartClosestPoint.selectors.ts` — `createSelector`
16. `internals/plugins/featurePlugins/useChartVisibilityManager/useChartVisibilityManager.selectors.ts` — `createSelector, createSelectorMemoized`
17. `internals/plugins/featurePlugins/useChartCartesianAxis/useChartCartesianInteraction.selectors.ts` — `createSelector`
18. `internals/plugins/featurePlugins/useChartInteraction/useChartInteraction.selectors.ts` — `createSelector`
19. `internals/plugins/featurePlugins/useChartCartesianAxis/useChartCartesianAxisPosition.selectors.ts` — `createSelector`
20. `internals/plugins/featurePlugins/useChartCartesianAxis/useChartCartesianAxisRendering.selectors.ts` — `createSelector, createSelectorMemoized`
21. `internals/plugins/featurePlugins/useChartCartesianAxis/useChartCartesianAxisPreview.selectors.ts` — `createSelectorMemoized`
22. `internals/plugins/featurePlugins/useChartCartesianAxis/useChartCartesianHighlight.selectors.ts` — `createSelector, createSelectorMemoized`
23. `internals/plugins/featurePlugins/useChartPolarAxis/useChartPolarAxis.selectors.ts` — `createSelector, createSelectorMemoized`
24. `internals/plugins/featurePlugins/useChartPolarAxis/useChartPolarInteraction.selectors.ts` — `createSelector, createSelectorMemoizedWithOptions`

---

### Step 3: Update x-charts non-selector files (5 files)

**Type-only imports (no runtime change, but cleaner):**

```ts
// Before
import { type Store } from '@mui/x-internals/store';

// After
import { type Store } from '@mui/x-internals/store/Store';
```

Files:
1. `context/ChartsProvider/ChartsProvider.types.ts` — `type Store`
2. `internals/store/useStore.ts` — `type Store`
3. `internals/plugins/utils/useLazySelectorEffect.ts` — `type Store`
4. `internals/plugins/models/plugin.ts` — `type Store`

**Runtime imports:**

```ts
// useCharts.ts — needs Store class
import { Store } from '@mui/x-internals/store/Store';

// useChartCartesianAxis.ts — needs useStoreEffect
import { useStoreEffect } from '@mui/x-internals/store/useStoreEffect';
```

Files:
5. `internals/store/useCharts.ts` — `Store` (runtime)
6. `internals/plugins/featurePlugins/useChartCartesianAxis/useChartCartesianAxis.ts` — `useStoreEffect`

---

### Step 4: Update x-charts-pro selector files (4 files)

```ts
// Before
import { createSelector } from '@mui/x-internals/store';
import { createSelector, createSelectorMemoized } from '@mui/x-internals/store';

// After
import { createSelector } from '@mui/x-internals/store/createSelector';
import { createSelector, createSelectorMemoized } from '@mui/x-internals/store/createSelector';
```

Files in `packages/x-charts-pro/src/`:
1. `FunnelChart/funnelAxisPlugin/useChartFunnelAxisRendering.selectors.ts` — `createSelector, createSelectorMemoized`
2. `internals/plugins/useChartProZoom/useChartProZoom.selectors.ts` — `createSelector`
3. `internals/plugins/useChartProZoom/ZoomInteractionConfig.selectors.ts` — `createSelector`
4. `plugins/selectors/useChartHeatmapPosition.selectors.ts` — `createSelector`

---

### Step 5: x-charts-premium (no changes needed)

No files in x-charts-premium import from `@mui/x-internals/store`.

---

## Expected Bundle Impact

### What gets eliminated for selector-only files (22 of 29 in x-charts)

| Module eliminated | Size | External deps eliminated |
|-------------------|------|------------------------|
| `useStore.ts` (74 lines) | ~1.5 KB source | `use-sync-external-store` shim |
| `useStoreEffect.ts` (58 lines) | ~1.2 KB source | `@mui/utils/useLazyRef`, `@mui/utils/useOnMount` |
| `Store.ts` (86 lines) | ~1.8 KB source | — |
| **Total per entrypoint** | **~4.5 KB source** | **2 external deps** |

> **Note:** The `reselect` dependency is still pulled in by `createSelector.ts` (it's needed). The savings come from eliminating `useStore`, `useStoreEffect`, and `Store` from bundles that only need selectors.

### Realistic gzip estimate

The savings depend on how the chart packages are bundled by end users. Since `sideEffects: false` is set, modern bundlers should already tree-shake some of this. The granular imports make this **guaranteed** regardless of bundler quality.

Conservative estimate: **200–800B gzipped** per chart package entrypoint, depending on how well the user's bundler already handles tree-shaking.

---

## Verification

1. **TypeScript:** Run `pnpm typescript` in `packages/x-internals`, `packages/x-charts`, `packages/x-charts-pro`
2. **Build:** Run `pnpm build` in `packages/x-internals` and verify the build output includes the new subpath exports
3. **Tests:** Run chart tests to ensure no regressions:
   - `pnpm --filter @mui/x-charts test`
   - `pnpm --filter @mui/x-charts-pro test`
4. **Bundle check:** If a size-limit or bundlesize tool exists, run it to verify reduction
5. **Import verification:** Confirm that `@mui/x-internals/store/createSelector` resolves correctly in both dev (TypeScript) and build (CJS/ESM) contexts

---

## Files Modified (Summary)

| Package | Files changed | Change type |
|---------|--------------|-------------|
| `x-internals` | 1 (`package.json`) | Add explicit store subpath exports |
| `x-charts` | 30 | Update import paths |
| `x-charts-pro` | 4 | Update import paths |
| `x-charts-premium` | 0 | No changes |
| **Total** | **35 files** | |
