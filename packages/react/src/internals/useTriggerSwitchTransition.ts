'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useAnimationsFinished } from './useAnimationsFinished';

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
  open: boolean;
}

/**
 * Tracks whether a popup is moving between detached triggers, so the positioner
 * can animate the move and keep anchor tracking instant otherwise.
 *
 * The move ends when the animations it starts in the positioner subtree finish, such as
 * the Arrow and Viewport content, even if the popup closes during the move.
 *
 * Returns whether the positioner should disable transitions for anchor tracking.
 */
export function useTriggerSwitchTransition(
  parameters: UseTriggerSwitchTransitionParameters,
): boolean {
  const { store, instantTypeStore, domReference, positionerElement, open } = parameters;

  const [isSwitching, setIsSwitching] = React.useState(false);
  const previousTriggerRef = React.useRef<Element | null>(null);
  const closeCountRef = React.useRef(0);
  const runOnceAnimationsFinish = useAnimationsFinished(positionerElement, false, false, true);

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

    if (!currentTrigger) {
      // Disabling a controlled Tooltip can clear its anchor while the store still reports open.
      setIsSwitching(false);
      return undefined;
    }

    // The trigger element can also change while the popup is closing, when a trigger is
    // replaced by a new element. There is no move to animate then.
    if (!previousTrigger || currentTrigger === previousTrigger || !store.select('open')) {
      return undefined;
    }

    setIsSwitching(true);
    instantTypeStore?.set('instantType', undefined);

    const closeCount = closeCountRef.current;
    const abortController = new AbortController();

    runOnceAnimationsFinish(() => {
      setIsSwitching(false);
      // A popup that closed during the move must not get trigger-change, even after it reopens.
      if (closeCountRef.current === closeCount && store.select('open')) {
        instantTypeStore?.set('instantType', 'trigger-change');
      }
    }, abortController.signal);

    return () => {
      abortController.abort();
    };
  }, [domReference, instantTypeStore, runOnceAnimationsFinish, store]);

  return !isSwitching;
}
