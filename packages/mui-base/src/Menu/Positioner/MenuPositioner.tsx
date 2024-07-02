'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import {
  FloatingFocusManager,
  FloatingNode,
  FloatingPortal,
  useFloatingNodeId,
} from '@floating-ui/react';
import type {
  MenuPositionerContextValue,
  MenuPositionerOwnerState,
  MenuPositionerProps,
} from './MenuPositioner.types';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useForkRef } from '../../utils/useForkRef';
import { useMenuRootContext } from '../Root/MenuRootContext';
import { useMenuPositioner } from './useMenuPositioner';
import { MenuPositionerContext } from './MenuPositionerContext';
import { HTMLElementType } from '../../utils/proptypes';
import { MenuActionTypes } from '../Root/menuReducer';
import { GenericHTMLProps } from '../../utils/types';

/**
 * Renders the element that positions the Menu popup.
 *
 * Demos:
 *
 * - [Menu](https://mui.com/base-ui/react-Menu/)
 *
 * API:
 *
 * - [MenuPositioner API](https://mui.com/base-ui/react-Menu/components-api/#Menu-positioner)
 */
const MenuPositioner = React.forwardRef(function MenuPositioner(
  props: MenuPositionerProps,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    anchor,
    positionStrategy = 'absolute',
    className,
    render,
    side = 'bottom',
    alignment = 'center',
    sideOffset = 0,
    alignmentOffset = 0,
    collisionBoundary,
    collisionPadding = 5,
    arrowPadding = 5,
    hideWhenDetached = false,
    sticky = false,
    container,
    ...otherProps
  } = props;

  const { state, dispatch, floatingRootContext, getPositionerProps, isNested } =
    useMenuRootContext();

  const { open, triggerElement } = state;

  const nodeId = useFloatingNodeId();

  const positioner = useMenuPositioner({
    anchor: anchor || triggerElement,
    floatingRootContext,
    positionStrategy,
    container,
    open,
    mounted: open,
    side,
    sideOffset,
    alignment,
    alignmentOffset,
    arrowPadding,
    collisionBoundary,
    collisionPadding,
    hideWhenDetached,
    sticky,
    nodeId,
  });

  const ownerState: MenuPositionerOwnerState = React.useMemo(
    () => ({
      open,
      side: positioner.side,
      alignment: positioner.alignment,
    }),
    [open, positioner.side, positioner.alignment],
  );

  const contextValue: MenuPositionerContextValue = React.useMemo(
    () => ({
      side: positioner.side,
      alignment: positioner.alignment,
      arrowRef: positioner.arrowRef,
      arrowUncentered: positioner.arrowUncentered,
      floatingContext: positioner.floatingContext,
    }),
    [
      positioner.side,
      positioner.alignment,
      positioner.arrowRef,
      positioner.arrowUncentered,
      positioner.floatingContext,
    ],
  );

  const setPositionerElement = React.useCallback(
    (element: HTMLDivElement | null) => {
      dispatch({ type: MenuActionTypes.registerPositioner, positionerElement: element });
    },
    [dispatch],
  );

  const mergedRef = useForkRef(forwardedRef, setPositionerElement);

  const { renderElement } = useComponentRenderer({
    propGetter: (externalProps: GenericHTMLProps) =>
      getPositionerProps(positioner.getPositionerProps(externalProps)),
    render: render ?? 'div',
    className,
    ownerState,
    customStyleHookMapping: {
      open: (value) => ({ 'data-state': value ? 'open' : 'closed' }),
    },
    ref: mergedRef,
    extraProps: otherProps,
  });

  return (
    <MenuPositionerContext.Provider value={contextValue}>
      <FloatingNode id={nodeId}>
        <FloatingPortal root={props.container}>
          <FloatingFocusManager
            context={positioner.floatingContext}
            modal={false}
            initialFocus={isNested ? -1 : 0}
            returnFocus={isNested}
          >
            {renderElement()}
          </FloatingFocusManager>
        </FloatingPortal>
      </FloatingNode>
    </MenuPositionerContext.Provider>
  );
});

MenuPositioner.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * The alignment of the Menu element to the anchor element along its cross axis.
   * @default 'center'
   */
  alignment: PropTypes.oneOf(['center', 'end', 'start']),
  /**
   * The offset of the Menu element along its alignment axis.
   * @default 0
   */
  alignmentOffset: PropTypes.number,
  /**
   * The anchor element to which the Menu popup will be placed at.
   */
  anchor: PropTypes /* @typescript-to-proptypes-ignore */.oneOfType([
    HTMLElementType,
    PropTypes.object,
    PropTypes.func,
  ]),
  /**
   * Determines the padding between the arrow and the Menu popup's edges. Useful when the popover
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
   * The boundary that the Menu element should be constrained to.
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
   * The container element to which the Menu popup will be appended to.
   */
  container: PropTypes /* @typescript-to-proptypes-ignore */.oneOfType([
    HTMLElementType,
    PropTypes.func,
  ]),
  /**
   * If `true`, the Menu will be hidden if it is detached from its anchor element due to
   * differing clipping contexts.
   * @default false
   */
  hideWhenDetached: PropTypes.bool,
  /**
   * The CSS position strategy for positioning the Menu popup element.
   * @default 'absolute'
   */
  positionStrategy: PropTypes.oneOf(['absolute', 'fixed']),
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
  /**
   * The side of the anchor element that the Menu element should align to.
   * @default 'bottom'
   */
  side: PropTypes.oneOf(['bottom', 'left', 'right', 'top']),
  /**
   * The gap between the anchor element and the Menu element.
   * @default 0
   */
  sideOffset: PropTypes.number,
  /**
   * If `true`, allow the Menu to remain in stuck view while the anchor element is scrolled out
   * of view.
   * @default false
   */
  sticky: PropTypes.bool,
} as any;

export { MenuPositioner };
