'use client';
import * as React from 'react';
import { useStore, type ReadonlyStore } from '@base-ui/utils/store';
import { useValueAsRef } from '@base-ui/utils/useValueAsRef';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { areArraysEqual } from '@base-ui/utils/areArraysEqual';
import { registerDropTarget } from '../../utils/drag-and-drop/registrations';
import { refreshDropTargets } from '../../utils/drag-and-drop/core/lifecycleManager';
import type { RegisterDropTargetParameters } from '../../types/dragRegistration';
import { useRegistrationRef } from '../../utils/drag-and-drop/useRegistrationRef';
import {
  createDragTargetStateStore,
  DragTargetState,
} from '../../utils/drag-and-drop/dragSessionStore';

// Stable scalar selector: the per-target store already resolves the live node
// and publishes only when this target's rendered state can change.
function selectTargetState(state: number): number {
  return state;
}

function hasTargetState(state: number, flag: number): boolean {
  return Math.floor(state / flag) % 2 === 1;
}

const untrackedTargetStateStore: ReadonlyStore<number> = {
  state: 0,
  getSnapshot: () => 0,
  subscribe: () => () => {},
};

// Content comparison, not identity: `accept` is commonly an inline array
// (`accept={[card, file]}`) whose identity changes every render while the kinds
// inside don't.
function sameAccept(
  a: RegisterDropTargetParameters['accept'],
  b: RegisterDropTargetParameters['accept'],
): boolean {
  if (a === b) {
    return true;
  }
  return Array.isArray(a) && Array.isArray(b) && areArraysEqual(a, b);
}

/**
 * Registers the element the returned `ref` is attached to as a drop target, and
 * tracks whether a matching source is over it. Backs `DropTarget.Root`.
 *
 * The parameters are read through a ref on every dispatch, so a re-render never
 * re-registers and the freshest callbacks always apply.
 * @internal
 */
export function useDropTargetElement(
  parameters: UseDropTargetElementParameters,
): UseDropTargetElementReturnValue {
  const { trackOver = true, ...registrationParameters } = parameters;
  const paramsRef = useValueAsRef(registrationParameters as RegisterDropTargetParameters);
  const disabledRef = useValueAsRef(parameters.disabled);
  const acceptRef = useValueAsRef(parameters.accept);
  const targetStateStore = useRefWithInit(() =>
    createDragTargetStateStore(disabledRef, acceptRef),
  ).current;
  const registrationRef = useRegistrationRef<HTMLElement>((element) =>
    // `.next` is the current render's params (see `useRegistrationRef`) — and it
    // matters doubly here, since registering mid-drag makes the engine read this
    // getter synchronously through the drop-target refresh.
    registerDropTarget(element, () => paramsRef.next),
  );

  // Forward the attached node to both the engine registration and the local ref.
  // Stable, so this merged callback is created once.
  const ref = useRefWithInit(() => (node: HTMLElement | null) => {
    targetStateStore.setElement(node);
    registrationRef(node);
  }).current;

  // Parameter changes never re-register, so the engine re-reads them on the next
  // resolution — normally the next pointer move. A `disabled` or `accept` change
  // under a stationary pointer has no next move: the hovered target would keep
  // `data-over` until a drop silently resolved without it, so re-resolve
  // eagerly (a no-op while no drag is active). `canDrop` gets no such refresh —
  // only calling it could reveal a changed verdict, and that means polling.
  // Only on an actual change, compared by content so an inline `accept` array
  // doesn't re-resolve every render: a mount-time refresh would resolve the
  // transient state of a same-commit remount mid-registration and churn a
  // spurious leave/enter pair.
  const { disabled, accept, canDrop } = parameters;
  const previousDisabledRef = React.useRef(disabled);
  const previousAcceptRef = React.useRef(accept);
  const previousCanDropRef = React.useRef(canDrop);
  useIsoLayoutEffect(() => {
    if (
      previousDisabledRef.current === disabled &&
      sameAccept(previousAcceptRef.current, accept) &&
      previousCanDropRef.current === canDrop
    ) {
      return;
    }
    previousDisabledRef.current = disabled;
    previousAcceptRef.current = accept;
    previousCanDropRef.current = canDrop;
    refreshDropTargets();
  }, [disabled, accept, canDrop]);

  const targetState = useStore(
    trackOver ? targetStateStore : untrackedTargetStateStore,
    selectTargetState,
  );

  return {
    ref,
    over: hasTargetState(targetState, DragTargetState.over),
    overInnermost: hasTargetState(targetState, DragTargetState.innermost),
    rejected: hasTargetState(targetState, DragTargetState.rejected),
    accepting: hasTargetState(targetState, DragTargetState.accepting),
  };
}

export type UseDropTargetElementParameters = RegisterDropTargetParameters & {
  trackOver?: boolean | undefined;
};

export interface UseDropTargetElementReturnValue {
  /** Ref callback to attach to the drop target element. */
  ref: React.RefCallback<HTMLElement>;
  /**
   * Whether a matching drag source is currently over the drop target or a nested
   * descendant.
   */
  over: boolean;
  /**
   * Whether the drop target is the innermost active target.
   * A nested ancestor target has `over` true but `overInnermost` false while a
   * descendant target is active.
   */
  overInnermost: boolean;
  /**
   * Whether this target is currently refusing the drag: its `canDrop` returned
   * `'reject'` for the current position. Mutually exclusive with `over`, since a
   * rejecting target keeps the stack empty. Absent tracking when `trackOver` is
   * `false`.
   */
  rejected: boolean;
  /**
   * Whether the drag in progress is one this target accepts, wherever the pointer
   * currently is. `false` when no drag is running, when the target is `disabled`,
   * and always when `trackOver` is `false`.
   */
  accepting: boolean;
}
