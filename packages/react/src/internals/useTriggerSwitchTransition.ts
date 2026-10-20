'use client';
import * as React from 'react';
import { NOOP } from '@base-ui/utils/empty';
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
interface TriggerChangeStore extends TriggerSwitchStore {
  /**
   * Read raw, because the `instantType` selector deliberately hides
   * `trigger-change` while closed — which is exactly when it has to be cleared.
   */
  readonly state: { readonly instantType: string | undefined };
  set(key: 'instantType', value: 'trigger-change' | undefined): void;
}

export interface UseTriggerSwitchParameters {
  store: TriggerSwitchStore;
  /**
   * The trigger element that currently owns the popup.
   */
  domReference: Element | null;
  positionerElement: HTMLElement | null;
  open: boolean;
  /**
   * Runs when the popup starts to move to another trigger.
   */
  onSwitchStart?: (() => void) | undefined;
  /**
   * Runs when the move's animations finish while the popup is still open.
   */
  onSwitchEnd?: (() => void) | undefined;
}

export interface UseTriggerSwitchTransitionParameters extends Omit<
  UseTriggerSwitchParameters,
  'store' | 'onSwitchStart' | 'onSwitchEnd'
> {
  store: TriggerChangeStore;
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
export function useTriggerSwitch(parameters: UseTriggerSwitchParameters): boolean {
  const { store, domReference, positionerElement, open } = parameters;

  const onSwitchStart = useStableCallback(parameters.onSwitchStart ?? NOOP);
  const onSwitchEnd = useStableCallback(parameters.onSwitchEnd ?? NOOP);
  const [isSwitching, setIsSwitching] = React.useState(false);
  const previousTriggerRef = React.useRef<Element | null>(null);
  const pendingSwitchRef = React.useRef<AbortController | null>(null);
  const runOnceAnimationsFinish = useAnimationsFinished(positionerElement);

  useIsoLayoutEffect(() => {
    if (open) {
      return;
    }

    pendingSwitchRef.current?.abort();
    pendingSwitchRef.current = null;
    setIsSwitching(false);
  }, [open]);

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

  // Anchor tracking must be instant even before the first trigger switch. Keep
  // this default local to the positioner: setting the shared `instantType` on
  // open would also disable the popup's enter transition.
  return open && !isSwitching;
}

/**
 * Lets the positioner animate while a popup moves between detached triggers.
 *
 * The positioner is normally marked instant, so a hand-off from one trigger to
 * another would teleport. Clearing `instantType` for the duration of the move
 * lets it transition, and `trigger-change` is restored once the move finishes.
 *
 * Applying `trigger-change` to a closed popup is prevented separately, by the
 * stores' `instantType` selector, since a controlled `open={false}` commit
 * reaches the popup without passing through `setOpen`.
 *
 * Returns whether the positioner should disable transitions for anchor tracking.
 */
export function useTriggerSwitchTransition(
  parameters: UseTriggerSwitchTransitionParameters,
): boolean {
  const { store, open } = parameters;

  useIsoLayoutEffect(() => {
    // `trigger-change` belongs to the open cycle that scheduled it. The selector
    // stops a closed popup from rendering it, but the value has to be dropped
    // too: a controlled reopen changes only `openProp`, so neither this effect
    // nor `setOpen` would run again to replace it, and the selector would start
    // exposing the old value against the new cycle.
    if (!open && store.state.instantType === 'trigger-change') {
      store.set('instantType', undefined);
    }
  }, [open, store]);

  return useTriggerSwitch({
    ...parameters,
    onSwitchStart() {
      store.set('instantType', undefined);
    },
    onSwitchEnd() {
      store.set('instantType', 'trigger-change');
    },
  });
}
