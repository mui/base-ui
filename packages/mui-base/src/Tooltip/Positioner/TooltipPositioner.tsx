'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { FloatingPortal } from '@floating-ui/react';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { HTMLElementType } from '../../utils/proptypes';
import { useForkRef } from '../../utils/useForkRef';
import type {
  TooltipPositionerContextValue,
  TooltipPositionerOwnerState,
  TooltipPositionerProps,
} from './TooltipPositioner.types';
import { useTooltipRootContext } from '../Root/TooltipRootContext';
import { useTooltipPositioner } from './useTooltipPositioner';
import { TooltipPositionerContext } from './TooltipPositionerContext';

/**
 * The tooltip positioner element.
 *
 * Demos:
 *
 * - [Tooltip](https://mui.com/base-ui/react-tooltip/)
 *
 * API:
 *
 * - [TooltipPositioner API](https://mui.com/base-ui/react-tooltip/components-api/#tooltip-positioner)
 */
const TooltipPositioner = React.forwardRef(function TooltipPositioner(
  props: TooltipPositionerProps,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    render,
    className,
    anchor,
    container,
    positionStrategy = 'absolute',
    side = 'top',
    alignment = 'center',
    sideOffset = 0,
    alignmentOffset = 0,
    collisionBoundary,
    collisionPadding = 5,
    arrowPadding = 5,
    hideWhenDetached = false,
    keepMounted = false,
    sticky = false,
    ...otherProps
  } = props;

  const {
    open,
    triggerElement,
    setPopupElement,
    getRootPositionerProps,
    mounted,
    setMounted,
    rootContext,
    followCursorAxis,
  } = useTooltipRootContext();

  const positioner = useTooltipPositioner({
    anchor: anchor || triggerElement,
    rootContext,
    positionStrategy,
    open,
    mounted,
    setMounted,
    getRootPositionerProps,
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
    arrowPadding,
  });

  const mergedRef = useForkRef(setPopupElement, forwardedRef);

  const ownerState: TooltipPositionerOwnerState = React.useMemo(
    () => ({
      open,
      side: positioner.side,
      alignment: positioner.alignment,
    }),
    [open, positioner.side, positioner.alignment],
  );

  const contextValue: TooltipPositionerContextValue = React.useMemo(
    () => ({
      ...ownerState,
      arrowRef: positioner.arrowRef,
      getArrowProps: positioner.getArrowProps,
      arrowUncentered: positioner.arrowUncentered,
    }),
    [ownerState, positioner.arrowRef, positioner.getArrowProps, positioner.arrowUncentered],
  );

  const { renderElement } = useComponentRenderer({
    propGetter: positioner.getPositionerProps,
    render: render ?? 'div',
    className,
    ownerState,
    ref: mergedRef,
    extraProps: {
      role: 'presentation',
      ...otherProps,
    },
  });

  const shouldRender = keepMounted || positioner.mounted;
  if (!shouldRender) {
    return null;
  }

  return (
    <TooltipPositionerContext.Provider value={contextValue}>
      <FloatingPortal root={container}>{renderElement()}</FloatingPortal>
    </TooltipPositionerContext.Provider>
  );
});

TooltipPositioner.propTypes /* remove-proptypes */ = {
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
   * The anchor element of the tooltip popup.
   */
  anchor: PropTypes /* @typescript-to-proptypes-ignore */.oneOfType([
    HTMLElementType,
    PropTypes.object,
    PropTypes.func,
  ]),
  /**
   * Determines the padding between the arrow and the tooltip popup edges. Useful when the tooltip
   * popup has rounded corners via `border-radius`.
   * @default 5
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
  collisionBoundary: PropTypes /* @typescript-to-proptypes-ignore */.oneOfType([
    HTMLElementType,
    PropTypes.arrayOf(HTMLElementType),
    PropTypes.string,
    PropTypes.shape({
      height: PropTypes.number,
      width: PropTypes.number,
      x: PropTypes.number,
      y: PropTypes.number,
    }),
  ]),
  /**
   * The padding of the collision boundary to add whitespace between the tooltip popup and the
   * boundary edges to prevent them from touching.
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
   * The container element to which the tooltip positioner is appended to.
   */
  container: PropTypes /* @typescript-to-proptypes-ignore */.oneOfType([
    HTMLElementType,
    PropTypes.func,
  ]),
  /**
   * If `true`, the tooltip will be hidden if it is detached from its anchor element due to
   * differing clipping contexts.
   * @default false
   */
  hideWhenDetached: PropTypes.bool,
  /**
   * If `true`, the tooltip popup remains mounted in the DOM even when closed.
   * @default false
   */
  keepMounted: PropTypes.bool,
  /**
   * The CSS position strategy for positioning the tooltip popup element.
   * @default 'absolute'
   */
  positionStrategy: PropTypes.oneOf(['absolute', 'fixed']),
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
  /**
   * The side of the anchor element that the tooltip element should be placed at.
   * @default 'top'
   */
  side: PropTypes.oneOf(['bottom', 'left', 'right', 'top']),
  /**
   * The gap between the anchor element and the tooltip element.
   * @default 0
   */
  sideOffset: PropTypes.number,
  /**
   * If `true`, allow the tooltip to remain stuck in view while the anchor element is scrolled out
   * of view.
   * @default false
   */
  sticky: PropTypes.bool,
} as any;

export { TooltipPositioner };
