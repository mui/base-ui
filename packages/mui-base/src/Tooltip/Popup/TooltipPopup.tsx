'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import type { TooltipPopupOwnerState, TooltipPopupProps } from './TooltipPopup.types';
import { resolveClassName } from '../../utils/resolveClassName';
import { Portal } from '../../Portal';
import { useTooltipPopup } from './useTooltipPopup';
import { TooltipPopupContext } from './TooltipPopupContext';
import { evaluateRenderProp } from '../../utils/evaluateRenderProp';
import { useRenderPropForkRef } from '../../utils/useRenderPropForkRef';
import { useContentStyleHooks } from './useStyleHooks';
import { useTooltipRootContext } from '../Root/TooltipRootContext';

function defaultRender(props: React.ComponentPropsWithRef<'div'>) {
  return <div {...props} />;
}

/**
 * The tooltip popup element.
 *
 * Demos:
 *
 * - [Tooltip](https://mui.com/base-ui/react-tooltip/)
 *
 * API:
 *
 * - [TooltipPopup API](https://mui.com/base-ui/react-tooltip/components-api/#tooltip-popup)
 */
const TooltipPopup = React.forwardRef(function TooltipPopup(
  props: TooltipPopupProps,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    anchor,
    className,
    render: renderProp,
    side = 'top',
    alignment = 'center',
    sideOffset = 0,
    alignmentOffset = 0,
    collisionBoundary,
    collisionPadding = 5,
    // This is the most sensible default for most `border-radius` values. However, we can't
    // determine the actual best value. It's up to the user to adjust this value if needed.
    arrowPadding = 3,
    hideWhenDetached = false,
    sticky = false,
    followCursorAxis = 'none',
    keepMounted = false,
    container,
    ...otherProps
  } = props;
  const render = renderProp ?? defaultRender;

  const {
    open,
    triggerEl,
    delay,
    delayType,
    closeDelay,
    transitionStatus,
    setPopupEl,
    getRootPopupProps,
    mounted,
    setMounted,
    rootContext,
    instantType,
  } = useTooltipRootContext();

  const tooltip = useTooltipPopup({
    anchor: anchor || triggerEl,
    rootContext,
    mounted,
    setMounted,
    getRootPopupProps,
    keepMounted,
    side,
    sideOffset,
    alignment,
    alignmentOffset,
    collisionBoundary,
    collisionPadding,
    hideWhenDetached,
    sticky,
    followCursorAxis,
    delay,
    delayType,
    closeDelay,
    arrowPadding,
  });

  const ownerState: TooltipPopupOwnerState = React.useMemo(
    () => ({
      open,
      status: transitionStatus,
      instant: instantType,
      side: tooltip.side,
      alignment: tooltip.alignment,
    }),
    [open, transitionStatus, instantType, tooltip.side, tooltip.alignment],
  );

  const contextValue = React.useMemo(
    () => ({
      ...ownerState,
      arrowRef: tooltip.arrowRef,
      floatingContext: tooltip.floatingContext,
    }),
    [ownerState, tooltip.arrowRef, tooltip.floatingContext],
  );

  const styleHooks = useContentStyleHooks(ownerState);

  const mergedRef = useRenderPropForkRef(render, forwardedRef);

  const shouldRender = keepMounted || tooltip.mounted;
  if (!shouldRender) {
    return null;
  }

  // The content element needs to be a child of a wrapper floating element in order to avoid
  // conflicts with CSS transitions and the positioning transform.
  const popupProps = {
    ref: mergedRef,
    className: resolveClassName(className, ownerState),
    ...styleHooks,
    ...otherProps,
    style: {
      // <Tooltip.Arrow> must be relative to the inner popup element.
      position: 'relative',
      ...otherProps.style,
    },
  } as const;

  return (
    <TooltipPopupContext.Provider value={contextValue}>
      <Portal container={container}>
        <div role="presentation" ref={setPopupEl} {...tooltip.getPopupProps()}>
          {evaluateRenderProp(render, popupProps, ownerState)}
        </div>
      </Portal>
    </TooltipPopupContext.Provider>
  );
});

TooltipPopup.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * The alignment of the tooltip element to the anchor element along its cross axis.
   * @default 'center'
   */
  alignment: PropTypes.oneOf(['center', 'end', 'start']),
  /**
   * The offset of the tooltip element along its alignment axis.
   * @default 0
   */
  alignmentOffset: PropTypes.number,
  /**
   * The anchor element to which the tooltip content will be placed at.
   */
  anchor: PropTypes /* @typescript-to-proptypes-ignore */.any,
  /**
   * Determines the padding between the arrow and the tooltip content. Useful when the tooltip
   * has rounded corners via `border-radius`.
   * @default 3
   */
  arrowPadding: PropTypes.number,
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * The boundary that the tooltip element should be constrained to.
   * @default 'clippingAncestors'
   */
  collisionBoundary: PropTypes /* @typescript-to-proptypes-ignore */.any,
  /**
   * The padding of the collision boundary.
   * @default 5
   */
  collisionPadding: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.shape({
      bottom: PropTypes.number,
      left: PropTypes.number,
      right: PropTypes.number,
      top: PropTypes.number,
    }),
  ]),
  /**
   * The container element to which the tooltip content will be appended to.
   * @default document.body
   */
  container: PropTypes /* @typescript-to-proptypes-ignore */.any,
  /**
   * Determines which axis the tooltip should follow the cursor on.
   * @default 'none'
   */
  followCursorAxis: PropTypes.oneOf(['both', 'none', 'x', 'y']),
  /**
   * If `true`, the tooltip will be hidden if it is detached from its anchor element due to
   * differing clipping contexts.
   * @default false
   */
  hideWhenDetached: PropTypes.bool,
  /**
   * If `true`, the tooltip content will be kept mounted in the DOM.
   * @default false
   */
  keepMounted: PropTypes.bool,
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
  /**
   * The side of the anchor element that the tooltip element should align to.
   * @default 'top'
   */
  side: PropTypes.oneOf(['bottom', 'left', 'right', 'top']),
  /**
   * The gap between the anchor element and the tooltip element.
   * @default 0
   */
  sideOffset: PropTypes.number,
  /**
   * If `true`, allow the tooltip to remain in stuck view while the anchor element is scrolled out
   * of view.
   * @default false
   */
  sticky: PropTypes.bool,
  /**
   * @ignore
   */
  style: PropTypes.object,
} as any;

export { TooltipPopup };
