import * as React from 'react';
import type { Padding, VirtualElement, FloatingRootContext } from '@floating-ui/react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { Boundary, useAnchorPositioning } from '../../utils/useAnchorPositioning';
import type { GenericHTMLProps } from '../../utils/types';
import { useTooltipRootContext } from '../root/TooltipRootContext';

export function useTooltipPositioner(
  params: useTooltipPositioner.Parameters,
): useTooltipPositioner.ReturnValue {
  const { keepMounted, mounted } = params;

  const { open, trackCursorAxis } = useTooltipRootContext();

  const { positionerStyles, arrowStyles, arrowRef, arrowUncentered, renderedSide, renderedAlign } =
    useAnchorPositioning(params);

  const getPositionerProps: useTooltipPositioner.ReturnValue['getPositionerProps'] =
    React.useCallback(
      (externalProps = {}) => {
        const hiddenStyles: React.CSSProperties = {};

        if ((keepMounted && !open) || trackCursorAxis === 'both') {
          hiddenStyles.pointerEvents = 'none';
        }

        const hidden = !mounted;

        return mergeReactProps<'div'>(externalProps, {
          role: 'presentation',
          hidden,
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
    }),
    [getPositionerProps, arrowRef, arrowUncentered, renderedSide, renderedAlign, arrowStyles],
  );
}

export namespace useTooltipPositioner {
  export interface SharedParameters {
    /**
     * The element to which the tooltip element is anchored to.
     */
    anchor?:
      | Element
      | null
      | VirtualElement
      | React.MutableRefObject<Element | null>
      | (() => Element | VirtualElement | null);
    /**
     * Whether the tooltip is open.
     * @default false
     */
    open?: boolean;
    /**
     * The CSS position strategy for positioning the tooltip element.
     * @default 'absolute'
     */
    positionMethod?: 'absolute' | 'fixed';
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
     * The align of the tooltip element to the anchor element along its cross axis.
     * @default 'center'
     */
    align?: 'start' | 'end' | 'center';
    /**
     * The offset of the tooltip element along its align axis.
     * @default 0
     */
    alignOffset?: number;
    /**
     * The boundary that the tooltip element should be constrained to.
     * @default 'clipping-ancestors'
     */
    collisionBoundary?: Boundary;
    /**
     * The padding between the tooltip element and the edges of the collision boundary to add
     * whitespace between them to prevent them from touching.
     * @default 5
     */
    collisionPadding?: Padding;
    /**
     * Whether the tooltip element is hidden if it appears detached from its anchor element due
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
     * Determines the padding between the arrow and the tooltip edges. Useful when the tooltip
     * element has rounded corners via `border-radius`.
     * @default 5
     */
    arrowPadding?: number;
    /**
     * Whether the tooltip remains mounted in the DOM while closed.
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
     * Whether the tooltip is open.
     * @default false
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
    side: 'top' | 'right' | 'bottom' | 'left';
    /**
     * The rendered align of the tooltip element.
     */
    align: 'start' | 'end' | 'center';
  }
}
