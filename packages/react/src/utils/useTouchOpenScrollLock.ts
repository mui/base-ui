'use client';
import * as React from 'react';
import { useAnimationFrame } from '@base-ui/utils/useAnimationFrame';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';

const VIEWPORT_WIDTH_TOLERANCE_PX = 20;

export function useTouchOpenScrollLock(
  enabled: boolean,
  touchOpen: boolean,
  popupRef: React.RefObject<HTMLElement | null>,
) {
  const [touchOpenShouldLockScroll, setTouchOpenShouldLockScroll] = React.useState(false);
  const frame = useAnimationFrame();

  useIsoLayoutEffect(() => {
    if (!enabled || !touchOpen) {
      setTouchOpenShouldLockScroll(false);
      return undefined;
    }

    function updateShouldLockScroll() {
      const popupElement = popupRef.current;
      const positionerElement = popupElement?.parentElement;

      if (popupElement == null || positionerElement == null) {
        setTouchOpenShouldLockScroll(false);
        return;
      }

      const availableWidth = Number.parseFloat(
        positionerElement.style.getPropertyValue('--available-width'),
      );
      const popupWidth = popupElement.offsetWidth;

      setTouchOpenShouldLockScroll(
        availableWidth > 0 &&
          popupWidth > 0 &&
          popupWidth >= availableWidth - VIEWPORT_WIDTH_TOLERANCE_PX,
      );
    }

    updateShouldLockScroll();
    frame.request(updateShouldLockScroll);

    return frame.cancel;
  }, [enabled, frame, popupRef, touchOpen]);

  return enabled && (!touchOpen || touchOpenShouldLockScroll);
}
