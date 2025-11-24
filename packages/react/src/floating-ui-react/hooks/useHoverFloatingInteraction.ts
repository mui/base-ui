import * as React from 'react';
import { isElement } from '@floating-ui/utils/dom';
import { useStableCallback } from '@base-ui-components/utils/useStableCallback';
import { useIsoLayoutEffect } from '@base-ui-components/utils/useIsoLayoutEffect';

import type { FloatingRootContext } from '../types';
import { getDocument, getTarget, isMouseLikePointerType } from '../utils';

import { createChangeEventDetails } from '../../utils/createBaseUIEventDetails';
import { REASONS } from '../../utils/reasons';
import { FloatingUIOpenChangeDetails } from '../../utils/types';
import { useFloatingParentNodeId, useFloatingTree } from '../components/FloatingTree';
import { FloatingTreeStore } from '../components/FloatingTreeStore';
import {
  isInteractiveElement,
  safePolygonIdentifier,
  useHoverInteractionSharedState,
} from './useHoverInteractionSharedState';

export type UseHoverFloatingInteractionProps = {
  /**
   * Whether the Hook is enabled, including all internal Effects and event
   * handlers.
   * @default true
   */
  enabled?: boolean;
  /**
   * Waits for the specified time when the event listener runs before changing
   * the `open` state.
   * @default 0
   */
  closeDelay?: number | (() => number);
  /**
   * An optional external floating tree to use instead of the default context.
   */
  externalTree?: FloatingTreeStore;
};

const clickLikeEvents = new Set(['click', 'mousedown']);

/**
 * Provides hover interactions that should be attached to the floating element.
 */
export function useHoverFloatingInteraction(
  context: FloatingRootContext,
  parameters: UseHoverFloatingInteractionProps = {},
): void {
  const { open, onOpenChange, dataRef, events, elements } = context;
  const { enabled = true, closeDelay: closeDelayProp = 0, externalTree } = parameters;

  const {
    pointerTypeRef,
    interactedInsideRef,
    handlerRef,
    blockMouseMoveRef,
    performedPointerEventsMutationRef,
    unbindMouseMoveRef,
    restTimeoutPendingRef,
    openChangeTimeout: openChangeTimeout,
    restTimeout,
    handleCloseOptionsRef,
  } = useHoverInteractionSharedState(context);

  const tree = useFloatingTree(externalTree);
  const parentId = useFloatingParentNodeId();

  const isClickLikeOpenEvent = useStableCallback(() => {
    if (interactedInsideRef.current) {
      return true;
    }

    return dataRef.current.openEvent ? clickLikeEvents.has(dataRef.current.openEvent.type) : false;
  });

  const isHoverOpen = useStableCallback(() => {
    const type = dataRef.current.openEvent?.type;
    return type?.includes('mouse') && type !== 'mousedown';
  });

  const closeWithDelay = React.useCallback(
    (event: MouseEvent, runElseBranch = true) => {
      const closeDelay = getDelay(closeDelayProp, pointerTypeRef.current);
      if (closeDelay && !handlerRef.current) {
        openChangeTimeout.start(closeDelay, () =>
          onOpenChange(false, createChangeEventDetails(REASONS.triggerHover, event)),
        );
      } else if (runElseBranch) {
        openChangeTimeout.clear();
        onOpenChange(false, createChangeEventDetails(REASONS.triggerHover, event));
      }
    },
    [closeDelayProp, handlerRef, onOpenChange, pointerTypeRef, openChangeTimeout],
  );

  const cleanupMouseMoveHandler = useStableCallback(() => {
    unbindMouseMoveRef.current();
    handlerRef.current = undefined;
  });

  const clearPointerEvents = useStableCallback(() => {
    if (performedPointerEventsMutationRef.current) {
      const body = getDocument(elements.floating).body;
      body.style.pointerEvents = '';
      body.removeAttribute(safePolygonIdentifier);
      performedPointerEventsMutationRef.current = false;
    }
  });

  const handleInteractInside = useStableCallback((event: PointerEvent) => {
    const target = getTarget(event) as Element | null;
    if (!isInteractiveElement(target)) {
      interactedInsideRef.current = false;
      return;
    }

    interactedInsideRef.current = true;
  });

  React.useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    function onOpenChangeLocal(details: FloatingUIOpenChangeDetails) {
      if (!details.open) {
        openChangeTimeout.clear();
        restTimeout.clear();
        blockMouseMoveRef.current = true;
        restTimeoutPendingRef.current = false;
      }
    }

    events.on('openchange', onOpenChangeLocal);
    return () => {
      events.off('openchange', onOpenChangeLocal);
    };
  }, [enabled, events, openChangeTimeout, restTimeout, blockMouseMoveRef, restTimeoutPendingRef]);

  useIsoLayoutEffect(() => {
    if (!open) {
      pointerTypeRef.current = undefined;
      restTimeoutPendingRef.current = false;
      interactedInsideRef.current = false;
      cleanupMouseMoveHandler();
      clearPointerEvents();
    }
  }, [
    open,
    pointerTypeRef,
    restTimeoutPendingRef,
    interactedInsideRef,
    cleanupMouseMoveHandler,
    clearPointerEvents,
  ]);

  React.useEffect(() => {
    return () => {
      cleanupMouseMoveHandler();
    };
  }, [cleanupMouseMoveHandler]);

  React.useEffect(() => {
    return clearPointerEvents;
  }, [clearPointerEvents]);

  useIsoLayoutEffect(() => {
    if (!enabled) {
      return undefined;
    }

    if (
      open &&
      handleCloseOptionsRef.current?.blockPointerEvents &&
      isHoverOpen() &&
      isElement(elements.domReference) &&
      elements.floating
    ) {
      performedPointerEventsMutationRef.current = true;
      const body = getDocument(elements.floating).body;
      body.setAttribute(safePolygonIdentifier, '');

      const ref = elements.domReference as HTMLElement | SVGSVGElement;
      const floatingEl = elements.floating;

      const parentFloating = tree?.nodesRef.current.find((node) => node.id === parentId)?.context
        ?.elements.floating;

      if (parentFloating) {
        parentFloating.style.pointerEvents = '';
      }

      body.style.pointerEvents = 'none';
      ref.style.pointerEvents = 'auto';
      floatingEl.style.pointerEvents = 'auto';

      return () => {
        body.style.pointerEvents = '';
        ref.style.pointerEvents = '';
        floatingEl.style.pointerEvents = '';
      };
    }

    return undefined;
  }, [
    enabled,
    open,
    elements.domReference,
    elements.floating,
    handleCloseOptionsRef,
    isHoverOpen,
    tree,
    parentId,
    performedPointerEventsMutationRef,
  ]);

  React.useEffect(() => {
    if (!enabled) {
      return undefined;
    }

    // Ensure the floating element closes after scrolling even if the pointer
    // did not move.
    // https://github.com/floating-ui/floating-ui/discussions/1692
    function onScrollMouseLeave(event: MouseEvent) {
      if (isClickLikeOpenEvent()) {
        return;
      }
      if (!dataRef.current.floatingContext) {
        return;
      }
      if (
        event.relatedTarget &&
        elements.triggers &&
        elements.triggers.includes(event.relatedTarget as Element)
      ) {
        // If the mouse is leaving the reference element to another trigger, don't explicitly close the popup
        // as it will be moved.
        return;
      }

      clearPointerEvents();
      cleanupMouseMoveHandler();
      if (!isClickLikeOpenEvent()) {
        closeWithDelay(event);
      }
    }

    function onFloatingMouseEnter(event: MouseEvent) {
      openChangeTimeout.clear();
      clearPointerEvents();
      handlerRef.current?.(event);
      cleanupMouseMoveHandler();
    }

    function onFloatingMouseLeave(event: MouseEvent) {
      if (!isClickLikeOpenEvent()) {
        closeWithDelay(event, false);
      }
    }

    const floating = elements.floating;
    if (floating) {
      floating.addEventListener('mouseleave', onScrollMouseLeave);
      floating.addEventListener('mouseenter', onFloatingMouseEnter);
      floating.addEventListener('mouseleave', onFloatingMouseLeave);
      floating.addEventListener('pointerdown', handleInteractInside, true);
    }

    return () => {
      if (floating) {
        floating.removeEventListener('mouseleave', onScrollMouseLeave);
        floating.removeEventListener('mouseenter', onFloatingMouseEnter);
        floating.removeEventListener('mouseleave', onFloatingMouseLeave);
        floating.removeEventListener('pointerdown', handleInteractInside, true);
      }
    };
  });
}

export function getDelay(
  value: number | (() => number),
  pointerType?: PointerEvent['pointerType'],
) {
  if (pointerType && !isMouseLikePointerType(pointerType)) {
    return 0;
  }

  if (typeof value === 'function') {
    return value();
  }

  return value;
}
