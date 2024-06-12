import type * as React from 'react';
import type { Boundary, Padding, VirtualElement, FloatingRootContext } from '@floating-ui/react';
import type { GenericHTMLProps } from '../../utils/types';

export interface TooltipPositionerParameters {
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
   * If `true`, the tooltip is open.
   */
  open?: boolean;
  /**
   * The CSS position strategy for positioning the tooltip popup element.
   * @default 'absolute'
   */
  positionStrategy?: 'absolute' | 'fixed';
  /**
   * The side of the anchor element that the tooltip element should be placed at.
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
   * The padding of the collision boundary to add whitespace between the tooltip popup and the
   * boundary edges to prevent them from touching.
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
   * If `true`, allow the tooltip to remain stuck in view while the anchor element is scrolled out
   * of view.
   * @default false
   */
  sticky?: boolean;
  /**
   * Determines the padding between the arrow and the tooltip popup edges. Useful when the tooltip
   * popup has rounded corners via `border-radius`.
   * @default 5
   */
  arrowPadding?: number;
  /**
   * If `true`, the tooltip popup remains mounted in the DOM even when closed.
   * @default false
   */
  keepMounted?: boolean;
}

export interface UseTooltipPositionerParameters extends TooltipPositionerParameters {
  /**
   * Root props to spread on the tooltip positioner element.
   */
  getRootPositionerProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
  /**
   * If `true`, the tooltip is in an instant phase where animations should be removed.
   */
  instant?: boolean;
  /**
   * If `true`, the tooltip is mounted.
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
  followCursorAxis?: 'none' | 'x' | 'y' | 'both';
}

export interface UseTooltipPositionerReturnValue {
  /**
   * Props to spread on the positioner element.
   */
  getPositionerProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
  /**
   * Props to spread on the popup arrow element.
   */
  getArrowProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
  /**
   * The ref for the arrow element.
   */
  arrowRef: React.MutableRefObject<Element | null>;
  /**
   * Determines if the arrow cannot be centered.
   */
  arrowUncentered: boolean;
  /**
   * The rendered side of the tooltip popup element.
   */
  side: 'top' | 'right' | 'bottom' | 'left';
  /**
   * The rendered alignment of the tooltip popup element.
   */
  alignment: 'start' | 'end' | 'center';
  /**
   * Whether the tooltip is mounted, including CSS transitions or animations.
   */
  mounted: boolean;
}
