'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useAnimationsFinished } from './useAnimationsFinished';

interface TriggerSwitchStore {
  select(key: 'open'): boolean;
}

/**
 * Popover and Menu declare different `instantType` unions, so only the members
 * this hook touches are typed.
 */
export interface TriggerChangeStore extends TriggerSwitchStore {
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
 * The move ends only after its animations finish, so the pending callback can
 * outlive the move that started it. The trigger element is retained through the
 * exit transition, so a close alone does not change `domReference` and nothing
 * would otherwise re-run this effect to abort it — a popup that closes and
 * reopens on the same trigger mid-exit would inherit the stale callback. Closing
 * therefore cancels the pending callback explicitly.
 *
 * Returns whether the positioner should disable transitions for anchor tracking.
 */
export function useTriggerSwitchTransition(
  parameters: UseTriggerSwitchTransitionParameters,
): boolean {
  const { store, instantTypeStore, domReference, positionerElement, open } = parameters;

  const onSwitchStart = useStableCallback(() => instantTypeStore?.set('instantType', undefined));
  const onSwitchEnd = useStableCallback(() =>
    instantTypeStore?.set('instantType', 'trigger-change'),
  );
  const [isSwitching, setIsSwitching] = React.useState(false);
  const previousTriggerRef = React.useRef<Element | null>(null);
  const pendingSwitchRef = React.useRef<AbortController | null>(null);
  const runOnceAnimationsFinish = useAnimationsFinished(positionerElement);

  useIsoLayoutEffect(() => {
    // The selector masks trigger-change while closed; clear its stored value too so a
    // controlled reopen cannot inherit it and skip the Popup's enter transition.
    if (!open && instantTypeStore?.state.instantType === 'trigger-change') {
      instantTypeStore.set('instantType', undefined);
    }
  }, [open, instantTypeStore]);

  useIsoLayoutEffect(() => {
    if (open && domReference) {
      return;
    }

    // Disabling a controlled Tooltip can clear its anchor while the store still reports open.
    // Cancel the move then too, so re-enabling starts with instant tracking.
    pendingSwitchRef.current?.abort();
    pendingSwitchRef.current = null;
    setIsSwitching(false);
  }, [open, domReference]);

  useIsoLayoutEffect(() => {
    const currentTrigger = domReference;
    const previousTrigger = previousTriggerRef.current;
    // A kept-mounted popup clears the reference when it unmounts, so its next open is not a
    // switch from the previous trigger.
    previousTriggerRef.current = currentTrigger;

    if (!previousTrigger || !currentTrigger || currentTrigger === previousTrigger) {
      return undefined;
    }

    // The trigger element can also change while the popup is closing, when a
    // trigger is replaced by a new element. There is no move to animate, and
    // the cancellation effect above has already run for this commit, so a
    // move started here would survive into whatever opens next.
    if (!store.select('open')) {
      return undefined;
    }

    setIsSwitching(true);
    onSwitchStart();

    const abortController = new AbortController();
    pendingSwitchRef.current = abortController;

    runOnceAnimationsFinish(() => {
      // The abort above covers a committed close, but the animations can finish
      // in the same frame the close commits. Ending the move then would leave
      // stale state behind for the next open to inherit.
      if (store.select('open')) {
        setIsSwitching(false);
        onSwitchEnd();
      }
    }, abortController.signal);

    return () => {
      abortController.abort();
    };
  }, [domReference, onSwitchEnd, onSwitchStart, runOnceAnimationsFinish, store]);

  // Closing ends the move immediately, while anchor tracking continues through the exit.
  return !open || !isSwitching;
}
