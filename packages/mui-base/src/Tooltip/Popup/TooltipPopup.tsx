'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import type {
  TooltipPopupContextValue,
  TooltipPopupOwnerState,
  TooltipPopupProps,
} from './TooltipPopup.types';
import { useTooltipPopup } from './useTooltipPopup';
import { TooltipPopupContext } from './TooltipPopupContext';
import { useTooltipRootContext } from '../Root/TooltipRootContext';
import { TooltipPopupRoot } from '../PopupRoot/TooltipPopupRoot';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { tooltipPopupStyleHookMapping } from './styleHooks';
import { defaultRenderFunctions } from '../../utils/defaultRenderFunctions';
import type { GenericHTMLProps } from '../../utils/BaseUI.types';

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
    className,
    render,
    renderRoot: renderRootProp,
    anchor,
    positionStrategy = 'absolute',
    side = 'top',
    alignment = 'center',
    sideOffset = 0,
    alignmentOffset = 0,
    collisionBoundary,
    collisionPadding = 5,
    arrowPadding = 5,
    hideWhenDetached = false,
    sticky = false,
    followCursorAxis = 'none',
    keepMounted = false,
    container,
    ...otherProps
  } = props;
  const renderRoot = renderRootProp ?? defaultRenderFunctions.div;

  const {
    open,
    triggerElement,
    setPopupElement,
    getRootPopupProps,
    mounted,
    setMounted,
    rootContext,
    instantType,
    transitionStatus,
  } = useTooltipRootContext();

  const tooltip = useTooltipPopup({
    anchor: anchor || triggerElement,
    rootContext,
    positionStrategy,
    open,
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
    arrowPadding,
  });

  const ownerState: TooltipPopupOwnerState = React.useMemo(
    () => ({
      open,
      instant: instantType,
      side: tooltip.side,
      alignment: tooltip.alignment,
      entering: transitionStatus === 'entering',
      exiting: transitionStatus === 'exiting',
    }),
    [open, instantType, tooltip.side, tooltip.alignment, transitionStatus],
  );

  const contextValue: TooltipPopupContextValue = React.useMemo(
    () => ({
      ...ownerState,
      arrowRef: tooltip.arrowRef,
      getArrowProps: tooltip.getArrowProps,
      arrowUncentered: tooltip.arrowUncentered,
    }),
    [ownerState, tooltip.arrowRef, tooltip.getArrowProps, tooltip.arrowUncentered],
  );

  const { renderElement } = useComponentRenderer({
    // The content element needs to be a child of a wrapper floating element in order to avoid
    // conflicts with CSS transitions and the positioning transform.
    propGetter: (externalProps: GenericHTMLProps = {}) => ({
      ...externalProps,
      style: {
        // <Tooltip.Arrow> must be relative to the inner popup element.
        position: 'relative',
        ...externalProps.style,
      },
    }),
    render: render ?? 'div',
    className,
    ownerState,
    extraProps: otherProps,
    ref: forwardedRef,
    customStyleHookMapping: tooltipPopupStyleHookMapping,
  });

  const shouldRender = keepMounted || tooltip.mounted;
  if (!shouldRender) {
    return null;
  }

  return (
    <TooltipPopupContext.Provider value={contextValue}>
      <TooltipPopupRoot render={renderRoot} ref={setPopupElement} {...tooltip.getPopupProps()}>
        {renderElement()}
      </TooltipPopupRoot>
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
   * The anchor element of the tooltip popup.
   */
  anchor: PropTypes /* @typescript-to-proptypes-ignore */.any,
  /**
   * Determines the padding between the arrow and the tooltip content. Useful when the tooltip
   * has rounded corners via `border-radius`.
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
   * Customize the positioned root element.
   */
  renderRoot: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
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
} as any;

export { TooltipPopup };
