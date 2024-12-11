'use client';
import * as React from 'react';
import type {
  Padding,
  VirtualElement,
  FloatingContext,
  FloatingRootContext,
} from '@floating-ui/react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { type Boundary, type Side, useAnchorPositioning } from '../../utils/useAnchorPositioning';
import type { GenericHTMLProps } from '../../utils/types';
import { useMenuRootContext } from '../root/MenuRootContext';

export function useMenuPositioner(
  params: useMenuPositioner.Parameters,
): useMenuPositioner.ReturnValue {
  const { keepMounted, mounted } = params;

  const { open } = useMenuRootContext();

  const {
    positionerStyles,
    arrowStyles,
    anchorHidden,
    arrowRef,
    arrowUncentered,
    renderedSide,
    renderedAlign,
    positionerContext: floatingContext,
  } = useAnchorPositioning(params);

  const getPositionerProps: useMenuPositioner.ReturnValue['getPositionerProps'] = React.useCallback(
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
    [keepMounted, open, positionerStyles, mounted],
  );

  return React.useMemo(
    () => ({
      getPositionerProps,
      arrowRef,
      arrowUncentered,
      arrowStyles,
      side: renderedSide,
      align: renderedAlign,
      floatingContext,
      anchorHidden,
    }),
    [
      getPositionerProps,
      arrowRef,
      arrowUncentered,
      arrowStyles,
      renderedSide,
      renderedAlign,
      floatingContext,
      anchorHidden,
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
    positionMethod?: 'absolute' | 'fixed';
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
     * The align of the Menu element to the anchor element along its cross axis.
     * @default 'center'
     */
    align?: 'start' | 'end' | 'center';
    /**
     * The offset of the Menu element along its align axis.
     * @default 0
     */
    alignOffset?: number;
    /**
     * The boundary that the Menu element should be constrained to.
     * @default 'clipping-ancestors'
     */
    collisionBoundary?: Boundary;
    /**
     * The padding of the collision boundary.
     * @default 5
     */
    collisionPadding?: Padding;
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
     * Whether the Menu is mounted.
     */
    mounted: boolean;
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
    side: Side;
    /**
     * The rendered align of the Menu element.
     */
    align: 'start' | 'end' | 'center';
    /**
     * The styles to apply to the Menu arrow element.
     */
    arrowStyles: React.CSSProperties;
    /**
     * The floating context.
     */
    floatingContext: FloatingContext;
    /**
     * Determines if the anchor element is hidden.
     */
    anchorHidden: boolean;
  }
}
