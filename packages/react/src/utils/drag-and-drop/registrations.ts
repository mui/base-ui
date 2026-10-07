/**
 * The engine's stateless registration functions.
 *
 * They live apart from `createRegisterSource` because drop targets and monitors
 * need none of its preview wiring or draggable static setup. Importing them from
 * here keeps the preview clone and the pointer sensor out of the bundle for
 * `Draggable.Target` and `useMonitor`, so an app that only accepts drops doesn't
 * pay for them. `registerViewport` lives in `autoScroller.ts` for the same reason.
 *
 * They carry no per-instance state, so they are plain functions. The engine
 * re-exposes them as methods.
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
    // `kind` is what this target is, and `accept` is what it takes. Mistaking one
    // for the other fails silently. An omitted `accept` takes every drag, so the
    // target claims drops from unrelated sources and passes their payloads to
    // handlers typed for its own. Warn only when `accept` is missing, because
    // declaring both is the normal way to give a target an identity.
    //
    // A throw from the consumer getter is swallowed here, not reported. This
    // dev-only check must not let it escape registration, and the dispatch path
    // already reports a throwing getter.
    let parameters: ReturnType<typeof getParameters> | null;
    try {
      parameters = getParameters();
    } catch {
      parameters = null;
    }
    // A getter written in plain JS can return `undefined`, and `accept: null`
    // takes every drag like an omitted one.
    if (parameters != null && parameters.accept == null) {
      // The types require `accept`, and `Draggable.Target` always passes one, so
      // this only runs for a `registerTarget()` call from plain JS or a cast,
      // where nothing else would flag the mistake.
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

  // The engine reads the getter on each dispatch, so callbacks stay current.
  // Registrations stack per element, so two hooks sharing one node through merged
  // refs don't overwrite each other, and the first unmount leaves the second registered.
  addDropTargetRegistration(element, getParameters);

  // A virtualizer can replace the hovered target's node mid-drag. The new node
  // registers here while the lifecycle's stack still holds the old, detached one,
  // so re-resolve the stack to let the new node enter it.
  //
  // This runs on every registration, not only the first. An element that
  // re-registers from its own `onDraggableLeave` keeps its existing entry, but
  // still needs the refresh to rejoin the stack before the next pointer update.
  // Does nothing without an active drag.
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
