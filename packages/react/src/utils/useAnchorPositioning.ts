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
  type FloatingRootContext,
  type VirtualElement,
  type Padding,
  type FloatingContext,
} from '@floating-ui/react';
import { getSide, getAlignment, type Rect } from '@floating-ui/utils';
import { useEnhancedEffect } from './useEnhancedEffect';

export type Side = 'top' | 'bottom' | 'left' | 'right';
export type Alignment = 'start' | 'center' | 'end';
export type Boundary = 'clipping-ancestors' | Element | Element[] | Rect;

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
  mounted: boolean;
  trackAnchor?: boolean;
  nodeId?: string;
  allowAxisFlip?: boolean;
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
  isPositioned: boolean;
}

/**
 * Provides standardized anchor positioning behavior for floating elements. Wraps Floating UI's
 * `useFloating` hook.
 * @ignore - internal hook.
 */
export function useAnchorPositioning(
  params: UseAnchorPositioningParameters,
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
    fallbackAxisSideDirection = 'none',
    sticky = false,
    keepMounted = false,
    arrowPadding = 5,
    mounted,
    trackAnchor = true,
    allowAxisFlip = true,
    nodeId,
  } = params;

  const placement = alignment === 'center' ? side : (`${side}-${alignment}` as Placement);

  const commonCollisionProps = {
    boundary: collisionBoundary === 'clipping-ancestors' ? 'clippingAncestors' : collisionBoundary,
    padding: collisionPadding,
  } as const;

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
    fallbackAxisSideDirection: allowAxisFlip ? fallbackAxisSideDirection : 'none',
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

  // Ensure positioning doesn't run initially for `keepMounted` elements that
  // aren't initially open.
  let rootContext = floatingRootContext;
  if (!mounted && floatingRootContext) {
    rootContext = {
      ...floatingRootContext,
      elements: { reference: null, floating: null, domReference: null },
    };
  }

  const autoUpdateOptions = React.useMemo(
    () => ({
      // Keep `ancestorResize` for window resizing. TODO: determine the best configuration, or
      // if we need to allow options.
      ancestorScroll: trackAnchor,
      elementResize: trackAnchor && typeof ResizeObserver !== 'undefined',
      layoutShift: trackAnchor && typeof IntersectionObserver !== 'undefined',
    }),
    [trackAnchor],
  );

  const {
    refs,
    elements,
    floatingStyles,
    middlewareData,
    update,
    placement: renderedPlacement,
    context: positionerContext,
    isPositioned,
  } = useFloating({
    rootContext,
    placement,
    middleware,
    strategy: positionMethod,
    whileElementsMounted: keepMounted
      ? undefined
      : (...args) => autoUpdate(...args, autoUpdateOptions),
    nodeId,
  });

  const registeredPositionReferenceRef = React.useRef<Element | VirtualElement | null>(null);

  useEnhancedEffect(() => {
    if (!mounted) {
      return;
    }

    const resolvedAnchor = typeof anchor === 'function' ? anchor() : anchor;

    if (resolvedAnchor) {
      const unwrappedElement = isRef(resolvedAnchor) ? resolvedAnchor.current : resolvedAnchor;
      refs.setPositionReference(unwrappedElement);
      registeredPositionReferenceRef.current = unwrappedElement;
    }
  }, [mounted, refs, anchor]);

  React.useEffect(() => {
    if (!mounted) {
      return;
    }

    // Refs from parent components are set after useLayoutEffect runs and are available in useEffect.
    // Therefore, if the anchor is a ref, we need to update the position reference in useEffect.
    if (typeof anchor === 'function') {
      return;
    }

    if (isRef(anchor) && anchor.current !== registeredPositionReferenceRef.current) {
      refs.setPositionReference(anchor.current);
      registeredPositionReferenceRef.current = anchor.current;
    }
  }, [mounted, refs, anchor]);

  React.useEffect(() => {
    if (keepMounted && mounted && elements.domReference && elements.floating) {
      return autoUpdate(elements.domReference, elements.floating, update, autoUpdateOptions);
    }
    return undefined;
  }, [keepMounted, mounted, elements, update, autoUpdateOptions]);

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
      isPositioned,
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
      isPositioned,
    ],
  );
}

function isRef(
  param: Element | VirtualElement | React.RefObject<any> | null | undefined,
): param is React.RefObject<any> {
  return param != null && 'current' in param;
}
