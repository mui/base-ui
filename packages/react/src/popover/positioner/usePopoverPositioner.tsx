import * as React from 'react';
import type {
  VirtualElement,
  Padding,
  FloatingContext,
  FloatingRootContext,
} from '@floating-ui/react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { type Boundary, type Side, useAnchorPositioning } from '../../utils/useAnchorPositioning';
import type { GenericHTMLProps } from '../../utils/types';
import { InteractionType } from '../../utils/useEnhancedClickHandler';

export function usePopoverPositioner(
  params: usePopoverPositioner.Parameters,
): usePopoverPositioner.ReturnValue {
  const { open = false, keepMounted = false, mounted } = params;

  const {
    positionerStyles,
    arrowStyles,
    anchorHidden,
    arrowRef,
    arrowUncentered,
    renderedSide,
    renderedAlign,
    positionerContext,
  } = useAnchorPositioning(params);

  const getPositionerProps: usePopoverPositioner.ReturnValue['getPositionerProps'] =
    React.useCallback(
      (externalProps = {}) => {
        const hiddenStyles: React.CSSProperties = {};

        if (keepMounted && !open) {
          hiddenStyles.pointerEvents = 'none';
        }

        return mergeReactProps<'div'>(externalProps, {
          role: 'presentation',
          hidden: !mounted,
          style: {
            ...positionerStyles,
            ...hiddenStyles,
          },
        });
      },
      [keepMounted, open, mounted, positionerStyles],
    );

  return React.useMemo(
    () => ({
      getPositionerProps,
      arrowRef,
      arrowUncentered,
      arrowStyles,
      side: renderedSide,
      align: renderedAlign,
      positionerContext,
      anchorHidden,
    }),
    [
      getPositionerProps,
      arrowRef,
      arrowUncentered,
      arrowStyles,
      renderedSide,
      renderedAlign,
      positionerContext,
      anchorHidden,
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
    side?: Side;
    /**
     * The gap between the anchor element and the popover element.
     * @default 0
     */
    sideOffset?: number;
    /**
     * The align of the popover element to the anchor element along its cross axis.
     * @default 'center'
     */
    align?: 'start' | 'end' | 'center';
    /**
     * The offset of the popover element along its align axis.
     * @default 0
     */
    alignOffset?: number;
    /**
     * The boundary that the popover element should be constrained to.
     * @default 'clipping-ancestors'
     */
    collisionBoundary?: Boundary;
    /**
     * The padding between the popover element and the edges of the collision boundary to add
     * whitespace between them to prevent them from touching.
     * @default 5
     */
    collisionPadding?: Padding;
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
     * Whether the popover is mounted.
     */
    mounted: boolean;
    /**
     * Whether the popover is open.
     * @default false
     */
    open?: boolean;
    /**
     * The floating root context.
     */
    floatingRootContext?: FloatingRootContext;
    /**
     * Method used to open the popover.
     */
    openMethod: InteractionType | null;
    /**
     * The ref to the popup element.
     */
    popupRef: React.RefObject<HTMLElement | null>;
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
    side: Side;
    /**
     * The rendered align of the popover element.
     */
    align: 'start' | 'end' | 'center';
    /**
     * The styles to apply to the popover arrow element.
     */
    arrowStyles: React.CSSProperties;
    /**
     * The floating context.
     */
    positionerContext: FloatingContext;
    /**
     * Determines if the anchor element is hidden.
     */
    anchorHidden: boolean;
  }
}
