'use client';
import * as React from 'react';
import { useAnimationFrame } from '@base-ui/utils/useAnimationFrame';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';

const VIEWPORT_WIDTH_TOLERANCE_PX = 20;

export function useTouchOpenScrollLock(
  enabled: boolean,
  touchOpen: boolean,
  positionerElement: HTMLElement | null,
) {
  const [touchOpenShouldLockScroll, setTouchOpenShouldLockScroll] = React.useState(false);
  const frame = useAnimationFrame();

  useIsoLayoutEffect(() => {
    if (!enabled || !touchOpen || positionerElement == null) {
      setTouchOpenShouldLockScroll(false);
      return undefined;
    }

    const currentPositionerElement = positionerElement;

    function updateShouldLockScroll() {
      const availableWidth = Number.parseFloat(
        currentPositionerElement.style.getPropertyValue('--available-width'),
      );
      const popupWidth = currentPositionerElement.offsetWidth;

      setTouchOpenShouldLockScroll(
        availableWidth > 0 &&
          popupWidth > 0 &&
          popupWidth >= availableWidth - VIEWPORT_WIDTH_TOLERANCE_PX,
      );
    }

    updateShouldLockScroll();
    frame.request(updateShouldLockScroll);

    return frame.cancel;
  }, [enabled, frame, positionerElement, touchOpen]);

  return enabled && (!touchOpen || touchOpenShouldLockScroll);
}
