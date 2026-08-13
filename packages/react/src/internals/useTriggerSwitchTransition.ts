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
   * The requested open state. A controlled consumer can leave the effective
   * `open` selector (`openProp ?? open`) `true` after a close was requested, so
   * this is the only signal that a close is already on its way.
   */
  readonly state: { readonly open: boolean };
  set(key: 'instantType', value: 'trigger-change' | undefined): void;
  select(key: 'open'): boolean;
}

interface TriggerSwitchFloatingRootContext {
  select(key: 'domReferenceElement'): Element | null;
}

export interface UseTriggerSwitchTransitionParameters {
  store: TriggerSwitchStore;
  floatingRootContext: TriggerSwitchFloatingRootContext;
  /**
   * The trigger element that currently owns the popup.
   */
  domReference: Element | null;
  positionerElement: HTMLElement | null;
}

/**
 * Lets the positioner animate while a popup moves between detached triggers.
 *
 * The positioner is normally marked instant, so a hand-off from one trigger to
 * another would teleport. Clearing `instantType` for the duration of the move
 * lets it transition, and `trigger-change` is restored once the move finishes.
 *
 * That restoration is deferred until the move's animations finish, by which
 * time the popup may already be closing — the trigger element is retained
 * through the exit transition, so nothing else re-runs this effect to abort it.
 * Restoring `trigger-change` then would mark the closing popup instant and skip
 * its exit animation, so it only applies while the popup is still open, no
 * close has been requested in the meantime, and the same trigger still owns it.
 *
 * The requested and effective open states have to be checked separately: a
 * controlled consumer can accept a close but commit `open={false}` later, and
 * that commit goes straight through the prop without passing back through
 * `setOpen`, so nothing downstream would clear a `trigger-change` set here.
 */
export function useTriggerSwitchTransition(parameters: UseTriggerSwitchTransitionParameters): void {
  const { store, floatingRootContext, domReference, positionerElement } = parameters;

  const previousTriggerRef = React.useRef<Element | null>(null);
  const runOnceAnimationsFinish = useAnimationsFinished(positionerElement);

  useIsoLayoutEffect(() => {
    const currentTrigger = domReference;
    const previousTrigger = previousTriggerRef.current;

    if (currentTrigger) {
      previousTriggerRef.current = currentTrigger;
    }

    if (!previousTrigger || !currentTrigger || currentTrigger === previousTrigger) {
      return undefined;
    }

    store.set('instantType', undefined);

    const abortController = new AbortController();
    const triggerOnSwitch = currentTrigger;
    const requestedOpenOnSwitch = store.state.open;

    runOnceAnimationsFinish(() => {
      if (
        store.select('open') &&
        store.state.open === requestedOpenOnSwitch &&
        floatingRootContext.select('domReferenceElement') === triggerOnSwitch
      ) {
        store.set('instantType', 'trigger-change');
      }
    }, abortController.signal);

    return () => {
      abortController.abort();
    };
  }, [domReference, floatingRootContext, runOnceAnimationsFinish, store]);
}
