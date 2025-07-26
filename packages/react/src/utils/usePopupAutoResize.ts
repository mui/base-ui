import * as React from 'react';
import { useAnimationFrame } from '@base-ui-components/utils/useAnimationFrame';
import { useIsoLayoutEffect } from '@base-ui-components/utils/useIsoLayoutEffect';
import { useAnimationsFinished } from './useAnimationsFinished';

/**
 * Allows the element to automatically resize based on its content while supporting animations.
 */
export function usePopupAutoResize(parameters: UsePopupAutoResizeParameters) {
  const { element, open, content, enabled = true } = parameters;

  const isInitialRender = React.useRef(true);
  const runOnceAnimationsFinish = useAnimationsFinished(element, true);
  const animationFrame = useAnimationFrame();
  const previousDimensionsRef = React.useRef<{ width: number; height: number } | null>(null);

  useIsoLayoutEffect(() => {
    // Reset the state when the popup is closed.
    if (!open || !enabled) {
      isInitialRender.current = true;
      previousDimensionsRef.current = null;
      return undefined;
    }

    if (!element) {
      return undefined;
    }

    const observer = new ResizeObserver((entries) => {
      // We only care about the first (and only) observed element.
      const entry = entries[0];
      if (entry) {
        previousDimensionsRef.current = {
          width: entry.borderBoxSize[0].inlineSize,
          height: entry.borderBoxSize[0].blockSize,
        };
      }
    });

    // Start observing the element.
    observer.observe(element);

    // Initial render (for each time the popup opens).
    if (isInitialRender.current || previousDimensionsRef.current === null) {
      element.style.setProperty('--popup-width', 'auto');
      element.style.setProperty('--popup-height', 'auto');
      isInitialRender.current = false;
      return undefined;
    }

    // Subsequent renders while open (when `content` changes).
    element.style.setProperty('--popup-width', 'auto');
    element.style.setProperty('--popup-height', 'auto');

    const newDimensions = element.getBoundingClientRect();
    element.style.setProperty('--popup-width', `${previousDimensionsRef.current.width}px`);
    element.style.setProperty('--popup-height', `${previousDimensionsRef.current.height}px`);

    const abortController = new AbortController();

    animationFrame.request(() => {
      element.style.setProperty('--popup-width', `${newDimensions.width}px`);
      element.style.setProperty('--popup-height', `${newDimensions.height}px`);

      runOnceAnimationsFinish(() => {
        element.style.setProperty('--popup-width', 'auto');
        element.style.setProperty('--popup-height', 'auto');
      }, abortController.signal);
    });

    return () => {
      abortController.abort();
      animationFrame.cancel();
    };
  }, [content, element, open, runOnceAnimationsFinish, animationFrame, enabled]);
}

interface UsePopupAutoResizeParameters {
  /**
   * Element to resize.
   */
  element: HTMLElement | null;
  /**
   * Whether the popup is open.
   */
  open: boolean;
  /*
   * Content that may change and trigger a resize.
   * This doesn't have to be the actual content of the popup, but a value that triggers a resize.
   */
  content: unknown;
  /**
   * Whether the auto-resize is enabled.
   */
  enabled?: boolean;
}
