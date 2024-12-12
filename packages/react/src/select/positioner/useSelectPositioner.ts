import * as React from 'react';
import type {
  VirtualElement,
  Padding,
  FloatingRootContext,
  FloatingContext,
  Middleware,
} from '@floating-ui/react';
import type { GenericHTMLProps } from '../../utils/types';
import { type Boundary, type Side, useAnchorPositioning } from '../../utils/useAnchorPositioning';
import { mergeReactProps } from '../../utils/mergeReactProps';
import { useSelectRootContext } from '../root/SelectRootContext';
import { useScrollLock } from '../../utils/useScrollLock';

export function useSelectPositioner(
  params: useSelectPositioner.Parameters,
): useSelectPositioner.ReturnValue {
  const { open, alignItemToTrigger, mounted, triggerElement } = useSelectRootContext();

  useScrollLock(alignItemToTrigger && mounted, triggerElement);

  const {
    positionerStyles: enabledPositionerStyles,
    arrowStyles,
    anchorHidden,
    arrowRef,
    arrowUncentered,
    renderedSide,
    renderedAlign,
    positionerContext,
    isPositioned,
  } = useAnchorPositioning({
    ...params,
    keepMounted: true,
    trackAnchor: params.trackAnchor ?? !alignItemToTrigger,
    mounted,
  });

  const positionerStyles: React.CSSProperties = React.useMemo(
    () => (alignItemToTrigger ? { position: 'fixed' } : enabledPositionerStyles),
    [alignItemToTrigger, enabledPositionerStyles],
  );

  const getPositionerProps: useSelectPositioner.ReturnValue['getPositionerProps'] =
    React.useCallback(
      (externalProps = {}) => {
        const hiddenStyles: React.CSSProperties = {};

        if (!open) {
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
      [open, mounted, positionerStyles],
    );

  const positioner = React.useMemo(
    () =>
      ({
        arrowRef,
        arrowUncentered,
        arrowStyles,
        side: alignItemToTrigger ? 'none' : renderedSide,
        align: renderedAlign,
        positionerContext,
        isPositioned,
        anchorHidden,
      }) as const,
    [
      alignItemToTrigger,
      arrowRef,
      arrowStyles,
      arrowUncentered,
      isPositioned,
      positionerContext,
      renderedAlign,
      renderedSide,
      anchorHidden,
    ],
  );

  return React.useMemo(
    () => ({
      getPositionerProps,
      positioner,
    }),
    [getPositionerProps, positioner],
  );
}

export namespace useSelectPositioner {
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
     * The CSS position method for positioning the Select popup element.
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
     * @default 'start'
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
     * Whether to keep the HTML element in the DOM while the select menu is hidden.
     * @default true
     */
    keepMounted?: boolean;
    /**
     * Whether to maintain the select menu in the viewport after
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
     * Whether the select popup continuously tracks its anchor after the initial positioning upon mount.
     * @default true
     */
    trackAnchor?: boolean;
  }

  export interface Parameters extends SharedParameters {
    /**
     * Whether the Select is mounted.
     */
    mounted: boolean;
    /**
     * Whether the select menu is currently open.
     */
    open?: boolean;
    /**
     * The Select root context.
     */
    floatingRootContext?: FloatingRootContext;
    /**
     * Floating node id.
     */
    nodeId?: string;
    /**
     * If specified, positions the popup relative to the selected item inside it.
     */
    inner?: Middleware;
    /**
     * Whether the floating element can flip to the perpendicular axis if it cannot fit in the
     * viewport.
     * @default true
     */
    allowAxisFlip?: boolean;
    /**
     * Whether to use fallback anchor postioning because anchoring to an inner item results in poor
     * UX.
     * @default false
     */
    innerFallback?: boolean;
    /**
     * Whether the user's current modality is touch.
     * @default false
     */
    touchModality?: boolean;
  }

  export interface ReturnValue {
    /**
     * Props to spread on the Select positioner element.
     */
    getPositionerProps: (externalProps?: GenericHTMLProps) => GenericHTMLProps;
    /**
     * The Select positioner context.
     */
    positioner: {
      /**
       * The ref of the Select arrow element.
       */
      arrowRef: React.MutableRefObject<Element | null>;
      /**
       * Determines if the arrow cannot be centered.
       */
      arrowUncentered: boolean;
      /**
       * The rendered side of the Select element.
       */
      side: Side | 'none';
      /**
       * The rendered align of the Select element.
       */
      align: 'start' | 'end' | 'center';
      /**
       * The styles to apply to the Select arrow element.
       */
      arrowStyles: React.CSSProperties;
      /**
       * The floating context.
       */
      positionerContext: FloatingContext;
      /**
       * Whether the Select popup has been positioned.
       */
      isPositioned: boolean;
      /**
       * Determines if the anchor element is hidden.
       */
      anchorHidden: boolean;
    };
  }
}
