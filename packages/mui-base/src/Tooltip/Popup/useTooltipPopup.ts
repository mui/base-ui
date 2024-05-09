import * as React from 'react';
import {
  autoUpdate,
  flip,
  limitShift,
  offset,
  shift,
  arrow,
  useFloating,
  useHover,
  useFocus,
  useDismiss,
  useClientPoint,
  useInteractions,
  safePolygon,
  useDelayGroup,
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
import { ownerWindow } from '../../utils/owner';
import { useLatestRef } from '../../utils/useLatestRef';
import { useTooltipRootContext } from '../Root/TooltipRootContext';

/**
 * The basic building block for creating custom tooltips.
 *
 * Demos:
 *
 * - [Tooltip](https://mui.com/base-ui/react-tooltip/)
 *
 * API:
 *
 * - [useTooltipPopup API](https://mui.com/base-ui/react-tooltip/hooks-api/#use-tooltip-popup)
 */
export function useTooltipPopup(params: UseTooltipPopupParameters): UseTooltipPopupReturnValue {
  const {
    anchor,
    open,
    onOpenChange,
    delayType = 'rest',
    delay = 200,
    closeDelay = 0,
    side = 'top',
    sideOffset = 0,
    alignment = 'center',
    alignmentOffset = 0,
    collisionBoundary,
    collisionPadding = 5,
    hideWhenDetached = false,
    hoverable = true,
    sticky = false,
    keepMounted = false,
    followCursorAxis = 'none',
    arrowPadding = 3,
  } = params;

  const { mounted, setMounted } = useTooltipRootContext();

  const [instantTypeState, setInstantTypeState] = React.useState<'dismiss' | 'focus'>();

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
    arrow(() => ({
      // `transform-origin` calculations rely on an element existing. If the arrow hasn't been set,
      // we'll create a fake element.
      element: arrowRef.current || document.createElement('div'),
      padding: arrowPadding,
    })),
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
    context,
    middlewareData,
    update,
    placement: renderedPlacement,
  } = useFloating({
    placement,
    middleware,
    open,
    whileElementsMounted: keepMounted ? undefined : autoUpdate,
    elements: anchor && isElement(anchor) ? { reference: anchor } : undefined,
    onOpenChange(openValue, eventValue, reasonValue) {
      onOpenChange(openValue, eventValue, reasonValue);

      const isFocusOpen = openValue && reasonValue === 'focus';
      const isDismissClose =
        !openValue && (reasonValue === 'reference-press' || reasonValue === 'escape-key');

      if (isFocusOpen || isDismissClose) {
        setInstantTypeState(isFocusOpen ? 'focus' : 'dismiss');
      } else {
        setInstantTypeState(undefined);
      }

      const popupElement = refs.floating.current?.firstElementChild;
      if (!keepMounted && !openValue && popupElement) {
        const computedStyles = ownerWindow(popupElement).getComputedStyle(popupElement);
        const noTransitionDuration = ['', '0s'].includes(computedStyles.transitionDuration);
        const noAnimationName = ['', 'none'].includes(computedStyles.animationName);
        const noAnimation = noTransitionDuration && noAnimationName;
        if (noAnimation) {
          setMounted(false);
        }
      }
    },
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

  const { delay: groupDelay, isInstantPhase } = useDelayGroup(context);

  const renderedSide = getSide(renderedPlacement);
  const renderedAlignment = getAlignment(renderedPlacement) || 'center';
  const isHidden = hideWhenDetached && middlewareData.hide?.referenceHidden;
  // TODO: While in the instant phase, if the tooltip is closing and no other tooltip is opening,
  // the `instantType` should be `undefined`. This ensures the close animation will play. This may
  // need an internal fix in Floating UI.
  const instantType = isInstantPhase ? 'delay' : instantTypeState;

  const hover = useHover(context, {
    mouseOnly: true,
    move: false,
    handleClose: hoverable && followCursorAxis !== 'both' ? safePolygon() : null,
    restMs: delayType === 'rest' ? delay : undefined,
    delay: groupDelay || {
      open: delayType === 'hover' ? delay : 0,
      close: closeDelay,
    },
  });
  const focus = useFocus(context);
  const dismiss = useDismiss(context, { referencePress: true });
  const clientPoint = useClientPoint(context, {
    enabled: followCursorAxis !== 'none',
    axis: followCursorAxis === 'none' ? undefined : followCursorAxis,
  });

  const { getReferenceProps, getFloatingProps } = useInteractions([
    hover,
    focus,
    dismiss,
    clientPoint,
  ]);

  const getTriggerProps: UseTooltipPopupReturnValue['getTriggerProps'] = React.useCallback(
    (externalProps = {}) => mergeReactProps(externalProps, getReferenceProps()),
    [getReferenceProps],
  );

  const getPopupProps: UseTooltipPopupReturnValue['getPopupProps'] = React.useCallback(
    (externalProps = {}) => {
      function handleTransitionOrAnimationEnd({ target }: React.SyntheticEvent) {
        const popupElement = refs.floating.current?.firstElementChild;
        if (target === popupElement) {
          setMounted((prevMounted) => (prevMounted ? false : prevMounted));
        }
      }

      return mergeReactProps(
        externalProps,
        getFloatingProps({
          style: {
            ...floatingStyles,
            maxWidth: 'var(--available-width)',
            maxHeight: 'var(--available-height)',
            visibility: isHidden ? 'hidden' : undefined,
            pointerEvents: isHidden || followCursorAxis === 'both' ? 'none' : undefined,
            zIndex: 2147483647, // max z-index
          },
          onTransitionEnd: handleTransitionOrAnimationEnd,
          onAnimationEnd: handleTransitionOrAnimationEnd,
        }),
      );
    },
    [getFloatingProps, floatingStyles, isHidden, followCursorAxis, setMounted, refs],
  );

  return React.useMemo(
    () => ({
      mounted,
      getTriggerProps,
      getPopupProps,
      arrowRef,
      setTriggerEl: refs.setReference,
      setPopupEl: refs.setFloating,
      floatingContext: context,
      side: renderedSide,
      alignment: renderedAlignment,
      instantType,
    }),
    [
      mounted,
      getTriggerProps,
      getPopupProps,
      refs.setReference,
      refs.setFloating,
      context,
      renderedSide,
      renderedAlignment,
      instantType,
    ],
  );
}
