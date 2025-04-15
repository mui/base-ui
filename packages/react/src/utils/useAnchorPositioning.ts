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
import { useLatestRef } from './useLatestRef';

function getLogicalSide(sideParam: Side, renderedSide: PhysicalSide, isRtl: boolean): Side {
  const isLogicalSideParam = sideParam === 'inline-start' || sideParam === 'inline-end';
  const logicalRight = isRtl ? 'inline-start' : 'inline-end';
  const logicalLeft = isRtl ? 'inline-end' : 'inline-start';
  return (
    {
      top: 'top',
      right: isLogicalSideParam ? logicalRight : 'right',
      bottom: 'bottom',
      left: isLogicalSideParam ? logicalLeft : 'left',
    } satisfies Record<PhysicalSide, Side>
  )[renderedSide];
}

export type Side = 'top' | 'bottom' | 'left' | 'right' | 'inline-end' | 'inline-start';
export type Align = 'start' | 'center' | 'end';
export type Boundary = 'clipping-ancestors' | Element | Element[] | Rect;
export type OffsetFunction = (data: {
  side: Side;
  align: Align;
  anchor: { width: number; height: number };
  positioner: { width: number; height: number };
}) => number;

/**
 * Provides standardized anchor positioning behavior for floating elements. Wraps Floating UI's
 * `useFloating` hook.
 * @internal
 */
export function useAnchorPositioning(
  params: useAnchorPositioning.Parameters,
): useAnchorPositioning.ReturnValue {
  const {
    // Public parameters
    anchor,
    positionMethod = 'absolute',
    side: sideParam = 'bottom',
    sideOffset = 0,
    align = 'center',
    alignOffset = 0,
    collisionBoundary,
    collisionPadding = 5,
    sticky = false,
    arrowPadding = 5,
    // Private parameters
    keepMounted = false,
    floatingRootContext,
    mounted,
    trackAnchor = true,
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

  // Keep these reactive if they're not functions
  const sideOffsetRef = useLatestRef(sideOffset);
  const alignOffsetRef = useLatestRef(alignOffset);
  const sideOffsetDep = typeof sideOffset !== 'function' ? sideOffset : 0;
  const alignOffsetDep = typeof alignOffset !== 'function' ? alignOffset : 0;

  const middleware: UseFloatingOptions['middleware'] = [
    offset(
      ({ rects, placement: currentPlacement }) => {
        const data = {
          side: getLogicalSide(sideParam, getSide(currentPlacement), isRtl),
          align: getAlignment(currentPlacement) || 'center',
          anchor: { width: rects.reference.width, height: rects.reference.height },
          positioner: { width: rects.floating.width, height: rects.floating.height },
        } as const;

        const sideAxis =
          typeof sideOffsetRef.current === 'function'
            ? sideOffsetRef.current(data)
            : sideOffsetRef.current;
        const alignAxis =
          typeof alignOffsetRef.current === 'function'
            ? alignOffsetRef.current(data)
            : alignOffsetRef.current;

        return {
          mainAxis: sideAxis,
          crossAxis: alignAxis,
          alignmentAxis: alignAxis,
        };
      },
      [sideOffsetDep, alignOffsetDep, isRtl, sideParam],
    ),
  ];

  const flipMiddleware = flip(commonCollisionProps);
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
    context,
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
  const logicalRenderedSide = getLogicalSide(sideParam, renderedSide, isRtl);
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
      side: logicalRenderedSide,
      align: renderedAlign,
      anchorHidden,
      refs,
      context,
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
      context,
      isPositioned,
    ],
  );
}

function isRef(
  param: Element | VirtualElement | React.RefObject<any> | null | undefined,
): param is React.RefObject<any> {
  return param != null && 'current' in param;
}

export namespace useAnchorPositioning {
  export interface SharedParameters {
    /**
     * An element to position the popup against.
     * By default, the popup will be positioned against the trigger.
     */
    anchor?:
      | Element
      | null
      | VirtualElement
      | React.RefObject<Element | null>
      | (() => Element | VirtualElement | null);
    /**
     * Determines which CSS `position` property to use.
     * @default 'absolute'
     */
    positionMethod?: 'absolute' | 'fixed';
    /**
     * Which side of the anchor element to align the popup against.
     * May automatically change to avoid collisions.
     * @default 'bottom'
     */
    side?: Side;
    /**
     * Distance between the anchor and the popup in pixels.
     * Also accepts a function that returns the distance to read the dimensions of the anchor
     * and positioner elements, along with its side and alignment.
     *
     * - `data.anchor`: the dimensions of the anchor element with properties `width` and `height`.
     * - `data.positioner`: the dimensions of the positioner element with properties `width` and `height`.
     * - `data.side`: which side of the anchor element the positioner is aligned against.
     * - `data.align`: how the positioner is aligned relative to the specified side.
     * @default 0
     */
    sideOffset?: number | OffsetFunction;
    /**
     * How to align the popup relative to the specified side.
     * @default 'center'
     */
    align?: 'start' | 'end' | 'center';
    /**
     * Additional offset along the alignment axis in pixels.
     * Also accepts a function that returns the offset to read the dimensions of the anchor
     * and positioner elements, along with its side and alignment.
     *
     * - `data.anchor`: the dimensions of the anchor element with properties `width` and `height`.
     * - `data.positioner`: the dimensions of the positioner element with properties `width` and `height`.
     * - `data.side`: which side of the anchor element the positioner is aligned against.
     * - `data.align`: how the positioner is aligned relative to the specified side.
     * @default 0
     */
    alignOffset?: number | OffsetFunction;
    /**
     * An element or a rectangle that delimits the area that the popup is confined to.
     * @default 'clipping-ancestors'
     */
    collisionBoundary?: Boundary;
    /**
     * Additional space to maintain from the edge of the collision boundary.
     * @default 5
     */
    collisionPadding?: Padding;
    /**
     * Whether to maintain the popup in the viewport after
     * the anchor element was scrolled out of view.
     * @default false
     */
    sticky?: boolean;
    /**
     * Minimum distance to maintain between the arrow and the edges of the popup.
     *
     * Use it to prevent the arrow element from hanging out of the rounded corners of a popup.
     * @default 5
     */
    arrowPadding?: number;
    /**
     * Whether the popup tracks any layout shift of its positioning anchor.
     * @default true
     */
    trackAnchor?: boolean;
  }

  export interface Parameters extends SharedParameters {
    open?: boolean;
    keepMounted?: boolean;
    trackCursorAxis?: 'none' | 'x' | 'y' | 'both';
    floatingRootContext?: FloatingRootContext;
    mounted: boolean;
    trackAnchor: boolean;
    nodeId?: string;
  }

  export interface ReturnValue {
    positionerStyles: React.CSSProperties;
    arrowStyles: React.CSSProperties;
    arrowRef: React.RefObject<Element | null>;
    arrowUncentered: boolean;
    side: Side;
    align: Align;
    anchorHidden: boolean;
    refs: ReturnType<typeof useFloating>['refs'];
    context: FloatingContext;
    isPositioned: boolean;
  }
}
