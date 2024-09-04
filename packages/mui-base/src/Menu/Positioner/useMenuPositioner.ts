'use client';
import * as React from 'react';
import type {
  Boundary,
  Padding,
  VirtualElement,
  FloatingContext,
  Side,
  FloatingRootContext,
} from '@floating-ui/react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useAnchorPositioning } from '../../utils/useAnchorPositioning';
import type { GenericHTMLProps } from '../../utils/types';

/**
 *
 * API:
 *
 * - [useMenuPositioner API](https://mui.com/base-ui/api/use-menu-positioner/)
 */
export function useMenuPositioner(
  params: useMenuPositioner.Parameters,
): useMenuPositioner.ReturnValue {
  const { open = false, keepMounted } = params;

  const {
    positionerStyles,
    arrowStyles,
    hidden,
    arrowRef,
    arrowUncentered,
    renderedSide,
    renderedAlignment,
    positionerContext: floatingContext,
  } = useAnchorPositioning(params);

  const getPositionerProps: useMenuPositioner.ReturnValue['getPositionerProps'] = React.useCallback(
    (externalProps = {}) => {
      const hiddenStyles: React.CSSProperties = {};

      if ((keepMounted && !open) || hidden) {
        hiddenStyles.pointerEvents = 'none';
      }

      return mergeReactProps(externalProps, {
        style: {
          ...positionerStyles,
          ...hiddenStyles,
          zIndex: 2147483647, // max z-index
        },
        'aria-hidden': !open || undefined,
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
      floatingContext,
    }),
    [
      getPositionerProps,
      arrowRef,
      arrowUncentered,
      arrowStyles,
      renderedSide,
      renderedAlignment,
      floatingContext,
    ],
  );
}

export namespace useMenuPositioner {
  export interface SharedParameters {
    /**
     * If `true`, the Menu is open.
     */
    open?: boolean;
    /**
     * The anchor element to which the Menu popup will be placed at.
     */
    anchor?:
      | Element
      | null
      | VirtualElement
      | React.MutableRefObject<Element | null>
      | (() => Element | VirtualElement | null);
    /**
     * The CSS position strategy for positioning the Menu popup element.
     * @default 'absolute'
     */
    positionStrategy?: 'absolute' | 'fixed';
    /**
     * The container element to which the Menu popup will be appended to.
     */
    container?: HTMLElement | null | React.MutableRefObject<HTMLElement | null>;
    /**
     * The side of the anchor element that the Menu element should align to.
     * @default 'bottom'
     */
    side?: Side;
    /**
     * The gap between the anchor element and the Menu element.
     * @default 0
     */
    sideOffset?: number;
    /**
     * The alignment of the Menu element to the anchor element along its cross axis.
     * @default 'center'
     */
    alignment?: 'start' | 'end' | 'center';
    /**
     * The offset of the Menu element along its alignment axis.
     * @default 0
     */
    alignmentOffset?: number;
    /**
     * The boundary that the Menu element should be constrained to.
     * @default 'clippingAncestors'
     */
    collisionBoundary?: Boundary;
    /**
     * The padding of the collision boundary.
     * @default 5
     */
    collisionPadding?: Padding;
    /**
     * If `true`, the Menu will be hidden if it is detached from its anchor element due to
     * differing clipping contexts.
     * @default false
     */
    hideWhenDetached?: boolean;
    /**
     * Whether the menu popup remains mounted in the DOM while closed.
     * @default false
     */
    keepMounted?: boolean;
    /**
     * If `true`, allow the Menu to remain in stuck view while the anchor element is scrolled out
     * of view.
     * @default false
     */
    sticky?: boolean;
    /**
     * Determines the padding between the arrow and the Menu popup's edges. Useful when the popover
     * popup has rounded corners via `border-radius`.
     * @default 5
     */
    arrowPadding?: number;
  }

  export interface Parameters extends SharedParameters {
    /**
     * If `true`, the Menu is mounted.
     * @default true
     */
    mounted?: boolean;
    /**
     * The Menu root context.
     */
    floatingRootContext?: FloatingRootContext;
    /**
     * Floating node id.
     */
    nodeId?: string;
  }

  export interface ReturnValue {
    /**
     * Props to spread on the Menu positioner element.
     */
    getPositionerProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
    /**
     * The ref of the Menu arrow element.
     */
    arrowRef: React.MutableRefObject<Element | null>;
    /**
     * Determines if the arrow cannot be centered.
     */
    arrowUncentered: boolean;
    /**
     * The rendered side of the Menu element.
     */
    side: 'top' | 'right' | 'bottom' | 'left';
    /**
     * The rendered alignment of the Menu element.
     */
    alignment: 'start' | 'end' | 'center';
    /**
     * The styles to apply to the Menu arrow element.
     */
    arrowStyles: React.CSSProperties;
    /**
     * The floating context.
     */
    floatingContext: FloatingContext;
  }
}
