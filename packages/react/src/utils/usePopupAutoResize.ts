import * as React from 'react';
import { useAnimationFrame } from '@base-ui-components/utils/useAnimationFrame';
import { useIsoLayoutEffect } from '@base-ui-components/utils/useIsoLayoutEffect';
import { useAnimationsFinished } from './useAnimationsFinished';

/**
 * Allows the element to automatically resize based on its content while supporting animations.
 */
export function usePopupAutoResize(parameters: UsePopupAutoResizeParameters) {
  const { popupElement, positionerElement, open, content, enabled = true } = parameters;

  const isInitialRender = React.useRef(true);
  const runOnceAnimationsFinish = useAnimationsFinished(popupElement, true);
  const animationFrame = useAnimationFrame();
  const previousDimensionsRef = React.useRef<{ width: number; height: number } | null>(null);

  useIsoLayoutEffect(() => {
    // Reset the state when the popup is closed.
    if (!open || !enabled) {
      isInitialRender.current = true;
      previousDimensionsRef.current = null;
      return undefined;
    }

    if (!popupElement || !positionerElement) {
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
    observer.observe(popupElement);

    const originalPositionProperty = popupElement.style.getPropertyValue('position');
    const originalTransformProperty = popupElement.style.getPropertyValue('transform');

    // Initial render (for each time the popup opens).
    if (isInitialRender.current || previousDimensionsRef.current === null) {
      popupElement.style.setProperty('--popup-width', 'auto');
      popupElement.style.setProperty('--popup-height', 'auto');
      popupElement.style.setProperty('transform', 'none');
      popupElement.style.setProperty('position', 'static');

      positionerElement.style.setProperty('--positioner-width', 'auto');
      positionerElement.style.setProperty('--positioner-height', 'auto');

      const dimensions = popupElement.getBoundingClientRect();

      positionerElement.style.setProperty('--positioner-width', `${dimensions.width}px`);
      positionerElement.style.setProperty('--positioner-height', `${dimensions.height}px`);

      if (originalPositionProperty) {
        popupElement.style.setProperty('position', originalPositionProperty);
      } else {
        popupElement.style.removeProperty('position');
      }

      if (originalTransformProperty) {
        popupElement.style.setProperty('transform', originalTransformProperty);
      } else {
        popupElement.style.removeProperty('transform');
      }

      isInitialRender.current = false;
      return undefined;
    }

    // Subsequent renders while open (when `content` changes).
    popupElement.style.setProperty('--popup-width', 'auto');
    popupElement.style.setProperty('--popup-height', 'auto');
    popupElement.style.setProperty('position', 'static');
    positionerElement.style.removeProperty('--positioner-width');
    positionerElement.style.removeProperty('--positioner-height');

    const newDimensions = popupElement.getBoundingClientRect();

    popupElement.style.setProperty('--popup-width', `${previousDimensionsRef.current.width}px`);
    popupElement.style.setProperty('--popup-height', `${previousDimensionsRef.current.height}px`);
    if (originalPositionProperty) {
      popupElement.style.setProperty('position', originalPositionProperty);
    } else {
      popupElement.style.removeProperty('position');
    }

    positionerElement.style.setProperty('--positioner-width', `${newDimensions.width}px`);
    positionerElement.style.setProperty('--positioner-height', `${newDimensions.height}px`);

    const abortController = new AbortController();

    animationFrame.request(() => {
      popupElement.style.setProperty('--popup-width', `${newDimensions.width}px`);
      popupElement.style.setProperty('--popup-height', `${newDimensions.height}px`);

      runOnceAnimationsFinish(() => {
        popupElement.style.setProperty('--popup-width', 'auto');
        popupElement.style.setProperty('--popup-height', 'auto');
      }, abortController.signal);
    });

    return () => {
      observer.disconnect();
      abortController.abort();
      animationFrame.cancel();
    };
  }, [
    content,
    popupElement,
    positionerElement,
    open,
    runOnceAnimationsFinish,
    animationFrame,
    enabled,
  ]);
}

interface UsePopupAutoResizeParameters {
  /**
   * Element to resize.
   */
  popupElement: HTMLElement | null;
  /*
   * Positioner element (parent of the popup)
   */
  positionerElement: HTMLElement | null;
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
