'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { NOOP } from '@base-ui/utils/empty';
import { useAnimationFrame } from '@base-ui/utils/useAnimationFrame';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { isFiniteAnimation } from '../utils/getFiniteAnimations';
import * as CommonViewportDataAttributes from '../utils/popups/viewport/CommonViewportDataAttributes';

interface TriggerSwitchStore {
  select(key: 'open'): boolean;
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
  viewportElement: HTMLElement | null;
  open: boolean;
}

/**
 * Tracks whether a popup is moving between detached triggers, so the positioner
 * can animate the move and keep anchor tracking instant otherwise.
 *
 * The move ends when the parts it animates settle: the positioner, the popup size, the arrow,
 * and the viewport content. It continues if the popup closes during the move.
 *
 * Returns whether the positioner should disable transitions for anchor tracking.
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
    viewportElement,
    open,
  } = parameters;

  const [isSwitching, setIsSwitching] = React.useState(false);
  const previousTriggerRef = React.useRef<Element | null>(null);
  const closeCountRef = React.useRef(0);
  const frame = useAnimationFrame();

  const waitForMove = useStableCallback((signal: AbortSignal, endMove: () => void) => {
    if (
      !positionerElement ||
      typeof positionerElement.getAnimations !== 'function' ||
      globalThis.BASE_UI_ANIMATIONS_DISABLED
    ) {
      endMove();
      return;
    }

    const positioner: HTMLElement = positionerElement;
    const viewport = viewportElement;

    function finishMove() {
      ReactDOM.flushSync(endMove);
    }

    function getPartAnimations() {
      return [positioner, popupElement, arrowElementRef.current]
        .flatMap((element) => element?.getAnimations() ?? [])
        .filter(isFiniteAnimation);
    }

    function isViewportTransitioning() {
      return (
        viewport != null &&
        viewport.isConnected &&
        viewport.hasAttribute(CommonViewportDataAttributes.transitioning)
      );
    }

    function waitForParts() {
      if (signal.aborted) {
        return;
      }

      // Reading the animations also updates styles, so a viewport content transition can start.
      const animations = getPartAnimations();

      // Discard fulfilled Animation values so unfinished animations cannot retain their targets.
      Promise.all(animations.map((animation) => animation.finished.then(NOOP))).then(
        () => {
          // A part can start later, such as the popup size after the viewport measures the new
          // content. A closing popup does not wait for its exit.
          if (
            store.select('open') &&
            getPartAnimations().some((animation) => animation.playState !== 'finished')
          ) {
            waitForParts();
            return;
          }
          waitForViewport();
        },
        // A canceled animation can have a replacement, such as when the anchor moves again.
        waitForParts,
      );
    }

    function waitForViewport() {
      if (signal.aborted) {
        return;
      }

      if (!isViewportTransitioning()) {
        finishMove();
        return;
      }

      // Only this popup's viewport counts; a nested popup can render its own inside the content.
      const observer = new MutationObserver(() => {
        if (!isViewportTransitioning()) {
          observer.disconnect();
          finishMove();
        }
      });

      observer.observe(positioner, {
        attributeFilter: [CommonViewportDataAttributes.transitioning],
        childList: true,
        subtree: true,
      });

      signal.addEventListener('abort', () => observer.disconnect(), { once: true });
    }

    frame.request(waitForParts);
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
    const currentTrigger = domReference;
    const previousTrigger = previousTriggerRef.current;
    // A kept-mounted popup clears the reference when it unmounts, so its next open is not a
    // switch from the previous trigger.
    previousTriggerRef.current = currentTrigger;

    // The cleanup canceled any earlier move, so end it unless a new one starts. No move starts
    // when the anchor clears, as for a disabled Tooltip, or changes while the popup closes.
    if (
      !previousTrigger ||
      !currentTrigger ||
      currentTrigger === previousTrigger ||
      !store.select('open')
    ) {
      setIsSwitching(false);
      return undefined;
    }

    setIsSwitching(true);
    instantTypeStore?.set('instantType', undefined);

    const closeCount = closeCountRef.current;
    const abortController = new AbortController();

    waitForMove(abortController.signal, () => {
      setIsSwitching(false);
      // A popup that closed during the move must not get trigger-change, even after it reopens.
      if (closeCountRef.current === closeCount && store.select('open')) {
        instantTypeStore?.set('instantType', 'trigger-change');
      }
    });

    return () => {
      abortController.abort();
      frame.cancel();
    };
  }, [domReference, frame, instantTypeStore, store, waitForMove]);

  return !isSwitching;
}
