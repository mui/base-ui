'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useAnimationsFinished } from './useAnimationsFinished';

interface TriggerSwitchStore {
  select(key: 'open'): boolean;
  observe(key: 'viewportTransitioning', listener: (transitioning: boolean) => void): () => void;
}

/**
 * Popover and Menu declare different `instantType` unions, so only the members
 * this hook touches are typed.
 */
export interface TriggerChangeStore {
  /**
   * Read raw, because the `instantType` selector deliberately hides
   * `trigger-change` while closed — which is exactly when it has to be cleared.
   */
  readonly state: { readonly instantType: string | undefined };
  set(key: 'instantType', value: 'trigger-change' | undefined): void;
}

export interface UseTriggerSwitchTransitionParameters {
  store: TriggerSwitchStore;
  /** Menu and Popover also coordinate Popup transitions through the shared store. */
  instantTypeStore?: TriggerChangeStore | undefined;
  domReference: Element | null;
  positionerElement: HTMLElement | null;
  popupElement: HTMLElement | null;
  arrowElementRef: React.RefObject<Element | null>;
  /**
   * Measures the anchor again, so a stable virtual anchor moves with the trigger.
   */
  updatePosition: () => void;
  /**
   * Runs before a scroll or resize repositions the popup.
   */
  onAnchorTracking: { current: (() => void) | null };
  open: boolean;
}

/**
 * Tracks whether a popup is moving between detached triggers, so the positioner can animate the
 * move and keep anchor tracking instant otherwise.
 *
 * The move ends when the positioner, popup, and arrow animations finish and the popup's own
 * viewport stops its content transition, or earlier when a scroll or resize repositions the popup.
 * It continues if the popup closes during the move.
 */
export function useTriggerSwitchTransition(
  parameters: UseTriggerSwitchTransitionParameters,
): boolean {
  const {
    store,
    instantTypeStore,
    domReference,
    positionerElement,
    popupElement,
    arrowElementRef,
    updatePosition,
    onAnchorTracking,
    open,
  } = parameters;

  const [isSwitching, setIsSwitching] = React.useState(false);
  const previousTriggerRef = React.useRef<Element | null>(null);
  const closeCountRef = React.useRef(0);
  const runOncePositionerFinishes = useAnimationsFinished(positionerElement);
  const runOncePopupFinishes = useAnimationsFinished(popupElement);
  const runOnceArrowFinishes = useAnimationsFinished(arrowElementRef);

  const waitForMove = useStableCallback((signal: AbortSignal, endMove: () => void) => {
    updatePosition();

    // Viewport content can transition under an ancestor `[data-instant]`, so the move waits for it.
    function waitForViewport() {
      const unsubscribe = store.observe('viewportTransitioning', (transitioning) => {
        if (!transitioning) {
          endMove();
        }
      });
      if (signal.aborted) {
        unsubscribe();
      } else {
        signal.addEventListener('abort', unsubscribe, { once: true });
      }
    }

    const waits = [
      positionerElement ? runOncePositionerFinishes : null,
      popupElement ? runOncePopupFinishes : null,
      arrowElementRef.current ? runOnceArrowFinishes : null,
    ].filter((wait) => wait != null);
    let pendingParts = waits.length;
    if (pendingParts === 0) {
      waitForViewport();
      return;
    }
    waits.forEach((wait) =>
      wait(() => {
        pendingParts -= 1;
        if (pendingParts === 0) {
          waitForViewport();
        }
      }, signal),
    );
  });

  useIsoLayoutEffect(() => {
    if (open) {
      return;
    }

    closeCountRef.current += 1;

    // The selector masks trigger-change while closed; clear its stored value too so a
    // controlled reopen cannot inherit it and skip the Popup's enter transition.
    if (instantTypeStore?.state.instantType === 'trigger-change') {
      instantTypeStore.set('instantType', undefined);
    }
  }, [open, instantTypeStore]);

  useIsoLayoutEffect(() => {
    const previousTrigger = previousTriggerRef.current;
    previousTriggerRef.current = domReference;

    // A cleared anchor, such as for a disabled Tooltip, or a change while closing does not move.
    if (
      !previousTrigger ||
      !domReference ||
      previousTrigger === domReference ||
      !store.select('open')
    ) {
      setIsSwitching(false);
      return undefined;
    }

    setIsSwitching(true);
    instantTypeStore?.set('instantType', undefined);

    const closeCount = closeCountRef.current;
    const abortController = new AbortController();
    function endMove() {
      if (abortController.signal.aborted) {
        return;
      }
      abortController.abort();
      onAnchorTracking.current = null;
      setIsSwitching(false);
      // A popup that closed during the move must not get trigger-change, even after it reopens.
      if (closeCountRef.current === closeCount && store.select('open')) {
        instantTypeStore?.set('instantType', 'trigger-change');
      }
    }

    onAnchorTracking.current = () => ReactDOM.flushSync(endMove);
    waitForMove(abortController.signal, endMove);

    return () => {
      abortController.abort();
      onAnchorTracking.current = null;
    };
  }, [domReference, store, instantTypeStore, onAnchorTracking, waitForMove]);

  return isSwitching;
}
