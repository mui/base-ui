import * as React from 'react';
import type {
  VirtualElement,
  Padding,
  Boundary,
  FloatingContext,
  FloatingRootContext,
} from '@floating-ui/react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useAnchorPositioning } from '../../utils/useAnchorPositioning';
import type { GenericHTMLProps } from '../../utils/types';
import { getInertValue } from '../../utils/getInertValue';

export function usePopoverPositioner(
  params: usePopoverPositioner.Parameters,
): usePopoverPositioner.ReturnValue {
  const { open = false, keepMounted = false } = params;

  const {
    positionerStyles,
    arrowStyles,
    hidden,
    arrowRef,
    arrowUncentered,
    renderedSide,
    renderedAlignment,
    positionerContext,
  } = useAnchorPositioning(params);

  const getPositionerProps: usePopoverPositioner.ReturnValue['getPositionerProps'] =
    React.useCallback(
      (externalProps = {}) => {
        const hiddenStyles: React.CSSProperties = {};

        if ((keepMounted && !open) || hidden) {
          hiddenStyles.pointerEvents = 'none';
        }

        return mergeReactProps<'div'>(externalProps, {
          role: 'presentation',
          // @ts-ignore
          inert: getInertValue(!open),
          style: {
            ...positionerStyles,
            ...hiddenStyles,
            zIndex: 2147483647, // max z-index
          },
        });
      },
      [positionerStyles, open, keepMounted, hidden],
    );

  return React.useMemo(
    () => ({
      getPositionerProps,
      arrowRef,
      arrowUncentered,
      arrowStyles,
      side: renderedSide,
      alignment: renderedAlignment,
      positionerContext,
    }),
    [
      getPositionerProps,
      arrowRef,
      arrowUncentered,
      arrowStyles,
      renderedSide,
      renderedAlignment,
      positionerContext,
    ],
  );
}

export namespace usePopoverPositioner {
  export interface SharedParameters {
    /**
     * The element to which the popover element is anchored to.
     */
    anchor?:
      | Element
      | null
      | VirtualElement
      | React.MutableRefObject<Element | null>
      | (() => Element | VirtualElement | null);
    /**
     * The CSS position strategy for positioning the popover element.
     * @default 'absolute'
     */
    positionMethod?: 'absolute' | 'fixed';
    /**
     * The side of the anchor element that the popover element should be placed at.
     * @default 'bottom'
     */
    side?: 'top' | 'right' | 'bottom' | 'left';
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
     * The padding between the popover element and the edges of the collision boundary to add
     * whitespace between them to prevent them from touching.
     * @default 5
     */
    collisionPadding?: Padding;
    /**
     * Whether the popover element is hidden if it appears detached from its anchor element due
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
     * Determines the padding between the arrow and the popover edges. Useful when the popover
     * element has rounded corners via `border-radius`.
     * @default 5
     */
    arrowPadding?: number;
    /**
     * Whether the popover remains mounted in the DOM while closed.
     * @default false
     */
    keepMounted?: boolean;
    /**
     * Whether the popover continuously tracks its anchor after the initial positioning upon mount.
     * @default true
     */
    trackAnchor?: boolean;
  }

  export interface Parameters extends SharedParameters {
    /**
     * Whether the popover is open.
     * @default false
     */
    open?: boolean;
    /**
     * The floating root context.
     */
    floatingRootContext?: FloatingRootContext;
  }

  export interface ReturnValue {
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
}
