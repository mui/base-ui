import type * as React from 'react';
import type {
  Boundary,
  Padding,
  VirtualElement,
  Side,
  FloatingRootContext,
  FloatingContext,
} from '@floating-ui/react';
import type { GenericHTMLProps } from '../../utils/types';

export interface HoverCardPositionerParameters {
  /**
   * If `true`, the popover is open.
   */
  open?: boolean;
  /**
   * The anchor element to which the popover popup will be placed at.
   */
  anchor?:
    | Element
    | null
    | VirtualElement
    | React.MutableRefObject<Element | null>
    | (() => Element | VirtualElement | null);
  /**
   * The CSS position strategy for positioning the popover popup element.
   * @default 'absolute'
   */
  positionStrategy?: 'absolute' | 'fixed';
  /**
   * The container element to which the popover popup will be appended to.
   */
  container?: HTMLElement | null | React.MutableRefObject<HTMLElement | null>;
  /**
   * The side of the anchor element that the popover element should align to.
   * @default 'bottom'
   */
  side?: Side;
  /**
   * The gap between the anchor element and the popover element.
   * @default 0
   */
  sideOffset?: number;
  /**
   * The alignment of the popover element to the anchor element along its cross axis.
   * @default 'center'
   */
  alignment?: 'start' | 'end' | 'center';
  /**
   * The offset of the popover element along its alignment axis.
   * @default 0
   */
  alignmentOffset?: number;
  /**
   * The boundary that the popover element should be constrained to.
   * @default 'clippingAncestors'
   */
  collisionBoundary?: Boundary;
  /**
   * The padding of the collision boundary.
   * @default 5
   */
  collisionPadding?: Padding;
  /**
   * If `true`, the popover will be hidden if it is detached from its anchor element due to
   * differing clipping contexts.
   * @default false
   */
  hideWhenDetached?: boolean;
  /**
   * If `true`, allow the popover to remain in stuck view while the anchor element is scrolled out
   * of view.
   * @default false
   */
  sticky?: boolean;
  /**
   * Determines the padding between the arrow and the popover popup's edges. Useful when the popover
   * popup has rounded corners via `border-radius`.
   * @default 5
   */
  arrowPadding?: number;
  /**
   * If `true`, popover stays mounted in the DOM when closed.
   * @default false
   */
  keepMounted?: boolean;
}

export interface UseHoverCardPositionerParameters extends HoverCardPositionerParameters {
  /**
   * If `true`, the popover is mounted.
   * @default true
   */
  mounted?: boolean;
  /**
   * The popover root context.
   */
  floatingRootContext?: FloatingRootContext;
}

export interface UseHoverCardPositionerReturnValue {
  /**
   * Props to spread on the popover positioner element.
   */
  getPositionerProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
  /**
   * The ref of the popover arrow element.
   */
  arrowRef: React.MutableRefObject<Element | null>;
  /**
   * Determines if the arrow cannot be centered.
   */
  arrowUncentered: boolean;
  /**
   * The rendered side of the popover element.
   */
  side: 'top' | 'right' | 'bottom' | 'left';
  /**
   * The rendered alignment of the popover element.
   */
  alignment: 'start' | 'end' | 'center';
  /**
   * The styles to apply to the popover arrow element.
   */
  arrowStyles: React.CSSProperties;
  /**
   * The floating context.
   */
  positionerContext: FloatingContext;
}
