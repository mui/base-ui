import * as React from 'react';
import { isElement } from '@floating-ui/utils/dom';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';

import type { FloatingContext, FloatingRootContext } from '../types';
import { getDocument } from '../utils';

import { useFloatingParentNodeId, useFloatingTree } from '../components/FloatingTree';
import { FloatingTreeStore } from '../components/FloatingTreeStore';
import {
  getCloseDelay,
  safePolygonIdentifier,
  useHoverInteractionSharedState,
  useHoverInteractionSharedMethods,
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

  const { enabled = true, closeDelay: closeDelayProp = 0, externalTree } = parameters;

  const sharedState = useHoverInteractionSharedState(store);
  const {
    pointerTypeRef,
    interactedInsideRef,
    handlerRef,
    performedPointerEventsMutationRef,
    restTimeoutPendingRef,
    openChangeTimeout,
    handleCloseOptionsRef,
  } = sharedState;

  const {
    isClickLikeOpenEvent,
    isHoverOpen,
    handleInteractInside,
    closeWithDelay,
    cleanupMouseMoveHandler,
    clearPointerEvents,
  } = useHoverInteractionSharedMethods(store, sharedState, () =>
    getCloseDelay(closeDelayProp, pointerTypeRef.current),
  );

  const tree = useFloatingTree(externalTree);
  const parentId = useFloatingParentNodeId();

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
      clearPointerEvents();
    };
  }, [clearPointerEvents, cleanupMouseMoveHandler]);

  useIsoLayoutEffect(() => {
    if (!enabled) {
      return undefined;
    }

    if (
      open &&
      handleCloseOptionsRef.current?.blockPointerEvents &&
      isHoverOpen() &&
      isElement(domReferenceElement) &&
      floatingElement
    ) {
      performedPointerEventsMutationRef.current = true;
      const body = getDocument(floatingElement).body;
      body.setAttribute(safePolygonIdentifier, '');

      const ref = domReferenceElement as HTMLElement | SVGSVGElement;
      const floatingEl = floatingElement;

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
    domReferenceElement,
    floatingElement,
    handleCloseOptionsRef,
    isHoverOpen,
    tree,
    parentId,
    performedPointerEventsMutationRef,
  ]);

  React.useEffect(() => {
    if (!enabled || !floatingElement) {
      return undefined;
    }

    // Ensure the floating element closes after scrolling even if the pointer
    // did not move.
    // https://github.com/floating-ui/floating-ui/discussions/1692
    function onScrollMouseLeave(event: MouseEvent) {
      if (isClickLikeOpenEvent() || !dataRef.current.floatingContext) {
        return;
      }

      const triggerElements = store.context.triggerElements;
      if (event.relatedTarget && triggerElements.hasElement(event.relatedTarget as Element)) {
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

    floatingElement.addEventListener('mouseleave', onScrollMouseLeave);
    floatingElement.addEventListener('mouseenter', onFloatingMouseEnter);
    floatingElement.addEventListener('mouseleave', onFloatingMouseLeave);
    floatingElement.addEventListener('pointerdown', handleInteractInside, true);

    return () => {
      openChangeTimeout.clear();

      floatingElement.removeEventListener('mouseleave', onScrollMouseLeave);
      floatingElement.removeEventListener('mouseenter', onFloatingMouseEnter);
      floatingElement.removeEventListener('mouseleave', onFloatingMouseLeave);
      floatingElement.removeEventListener('pointerdown', handleInteractInside, true);
    };
  }, [
    enabled,
    floatingElement,
    isClickLikeOpenEvent,
    dataRef,
    store,
    clearPointerEvents,
    cleanupMouseMoveHandler,
    closeWithDelay,
    openChangeTimeout,
    handlerRef,
    handleInteractInside,
  ]);
}
