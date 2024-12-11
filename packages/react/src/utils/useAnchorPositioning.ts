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
  type Side as PhysicalSide,
} from '@floating-ui/react';
import { getSide, getAlignment, type Rect } from '@floating-ui/utils';
import { useEnhancedEffect } from './useEnhancedEffect';
import { useDirection } from '../direction-provider/DirectionContext';

export type Side = 'top' | 'bottom' | 'left' | 'right' | 'inline-end' | 'inline-start';
export type Align = 'start' | 'center' | 'end';
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
  align?: Align;
  alignOffset?: number;
  fallbackAxisSideDirection?: 'start' | 'end' | 'none';
  collisionBoundary?: Boundary;
  collisionPadding?: Padding;
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
  renderedAlign: Align;
  anchorHidden: boolean;
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
    side: sideParam = 'top',
    sideOffset = 0,
    align = 'center',
    alignOffset = 0,
    collisionBoundary,
    collisionPadding = 5,
    fallbackAxisSideDirection = 'none',
    sticky = false,
    keepMounted = false,
    arrowPadding = 5,
    mounted,
    trackAnchor = true,
    allowAxisFlip = true,
    nodeId,
  } = params;

  const direction = useDirection();
  const isRtl = direction === 'rtl';

  const side = (
    {
      top: 'top',
      right: 'right',
      bottom: 'bottom',
      left: 'left',
      'inline-end': isRtl ? 'left' : 'right',
      'inline-start': isRtl ? 'right' : 'left',
    } satisfies Record<Side, PhysicalSide>
  )[sideParam];

  const placement = align === 'center' ? side : (`${side}-${align}` as Placement);

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
      crossAxis: alignOffset,
      alignmentAxis: alignOffset,
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
  if (align !== 'center') {
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
    hide(),
    {
      name: 'transformOrigin',
      fn({ elements, middlewareData, placement: renderedPlacement }) {
        const currentRenderedSide = getSide(renderedPlacement);
        const arrowEl = arrowRef.current;
        const arrowX = middlewareData.arrow?.x ?? 0;
        const arrowY = middlewareData.arrow?.y ?? 0;
        const arrowWidth = arrowEl?.clientWidth ?? 0;
        const arrowHeight = arrowEl?.clientHeight ?? 0;
        const transformX = arrowX + arrowWidth / 2;
        const transformY = arrowY + arrowHeight / 2;

        const transformOrigin = {
          top: `${transformX}px calc(100% + ${sideOffset}px)`,
          bottom: `${transformX}px ${-sideOffset}px`,
          left: `calc(100% + ${sideOffset}px) ${transformY}px`,
          right: `${-sideOffset}px ${transformY}px`,
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
  const isLogicalSideParam = sideParam === 'inline-start' || sideParam === 'inline-end';
  const logicalRight = isRtl ? 'inline-start' : 'inline-end';
  const logicalLeft = isRtl ? 'inline-end' : 'inline-start';
  const logicalRenderedSide = (
    {
      top: 'top',
      right: isLogicalSideParam ? logicalRight : 'right',
      bottom: 'bottom',
      left: isLogicalSideParam ? logicalLeft : 'left',
    } satisfies Record<PhysicalSide, Side>
  )[renderedSide];
  const renderedAlign = getAlignment(renderedPlacement) || 'center';
  const anchorHidden = Boolean(middlewareData.hide?.referenceHidden);

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
      positionerStyles: floatingStyles,
      arrowStyles,
      arrowRef,
      arrowUncentered,
      renderedSide: logicalRenderedSide,
      renderedAlign,
      anchorHidden,
      refs,
      positionerContext,
      isPositioned,
    }),
    [
      floatingStyles,
      arrowStyles,
      arrowRef,
      arrowUncentered,
      logicalRenderedSide,
      renderedAlign,
      anchorHidden,
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
