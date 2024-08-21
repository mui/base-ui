import type * as React from 'react';
import type { Boundary, Padding, VirtualElement, FloatingRootContext } from '@floating-ui/react';
import type { GenericHTMLProps } from '../../utils/types';

export interface TooltipPositionerParameters {
  /**
   * The element to which the tooltip popup element is anchored to.
   */
  anchor?:
    | Element
    | null
    | VirtualElement
    | React.MutableRefObject<Element | null>
    | (() => Element | VirtualElement | null);
  /**
   * Whether the tooltip popup is open.
   * @default false
   */
  open?: boolean;
  /**
   * The CSS position strategy for positioning the tooltip popup element.
   * @default 'absolute'
   */
  positionStrategy?: 'absolute' | 'fixed';
  /**
   * The side of the anchor element that the tooltip popup element should be placed at.
   * @default 'top'
   */
  side?: 'top' | 'right' | 'bottom' | 'left';
  /**
   * The gap between the anchor element and the tooltip popup element.
   * @default 0
   */
  sideOffset?: number;
  /**
   * The alignment of the tooltip popup element to the anchor element along its cross axis.
   * @default 'center'
   */
  alignment?: 'start' | 'end' | 'center';
  /**
   * The offset of the tooltip popup element along its alignment axis.
   * @default 0
   */
  alignmentOffset?: number;
  /**
   * The boundary that the tooltip popup element should be constrained to.
   * @default 'clippingAncestors'
   */
  collisionBoundary?: Boundary;
  /**
   * The padding between the tooltip popup element and the edges of the collision boundary to add
   * whitespace between them to prevent them from touching.
   * @default 5
   */
  collisionPadding?: Padding;
  /**
   * Whether the tooltip popup element is hidden if it appears detached from its anchor element due
   * to the anchor element being clipped (or hidden) from view.
   * @default false
   */
  hideWhenDetached?: boolean;
  /**
   * Whether to allow the tooltip to remain stuck in view while the anchor element is scrolled out
   * of view.
   * @default false
   */
  sticky?: boolean;
  /**
   * Determines the padding between the arrow and the tooltip popup edges. Useful when the tooltip
   * popup element has rounded corners via `border-radius`.
   * @default 5
   */
  arrowPadding?: number;
  /**
   * Whether the tooltip popup remains mounted in the DOM while closed.
   * @default false
   */
  keepMounted?: boolean;
  /**
   * Whether the tooltip popup continuously tracks its anchor after the initial positioning upon
   * mount.
   * @default true
   */
  trackAnchor?: boolean;
}

export interface UseTooltipPositionerParameters extends TooltipPositionerParameters {
  /**
   * The tooltip root context.
   */
  floatingRootContext?: FloatingRootContext;
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
   * The ref for the arrow element.
   */
  arrowRef: React.MutableRefObject<Element | null>;
  /**
   * Determines if the arrow cannot be centered.
   */
  arrowUncentered: boolean;
  /**
   * Styles to apply to the popup arrow element.
   */
  arrowStyles: React.CSSProperties;
  /**
   * The rendered side of the tooltip popup element.
   */
  side: 'top' | 'right' | 'bottom' | 'left';
  /**
   * The rendered alignment of the tooltip popup element.
   */
  alignment: 'start' | 'end' | 'center';
}
