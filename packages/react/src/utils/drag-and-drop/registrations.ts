/**
 * The engine's stateless registration primitives.
 *
 * Deliberately their own module, separate from `DragEngineImpl`: a drop target,
 * a monitor or an auto-scroller needs none of the engine's locale-aware
 * announcements, preview wiring or draggable static setup. Importing them from
 * here keeps `DropTarget.Root`, `DragAutoScroll.Root` and `useDragMonitor` off
 * that whole graph — the preview clone, both sensors, the live announcer and the
 * localization provider — so an app that only accepts drops pays for what it uses.
 *
 * They carry no per-instance state, so they are plain functions rather than
 * methods; the engine simply re-exposes them.
 */

import { warn } from '@base-ui/utils/warn';
import {
  addDropTargetRegistration,
  removeDropTargetRegistration,
  retainRetiringDropTarget,
} from './dropTarget';
import { addScrollerRegistration, retainScrollMonitor } from './autoScroller';
import { monitorRegistry, engageMonitorIfDragging, removeMonitor } from './monitor';
import { isActive, isHoveredDropTarget, refreshDropTargets } from './core/lifecycleManager';
import { dragSessionStore } from './dragSessionStore';
import type {
  RegisterAutoScrollerParameters,
  RegisterMonitorParameters,
  WithInferredAccept,
} from '../../types/dragRegistration';
import type { RegisterDropTargetParameters } from './dropTarget';
import type { AcceptedDragPayload, AnyDragAccept, DragCleanupFn, DragKind } from '../../types/drag';
import { onceCleanup } from './utils';

// Coalesces the mid-drag refresh triggered by drop targets registering and
// unregistering (a virtualizer commit can do either many times in one React
// commit; re-resolving the stack per registration would be O(k) walks for one
// visual change). Only a *hovered* target's unregister stays synchronous: its
// refresh must run while the leaving target's registration is still readable,
// so its `onDragLeave` can dispatch.
let dropTargetRefreshScheduled = false;
function scheduleDropTargetRefresh(): void {
  if (dropTargetRefreshScheduled) {
    return;
  }
  dropTargetRefreshScheduled = true;
  queueMicrotask(() => {
    dropTargetRefreshScheduled = false;
    // No-ops if the drag ended in the meantime.
    refreshDropTargets();
  });
}

export function registerDropTarget<TSourceData = unknown, TLocalData = unknown>(
  element: HTMLElement,
  getParameters: () => RegisterDropTargetParameters<TSourceData, TLocalData>,
): DragCleanupFn {
  if (process.env.NODE_ENV !== 'production') {
    // `kind` is what this target *is*; `accept` is what it takes. Reading the
    // first as the second is the natural misunderstanding, and it fails silently:
    // an omitted `accept` takes every drag, so the target quietly claims drops
    // from unrelated sources and hands their payload to handlers typed for its
    // own. Only warn when `accept` is absent — declaring both is the normal way
    // to give a target an identity.
    // Swallowed, not contained: the getter is consumer-supplied and may throw,
    // and a dev-only check must neither let that escape registration nor report
    // it — the dispatch path already surfaces a throwing getter properly, and
    // logging it here too would double up.
    let parameters: RegisterDropTargetParameters<TSourceData, TLocalData> | null = null;
    try {
      parameters = getParameters();
    } catch {
      parameters = null;
    }
    if (parameters !== null && parameters.accept === undefined) {
      // Two messages, one gap: the types require `accept`, so reaching here means
      // plain JS (or a cast), where the silence would otherwise be total.
      if (parameters.kind) {
        warn(
          'Base UI: a DropTarget declares `kind` but no `accept`, so it takes every drag on the page. ' +
            '`kind` is what this target is; `accept` is which sources it takes. ' +
            'Add `accept` with the kinds this target should receive, or drop `kind` if the target needs no identity of its own. ' +
            'See https://base-ui.com/react/components/drop-target.',
        );
      } else {
        warn(
          'Base UI: a DropTarget declares no `accept`, so it takes every drag on the page ' +
            'and hands foreign payloads to its handlers. ' +
            'Add `accept` with the kinds this target should receive, or ' +
            '`accept={DropTarget.anyKind}` to accept every drag on purpose. ' +
            'See https://base-ui.com/react/components/drop-target.',
        );
      }
    }
  }

  // The getter is read on each dispatch for the freshest callbacks. Ref-counted
  // so two hooks sharing one node (merged refs) don't clobber each other and
  // the first unmount doesn't kill the second's registration.
  addDropTargetRegistration(element, getParameters);

  // A virtualizer can swap the hovered target's node mid-drag: the new node
  // registers here while the lifecycle's stack still points at the old, detached
  // one, so re-resolve to let this fresh target re-enter the stack.
  //
  // Not gated on `firstRegistration`: an element re-registering from inside its own
  // `onDragLeave` keeps its existing entry, yet still needs the refresh to rejoin
  // the stack — a keyboard drag would otherwise not see it again until the next press.
  if (isActive()) {
    scheduleDropTargetRefresh();
  }

  return onceCleanup(() => {
    // A hovered element must re-resolve *synchronously* so reactive subscribers,
    // such as `DropTarget.Root`'s `over` state, observe it leaving the stack. The
    // registry entry is deleted only after the refresh, so the lifecycle can still
    // dispatch this target's leave events as it drops out.
    //
    // A target *not* in the stack owes no leave, and removing it cannot change the
    // resolved stack, so its refresh coalesces into the microtask instead.
    removeDropTargetRegistration(element, getParameters, () => {
      if (!isActive()) {
        return;
      }
      const snapshot = dragSessionStore.getSnapshot();
      // A `null` snapshot with an active drag is the `onGenerateDragPreview`
      // window: the session hasn't published yet, so membership can't be read —
      // refresh synchronously so the initial publish and `onDragStart` don't
      // carry the just-unregistered target.
      //
      // Membership comes from `isHoveredDropTarget` — the lifecycle's own hover
      // bookkeeping, not the published snapshot: a target that entered and
      // unregistered within the same change round is already hovered but not yet
      // published, and the coalesced path would run after its registration is
      // gone, losing the `onDragLeave` it is owed.
      if (snapshot === null || isHoveredDropTarget(element)) {
        // Held readable across the delete below. The synchronous refresh usually
        // dispatches the leave right here, releasing it again immediately — but
        // when this unregister comes from *inside* a consumer fan-out the refresh
        // can only queue, and the entry would be gone by the time it drains.
        retainRetiringDropTarget(element, getParameters);
        refreshDropTargets();
      } else {
        scheduleDropTargetRefresh();
      }
    });
  });
}

// Keyed on the `accept` value it infers, like every other `accept`-taking API.
export function registerAutoScroller<TAccept extends AnyDragAccept = DragKind<unknown>>(
  element: HTMLElement,
  getParameters: () => WithInferredAccept<
    RegisterAutoScrollerParameters<AcceptedDragPayload<TAccept>>,
    TAccept
  >,
): DragCleanupFn {
  // Ref-counted so merged refs on one node don't clobber each other.
  const removeScroller = addScrollerRegistration(element, getParameters);
  // Auto-scroll is an explicit feature boundary: the first registered region
  // arms both inferred scrolling and the advanced configuration loop.
  const releaseScrollMonitor = retainScrollMonitor();

  return onceCleanup(() => {
    removeScroller();
    releaseScrollMonitor();
  });
}

// Keyed on the `accept` value it infers, like every other `accept`-taking API.
export function registerMonitor<TAccept extends AnyDragAccept = DragKind<unknown>>(
  getMonitor: () => WithInferredAccept<
    RegisterMonitorParameters<AcceptedDragPayload<TAccept>>,
    TAccept
  >,
): DragCleanupFn {
  monitorRegistry.add(getMonitor);
  // A monitor registered mid-drag joins the in-progress drag for its remainder.
  engageMonitorIfDragging(getMonitor);

  return onceCleanup(() => {
    removeMonitor(getMonitor);
  });
}
