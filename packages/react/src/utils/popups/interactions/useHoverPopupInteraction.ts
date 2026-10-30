'use client';
import * as React from 'react';
import { addEventListener } from '@base-ui/utils/addEventListener';
import { mergeCleanups } from '@base-ui/utils/mergeCleanups';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useTimeout } from '@base-ui/utils/useTimeout';
import { isElement } from '@floating-ui/utils/dom';
import { createChangeEventDetails } from '../../../internals/createBaseUIEventDetails';
import { REASONS } from '../../../internals/reasons';
import type { PopupInteractionStore } from '../types';
import { getHoverIntent } from './hoverIntent';

export type UseHoverPopupInteractionProps = {
  /**
   * Whether the Hook is enabled, including all internal Effects and event
   * handlers.
   * @default true
   */
  enabled?: boolean | undefined;
  /**
   * Waits for the specified time when the event listener runs before changing
   * the `open` state.
   * @default 0
   */
  closeDelay?: number | (() => number) | undefined;
  /**
   * Tree node id override for floating elements that participate in the tree
   * without a `PopupPositioningContext`, such as inline nested navigation menus.
   */
  nodeId?: string | undefined;
};

/**
 * Provides hover interactions that should be attached to the popup's positioner element.
 */
export function useHoverPopupInteraction(
  store: PopupInteractionStore,
  parameters: UseHoverPopupInteractionProps = {},
): void {
  const { enabled = true, closeDelay: closeDelayProp = 0, nodeId: nodeIdProp } = parameters;

  const open = store.useState('open');
  const positionerElement = store.useState('positionerElement');
  const anchorElement = store.useState('anchorElement');

  const tree = store.useState('popupTree');
  // The node whose open descendants keep this popup open: its own node, or for a popup that
  // doesn't register one, the node it's nested in.
  const ownerNodeId = store.select('popupNodeId') ?? store.select('popupParentNodeId');
  const intent = getHoverIntent(store);

  const childClosedTimeout = useTimeout();

  useIsoLayoutEffect(() => {
    if (!open) {
      intent.reset();
    }
  }, [open, intent]);

  React.useEffect(
    () => () => {
      intent.cancelPendingOpen();
      intent.restoreOutsidePointerEvents();
    },
    [intent],
  );

  useIsoLayoutEffect(() => {
    if (!enabled) {
      return undefined;
    }

    if (
      open &&
      isElement(anchorElement) &&
      positionerElement &&
      intent.blockOutsidePointerEventsForPopup(
        anchorElement as HTMLElement | SVGSVGElement,
        positionerElement,
        tree,
        ownerNodeId,
      )
    ) {
      return intent.restoreOutsidePointerEvents;
    }

    return undefined;
  }, [enabled, open, anchorElement, positionerElement, intent, tree, ownerNodeId]);

  React.useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    function hasParentChildren() {
      return !!(ownerNodeId && tree?.descendants(ownerNodeId).length);
    }

    function onFloatingMouseEnter() {
      intent.onPopupMouseEnter();
      childClosedTimeout.clear();
      tree?.events.off('nodeHoverClose', onNodeClosed);
    }

    function onFloatingMouseLeave(event: MouseEvent) {
      if (hasParentChildren() && tree) {
        tree.events.on('nodeHoverClose', onNodeClosed);
        return;
      }

      intent.onPopupMouseLeave(event, { closeDelay: closeDelayProp, tree, nodeId: nodeIdProp });
    }

    function onPopupPointerDown(event: PointerEvent) {
      intent.onPopupPointerDown(event);
    }

    function onNodeClosed(event: MouseEvent) {
      if (!tree || !ownerNodeId || hasParentChildren()) {
        return;
      }
      // Allow the mouseenter event to fire in case child was closed because mouse moved into parent.
      childClosedTimeout.start(0, () => {
        tree.events.off('nodeHoverClose', onNodeClosed);
        store.setOpen(false, createChangeEventDetails(REASONS.triggerHover, event));
        tree.events.emit('nodeHoverClose', event);
      });
    }

    const floating = positionerElement;
    return mergeCleanups(
      floating && addEventListener(floating, 'mouseenter', onFloatingMouseEnter),
      floating && addEventListener(floating, 'mouseleave', onFloatingMouseLeave),
      floating && addEventListener(floating, 'pointerdown', onPopupPointerDown, true),
      () => {
        tree?.events.off('nodeHoverClose', onNodeClosed);
      },
    );
  }, [
    enabled,
    positionerElement,
    store,
    closeDelayProp,
    nodeIdProp,
    intent,
    tree,
    ownerNodeId,
    childClosedTimeout,
  ]);
}
