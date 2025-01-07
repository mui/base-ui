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
import { usePopoverRootContext } from '../root/PopoverRootContext';

export function usePopoverPositioner(
  params: usePopoverPositioner.Parameters,
): usePopoverPositioner.ReturnValue {
  const { keepMounted = false, mounted } = params;

  const { open } = usePopoverRootContext();

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
     * An element to position the popup against.
     * By default, the popup will be positioned against the trigger.
     */
    anchor?:
      | Element
      | null
      | VirtualElement
      | React.MutableRefObject<Element | null>
      | (() => Element | VirtualElement | null);
    /**
     * Determines which CSS `position` property to use.
     * @default 'absolute'
     */
    positionMethod?: 'absolute' | 'fixed';
    /**
     * Which side of the anchor element to align the popup against.
     * May automatically change to avoid collisions.
     * @default 'bottom'
     */
    side?: Side;
    /**
     * Distance between the anchor and the popup.
     * @default 0
     */
    sideOffset?: number;
    /**
     * How to align the popup relative to the specified side.
     * @default 'center'
     */
    align?: 'start' | 'end' | 'center';
    /**
     * Additional offset along the alignment axis of the element.
     * @default 0
     */
    alignOffset?: number;
    /**
     * An element or a rectangle that delimits the area that the popup is confined to.
     * @default 'clipping-ancestors'
     */
    collisionBoundary?: Boundary;
    /**
     * Additional space to maintain from the edge of the collision boundary.
     * @default 5
     */
    collisionPadding?: Padding;
    /**
     * Whether to maintain the popup in the viewport after
     * the anchor element is scrolled out of view.
     * @default false
     */
    sticky?: boolean;
    /**
     * Minimum distance to maintain between the arrow and the edges of the popup.
     *
     * Use it to prevent the arrow element from hanging out of the rounded corners of a popup.
     * @default 5
     */
    arrowPadding?: number;
    /**
     * Whether to keep the HTML element in the DOM while the popover is hidden.
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
