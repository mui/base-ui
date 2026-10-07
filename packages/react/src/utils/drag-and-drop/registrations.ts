/**
 * The engine's stateless registration functions. They live apart from
 * `createRegisterSource` so `Draggable.Target` and `useMonitor` don't bundle the
 * preview clone and the pointer sensor. `registerViewport` lives in `autoScroller.ts`
 * for the same reason.
 */

import { warn } from '@base-ui/utils/warn';
import { addDropTargetRegistration, removeDropTargetRegistration } from './dropTarget';
import { addMonitor, removeMonitor } from './monitor';
import { getActiveSession } from './core/dragSession';
import type {
  RegisterMonitorParameters,
  DragParametersWithInferredAccept,
} from './registrationTypes';
import type { DropTargetParameters } from './dropTarget';
import type { DraggableAccept, DraggableKind } from '../../draggable/DraggableProvider';
import type { AcceptedDragData, AcceptedDragPayload, DragCleanupFn } from './types';
import { onceCleanup } from './utils';

export function registerTarget<
  TSourcePayload = unknown,
  TTargetPayload = unknown,
  TDragData = unknown,
  TTargetDragData = unknown,
>(
  element: HTMLElement,
  getParameters: () => DropTargetParameters<
    TSourcePayload,
    TTargetPayload,
    TDragData,
    TTargetDragData
  >,
): DragCleanupFn {
  if (process.env.NODE_ENV !== 'production') {
    // An omitted `accept` silently takes every drag and hands foreign payloads to
    // handlers typed for its own. A throwing getter is swallowed: this dev-only check
    // must not break registration, and the dispatch path already reports it.
    let parameters: ReturnType<typeof getParameters> | null;
    try {
      parameters = getParameters();
    } catch {
      parameters = null;
    }
    // A getter written in plain JS can return `undefined`, and `accept: null`
    // takes every drag like an omitted one.
    if (parameters != null && parameters.accept == null) {
      // Only reachable from plain JS or a cast: the types require `accept`, and
      // `Draggable.Target` always passes one.
      if (parameters.kind) {
        warn(
          'registerTarget() was called with `kind` but no `accept`, so the target takes every drag on the page. ' +
            '`kind` is what this target is; `accept` is which sources it takes. ' +
            'Add `accept` with the kinds this target should receive, or drop `kind` if the target needs no identity of its own. ' +
            'See https://base-ui.com/react/utils/draggable.',
        );
      } else {
        warn(
          'registerTarget() was called without `accept`, so the target takes every drag on the page ' +
            'and hands foreign payloads to its handlers. ' +
            'Add `accept` with the kinds this target should receive, or ' +
            '`accept: Draggable.anyKind` to accept every drag on purpose. ' +
            'See https://base-ui.com/react/utils/draggable.',
        );
      }
    }
  }

  addDropTargetRegistration(element, getParameters);

  // A virtualizer can replace the hovered target's node mid-drag, so re-resolve the
  // stack to let the new node enter it. Runs on every registration: an element that
  // re-registers from its own `onDraggableLeave` keeps its entry but must still
  // rejoin the stack before the next pointer update.
  getActiveSession()?.scheduleTargetRefresh(null, true);

  return onceCleanup(() => {
    // Runs before the registry entry is deleted, so the session can still deliver
    // a leave this target is owed.
    removeDropTargetRegistration(element, getParameters, () => {
      getActiveSession()?.releaseTarget(element, getParameters);
    });
  });
}

// The type argument is the `accept` value, like in every other API that takes `accept`.
export function registerMonitor<
  TAccept extends DraggableAccept<unknown> = DraggableKind<unknown, unknown>,
>(
  getMonitor: () => DragParametersWithInferredAccept<
    RegisterMonitorParameters<AcceptedDragPayload<TAccept>, AcceptedDragData<TAccept>>,
    TAccept
  >,
): DragCleanupFn {
  addMonitor(getMonitor);
  return onceCleanup(() => removeMonitor(getMonitor));
}
