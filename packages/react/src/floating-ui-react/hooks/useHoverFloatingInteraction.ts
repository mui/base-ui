'use client';
import * as React from 'react';
import { isElement } from '@floating-ui/utils/dom';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useTimeout } from '@base-ui/utils/useTimeout';
import { ownerDocument } from '@base-ui/utils/owner';

import type { FloatingContext, FloatingRootContext } from '../types';
import { getNodeChildren, getTarget, isTargetInsideEnabledTrigger } from '../utils';

import { createChangeEventDetails } from '../../utils/createBaseUIEventDetails';
import { REASONS } from '../../utils/reasons';
import { useFloatingParentNodeId, useFloatingTree } from '../components/FloatingTree';
import {
  clearSafePolygonPointerEventsMutation,
  isInteractiveElement,
  useHoverInteractionSharedState,
} from './useHoverInteractionSharedState';
import { getDelay } from './useHoverShared';

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
};

/**
 * Provides hover interactions that should be attached to the floating element.
 */
export function useHoverFloatingInteraction(
  context: FloatingRootContext | FloatingContext,
  parameters: UseHoverFloatingInteractionProps = {},
): void {
  const store = 'rootStore' in context ? context.rootStore : context;
  const open = store.useState('open');
  const floatingElement = store.useState('floatingElement');
  const domReferenceElement = store.useState('domReferenceElement');
  const { dataRef } = store.context;

  const { enabled = true, closeDelay: closeDelayProp = 0 } = parameters;

  const instance = useHoverInteractionSharedState(store);

  const tree = useFloatingTree();
  const parentId = useFloatingParentNodeId();

  const isClickLikeOpenEvent = useStableCallback(() => {
    if (instance.interactedInside) {
      return true;
    }

    const openEventType = dataRef.current.openEvent?.type;
    return openEventType === 'click' || openEventType === 'mousedown';
  });

  const isHoverOpen = useStableCallback(() => {
    const type = dataRef.current.openEvent?.type;
    return type?.includes('mouse') && type !== 'mousedown';
  });

  const isRelatedTargetInsideEnabledTrigger = useStableCallback((target: EventTarget | null) => {
    return isTargetInsideEnabledTrigger(target, store.context.triggerElements);
  });

  const closeWithDelay = React.useCallback(
    (event: MouseEvent) => {
      const closeDelay = getDelay(closeDelayProp, 'close', instance.pointerType);
      const close = () => {
        store.setOpen(false, createChangeEventDetails(REASONS.triggerHover, event));
        tree?.events.emit('floating.closed', event);
      };
      if (closeDelay) {
        instance.openChangeTimeout.start(closeDelay, close);
      } else {
        instance.openChangeTimeout.clear();
        close();
      }
    },
    [closeDelayProp, store, instance, tree],
  );

  const clearPointerEvents = useStableCallback(() => {
    clearSafePolygonPointerEventsMutation(instance, ownerDocument(floatingElement).body);
  });

  const handleInteractInside = useStableCallback((event: PointerEvent) => {
    const target = getTarget(event) as Element | null;
    if (!isInteractiveElement(target)) {
      instance.interactedInside = false;
      return;
    }

    instance.interactedInside = true;
  });

  useIsoLayoutEffect(() => {
    if (!open) {
      instance.pointerType = undefined;
      instance.restTimeoutPending = false;
      instance.interactedInside = false;
      clearPointerEvents();
    }
  }, [open, instance, clearPointerEvents]);

  React.useEffect(() => {
    return clearPointerEvents;
  }, [clearPointerEvents]);

  useIsoLayoutEffect(() => {
    if (!enabled) {
      return undefined;
    }

    if (
      open &&
      instance.handleCloseOptions?.blockPointerEvents &&
      isHoverOpen() &&
      isElement(domReferenceElement) &&
      floatingElement
    ) {
      instance.performedPointerEventsMutation = true;
      const ref = domReferenceElement as HTMLElement | SVGSVGElement;
      const floatingEl = floatingElement;
      const doc = ownerDocument(floatingElement);

      const parentFloating = tree?.nodesRef.current.find((node) => node.id === parentId)?.context
        ?.elements.floating as HTMLElement | null;

      if (parentFloating) {
        parentFloating.style.pointerEvents = '';
      }

      const scopeElement = parentFloating ?? ref.closest('[data-rootownerid]') ?? doc.body;

      instance.pointerEventsScopeElement = scopeElement;
      scopeElement.style.pointerEvents = 'none';
      ref.style.pointerEvents = 'auto';
      floatingEl.style.pointerEvents = 'auto';

      return () => {
        ref.style.pointerEvents = '';
        floatingEl.style.pointerEvents = '';
        clearPointerEvents();
      };
    }

    return undefined;
  }, [
    enabled,
    open,
    domReferenceElement,
    floatingElement,
    instance,
    isHoverOpen,
    tree,
    parentId,
    clearPointerEvents,
  ]);

  const childClosedTimeout = useTimeout();

  React.useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    function onFloatingMouseEnter() {
      instance.openChangeTimeout.clear();
      childClosedTimeout.clear();
      tree?.events.off('floating.closed', onNodeClosed);
      clearPointerEvents();
    }

    function onFloatingMouseLeave(event: MouseEvent) {
      if (tree && parentId && getNodeChildren(tree.nodesRef.current, parentId).length > 0) {
        tree.events.on('floating.closed', onNodeClosed);
        return;
      }

      if (isRelatedTargetInsideEnabledTrigger(event.relatedTarget)) {
        // If the mouse is leaving the reference element to another trigger, don't explicitly close the popup
        // as it will be moved.
        return;
      }

      // If the safePolygon handler is active, let it handle the close logic.
      if (instance.handler) {
        instance.handler(event);
        return;
      }

      clearPointerEvents();
      if (!isClickLikeOpenEvent()) {
        closeWithDelay(event);
      }
    }

    function onNodeClosed(event: MouseEvent) {
      if (!tree || !parentId || getNodeChildren(tree.nodesRef.current, parentId).length > 0) {
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
    if (floating) {
      floating.addEventListener('mouseenter', onFloatingMouseEnter);
      floating.addEventListener('mouseleave', onFloatingMouseLeave);
      floating.addEventListener('pointerdown', handleInteractInside, true);
    }

    return () => {
      if (floating) {
        floating.removeEventListener('mouseenter', onFloatingMouseEnter);
        floating.removeEventListener('mouseleave', onFloatingMouseLeave);
        floating.removeEventListener('pointerdown', handleInteractInside, true);
      }
      tree?.events.off('floating.closed', onNodeClosed);
    };
  }, [
    enabled,
    floatingElement,
    store,
    dataRef,
    isClickLikeOpenEvent,
    isRelatedTargetInsideEnabledTrigger,
    closeWithDelay,
    clearPointerEvents,
    handleInteractInside,
    instance,
    tree,
    parentId,
    childClosedTimeout,
  ]);
}
