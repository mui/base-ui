'use client';
import * as React from 'react';
import { ownerDocument } from '@base-ui/utils/owner';
import { useScrollLock } from '@base-ui/utils/useScrollLock';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';

// Touch-opened popups normally avoid scroll locking so users can still swipe outside to dismiss.
// This hook re-enables scroll lock only when the popup is effectively full-width.
const VIEWPORT_WIDTH_TOLERANCE_PX = 20;

/**
 * Enables scroll lock for touch-opened popups when their positioned width is effectively
 * viewport-sized.
 */
export function useTouchOpenScrollLock(
  enabled: boolean,
  touchOpen: boolean,
  positionerElement: HTMLElement | null,
  referenceElement: Element | null,
) {
  const [touchOpenShouldLockScroll, setTouchOpenShouldLockScroll] = React.useState(false);

  useIsoLayoutEffect(() => {
    if (!enabled || !touchOpen || positionerElement == null) {
      setTouchOpenShouldLockScroll(false);
      return;
    }

    const viewportWidth = ownerDocument(positionerElement).documentElement.clientWidth;
    const popupWidth = positionerElement.offsetWidth;

    setTouchOpenShouldLockScroll(
      viewportWidth > 0 &&
        popupWidth > 0 &&
        popupWidth >= viewportWidth - VIEWPORT_WIDTH_TOLERANCE_PX,
    );
  }, [enabled, touchOpen, positionerElement]);

  useScrollLock(enabled && (!touchOpen || touchOpenShouldLockScroll), referenceElement);
}
