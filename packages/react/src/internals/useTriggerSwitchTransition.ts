'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useAnimationsFinished } from './useAnimationsFinished';

/**
 * Popover and Menu declare different `instantType` unions, so only the members
 * this hook touches are typed.
 */
interface TriggerSwitchStore {
  /**
   * Read raw, because the `instantType` selector deliberately hides
   * `trigger-change` while closed — which is exactly when it has to be cleared.
   */
  readonly state: { readonly instantType: string | undefined };
  set(key: 'instantType', value: 'trigger-change' | undefined): void;
  select(key: 'open'): boolean;
}

export interface UseTriggerSwitchTransitionParameters {
  store: TriggerSwitchStore;
  /**
   * The trigger element that currently owns the popup.
   */
  domReference: Element | null;
  positionerElement: HTMLElement | null;
  open: boolean;
}

/**
 * Lets the positioner animate while a popup moves between detached triggers.
 *
 * The positioner is normally marked instant, so a hand-off from one trigger to
 * another would teleport. Clearing `instantType` for the duration of the move
 * lets it transition, and `trigger-change` is restored once the move finishes.
 *
 * The restoration is deferred until the move's animations finish, so it can
 * outlive the move that scheduled it. The trigger element is retained through
 * the exit transition, so a close alone does not change `domReference` and
 * nothing would otherwise re-run this effect to abort it — a popup that closes
 * and reopens on the same trigger mid-exit would inherit the stale callback and
 * lose its own transition. Closing therefore cancels the pending restoration
 * explicitly.
 *
 * Applying `trigger-change` to a closed popup is prevented separately, by the
 * stores' `instantType` selector, since a controlled `open={false}` commit
 * reaches the popup without passing through `setOpen`.
 */
export function useTriggerSwitchTransition(parameters: UseTriggerSwitchTransitionParameters): void {
  const { store, domReference, positionerElement, open } = parameters;

  const previousTriggerRef = React.useRef<Element | null>(null);
  const pendingSwitchRef = React.useRef<AbortController | null>(null);
  const runOnceAnimationsFinish = useAnimationsFinished(positionerElement);

  useIsoLayoutEffect(() => {
    if (open) {
      return;
    }

    pendingSwitchRef.current?.abort();
    pendingSwitchRef.current = null;

    // `trigger-change` belongs to the open cycle that scheduled it. The selector
    // stops a closed popup from rendering it, but the value has to be dropped
    // too: a controlled reopen changes only `openProp`, so neither this effect
    // nor `setOpen` would run again to replace it, and the selector would start
    // exposing the old value against the new cycle.
    if (store.state.instantType === 'trigger-change') {
      store.set('instantType', undefined);
    }

    // `trigger-change` belongs to the open cycle that scheduled it. The selector
    // stops a closed popup from rendering it, but the value has to be dropped
    // too: a controlled reopen changes only `openProp`, so neither this effect
    // nor `setOpen` would run again to replace it, and the selector would start
    // exposing the old value against the new cycle.
  }, [open, store]);

  useIsoLayoutEffect(() => {
    const currentTrigger = domReference;
    const previousTrigger = previousTriggerRef.current;

    if (currentTrigger) {
      previousTriggerRef.current = currentTrigger;
    }

    if (!previousTrigger || !currentTrigger || currentTrigger === previousTrigger) {
      return undefined;
    }

    // The trigger element can also change while the popup is closing, when a
    // trigger is replaced by a new element. There is no move to animate, and
    // the cancellation effect above has already run for this commit, so a
    // restoration scheduled here would survive into whatever opens next.
    if (!store.select('open')) {
      return undefined;
    }

    store.set('instantType', undefined);

    const abortController = new AbortController();
    pendingSwitchRef.current = abortController;

    runOnceAnimationsFinish(() => {
      // The abort above covers a committed close, but the animations can finish
      // in the same frame the close commits. Writing `trigger-change` then would
      // leave stale state behind for the next open to inherit.
      if (store.select('open')) {
        store.set('instantType', 'trigger-change');
      }
    }, abortController.signal);

    return () => {
      abortController.abort();
    };
  }, [domReference, runOnceAnimationsFinish, store]);
}
