import * as React from 'react';
import type { Padding, VirtualElement, FloatingRootContext } from '@floating-ui/react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { type Boundary, type Side, useAnchorPositioning } from '../../utils/useAnchorPositioning';
import type { GenericHTMLProps } from '../../utils/types';
import { useTooltipRootContext } from '../root/TooltipRootContext';

export function useTooltipPositioner(
  params: useTooltipPositioner.Parameters,
): useTooltipPositioner.ReturnValue {
  const { keepMounted, mounted } = params;

  const { open, trackCursorAxis } = useTooltipRootContext();

  const {
    positionerStyles,
    arrowStyles,
    anchorHidden,
    arrowRef,
    arrowUncentered,
    renderedSide,
    renderedAlign,
  } = useAnchorPositioning(params);

  const getPositionerProps: useTooltipPositioner.ReturnValue['getPositionerProps'] =
    React.useCallback(
      (externalProps = {}) => {
        const hiddenStyles: React.CSSProperties = {};

        if (keepMounted && !open) {
          hiddenStyles.pointerEvents = 'none';
        }

        if (trackCursorAxis === 'both') {
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
      [keepMounted, open, trackCursorAxis, mounted, positionerStyles],
    );

  return React.useMemo(
    () => ({
      getPositionerProps,
      arrowStyles,
      arrowRef,
      arrowUncentered,
      side: renderedSide,
      align: renderedAlign,
      anchorHidden,
    }),
    [
      getPositionerProps,
      arrowStyles,
      arrowRef,
      arrowUncentered,
      renderedSide,
      renderedAlign,
      anchorHidden,
    ],
  );
}

export namespace useTooltipPositioner {
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
     * Whether the tooltip is currently open.
     */
    open?: boolean;
    /**
     * Determines which CSS `position` property to use.
     * @default 'absolute'
     */
    positionMethod?: 'absolute' | 'fixed';
    /**
     * Which side of the anchor element to align the popup against.
     * May automatically change to avoid collisions.
     * @default 'top'
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
     * the anchor element was scrolled out of view.
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
     * Whether to keep the HTML element in the DOM while the tooltip is hidden.
     * @default false
     */
    keepMounted?: boolean;
    /**
     * Whether the tooltip continuously tracks its anchor after the initial positioning upon
     * mount.
     * @default true
     */
    trackAnchor?: boolean;
    /**
     * The tooltip root context.
     */
    floatingRootContext?: FloatingRootContext;
    /**
     * Determines which axis the tooltip should track the cursor on.
     * @default 'none'
     */
    trackCursorAxis?: 'none' | 'x' | 'y' | 'both';
  }

  export interface Parameters extends SharedParameters {
    /**
     * Whether the tooltip is mounted.
     */
    mounted: boolean;
    /**
     * Whether the tooltip is currently open.
     */
    open?: boolean;
    /**
     * The tooltip root context.
     */
    floatingRootContext?: FloatingRootContext;
  }

  export interface ReturnValue {
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
     * Styles to apply to the arrow element.
     */
    arrowStyles: React.CSSProperties;
    /**
     * The rendered side of the tooltip element.
     */
    side: Side;
    /**
     * The rendered align of the tooltip element.
     */
    align: 'start' | 'end' | 'center';
    /**
     * Determines if the anchor element is hidden.
     */
    anchorHidden: boolean;
  }
}
