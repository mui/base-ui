'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { ownerDocument } from '@base-ui/utils/owner';
import { clamp } from '../../internals/clamp';
import { useDialogRootContext } from '../../dialog/root/DialogRootContext';
import { useDrawerRootContext } from './DrawerRootContext';
import type { DrawerSnapPoint } from './DrawerRootContext';

export interface ResolvedDrawerSnapPoint {
  value: DrawerSnapPoint;
  height: number;
  offset: number;
}

/**
 * Resolves the vertical swipe movement for a snap point, applying square-root damping once the drag
 * overshoots the fully-open edge (`nextOffset < 0`) so the popup resists travelling past it.
 */
export function getSnapPointSwipeMovement(baseOffset: number, movementValue: number): number {
  const nextOffset = baseOffset + movementValue;
  if (nextOffset >= 0) {
    return movementValue;
  }

  return -Math.sqrt(-nextOffset) - baseOffset;
}

function resolveSnapPointValue(
  snapPoint: DrawerSnapPoint,
  viewportHeight: number,
  rootFontSize: number,
) {
  if (!Number.isFinite(viewportHeight) || viewportHeight <= 0) {
    return null;
  }

  if (typeof snapPoint === 'number') {
    if (!Number.isFinite(snapPoint)) {
      return null;
    }

    if (snapPoint <= 1) {
      return clamp(snapPoint, 0, 1) * viewportHeight;
    }

    return snapPoint;
  }

  const trimmed = snapPoint.trim();

  if (trimmed.endsWith('px')) {
    const value = Number.parseFloat(trimmed);
    return Number.isFinite(value) ? value : null;
  }

  if (trimmed.endsWith('rem')) {
    const value = Number.parseFloat(trimmed);
    return Number.isFinite(value) ? value * rootFontSize : null;
  }

  return null;
}

/**
 * Returns the index of the value closest to `target`, or `-1` if `values` is empty.
 */
export function closestSnapPointIndex(values: number[], target: number): number {
  let closestIndex = -1;
  let closestDistance = Infinity;

  for (let index = 0; index < values.length; index += 1) {
    const distance = Math.abs(values[index] - target);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestIndex = index;
    }
  }

  return closestIndex;
}

export function useDrawerSnapPoints() {
  const store = useDialogRootContext();
  const { snapPoints, activeSnapPoint, setActiveSnapPoint, popupHeight } = useDrawerRootContext();
  const viewportElement = store.useState('viewportElement');

  const [viewportHeight, setViewportHeight] = React.useState(0);
  const [rootFontSize, setRootFontSize] = React.useState(16);

  const measureViewportHeight = useStableCallback(() => {
    const doc = ownerDocument(viewportElement);
    const html = doc.documentElement;

    setViewportHeight(viewportElement ? viewportElement.offsetHeight : html.clientHeight);

    const fontSize = parseFloat(getComputedStyle(html).fontSize);
    if (Number.isFinite(fontSize)) {
      setRootFontSize(fontSize);
    }
  });

  useIsoLayoutEffect(() => {
    measureViewportHeight();

    if (!viewportElement || typeof ResizeObserver !== 'function') {
      return undefined;
    }

    const resizeObserver = new ResizeObserver(measureViewportHeight);
    resizeObserver.observe(viewportElement);
    return () => {
      resizeObserver.disconnect();
    };
  }, [measureViewportHeight, viewportElement]);

  const resolvedSnapPoints = React.useMemo<ResolvedDrawerSnapPoint[]>(() => {
    if (!snapPoints || snapPoints.length === 0 || viewportHeight <= 0 || popupHeight <= 0) {
      return [];
    }

    const maxHeight = Math.min(popupHeight, viewportHeight);

    const resolved = snapPoints
      .map((value): ResolvedDrawerSnapPoint | null => {
        const resolvedHeight = resolveSnapPointValue(value, viewportHeight, rootFontSize);
        if (resolvedHeight === null) {
          return null;
        }

        const clampedHeight = clamp(resolvedHeight, 0, maxHeight);
        return {
          value,
          height: clampedHeight,
          offset: Math.max(0, popupHeight - clampedHeight),
        };
      })
      .filter((point): point is ResolvedDrawerSnapPoint => Boolean(point));

    if (resolved.length <= 1) {
      return resolved;
    }

    const deduped: ResolvedDrawerSnapPoint[] = [];
    const seenHeights: number[] = [];

    for (let index = resolved.length - 1; index >= 0; index -= 1) {
      const point = resolved[index];
      const isDuplicate = seenHeights.some((height) => Math.abs(height - point.height) <= 1);
      if (isDuplicate) {
        continue;
      }

      seenHeights.push(point.height);
      deduped.push(point);
    }

    deduped.reverse();
    return deduped;
  }, [popupHeight, rootFontSize, snapPoints, viewportHeight]);

  const resolvedActiveSnapPoint = React.useMemo(() => {
    if (activeSnapPoint === null) {
      return undefined;
    }

    const exactMatch = resolvedSnapPoints.find((point) => Object.is(point.value, activeSnapPoint));
    if (exactMatch) {
      return exactMatch;
    }

    const maxHeight = Math.min(popupHeight, viewportHeight);
    const resolvedHeight = resolveSnapPointValue(activeSnapPoint, viewportHeight, rootFontSize);
    if (resolvedHeight === null) {
      return undefined;
    }

    const clampedHeight = clamp(resolvedHeight, 0, maxHeight);
    return resolvedSnapPoints[
      closestSnapPointIndex(
        resolvedSnapPoints.map((point) => point.height),
        clampedHeight,
      )
    ];
  }, [activeSnapPoint, popupHeight, resolvedSnapPoints, rootFontSize, viewportHeight]);

  return {
    snapPoints,
    activeSnapPoint,
    setActiveSnapPoint,
    popupHeight,
    viewportHeight,
    resolvedSnapPoints,
    activeSnapPointOffset: resolvedActiveSnapPoint?.offset ?? null,
  };
}
