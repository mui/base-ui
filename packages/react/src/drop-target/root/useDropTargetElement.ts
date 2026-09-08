'use client';
import * as React from 'react';
import { useStore, type ReadonlyStore } from '@base-ui/utils/store';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { areArraysEqual } from '@base-ui/utils/areArraysEqual';
import { registerDropTarget } from '../../utils/drag-and-drop/registrations';
import { scheduleDropTargetParameterRefresh } from '../../utils/drag-and-drop/core/lifecycleManager';
import type { RegisterDropTargetParameters } from '../../types/dragRegistration';
import { useRegistrationRef } from '../../utils/drag-and-drop/useRegistrationRef';
import {
  createDragTargetStateStore,
  dragSourceStore,
  dragTargetStateStride,
  DragTargetState,
} from '../../utils/drag-and-drop/dragSessionStore';
import { matchesAccept } from '../../utils/drag-and-drop/dragKind';

// Stable scalar selector: the per-target store already resolves the live node
// and publishes only when this target's rendered state can change.
function selectTargetState(
  state: number,
  disabled: boolean | undefined,
  accept: RegisterDropTargetParameters['accept'],
): number {
  const targetState = state % dragTargetStateStride;
  const source = dragSourceStore.state;
  if (source !== null && !disabled && matchesAccept(accept, source)) {
    return targetState + DragTargetState.accepting;
  }
  return targetState;
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
  const { trackDragOver = true, ...registrationParameters } = parameters;
  const getParameters = useStableCallback(
    () => registrationParameters as RegisterDropTargetParameters,
  );
  const targetStateStore = useRefWithInit(createDragTargetStateStore).current;
  const registrationRef = useRegistrationRef<HTMLElement>((element) =>
    registerDropTarget(element, getParameters),
  );

  // Forward the attached node to both the engine registration and the local ref.
  // Stable, so this merged callback is created once.
  const ref = useRefWithInit(() => (node: HTMLElement | null) => {
    targetStateStore.setElement(node);
    registrationRef(node);
  }).current;

  // A changed `disabled`, `accept`, or `canDrop` identity is re-resolved for a
  // stationary pointer. Mutations hidden behind a stable callback are observed
  // on the next input.
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
    // Parameter changes re-resolve from the last event target rather than
    // hit-testing the live DOM again. An inline `canDrop` commonly changes
    // identity after its own `onDrag` updates preview state; re-hit-testing the
    // shifted content there can enter another target, update preview state
    // again, and create a synchronous render/refresh loop.
    scheduleDropTargetParameterRefresh();
  }, [disabled, accept, canDrop]);

  const targetState = useStore(
    trackDragOver ? targetStateStore : untrackedTargetStateStore,
    selectTargetState,
    trackDragOver ? parameters.disabled : true,
    parameters.accept,
  );

  return {
    ref,
    dragOver: hasTargetState(targetState, DragTargetState.over),
    dragOverInnermost: hasTargetState(targetState, DragTargetState.innermost),
    rejected: hasTargetState(targetState, DragTargetState.rejected),
    accepting: hasTargetState(targetState, DragTargetState.accepting),
  };
}

export type UseDropTargetElementParameters = RegisterDropTargetParameters & {
  trackDragOver?: boolean | undefined;
};

export interface UseDropTargetElementReturnValue {
  /** Ref callback to attach to the drop target element. */
  ref: React.RefCallback<HTMLElement>;
  /**
   * Whether a matching drag source is currently over the drop target or a nested
   * descendant.
   */
  dragOver: boolean;
  /**
   * Whether the drop target is the innermost active target.
   * A nested ancestor target has `dragOver` true but `dragOverInnermost` false
   * while a descendant target is active.
   */
  dragOverInnermost: boolean;
  /**
   * Whether this target is currently refusing the drag: its `canDrop` returned
   * `'reject'` for the current position. Mutually exclusive with `dragOver`, since
   * a rejecting target keeps the stack empty. Absent tracking when
   * `trackDragOver` is `false`.
   */
  rejected: boolean;
  /**
   * Whether the drag in progress is one this target accepts, wherever the pointer
   * currently is. `false` when no drag is running, when the target is `disabled`,
   * and always when `trackDragOver` is `false`.
   */
  accepting: boolean;
}
