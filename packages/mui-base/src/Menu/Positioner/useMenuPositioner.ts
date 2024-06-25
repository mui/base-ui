'use client';
import * as React from 'react';
import {
  type Placement,
  type UseFloatingOptions,
  autoUpdate,
  flip,
  offset,
  shift,
  limitShift,
  arrow,
  size,
  hide,
  useFloating,
} from '@floating-ui/react';
import { getSide, getAlignment } from '@floating-ui/utils';
import { isElement } from '@floating-ui/utils/dom';
import { useEnhancedEffect } from '../../utils/useEnhancedEffect';
import type {
  UseMenuPositionerParameters,
  UseMenuPositionerReturnValue,
} from './useMenuPositioner.types';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useLatestRef } from '../../utils/useLatestRef';

/**
 *
 * API:
 *
 * - [useMenuPositioner API](https://mui.com/base-ui/api/use-menu-positioner/)
 */
export function useMenuPositioner(
  params: UseMenuPositionerParameters,
): UseMenuPositionerReturnValue {
  const {
    anchor,
    positionStrategy = 'absolute',
    side = 'bottom',
    sideOffset = 0,
    alignment = 'center',
    alignmentOffset = 0,
    collisionBoundary,
    collisionPadding = 5,
    hideWhenDetached = false,
    sticky = false,
    mounted = true,
    floatingRootContext,
    arrowPadding = 5,
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
    fallbackAxisSideDirection: 'end',
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
    context,
  } = useFloating({
    rootContext: floatingRootContext,
    placement,
    middleware,
    strategy: positionStrategy,
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
    if (mounted && elements.domReference && elements.floating) {
      return autoUpdate(elements.domReference, elements.floating, update);
    }
    return undefined;
  }, [mounted, elements, update]);

  const renderedSide = getSide(renderedPlacement);
  const renderedAlignment = getAlignment(renderedPlacement) || 'center';
  const isHidden = hideWhenDetached && middlewareData.hide?.referenceHidden;

  const getPositionerProps: UseMenuPositionerReturnValue['getPositionerProps'] = React.useCallback(
    (externalProps = {}) => {
      return mergeReactProps<'div'>(externalProps, {
        role: 'presentation',
        style: {
          ...floatingStyles,
          visibility: isHidden ? 'hidden' : undefined,
          pointerEvents: isHidden ? 'none' : undefined,
          zIndex: 2147483647, // max z-index
        },
      });
    },
    [floatingStyles, isHidden],
  );

  const arrowUncentered = middlewareData.arrow?.centerOffset !== 0;

  return React.useMemo(
    () => ({
      mounted,
      getPositionerProps,
      arrowRef,
      arrowUncentered,
      side: renderedSide,
      alignment: renderedAlignment,
      floatingContext: context,
    }),
    [mounted, getPositionerProps, arrowUncentered, renderedSide, renderedAlignment, context],
  );
}
