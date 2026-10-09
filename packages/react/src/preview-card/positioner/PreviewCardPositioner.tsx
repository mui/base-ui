'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { PreviewCardTreeNodeContext, usePreviewCardRootContext } from '../root/PreviewCardContext';
import { PreviewCardPositionerContext } from './PreviewCardPositionerContext';
import { FloatingNode, useFloatingNodeSnapshot } from '../../utils/popups/tree/FloatingTree';
import type {
  Side,
  Align,
  UseAnchorPositioningSharedParameters,
} from '../../internals/useAnchorPositioning';
import type { BaseUIComponentProps } from '../../internals/types';
import { usePreviewCardPortalContext } from '../portal/PreviewCardPortalContext';
import { POPUP_COLLISION_AVOIDANCE } from '../../internals/constants';
import { usePopupPositioner } from '../../utils/popups/popupPositioner';
import { createInlineMiddleware } from '../../utils/popups';

/**
 * Positions the popup against the trigger.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Preview Card](https://base-ui.com/react/components/preview-card)
 */
export const PreviewCardPositioner = React.forwardRef(function PreviewCardPositioner(
  componentProps: PreviewCardPositioner.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const store = usePreviewCardRootContext();
  const keepMounted = usePreviewCardPortalContext();
  // The Root registers the node; the Positioner attaches its snapshot to the same tree and scopes
  // nested popups under it.
  const treeNode = React.useContext(PreviewCardTreeNodeContext);
  const nodeId = treeNode?.id;

  const open = store.useState('open');
  const mounted = store.useState('mounted');
  const inlineRectCoordsRef = store.context.inlineRectCoordsRef;

  const { element, positioning } = usePopupPositioner(store, componentProps, {
    forwardedRef,
    keepMounted,
    defaults: { collisionAvoidance: POPUP_COLLISION_AVOIDANCE },
    positioning: {
      nodeId,
      inline: createInlineMiddleware(inlineRectCoordsRef),
    },
  });
  // The Root keeps the node registered once the Positioner unmounts, so the snapshot is dropped then.
  useFloatingNodeSnapshot(nodeId, positioning.context, treeNode?.tree, true);
  const updatePosition = positioning.update;

  useIsoLayoutEffect(() => {
    if (open && mounted) {
      updatePosition();
    }
  }, [open, mounted, updatePosition]);

  return (
    <PreviewCardPositionerContext.Provider value={positioning}>
      <FloatingNode id={nodeId}>{element}</FloatingNode>
    </PreviewCardPositionerContext.Provider>
  );
});

export interface PreviewCardPositionerState {
  /**
   * Whether the preview card is currently open.
   */
  open: boolean;
  /**
   * The side of the anchor the component is placed on.
   */
  side: Side;
  /**
   * The alignment of the component relative to the anchor.
   */
  align: Align;
  /**
   * Whether the anchor element is hidden.
   */
  anchorHidden: boolean;
  /**
   * Whether transitions should be skipped.
   */
  instant: 'dismiss' | 'focus' | undefined;
}

export interface PreviewCardPositionerProps
  extends
    UseAnchorPositioningSharedParameters,
    BaseUIComponentProps<'div', PreviewCardPositionerState> {}

export namespace PreviewCardPositioner {
  export type State = PreviewCardPositionerState;
  export type Props = PreviewCardPositionerProps;
}
