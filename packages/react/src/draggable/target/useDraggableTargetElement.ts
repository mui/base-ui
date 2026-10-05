'use client';
import * as React from 'react';
import { Store, useStore } from '@base-ui/utils/store';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useMergedRefs } from '@base-ui/utils/useMergedRefs';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { syncDropTargetPayload } from '../../utils/drag-and-drop/dropTarget';
import { registerTarget } from '../../utils/drag-and-drop/registrations';
import { scheduleDropTargetParameterRefresh } from '../../utils/drag-and-drop/core/lifecycleManager';
import type { RegisterTargetParameters } from '../../utils/drag-and-drop/registrationTypes';
import { useRegistrationRef } from '../../utils/drag-and-drop/useRegistrationRef';
import {
  createDragTargetStateStore,
  dragSourceStore,
  dragTargetStateStride,
  DragTargetState,
} from '../../utils/drag-and-drop/dragSessionStore';
import { matchesAccept, sameAccept } from '../../utils/drag-and-drop/dragKind';

// Stable scalar selector. The per-target store already resolves the live node
// and publishes only when this target's rendered state can change.
function selectTargetState(
  state: number,
  disabled: boolean | undefined,
  accept: RegisterTargetParameters['accept'],
): number {
  const targetState = state % dragTargetStateStride;
  const source = dragSourceStore.state;
  if (source !== null && !disabled && matchesAccept(accept, source)) {
    return targetState + DragTargetState.accepting;
  }
  return targetState;
}

function hasTargetState(state: number, flag: number): boolean {
  // eslint-disable-next-line no-bitwise
  return (state & flag) !== 0;
}

// Never written to, so a target that opted out of tracking never re-renders.
const untrackedTargetStateStore = new Store(0);

/**
 * Registers the element the returned `ref` is attached to as a drop target, and
 * tracks whether a matching source is over it. Backs `Draggable.Target`.
 *
 * The parameters are read through a ref on every dispatch, so a re-render never
 * re-registers and the latest callbacks always apply.
 * @internal
 */
export function useDraggableTargetElement(
  parameters: UseDraggableTargetElementParameters,
): UseDraggableTargetElementReturnValue {
  const { trackDragOver = true, ...registrationParameters } = parameters;
  const getParameters = useStableCallback(() => registrationParameters);
  const targetStateStore = useRefWithInit(createDragTargetStateStore).current;
  const elementRef = React.useRef<HTMLElement | null>(null);
  useIsoLayoutEffect(() => {
    syncDropTargetPayload(
      elementRef.current,
      getParameters,
      parameters.kind?.id,
      parameters.payload,
    );
  });
  const registrationRef = useRegistrationRef<HTMLElement>((element) =>
    registerTarget(element, getParameters),
  );

  // All three are stable, so the merged callback keeps its identity.
  const ref = useMergedRefs(elementRef, targetStateStore.setElement, registrationRef);

  // Re-resolve for a stationary pointer when `disabled`, `accept`, or `canDrop`
  // changes identity. Changes hidden behind a stable callback show up on the next
  // input.
  // Refresh only on a real change. `accept` is compared by content so an inline
  // array doesn't re-resolve every render. A refresh on mount would resolve a
  // same-commit remount halfway through registering and fire a spurious
  // leave/enter pair.
  const { disabled, accept, canDrop } = parameters;
  const previousRef = React.useRef({ disabled, accept, canDrop });
  useIsoLayoutEffect(() => {
    const previous = previousRef.current;
    if (
      previous.disabled === disabled &&
      sameAccept(previous.accept, accept) &&
      previous.canDrop === canDrop
    ) {
      return;
    }
    previousRef.current = { disabled, accept, canDrop };
    // Parameter changes re-resolve from the last event target rather than
    // hit-testing the live DOM again. An inline `canDrop` often changes identity
    // after its own `onMove` updates preview state. Hit-testing the shifted content
    // again can enter another target, update preview state again, and start a
    // synchronous render/refresh loop.
    scheduleDropTargetParameterRefresh(elementRef.current);
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

export type UseDraggableTargetElementParameters = RegisterTargetParameters & {
  trackDragOver?: boolean | undefined;
};

export interface UseDraggableTargetElementReturnValue {
  /** Ref callback to attach to the drop target element. */
  ref: React.RefCallback<HTMLElement> | null;
  /**
   * Whether a matching drag source is over the drop target or a nested
   * descendant.
   */
  dragOver: boolean;
  /**
   * Whether the drop target is the innermost active target.
   * An ancestor target has `dragOver` true but `dragOverInnermost` false while a
   * nested target is active.
   */
  dragOverInnermost: boolean;
  /**
   * Whether this target's `canDrop` returned `'reject'` for the current position.
   * Mutually exclusive with `dragOver`, since a rejecting target keeps the stack
   * empty. Always `false` when `trackDragOver` is `false`.
   */
  rejected: boolean;
  /**
   * Whether the drag in progress is one this target accepts, wherever the pointer
   * is. `false` when no drag is running, when the target is `disabled`, and always
   * when `trackDragOver` is `false`.
   */
  accepting: boolean;
}
