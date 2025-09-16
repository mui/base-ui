import * as React from 'react';
import { useAnimationFrame } from '@base-ui-components/utils/useAnimationFrame';
import { useIsoLayoutEffect } from '@base-ui-components/utils/useIsoLayoutEffect';
import { useAnimationsFinished } from './useAnimationsFinished';
import { getCssDimensions } from './getCssDimensions';
import { Dimensions } from '../floating-ui-react/types';

/**
 * Allows the element to automatically resize based on its content while supporting animations.
 */
export function usePopupAutoResize(parameters: UsePopupAutoResizeParameters) {
  const {
    popupElement,
    positionerElement,
    open,
    content,
    enabled = true,
    onMeasureLayout,
    onMeasureLayoutComplete,
  } = parameters;

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
      const entry = entries[0];
      if (entry) {
        if (previousDimensionsRef.current === null) {
          previousDimensionsRef.current = {
            width: entry.borderBoxSize[0].inlineSize,
            height: entry.borderBoxSize[0].blockSize,
          };
        } else {
          previousDimensionsRef.current.width = entry.borderBoxSize[0].inlineSize;
          previousDimensionsRef.current.height = entry.borderBoxSize[0].blockSize;
        }
      }
    });

    observer.observe(popupElement);

    // Measure the rendered size to enable transitions:

    popupElement.style.setProperty('--popup-width', 'auto');
    popupElement.style.setProperty('--popup-height', 'auto');

    const restorePopupPosition = overrideElementStyle(popupElement, 'position', 'static');
    const restorePopupTransform = overrideElementStyle(popupElement, 'transform', 'none');
    onMeasureLayout?.();

    // Initial render (for each time the popup opens).
    if (isInitialRender.current || previousDimensionsRef.current === null) {
      positionerElement.style.setProperty('--positioner-width', 'auto');
      positionerElement.style.setProperty('--positioner-height', 'auto');

      const dimensions = getCssDimensions(popupElement);

      positionerElement.style.setProperty('--positioner-width', `${dimensions.width}px`);
      positionerElement.style.setProperty('--positioner-height', `${dimensions.height}px`);
      restorePopupPosition();
      restorePopupTransform();
      onMeasureLayoutComplete?.(null, dimensions);

      isInitialRender.current = false;

      return () => {
        observer.disconnect();
      };
    }

    // Subsequent renders while open (when `content` changes).
    popupElement.style.setProperty('--popup-width', 'auto');
    popupElement.style.setProperty('--popup-height', 'auto');
    positionerElement.style.removeProperty('--positioner-width');
    positionerElement.style.removeProperty('--positioner-height');

    const newDimensions = getCssDimensions(positionerElement);

    popupElement.style.setProperty('--popup-width', `${previousDimensionsRef.current.width}px`);
    popupElement.style.setProperty('--popup-height', `${previousDimensionsRef.current.height}px`);
    restorePopupPosition();
    restorePopupTransform();
    onMeasureLayoutComplete?.(previousDimensionsRef.current, newDimensions);

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
    onMeasureLayout,
    onMeasureLayoutComplete,
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
  /**
   * Callback fired immediately before measuring the dimensions of the new content.
   */
  onMeasureLayout?: () => void;
  /**
   * Callback fired after the new dimensions have been measured.
   *
   * @param previousDimensions Dimensions before the change, or `null` if this is the first measurement.
   * @param newDimensions Newly measured dimensions.
   */
  onMeasureLayoutComplete?: (
    previousDimensions: Dimensions | null,
    newDimensions: Dimensions,
  ) => void;
}

function overrideElementStyle(element: HTMLElement, property: string, value: string) {
  const originalValue = element.style.getPropertyValue(property);
  element.style.setProperty(property, value);

  return () => {
    element.style.setProperty(property, originalValue);
  };
}
