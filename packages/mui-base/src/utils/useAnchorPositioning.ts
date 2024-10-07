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
  type UseFloatingOptions,
  type Placement,
  type Boundary,
  type FloatingRootContext,
  type VirtualElement,
  type Padding,
  type FloatingContext,
} from '@floating-ui/react';
import { getSide, getAlignment } from '@floating-ui/utils';
import { useEnhancedEffect } from './useEnhancedEffect';

export type Side = 'top' | 'bottom' | 'left' | 'right';
export type Alignment = 'start' | 'center' | 'end';

interface UseAnchorPositioningParameters {
  anchor?:
    | Element
    | VirtualElement
    | (() => Element | VirtualElement | null)
    | React.MutableRefObject<Element | null>
    | null;
  positionMethod?: 'absolute' | 'fixed';
  side?: Side;
  sideOffset?: number;
  alignment?: 'start' | 'center' | 'end';
  alignmentOffset?: number;
  fallbackAxisSideDirection?: 'start' | 'end' | 'none';
  collisionBoundary?: Boundary;
  collisionPadding?: Padding;
  hideWhenDetached?: boolean;
  sticky?: boolean;
  keepMounted?: boolean;
  arrowPadding?: number;
  floatingRootContext?: FloatingRootContext;
  mounted?: boolean;
  trackAnchor?: boolean;
  nodeId?: string;
}

interface UseAnchorPositioningReturnValue {
  positionerStyles: React.CSSProperties;
  arrowStyles: React.CSSProperties;
  arrowRef: React.MutableRefObject<Element | null>;
  arrowUncentered: boolean;
  renderedSide: Side;
  renderedAlignment: 'start' | 'center' | 'end';
  hidden: boolean;
  refs: ReturnType<typeof useFloating>['refs'];
  positionerContext: FloatingContext;
}

/**
 * Provides standardized anchor positioning behavior for floating elements. Wraps Floating UI's
 * `useFloating` hook.
 * @ignore - internal hook.
 */
export function useAnchorPositioning(
  params: UseAnchorPositioningParameters = {},
): UseAnchorPositioningReturnValue {
  const {
    anchor,
    floatingRootContext,
    positionMethod = 'absolute',
    side = 'top',
    sideOffset = 0,
    alignment = 'center',
    alignmentOffset = 0,
    collisionBoundary,
    collisionPadding = 5,
    hideWhenDetached = false,
    fallbackAxisSideDirection = 'start',
    sticky = false,
    keepMounted = false,
    arrowPadding = 5,
    mounted = true,
    trackAnchor = true,
    nodeId,
  } = params;

  const placement = alignment === 'center' ? side : (`${side}-${alignment}` as Placement);

  const commonCollisionProps = {
    boundary: collisionBoundary,
    padding: collisionPadding,
  };

  // Using a ref assumes that the arrow element is always present in the DOM for the lifetime of the
  // tooltip. If this assumption ends up being false, we can switch to state to manage the arrow's
  // presence.
  const arrowRef = React.useRef<Element | null>(null);

  const middleware: UseFloatingOptions['middleware'] = [
    offset({
      mainAxis: sideOffset,
      crossAxis: alignmentOffset,
      alignmentAxis: alignmentOffset,
    }),
  ];

  const flipMiddleware = flip({
    ...commonCollisionProps,
    fallbackAxisSideDirection,
  });
  const shiftMiddleware = shift({
    ...commonCollisionProps,
    crossAxis: sticky,
    limiter: sticky
      ? undefined
      : limitShift(() => {
          if (!arrowRef.current) {
            return {};
          }
          const { height } = arrowRef.current.getBoundingClientRect();
          return {
            offset: height / 2 + (typeof collisionPadding === 'number' ? collisionPadding : 0),
          };
        }),
  });

  // https://floating-ui.com/docs/flip#combining-with-shift
  if (alignment !== 'center') {
    middleware.push(flipMiddleware, shiftMiddleware);
  } else {
    middleware.push(shiftMiddleware, flipMiddleware);
  }

  middleware.push(
    size({
      ...commonCollisionProps,
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
    context: positionerContext,
  } = useFloating({
    rootContext: floatingRootContext,
    placement,
    middleware,
    strategy: positionMethod,
    whileElementsMounted: keepMounted || !trackAnchor ? undefined : autoUpdate,
    nodeId,
  });

  const registeredPositionReferenceRef = React.useRef<Element | VirtualElement | null>(null);

  useEnhancedEffect(() => {
    const resolvedAnchor = typeof anchor === 'function' ? anchor() : anchor;

    if (resolvedAnchor) {
      const unwrappedElement = isRef(resolvedAnchor) ? resolvedAnchor.current : resolvedAnchor;
      refs.setPositionReference(unwrappedElement);
      registeredPositionReferenceRef.current = unwrappedElement;
    }
  }, [refs, anchor]);

  React.useEffect(() => {
    // Refs from parent components are set after useLayoutEffect runs and are available in useEffect.
    // Therefore, if the anchor is a ref, we need to update the position reference in useEffect.
    if (typeof anchor === 'function') {
      return;
    }

    if (isRef(anchor) && anchor.current !== registeredPositionReferenceRef.current) {
      refs.setPositionReference(anchor.current);
      registeredPositionReferenceRef.current = anchor.current;
    }
  }, [refs, anchor]);

  React.useEffect(() => {
    if (keepMounted && mounted && elements.domReference && elements.floating) {
      return autoUpdate(elements.domReference, elements.floating, update);
    }
    return undefined;
  }, [keepMounted, mounted, elements, update]);

  const renderedSide = getSide(renderedPlacement);
  const renderedAlignment = getAlignment(renderedPlacement) || 'center';
  const hidden = Boolean(hideWhenDetached && middlewareData.hide?.referenceHidden);

  const positionerStyles = React.useMemo(
    () => ({
      ...floatingStyles,
      ...(hidden && { visibility: 'hidden' as const }),
    }),
    [floatingStyles, hidden],
  );

  const arrowStyles = React.useMemo(
    () => ({
      position: 'absolute' as const,
      top: middlewareData.arrow?.y,
      left: middlewareData.arrow?.x,
    }),
    [middlewareData.arrow],
  );

  const arrowUncentered = middlewareData.arrow?.centerOffset !== 0;

  return React.useMemo(
    () => ({
      positionerStyles,
      arrowStyles,
      arrowRef,
      arrowUncentered,
      renderedSide,
      renderedAlignment,
      hidden,
      refs,
      positionerContext,
    }),
    [
      positionerStyles,
      arrowStyles,
      arrowRef,
      arrowUncentered,
      renderedSide,
      renderedAlignment,
      hidden,
      refs,
      positionerContext,
    ],
  );
}

function isRef(
  param: Element | VirtualElement | React.RefObject<any> | null | undefined,
): param is React.RefObject<any> {
  return param != null && 'current' in param;
}
