'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { FloatingFocusManager, FloatingPortal } from '@floating-ui/react';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useForkRef } from '../../utils/useForkRef';
import { usePopoverRootContext } from '../Root/PopoverRootContext';
import { usePopoverPositioner } from './usePopoverPositioner';
import { PopoverPositionerContext } from './PopoverPositionerContext';
import { HTMLElementType, refType } from '../../utils/proptypes';
import type { BaseUIComponentProps } from '../../utils/types';
import type { Side, Alignment } from '../../utils/useAnchorPositioning';
import { popupOpenStateMapping } from '../../utils/popupOpenStateMapping';

/**
 * The popover positioner element.
 *
 * Demos:
 *
 * - [Popover](https://base-ui.netlify.app/components/react-popover/)
 *
 * API:
 *
 * - [PopoverPositioner API](https://base-ui.netlify.app/components/react-popover/#api-reference-PopoverPositioner)
 */
const PopoverPositioner = React.forwardRef(function PopoverPositioner(
  props: PopoverPositioner.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    render,
    className,
    anchor,
    container,
    keepMounted = false,
    positionMethod = 'absolute',
    side = 'bottom',
    alignment = 'center',
    sideOffset = 0,
    alignmentOffset = 0,
    collisionBoundary = 'clippingAncestors',
    collisionPadding = 5,
    arrowPadding = 5,
    hideWhenDetached = false,
    sticky = false,
    initialFocus,
    ...otherProps
  } = props;

  const { floatingRootContext, open, mounted, setPositionerElement, popupRef, openMethod } =
    usePopoverRootContext();

  const positioner = usePopoverPositioner({
    anchor,
    floatingRootContext,
    positionMethod,
    open,
    keepMounted,
    side,
    sideOffset,
    alignment,
    alignmentOffset,
    arrowPadding,
    collisionBoundary,
    collisionPadding,
    hideWhenDetached,
    sticky,
    popupRef,
    openMethod,
    initialFocus,
  });

  const ownerState: PopoverPositioner.OwnerState = React.useMemo(
    () => ({
      open,
      side: positioner.side,
      alignment: positioner.alignment,
    }),
    [open, positioner.side, positioner.alignment],
  );

  const contextValue: PopoverPositionerContext = React.useMemo(
    () => ({
      ...ownerState,
      arrowRef: positioner.arrowRef,
      arrowUncentered: positioner.arrowUncentered,
      arrowStyles: positioner.arrowStyles,
    }),
    [ownerState, positioner.arrowRef, positioner.arrowUncentered, positioner.arrowStyles],
  );

  const mergedRef = useForkRef(forwardedRef, setPositionerElement);

  const { renderElement } = useComponentRenderer({
    propGetter: positioner.getPositionerProps,
    render: render ?? 'div',
    className,
    ownerState,
    ref: mergedRef,
    extraProps: otherProps,
    customStyleHookMapping: popupOpenStateMapping,
  });

  const shouldRender = keepMounted || mounted;
  if (!shouldRender) {
    return null;
  }

  return (
    <PopoverPositionerContext.Provider value={contextValue}>
      <FloatingPortal root={container}>
        <FloatingFocusManager
          context={positioner.positionerContext}
          modal={false}
          disabled={!mounted}
          initialFocus={positioner.resolvedInitialFocus}
        >
          {renderElement()}
        </FloatingFocusManager>
      </FloatingPortal>
    </PopoverPositionerContext.Provider>
  );
});

namespace PopoverPositioner {
  export interface OwnerState {
    open: boolean;
    side: Side;
    alignment: Alignment;
  }

  export type Props = usePopoverPositioner.SharedParameters &
    BaseUIComponentProps<'div', OwnerState> & {
      /**
       * The element the popover positioner element is appended to.
       */
      container?: HTMLElement | null | React.MutableRefObject<HTMLElement | null>;
    };
}

PopoverPositioner.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * The alignment of the popover element to the anchor element along its cross axis.
   * @default 'center'
   */
  alignment: PropTypes.oneOf(['center', 'end', 'start']),
  /**
   * The offset of the popover element along its alignment axis.
   * @default 0
   */
  alignmentOffset: PropTypes.number,
  /**
   * The element to which the popover element is anchored to.
   */
  anchor: PropTypes /* @typescript-to-proptypes-ignore */.oneOfType([
    HTMLElementType,
    PropTypes.object,
    PropTypes.func,
  ]),
  /**
   * Determines the padding between the arrow and the popover edges. Useful when the popover
   * element has rounded corners via `border-radius`.
   * @default 5
   */
  arrowPadding: PropTypes.number,
  /**
   * @ignore
   */
  children: PropTypes.oneOfType([
    PropTypes.element,
    PropTypes.func,
    PropTypes.number,
    PropTypes.shape({
      '__@toStringTag@620': PropTypes.oneOf(['BigInt']).isRequired,
      toLocaleString: PropTypes.func.isRequired,
      toString: PropTypes.func.isRequired,
      valueOf: PropTypes.func.isRequired,
    }),
    PropTypes.shape({
      '__@iterator@96': PropTypes.func.isRequired,
    }),
    PropTypes.shape({
      children: PropTypes.node,
      key: PropTypes.string,
      props: PropTypes.any.isRequired,
      type: PropTypes.oneOfType([PropTypes.func, PropTypes.string]).isRequired,
    }),
    PropTypes.shape({
      '__@toStringTag@620': PropTypes.string.isRequired,
      catch: PropTypes.func.isRequired,
      finally: PropTypes.func.isRequired,
      then: PropTypes.func.isRequired,
    }),
    PropTypes.string,
    PropTypes.bool,
  ]),
  /**
   * Class names applied to the element or a function that returns them based on the component's state.
   */
  className: PropTypes.oneOfType([PropTypes.func, PropTypes.string]),
  /**
   * The boundary that the popover element should be constrained to.
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
   * The padding between the popover element and the edges of the collision boundary to add
   * whitespace between them to prevent them from touching.
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
   * The element the popover positioner element is appended to.
   */
  container: PropTypes /* @typescript-to-proptypes-ignore */.oneOfType([
    HTMLElementType,
    PropTypes.func,
  ]),
  /**
   * Whether the popover element is hidden if it appears detached from its anchor element due
   * to the anchor element being clipped (or hidden) from view.
   * @default false
   */
  hideWhenDetached: PropTypes.bool,
  /**
   * Determines an element to focus when the popover is opened.
   * It can be either a ref to the element or a function that returns such a ref.
   * If not provided, the first focusable element is focused.
   */
  initialFocus: PropTypes /* @typescript-to-proptypes-ignore */.oneOfType([
    PropTypes.func,
    refType,
  ]),
  /**
   * Whether the popover remains mounted in the DOM while closed.
   * @default false
   */
  keepMounted: PropTypes.bool,
  /**
   * The CSS position strategy for positioning the popover element.
   * @default 'absolute'
   */
  positionMethod: PropTypes.oneOf(['absolute', 'fixed']),
  /**
   * A function to customize rendering of the component.
   */
  render: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
  /**
   * The side of the anchor element that the popover element should be placed at.
   * @default 'bottom'
   */
  side: PropTypes.oneOf(['bottom', 'left', 'right', 'top']),
  /**
   * The gap between the anchor element and the popover element.
   * @default 0
   */
  sideOffset: PropTypes.number,
  /**
   * Whether to allow the popover to remain stuck in view while the anchor element is scrolled out
   * of view.
   * @default false
   */
  sticky: PropTypes.bool,
} as any;

export { PopoverPositioner };
