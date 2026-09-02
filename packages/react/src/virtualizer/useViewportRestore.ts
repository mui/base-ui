'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import type { RenderContext, Virtualizer as MuiVirtualizer } from '@mui/x-virtualizer';
import { getContentHeight } from './scrollport';

type RootSize = MuiVirtualizer['store']['state']['rootSize'];

export interface UseViewportRestoreParameters {
  api: MuiVirtualizer['api'];
  /** Whether the engine has measured its dimensions yet. */
  dimensionsReady: boolean;
  enabled: boolean;
  /** The window the engine currently publishes. */
  renderContext: RenderContext;
  /** The viewport size the engine last recorded, in the box model its observer reports. */
  rootSize: RootSize;
  rowCount: number;
  scrollElementRef: React.RefObject<HTMLElement | null>;
  scrollportPaddingTotal: number;
  store: MuiVirtualizer['store'];
  /** The engine's virtual content height. */
  totalSize: number;
}

export interface ViewportRestore {
  /**
   * Requests that the viewport be measured again, because the layout it was measured under has
   * since been replaced. The correction lands on the next commit rather than this one: the
   * request arrives from the mode publication, which runs after this module's own effects.
   */
  arm: () => void;
  /**
   * Withdraws a request that is no longer meaningful. A collection that is currently mounted in
   * full has no windowed viewport to restore, and an armed request left standing would overwrite
   * the next measurement the observer takes.
   */
  disarm: () => void;
}

/**
 * Recovers the viewport measurement a list invalidates by briefly mounting its whole collection.
 *
 * The engine sizes its window from a viewport it measures through a `ResizeObserver`. While every
 * row is mounted, a scrollport constrained only by a maximum height grows to fit them, and that
 * expanded box is what the observer reports. Windowing then resumes against a viewport describing
 * a layout that no longer exists, so the measurement has to be taken again from the element.
 */
export function useViewportRestore(parameters: UseViewportRestoreParameters): ViewportRestore {
  const {
    api,
    dimensionsReady,
    enabled,
    renderContext,
    rootSize,
    rowCount,
    scrollElementRef,
    scrollportPaddingTotal,
    store,
    totalSize,
  } = parameters;

  const armedRef = React.useRef(false);
  // Read as a dependency below so a request arriving after this module's effects have run for the
  // commit still schedules one to act on.
  const [revision, bumpRevision] = React.useReducer((value: number) => value + 1, 0);

  const arm = useStableCallback(() => {
    armedRef.current = true;
    bumpRevision();
  });

  const disarm = useStableCallback(() => {
    armedRef.current = false;
  });

  useIsoLayoutEffect(() => {
    const element = scrollElementRef.current;
    const viewportHeight = element ? getContentHeight(element) : 0;

    if (!armedRef.current || viewportHeight <= 0) {
      return;
    }

    // A completed render-all pass needs this correction at most once. Keeping the flag armed
    // would overwrite every later ResizeObserver update.
    armedRef.current = false;

    if (Math.abs(rootSize.height - viewportHeight) < 1) {
      return;
    }

    // MUI Virtualizer stores the ResizeObserver content-box height. Preserve that same box model even if a
    // preceding render-all pass temporarily expanded the observed content box.
    store.set('rootSize', {
      ...rootSize,
      height: viewportHeight,
    });
    api.updateDimensions();
    api.forceUpdateRenderContext();
  }, [api, enabled, revision, rootSize, scrollElementRef, store]);

  const staleRangeRef = React.useRef<string | null>(null);

  // Declared after the correction above, which disarms once it has a viewport to measure. What
  // reaches this effect is therefore a request that could not be served yet, which is what a list
  // enabled while hidden produces.
  useIsoLayoutEffect(() => {
    const element = scrollElementRef.current;
    const isRenderAllRange =
      renderContext.firstRowIndex === 0 && renderContext.lastRowIndex >= rowCount;
    const needsWindowRefresh =
      armedRef.current &&
      rowCount > 0 &&
      dimensionsReady &&
      element != null &&
      element.clientHeight - scrollportPaddingTotal < totalSize &&
      isRenderAllRange;

    if (!needsWindowRefresh) {
      staleRangeRef.current = null;
      return;
    }

    const refreshKey = `${rowCount}:${element.clientHeight}:${totalSize}`;
    if (staleRangeRef.current === refreshKey) {
      return;
    }

    // Enabling while hidden can make the scheduled update run before dimensions are ready.
    // Retry after a constrained viewport renders so reopening cannot retain the render-all range.
    staleRangeRef.current = refreshKey;
    api.forceUpdateRenderContext();
  }, [
    api,
    dimensionsReady,
    enabled,
    renderContext.firstRowIndex,
    renderContext.lastRowIndex,
    revision,
    rowCount,
    scrollElementRef,
    scrollportPaddingTotal,
    totalSize,
  ]);

  return React.useMemo(() => ({ arm, disarm }), [arm, disarm]);
}
