import type * as React from 'react';
import type { Boundary, Padding, VirtualElement, FloatingRootContext } from '@floating-ui/react';
import type { GenericHTMLProps } from '../../utils/BaseUI.types';

export interface TooltipPopupParameters {
  /**
   * The side of the anchor element that the tooltip element should align to.
   * @default 'top'
   */
  side?: 'top' | 'right' | 'bottom' | 'left';
  /**
   * The gap between the anchor element and the tooltip element.
   * @default 0
   */
  sideOffset?: number;
  /**
   * The alignment of the tooltip element to the anchor element along its cross axis.
   * @default 'center'
   */
  alignment?: 'start' | 'end' | 'center';
  /**
   * The offset of the tooltip element along its alignment axis.
   * @default 0
   */
  alignmentOffset?: number;
  /**
   * The boundary that the tooltip element should be constrained to.
   * @default 'clippingAncestors'
   */
  collisionBoundary?: Boundary;
  /**
   * The padding of the collision boundary.
   * @default 5
   */
  collisionPadding?: Padding;
  /**
   * If `true`, the tooltip will be hidden if it is detached from its anchor element due to
   * differing clipping contexts.
   * @default false
   */
  hideWhenDetached?: boolean;
  /**
   * If `true`, allow the tooltip to remain in stuck view while the anchor element is scrolled out
   * of view.
   * @default false
   */
  sticky?: boolean;
  /**
   * Determines the padding between the arrow and the tooltip content. Useful when the tooltip
   * has rounded corners via `border-radius`.
   * @default 5
   */
  arrowPadding?: number;
  /**
   * Determines if the tooltip is in an instant phase.
   */
  instant?: boolean;
  /**
   * Determines if the tooltip is mounted.
   */
  mounted?: boolean;
  /**
   * Callback fired when the mounted state changes.
   */
  setMounted?: React.Dispatch<React.SetStateAction<boolean>>;
  /**
   * The tooltip root context.
   */
  rootContext?: FloatingRootContext;
  /**
   * Determines which axis the tooltip should follow the cursor on.
   * @default 'none'
   */
  followCursorAxis?: 'both' | 'none' | 'x' | 'y';
}

export interface UseTooltipPopupParameters extends TooltipPopupParameters {
  /**
   * The anchor element of the tooltip popup.
   */
  anchor?:
    | Element
    | null
    | VirtualElement
    | React.MutableRefObject<Element | null>
    | (() => Element | VirtualElement | null);
  /**
   * If `true`, the tooltip will be mounted, including CSS transitions or animations.
   */
  keepMounted?: boolean;
  /**
   * The type of open delay.
   */
  delayType?: 'rest' | 'hover';
  /**
   * The delay in milliseconds before the tooltip opens after the trigger element is hovered.
   * @default 0
   */
  delay?: number;
  /**
   * The delay in milliseconds before the tooltip closes after the trigger element is unhovered.
   * @default 0
   */
  closeDelay?: number;
  /**
   * The props to spread on the tooltip popup element.
   */
  getRootPopupProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
}

export interface UseTooltipPopupReturnValue {
  /**
   * Props to spread on the tooltip content element.
   */
  getPopupProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
  /**
   * Props to spread on the arrow element.
   */
  getArrowProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
  /**
   * The ref of the arrow element.
   */
  arrowRef: React.MutableRefObject<Element | null>;
  /**
   * Determines if the arrow can not be centered.
   */
  arrowUncentered: boolean;
  /**
   * The rendered side of the tooltip element.
   */
  side: 'top' | 'right' | 'bottom' | 'left';
  /**
   * The rendered alignment of the tooltip element.
   */
  alignment: 'start' | 'end' | 'center';
  /**
   * Whether the tooltip is mounted, including CSS transitions or animations.
   */
  mounted: boolean;
}
