'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { usePreviewCardRootContext } from '../root/PreviewCardContext';
import { PreviewCardPositionerContext } from './PreviewCardPositionerContext';
import { PopupTreeNode, useRegisterPopupNode } from '../../utils/popups/tree/PopupTree';
import type {
  Side,
  Align,
  UseAnchorPositioningSharedParameters,
} from '../../internals/useAnchorPositioning';
import type { BaseUIComponentProps } from '../../internals/types';
import { usePreviewCardPortalContext } from '../portal/PreviewCardPortalContext';
import { usePopupPositioner } from '../../utils/popups/popupPositioner';
import { createInlineMiddleware } from '../../utils/popups/inlineRect';

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
  const nodeId = store.useState('popupNodeId');
  useRegisterPopupNode(nodeId);

  const inlineRectCoordsRef = store.context.inlineRectCoordsRef;

  const { element, positioning, open, mounted } = usePopupPositioner(store, componentProps, {
    forwardedRef,
    keepMounted,
    positioning: {
      inline: createInlineMiddleware(inlineRectCoordsRef),
    },
  });
  const updatePosition = positioning.update;

  useIsoLayoutEffect(() => {
    if (open && mounted) {
      updatePosition();
    }
  }, [open, mounted, updatePosition]);

  return (
    <PreviewCardPositionerContext.Provider value={positioning}>
      <PopupTreeNode id={nodeId}>{element}</PopupTreeNode>
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
