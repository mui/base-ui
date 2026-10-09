'use client';
import * as React from 'react';
import { addEventListener } from '@base-ui/utils/addEventListener';
import { mergeCleanups } from '@base-ui/utils/mergeCleanups';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useTimeout } from '@base-ui/utils/useTimeout';
import { isElement } from '@floating-ui/utils/dom';
import { createChangeEventDetails } from '../../../internals/createBaseUIEventDetails';
import { REASONS } from '../../../internals/reasons';
import { useFloatingParentNodeId, useFloatingTree } from '../tree/FloatingTree';
import type { FloatingRootContext } from '../floating-root/types';
import { useHoverIntent } from './hoverIntent';

export type UseHoverFloatingInteractionProps = {
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
   * without a `FloatingContext`, such as inline nested navigation menus.
   */
  nodeId?: string | undefined;
};

/**
 * Provides hover interactions that should be attached to the floating element.
 */
export function useHoverFloatingInteraction(
  store: FloatingRootContext,
  parameters: UseHoverFloatingInteractionProps = {},
): void {
  const { enabled = true, closeDelay: closeDelayProp = 0, nodeId: nodeIdProp } = parameters;

  const open = store.useState('open');
  const floatingElement = store.useState('floatingElement');
  const domReferenceElement = store.useState('domReferenceElement');

  const tree = useFloatingTree();
  const parentId = useFloatingParentNodeId();
  const intent = useHoverIntent(store);

  const childClosedTimeout = useTimeout();

  useIsoLayoutEffect(() => {
    if (!open) {
      intent.reset();
    }
  }, [open, intent]);

  React.useEffect(() => {
    return intent.restoreOutsidePointerEvents;
  }, [intent]);

  useIsoLayoutEffect(() => {
    if (!enabled) {
      return undefined;
    }

    if (
      open &&
      isElement(domReferenceElement) &&
      floatingElement &&
      intent.blockOutsidePointerEventsForPopup(
        domReferenceElement as HTMLElement | SVGSVGElement,
        floatingElement,
        tree,
        parentId,
      )
    ) {
      return intent.restoreOutsidePointerEvents;
    }

    return undefined;
  }, [enabled, open, domReferenceElement, floatingElement, intent, tree, parentId]);

  React.useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    function hasParentChildren() {
      return !!(tree && parentId && tree.hasOpenDescendant(parentId));
    }

    function onFloatingMouseEnter() {
      intent.onPopupMouseEnter();
      childClosedTimeout.clear();
      tree?.events.off('floating.closed', onNodeClosed);
    }

    function onFloatingMouseLeave(event: MouseEvent) {
      if (hasParentChildren() && tree) {
        tree.events.on('floating.closed', onNodeClosed);
        return;
      }

      intent.onPopupMouseLeave(event, { closeDelay: closeDelayProp, tree, nodeId: nodeIdProp });
    }

    function onPopupPointerDown(event: PointerEvent) {
      intent.onPopupPointerDown(event);
    }

    function onNodeClosed(event: MouseEvent) {
      if (!tree || !parentId || hasParentChildren()) {
        return;
      }
      // Allow the mouseenter event to fire in case child was closed because mouse moved into parent.
      childClosedTimeout.start(0, () => {
        tree.events.off('floating.closed', onNodeClosed);
        store.setOpen(false, createChangeEventDetails(REASONS.triggerHover, event));
        tree.events.emit('floating.closed', event);
      });
    }

    const floating = floatingElement;
    return mergeCleanups(
      floating && addEventListener(floating, 'mouseenter', onFloatingMouseEnter),
      floating && addEventListener(floating, 'mouseleave', onFloatingMouseLeave),
      floating && addEventListener(floating, 'pointerdown', onPopupPointerDown, true),
      () => {
        tree?.events.off('floating.closed', onNodeClosed);
      },
    );
  }, [
    enabled,
    floatingElement,
    store,
    closeDelayProp,
    nodeIdProp,
    intent,
    tree,
    parentId,
    childClosedTimeout,
  ]);
}
