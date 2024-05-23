'use client';
import * as React from 'react';
import {
  autoUpdate,
  flip,
  limitShift,
  offset,
  shift,
  arrow,
  useFloating,
  size,
  hide,
  type Placement,
  type UseFloatingOptions,
} from '@floating-ui/react';
import { getSide, getAlignment } from '@floating-ui/utils';
import { isElement } from '@floating-ui/utils/dom';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import type {
  UseTooltipPopupParameters,
  UseTooltipPopupReturnValue,
} from './useTooltipPopup.types';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useLatestRef } from '../../utils/useLatestRef';

/**
 * The basic building block for creating custom tooltips.
 *
 * Demos:
 *
 * - [Tooltip](https://mui.com/base-ui/react-tooltip/#hooks)
 *
 * API:
 *
 * - [useTooltipPopup API](https://mui.com/base-ui/react-tooltip/hooks-api/#use-tooltip-popup)
 */
export function useTooltipPopup(params: UseTooltipPopupParameters): UseTooltipPopupReturnValue {
  const {
    open,
    anchor,
    positionStrategy = 'absolute',
    side = 'top',
    sideOffset = 0,
    alignment = 'center',
    alignmentOffset = 0,
    collisionBoundary,
    collisionPadding = 5,
    hideWhenDetached = false,
    sticky = false,
    keepMounted = false,
    arrowPadding = 5,
    mounted = true,
    setMounted,
    getRootPopupProps,
    rootContext,
    followCursorAxis = 'none',
  } = params;

  // Using a ref assumes that the arrow element is always present in the DOM for the lifetime of the
  // tooltip. If this assumption ends up being false, we can switch to state to manage the arrow's
  // presence.
  const arrowRef = React.useRef<Element | null>(null);

  const placement = alignment === 'center' ? side : (`${side}-${alignment}` as Placement);

  const middleware: UseFloatingOptions['middleware'] = [
    offset({
      mainAxis: sideOffset,
      crossAxis: alignmentOffset,
      alignmentAxis: alignmentOffset,
    }),
  ];

  const flipMiddleware = flip({
    fallbackAxisSideDirection: 'start',
    padding: collisionPadding,
    boundary: collisionBoundary,
  });
  const shiftMiddleware = shift({
    limiter: sticky
      ? undefined
      : limitShift(() => {
          if (!arrowRef.current) {
            return {};
          }
          const { height } = arrowRef.current.getBoundingClientRect();
          return {
            offset: height,
          };
        }),
    padding: collisionPadding,
    boundary: collisionBoundary,
  });

  // https://floating-ui.com/docs/flip#combining-with-shift
  if (alignment !== 'center') {
    middleware.push(flipMiddleware, shiftMiddleware);
  } else {
    middleware.push(shiftMiddleware, flipMiddleware);
  }

  middleware.push(
    size({
      boundary: collisionBoundary,
      padding: collisionPadding,
      apply({ elements: { floating }, rects: { reference }, availableWidth, availableHeight }) {
        Object.entries({
          '--available-width': `${availableWidth}px`,
          '--available-height': `${availableHeight}px`,
          '--anchor-width': `${reference.width}px`,
          '--anchor-height': `${reference.height}px`,
        }).forEach(([key, value]) => {
          floating.style.setProperty(key, value);
        });
      },
    }),
    arrow(
      () => ({
        // `transform-origin` calculations rely on an element existing. If the arrow hasn't been set,
        // we'll create a fake element.
        element: arrowRef.current || document.createElement('div'),
        padding: arrowPadding,
      }),
      [arrowPadding],
    ),
    hideWhenDetached && hide(),
    {
      name: 'transformOrigin',
      fn({ elements, middlewareData, placement: renderedPlacement }) {
        const currentRenderedSide = getSide(renderedPlacement);
        const arrowEl = arrowRef.current;
        const arrowX = middlewareData.arrow?.x ?? 0;
        const arrowY = middlewareData.arrow?.y ?? 0;
        const arrowWidth = arrowEl?.clientWidth ?? sideOffset;
        const arrowHeight = arrowEl?.clientHeight ?? sideOffset;
        const transformX = arrowX + arrowWidth / 2;
        const transformY = arrowY + arrowHeight;

        const transformOrigin = {
          top: `${transformX}px calc(100% + ${arrowHeight}px)`,
          bottom: `${transformX}px ${-arrowHeight}px`,
          left: `calc(100% + ${arrowHeight}px) ${transformY}px`,
          right: `${-arrowHeight}px ${transformY}px`,
        }[currentRenderedSide];

        elements.floating.style.setProperty('--transform-origin', transformOrigin);

        return {};
      },
    },
  );

  const {
    refs,
    elements,
    floatingStyles,
    middlewareData,
    update,
    placement: renderedPlacement,
  } = useFloating({
    rootContext,
    placement,
    strategy: positionStrategy,
    middleware,
    whileElementsMounted: keepMounted ? undefined : autoUpdate,
  });

  // The `anchor` prop is non-reactive.
  const anchorRef = useLatestRef(anchor);

  useEnhancedEffect(() => {
    function isRef(param: any): param is React.MutableRefObject<any> {
      return {}.hasOwnProperty.call(param, 'current');
    }
    const resolvedAnchor =
      typeof anchorRef.current === 'function' ? anchorRef.current() : anchorRef.current;
    if (resolvedAnchor && !isElement(resolvedAnchor)) {
      refs.setPositionReference(isRef(resolvedAnchor) ? resolvedAnchor.current : resolvedAnchor);
    }
  }, [refs, anchorRef]);

  React.useEffect(() => {
    if (keepMounted && mounted && elements.domReference && elements.floating) {
      return autoUpdate(elements.domReference, elements.floating, update);
    }
    return undefined;
  }, [keepMounted, mounted, elements, update]);

  const renderedSide = getSide(renderedPlacement);
  const renderedAlignment = getAlignment(renderedPlacement) || 'center';
  const isHidden = hideWhenDetached && middlewareData.hide?.referenceHidden;

  const getPopupProps: UseTooltipPopupReturnValue['getPopupProps'] = React.useCallback(
    (externalProps = {}) => {
      function handleEnd({ target }: React.SyntheticEvent) {
        const popupElement = refs.floating.current?.firstElementChild;
        if (target === popupElement && setMounted) {
          setMounted((prevMounted) => (prevMounted ? false : prevMounted));
        }
      }

      const hiddenStyles: React.CSSProperties = {};

      if (isHidden) {
        hiddenStyles.visibility = 'hidden';
      }

      if ((keepMounted && !open) || isHidden) {
        hiddenStyles.pointerEvents = 'none';
      }

      if (followCursorAxis === 'both') {
        hiddenStyles.pointerEvents = 'none';
      }

      return mergeReactProps(
        externalProps,
        getRootPopupProps({
          style: {
            ...floatingStyles,
            ...hiddenStyles,
            maxWidth: 'var(--available-width)',
            maxHeight: 'var(--available-height)',
            zIndex: 2147483647, // max z-index
          },
          onTransitionEnd: handleEnd,
          onAnimationEnd: handleEnd,
        }),
      );
    },
    [
      getRootPopupProps,
      floatingStyles,
      isHidden,
      followCursorAxis,
      setMounted,
      refs,
      open,
      keepMounted,
    ],
  );

  const getArrowProps: UseTooltipPopupReturnValue['getArrowProps'] = React.useCallback(
    (externalProps = {}) => {
      return mergeReactProps(externalProps, {
        style: {
          position: 'absolute',
          top: middlewareData.arrow?.y,
          left: middlewareData.arrow?.x,
        },
      });
    },
    [middlewareData],
  );

  const arrowUncentered = middlewareData.arrow?.centerOffset !== 0;

  return React.useMemo(
    () => ({
      mounted,
      getPopupProps,
      getArrowProps,
      arrowRef,
      arrowUncentered,
      side: renderedSide,
      alignment: renderedAlignment,
    }),
    [mounted, getPopupProps, getArrowProps, arrowUncentered, renderedSide, renderedAlignment],
  );
}
