'use client';
import { useAnimationFrame } from '@base-ui/utils/useAnimationFrame';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { ViewportController } from './viewportController';
import type { ViewportEnvironment } from './viewportController';

/**
 * Creates the {@link ViewportController} for a virtualizer's lifetime, with the frames it
 * schedules cancelled whenever its effects are torn down. Every member of `environment` must be stable.
 */
export function useViewportController<RowModel>(
  environment: Omit<ViewportEnvironment, 'measurementFrame' | 'viewportFrame'>,
) {
  const viewportFrame = useAnimationFrame();
  const measurementFrame = useAnimationFrame();

  const controller = useRefWithInit(
    () => new ViewportController<RowModel>({ ...environment, measurementFrame, viewportFrame }),
  ).current;

  useIsoLayoutEffect(() => () => controller.disconnect(), [controller]);

  return controller;
}
