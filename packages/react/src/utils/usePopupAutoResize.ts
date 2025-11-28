import * as React from 'react';
import { useAnimationFrame } from '@base-ui-components/utils/useAnimationFrame';
import { useIsoLayoutEffect } from '@base-ui-components/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui-components/utils/useStableCallback';
import { useAnimationsFinished } from './useAnimationsFinished';
import { getCssDimensions } from './getCssDimensions';
import { Dimensions } from '../floating-ui-react/types';

const supportsResizeObserver = typeof ResizeObserver !== 'undefined';

const DEFAULT_ENABLED = () => true;

/**
 * Allows the element to automatically resize based on its content while supporting animations.
 */
export function usePopupAutoResize(parameters: UsePopupAutoResizeParameters) {
  const {
    popupElement,
    positionerElement,
    content,
    mounted,
    enabled = DEFAULT_ENABLED,
    onMeasureLayout: onMeasureLayoutParam,
    onMeasureLayoutComplete: onMeasureLayoutCompleteParam,
  } = parameters;

  const isInitialRender = React.useRef(true);
  const runOnceAnimationsFinish = useAnimationsFinished(popupElement, true, false);
  const animationFrame = useAnimationFrame();
  const previousDimensionsRef = React.useRef<Dimensions | null>(null);

  const onMeasureLayout = useStableCallback(onMeasureLayoutParam);
  const onMeasureLayoutComplete = useStableCallback(onMeasureLayoutCompleteParam);

  useIsoLayoutEffect(() => {
    // Reset the state when the popup is closed.
    if (!mounted || !enabled() || !supportsResizeObserver) {
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
            width: Math.ceil(entry.borderBoxSize[0].inlineSize),
            height: Math.ceil(entry.borderBoxSize[0].blockSize),
          };
        } else {
          previousDimensionsRef.current.width = Math.ceil(entry.borderBoxSize[0].inlineSize);
          previousDimensionsRef.current.height = Math.ceil(entry.borderBoxSize[0].blockSize);
        }
      }
    });

    observer.observe(popupElement);

    // Measure the rendered size to enable transitions:
    popupElement.style.setProperty('--popup-width', 'auto');
    popupElement.style.setProperty('--popup-height', 'auto');

    const restorePopupPosition = overrideElementStyle(popupElement, 'position', 'static');
    const restorePopupTransform = overrideElementStyle(popupElement, 'transform', 'none');
    const restorePopupScale = overrideElementStyle(popupElement, 'scale', '1');
    const restoreAvailableWidth = overrideElementStyle(
      positionerElement,
      '--available-width',
      'max-content',
    );
    const restoreAvailableHeight = overrideElementStyle(
      positionerElement,
      '--available-height',
      'max-content',
    );
    onMeasureLayout?.();

    // Initial render (for each time the popup opens).
    if (isInitialRender.current || previousDimensionsRef.current === null) {
      positionerElement.style.setProperty('--positioner-width', 'max-content');
      positionerElement.style.setProperty('--positioner-height', 'max-content');

      const dimensions = getCssDimensions(popupElement);

      positionerElement.style.setProperty('--positioner-width', `${dimensions.width}px`);
      positionerElement.style.setProperty('--positioner-height', `${dimensions.height}px`);
      restorePopupPosition();
      restorePopupTransform();
      restorePopupScale();
      restoreAvailableWidth();
      restoreAvailableHeight();
      onMeasureLayoutComplete?.(null, dimensions);

      isInitialRender.current = false;

      return () => {
        observer.disconnect();
      };
    }

    // Subsequent renders while open (when `content` changes).
    popupElement.style.setProperty('--popup-width', 'auto');
    popupElement.style.setProperty('--popup-height', 'auto');
    positionerElement.style.setProperty('--positioner-width', 'max-content');
    positionerElement.style.setProperty('--positioner-height', 'max-content');

    const newDimensions = getCssDimensions(popupElement);

    popupElement.style.setProperty('--popup-width', `${previousDimensionsRef.current.width}px`);
    popupElement.style.setProperty('--popup-height', `${previousDimensionsRef.current.height}px`);
    restorePopupPosition();
    restorePopupTransform();
    restoreAvailableWidth();
    restoreAvailableHeight();
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
    runOnceAnimationsFinish,
    animationFrame,
    enabled,
    mounted,
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
   * Whether the popup is mounted.
   */
  mounted: boolean;
  /*
   * Content that may change and trigger a resize.
   * This doesn't have to be the actual content of the popup, but a value that triggers a resize.
   */
  content: unknown;
  /**
   * Whether the auto-resize is enabled. This function runs in an effect and can safely access refs.
   */
  enabled?: () => boolean;
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
