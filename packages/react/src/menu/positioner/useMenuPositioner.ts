'use client';
import * as React from 'react';
import type {
  Padding,
  VirtualElement,
  FloatingContext,
  FloatingRootContext,
  FloatingEvents,
} from '@floating-ui/react';
import { mergeReactProps } from '../../utils/mergeReactProps';
import {
  type Boundary,
  OffsetFunction,
  type Side,
  useAnchorPositioning,
} from '../../utils/useAnchorPositioning';
import type { GenericHTMLProps } from '../../utils/types';
import { useMenuRootContext } from '../root/MenuRootContext';

export function useMenuPositioner(
  params: useMenuPositioner.Parameters,
): useMenuPositioner.ReturnValue {
  const { mounted, menuEvents, nodeId, parentNodeId, setOpen } = params;

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
    [open, positionerStyles, mounted],
  );

  React.useEffect(() => {
    function onMenuOpened(event: { nodeId: string; parentNodeId: string }) {
      if (event.nodeId !== nodeId && event.parentNodeId === parentNodeId) {
        setOpen(false);
      }
    }

    menuEvents.on('opened', onMenuOpened);

    return () => {
      menuEvents.off('opened', onMenuOpened);
    };
  }, [menuEvents, nodeId, parentNodeId, setOpen]);

  React.useEffect(() => {
    if (open) {
      menuEvents.emit('opened', { nodeId, parentNodeId });
    }
  }, [menuEvents, open, nodeId, parentNodeId]);

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
     * Whether the menu is currently open.
     */
    open?: boolean;
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
     */
    side?: Side;
    /**
     * Distance between the anchor and the popup.
     * @default 0
     */
    sideOffset?: number | OffsetFunction;
    /**
     * How to align the popup relative to the specified side.
     */
    align?: 'start' | 'end' | 'center';
    /**
     * Additional offset along the alignment axis of the element.
     * @default 0
     */
    alignOffset?: number | OffsetFunction;
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
     * Whether to maintain the menu in the viewport after
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
  }

  export interface Parameters extends SharedParameters {
    /**
     * Whether the portal is kept mounted in the DOM while the popup is closed.
     */
    keepMounted: boolean;
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
    /**
     * The parent floating node id.
     */
    parentNodeId: string | null;
    menuEvents: FloatingEvents;
    setOpen: (open: boolean, event?: Event) => void;
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
