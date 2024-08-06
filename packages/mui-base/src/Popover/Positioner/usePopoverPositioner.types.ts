import type * as React from 'react';
import type {
  Boundary,
  Padding,
  VirtualElement,
  FloatingRootContext,
  FloatingContext,
} from '@floating-ui/react';
import type { GenericHTMLProps } from '../../utils/types';

export interface PopoverPositionerParameters {
  /**
   * The element to which the popover popup element is anchored to.
   */
  anchor?:
    | Element
    | null
    | VirtualElement
    | React.MutableRefObject<Element | null>
    | (() => Element | VirtualElement | null);
  /**
   * Whether the popover popup is open.
   * @default false
   */
  open?: boolean;
  /**
   * The CSS position strategy for positioning the popover popup element.
   * @default 'absolute'
   */
  positionStrategy?: 'absolute' | 'fixed';
  /**
   * The side of the anchor element that the popover popup element should be placed at.
   * @default 'bottom'
   */
  side?: 'top' | 'right' | 'bottom' | 'left';
  /**
   * The gap between the anchor element and the popover popup element.
   * @default 0
   */
  sideOffset?: number;
  /**
   * The alignment of the popover popup element to the anchor element along its cross axis.
   * @default 'center'
   */
  alignment?: 'start' | 'end' | 'center';
  /**
   * The offset of the popover popup element along its alignment axis.
   * @default 0
   */
  alignmentOffset?: number;
  /**
   * The boundary that the popover popup element should be constrained to.
   * @default 'clippingAncestors'
   */
  collisionBoundary?: Boundary;
  /**
   * The padding between the popover popup element and the edges of the collision boundary to add
   * whitespace between them to prevent them from touching.
   * @default 5
   */
  collisionPadding?: Padding;
  /**
   * Whether the popover popup element is hidden if it appears detached from its anchor element due
   * to the anchor element being clipped (or hidden) from view.
   * @default false
   */
  hideWhenDetached?: boolean;
  /**
   * Whether to allow the popover to remain stuck in view while the anchor element is scrolled out
   * of view.
   * @default false
   */
  sticky?: boolean;
  /**
   * Determines the padding between the arrow and the popover popup edges. Useful when the popover
   * popup element has rounded corners via `border-radius`.
   * @default 5
   */
  arrowPadding?: number;
  /**
   * Whether the popover popup remains mounted in the DOM while closed.
   * @default false
   */
  keepMounted?: boolean;
  /**
   * Whether the popover popup continuously tracks its anchor after the initial positioning upon
   * mount.
   * @default true
   */
  trackAnchor?: boolean;
}

export interface UsePopoverPositionerParameters extends PopoverPositionerParameters {
  /**
   * Determines if the popover popup is currently mounted in the DOM.
   * @default true
   */
  mounted?: boolean;
  /**
   * The popover root context.
   */
  floatingRootContext?: FloatingRootContext;
}

export interface UsePopoverPositionerReturnValue {
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
