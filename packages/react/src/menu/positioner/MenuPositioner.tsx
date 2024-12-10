'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import {
  FloatingFocusManager,
  FloatingList,
  FloatingNode,
  FloatingPortal,
  useFloatingNodeId,
} from '@floating-ui/react';
import { MenuPositionerContext } from './MenuPositionerContext';
import { useMenuRootContext } from '../root/MenuRootContext';
import type { Side } from '../../utils/useAnchorPositioning';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useForkRef } from '../../utils/useForkRef';
import { useMenuPositioner } from './useMenuPositioner';
import { HTMLElementType } from '../../utils/proptypes';
import { BaseUIComponentProps, GenericHTMLProps } from '../../utils/types';
import { popupStateMapping } from '../../utils/popupStateMapping';

/**
 * Renders the element that positions the Menu popup.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
const MenuPositioner = React.forwardRef(function MenuPositioner(
  props: MenuPositioner.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    anchor,
    positionMethod = 'absolute',
    className,
    render,
    keepMounted = false,
    side = 'bottom',
    align = 'center',
    sideOffset = 0,
    alignOffset = 0,
    collisionBoundary = 'clipping-ancestors',
    collisionPadding = 5,
    arrowPadding = 5,
    sticky = false,
    container,
    ...otherProps
  } = props;

  const {
    open,
    floatingRootContext,
    getPositionerProps,
    setPositionerElement,
    nested,
    itemDomElements,
    itemLabels,
    mounted,
  } = useMenuRootContext();

  const nodeId = useFloatingNodeId();

  const positioner = useMenuPositioner({
    anchor,
    floatingRootContext,
    positionMethod,
    container,
    open,
    mounted,
    side,
    sideOffset,
    align,
    alignOffset,
    arrowPadding,
    collisionBoundary,
    collisionPadding,
    sticky,
    nodeId,
  });

  const state: MenuPositioner.State = React.useMemo(
    () => ({
      open,
      side: positioner.side,
      align: positioner.align,
      anchorHidden: positioner.anchorHidden,
    }),
    [open, positioner.side, positioner.align, positioner.anchorHidden],
  );

  const contextValue: MenuPositionerContext = React.useMemo(
    () => ({
      side: positioner.side,
      align: positioner.align,
      arrowRef: positioner.arrowRef,
      arrowUncentered: positioner.arrowUncentered,
      arrowStyles: positioner.arrowStyles,
      floatingContext: positioner.floatingContext,
    }),
    [
      positioner.side,
      positioner.align,
      positioner.arrowRef,
      positioner.arrowUncentered,
      positioner.arrowStyles,
      positioner.floatingContext,
    ],
  );

  const mergedRef = useForkRef(forwardedRef, setPositionerElement);

  const { renderElement } = useComponentRenderer({
    propGetter: (externalProps: GenericHTMLProps) =>
      positioner.getPositionerProps(getPositionerProps(externalProps)),
    render: render ?? 'div',
    className,
    state,
    customStyleHookMapping: popupStateMapping,
    ref: mergedRef,
    extraProps: otherProps,
  });

  const shouldRender = keepMounted || mounted;
  if (!shouldRender) {
    return null;
  }

  return (
    <MenuPositionerContext.Provider value={contextValue}>
      <FloatingNode id={nodeId}>
        <FloatingList elementsRef={itemDomElements} labelsRef={itemLabels}>
          <FloatingPortal root={props.container}>
            <FloatingFocusManager
              context={positioner.floatingContext}
              modal={false}
              initialFocus={nested ? -1 : 0}
              returnFocus
              disabled={!mounted}
            >
              {renderElement()}
            </FloatingFocusManager>
          </FloatingPortal>
        </FloatingList>
      </FloatingNode>
    </MenuPositionerContext.Provider>
  );
});

export namespace MenuPositioner {
  export interface State {
    open: boolean;
    side: Side;
    align: 'start' | 'end' | 'center';
    anchorHidden: boolean;
  }

  export interface Props
    extends useMenuPositioner.SharedParameters,
      BaseUIComponentProps<'div', State> {}
}

MenuPositioner.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * The align of the Menu element to the anchor element along its cross axis.
   * @default 'center'
   */
  align: PropTypes.oneOf(['center', 'end', 'start']),
  /**
   * The offset of the Menu element along its align axis.
   * @default 0
   */
  alignOffset: PropTypes.number,
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
   * @default 'clipping-ancestors'
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
   * Whether the menu popup remains mounted in the DOM while closed.
   * @default false
   */
  keepMounted: PropTypes.bool,
  /**
   * The CSS position strategy for positioning the Menu popup element.
   * @default 'absolute'
   */
  positionMethod: PropTypes.oneOf(['absolute', 'fixed']),
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
  /**
   * The side of the anchor element that the Menu element should align to.
   * @default 'bottom'
   */
  side: PropTypes.oneOf(['bottom', 'inline-end', 'inline-start', 'left', 'right', 'top']),
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
