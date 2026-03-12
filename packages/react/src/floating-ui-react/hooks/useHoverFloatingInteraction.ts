'use client';
import * as React from 'react';
import { isElement } from '@floating-ui/utils/dom';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useTimeout } from '@base-ui/utils/useTimeout';
import { ownerDocument } from '@base-ui/utils/owner';

import type { FloatingContext, FloatingRootContext } from '../types';
import { getNodeChildren, getTarget, isTargetInsideEnabledTrigger } from '../utils';

import { useFloatingParentNodeId, useFloatingTree } from '../components/FloatingTree';
import {
  closeHoverPopup as closeHoverPopupShared,
  applySafePolygonPointerEventsMutation,
  clearSafePolygonPointerEventsMutation,
  HoverInteraction,
  isInteractiveElement,
  useHoverInteractionSharedState,
} from './useHoverInteractionSharedState';
import {
  getDelay,
  isClickLikeOpenEvent as isClickLikeOpenEventShared,
  isHoverOpen,
} from './useHoverShared';

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
   * Reopens instantly for this many milliseconds after a committed hover close.
   * Useful for trigger-to-trigger and popup-to-trigger handoffs.
   * @default undefined
   */
  hoverCloseGracePeriod?: number | undefined;
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

  const { enabled = true, closeDelay: closeDelayProp = 0, hoverCloseGracePeriod } = parameters;

  const instance = useHoverInteractionSharedState(store);

  const tree = useFloatingTree();
  const parentId = useFloatingParentNodeId();

  const isClickLikeOpenEvent = useStableCallback(() => {
    return isClickLikeOpenEventShared(dataRef.current.openEvent?.type, instance.interactedInside);
  });

  const closeHoverPopup = useStableCallback((event: MouseEvent) => {
    // Emit tree close only when a hover-close was actually committed.
    if (
      closeHoverPopupShared(
        store,
        instance,
        event,
        isHoverOpen(dataRef.current.openEvent?.type),
        hoverCloseGracePeriod,
      )
    ) {
      tree?.events.emit('floating.closed', event);
    }
  });

  const closeWithDelay = React.useCallback(
    (event: MouseEvent) => {
      if (!store.select('open')) {
        instance.openChangeTimeout.clear();
        return;
      }

      const closeDelay = getDelay(closeDelayProp, 'close', instance.pointerType);
      if (closeDelay) {
        instance.openChangeTimeout.start(closeDelay, () => closeHoverPopup(event));
      } else {
        instance.openChangeTimeout.clear();
        closeHoverPopup(event);
      }
    },
    [closeDelayProp, closeHoverPopup, instance, store],
  );

  const clearPointerEvents = useStableCallback(() => {
    clearSafePolygonPointerEventsMutation(instance);
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
      isHoverOpen(dataRef.current.openEvent?.type) &&
      isElement(domReferenceElement) &&
      floatingElement
    ) {
      const ref = domReferenceElement as HTMLElement | SVGSVGElement;
      const floatingEl = floatingElement;
      const doc = ownerDocument(floatingElement);

      const parentFloating = tree?.nodesRef.current.find((node) => node.id === parentId)?.context
        ?.elements.floating as HTMLElement | null;

      if (parentFloating) {
        parentFloating.style.pointerEvents = '';
      }

      const scopeElement =
        instance.handleCloseOptions?.getScope?.() ??
        instance.pointerEventsScopeElement ??
        parentFloating ??
        (ref.closest('[data-rootownerid]') as HTMLElement | SVGSVGElement | null) ??
        doc.body;

      applySafePolygonPointerEventsMutation(instance, {
        scopeElement,
        referenceElement: ref,
        floatingElement: floatingEl,
      });

      return () => {
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
    dataRef,
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

      if (isTargetInsideEnabledTrigger(event.relatedTarget, store.context.triggerElements)) {
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
        closeHoverPopup(event);
      });
    }

    const floating = floatingElement;
    if (floating) {
      function onPointerDown(event: PointerEvent) {
        handleInteractInside(instance, event);
      }

      floating.addEventListener('mouseenter', onFloatingMouseEnter);
      floating.addEventListener('mouseleave', onFloatingMouseLeave);
      floating.addEventListener('pointerdown', onPointerDown, true);

      return () => {
        floating.removeEventListener('mouseenter', onFloatingMouseEnter);
        floating.removeEventListener('mouseleave', onFloatingMouseLeave);
        floating.removeEventListener('pointerdown', onPointerDown, true);
        tree?.events.off('floating.closed', onNodeClosed);
      };
    }

    return () => {
      tree?.events.off('floating.closed', onNodeClosed);
    };
  }, [
    enabled,
    floatingElement,
    store,
    isClickLikeOpenEvent,
    closeWithDelay,
    closeHoverPopup,
    clearPointerEvents,
    instance,
    tree,
    parentId,
    childClosedTimeout,
  ]);
}

/**
 * Tracks whether pointer interaction happened inside an interactive popup element.
 */
function handleInteractInside(instance: HoverInteraction, event: PointerEvent) {
  const target = getTarget(event) as Element | null;
  if (!isInteractiveElement(target)) {
    instance.interactedInside = false;
    return;
  }

  instance.interactedInside = target?.closest('[aria-haspopup]') != null;
}
