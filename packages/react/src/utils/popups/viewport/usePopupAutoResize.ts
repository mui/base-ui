'use client';
import * as React from 'react';
import { useAnimationFrame } from '@base-ui/utils/useAnimationFrame';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { NOOP, EMPTY_OBJECT } from '@base-ui/utils/empty';
import type { Dimensions } from '@floating-ui/react-dom';
import { useAnimationsFinished } from '../../../internals/useAnimationsFinished';
import { getCssDimensions } from '../../getCssDimensions';
import type { Side } from '../../../internals/useAnchorPositioning';
import * as CommonPopupCssVars from './CommonPopupCssVars';
import * as CommonPositionerCssVars from '../positioning/CommonPositionerCssVars';

/**
 * Allows the element to automatically resize based on its content while supporting animations.
 */
export function usePopupAutoResize(parameters: UsePopupAutoResizeParameters) {
  const {
    popupElement,
    positionerElement,
    content,
    mounted,
    onMeasureLayout: onMeasureLayoutParam,
    onMeasureLayoutComplete: onMeasureLayoutCompleteParam,
    side,
    direction,
  } = parameters;

  const runOnceAnimationsFinish = useAnimationsFinished(popupElement, true);

  const animationFrame = useAnimationFrame();

  const committedDimensionsRef = React.useRef<Dimensions | null>(null);

  const onMeasureLayout = useStableCallback(onMeasureLayoutParam);
  const onMeasureLayoutComplete = useStableCallback(onMeasureLayoutCompleteParam);

  const anchoringStyles = React.useMemo(
    () => getPopupAnchoringStyles(side, direction),
    [side, direction],
  );

  useIsoLayoutEffect(() => {
    // Reset the state when the popup is closed.
    if (!mounted) {
      committedDimensionsRef.current = null;
      return undefined;
    }

    if (!popupElement || !positionerElement) {
      return undefined;
    }

    const restoreAnchoringStyles = applyElementStyles(
      popupElement,
      anchoringStyles as Record<string, string>,
    );

    // Measure the rendered size to enable transitions:
    setPopupCssSize(popupElement, 'auto');

    const restorePopupOverrides = applyElementStyles(popupElement, {
      position: 'static',
      transform: 'none',
      scale: '1',
    });
    const restorePositionerAvailableSize = applyElementStyles(positionerElement, {
      [CommonPositionerCssVars.availableWidth]: 'max-content',
      [CommonPositionerCssVars.availableHeight]: 'max-content',
    });

    function restoreMeasurementOverrides() {
      restorePopupOverrides();
      restorePositionerAvailableSize();
    }

    onMeasureLayout?.();
    setPositionerCssSize(positionerElement, 'max-content');

    const previousDimensions = committedDimensionsRef.current;
    const newDimensions = getCssDimensions(popupElement);

    // Commit immediately so future content changes have a stable previous size.
    committedDimensionsRef.current = newDimensions;

    // Initial render (for each time the popup opens).
    if (previousDimensions === null) {
      setPositionerCssSize(positionerElement, newDimensions);
      restoreMeasurementOverrides();
      onMeasureLayoutComplete?.(null, newDimensions);

      return restoreAnchoringStyles;
    }

    // Subsequent renders while open (when `content` changes).
    setPopupCssSize(popupElement, previousDimensions);
    restoreMeasurementOverrides();
    onMeasureLayoutComplete?.(previousDimensions, newDimensions);

    setPositionerCssSize(positionerElement, newDimensions);

    const abortController = new AbortController();

    animationFrame.request(() => {
      setPopupCssSize(popupElement, newDimensions);

      runOnceAnimationsFinish(() => {
        setPopupCssSize(popupElement, 'auto');
      }, abortController.signal);
    });

    return () => {
      abortController.abort();
      animationFrame.cancel();
      restoreAnchoringStyles();
    };
  }, [
    content,
    popupElement,
    positionerElement,
    runOnceAnimationsFinish,
    animationFrame,
    mounted,
    onMeasureLayout,
    onMeasureLayoutComplete,
    anchoringStyles,
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
   * Callback fired immediately before measuring the dimensions of the new content.
   */
  onMeasureLayout?: (() => void) | undefined;
  /**
   * Callback fired after the new dimensions have been measured.
   *
   * @param previousDimensions Dimensions before the change, or `null` if this is the first measurement.
   * @param newDimensions Newly measured dimensions.
   */
  onMeasureLayoutComplete?:
    ((previousDimensions: Dimensions | null, newDimensions: Dimensions) => void) | undefined;

  side: Side;
  direction: 'ltr' | 'rtl';
}

function getPopupAnchoringStyles(side: Side, direction: 'ltr' | 'rtl'): React.CSSProperties {
  // Ensure popup size transitions correctly when anchored to `bottom` (side=top) or `right` (side=left).
  const isPhysicalTop = side === 'top';
  const isPhysicalLeft =
    side === 'left' || side === (direction === 'rtl' ? 'inline-end' : 'inline-start');

  if (!isPhysicalTop && !isPhysicalLeft) {
    return EMPTY_OBJECT;
  }

  return {
    position: 'absolute',
    [isPhysicalTop ? 'bottom' : 'top']: '0',
    [isPhysicalLeft ? 'right' : 'left']: '0',
  };
}

function overrideElementStyle(element: HTMLElement, property: string, value: string) {
  const originalValue = element.style.getPropertyValue(property);
  element.style.setProperty(property, value);

  return () => {
    element.style.setProperty(property, originalValue);
  };
}

function applyElementStyles(element: HTMLElement, styles: Record<string, string>) {
  const restorers: Array<() => void> = [];

  for (const [key, value] of Object.entries(styles)) {
    restorers.push(overrideElementStyle(element, key, value));
  }

  return restorers.length
    ? () => {
        restorers.forEach((restore) => restore());
      }
    : NOOP;
}

function setCssSize(
  element: HTMLElement,
  widthVar: string,
  heightVar: string,
  size: Dimensions | string,
) {
  element.style.setProperty(widthVar, typeof size === 'string' ? size : `${size.width}px`);
  element.style.setProperty(heightVar, typeof size === 'string' ? size : `${size.height}px`);
}

function setPopupCssSize(popupElement: HTMLElement, size: Dimensions | 'auto') {
  setCssSize(popupElement, CommonPopupCssVars.popupWidth, CommonPopupCssVars.popupHeight, size);
}

function setPositionerCssSize(positionerElement: HTMLElement, size: Dimensions | 'max-content') {
  setCssSize(
    positionerElement,
    CommonPositionerCssVars.positionerWidth,
    CommonPositionerCssVars.positionerHeight,
    size,
  );
}
