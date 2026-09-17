/**
 * Core drag lifecycle state machine.
 *
 * Drop-target resolution, monitor dispatch, `onMove` delivery, and the session
 * snapshot all live here. Sensors call `start()` and drive the returned
 * controller (`update` / `drop` / `cancel`) from their own listeners. The
 * preview itself is owned by the sensors (see `synthetic/syntheticPreview`).
 */

import { ownerDocument } from '@base-ui/utils/owner';
import { areArraysEqual } from '@base-ui/utils/areArraysEqual';
import type {
  DragCanceledReason,
  DragCleanupFn,
  DragDropReason,
  DragEndReason,
  DragLocation,
  DragLocationHistory,
  DragMoveReason,
  DropTargetRecord,
  DragSource,
  DraggableEventDetailsMap,
  DraggableEventMap,
  DropTargetEventMap,
  DragInput,
  DragPreviewRenderEvent,
} from '../../../types/drag';
import { createDragEventDetails } from '../dragEventDetails';
import {
  captureDropTargetRegistration,
  captureDropTargetCollision,
  clearRetiringDropTargets,
  setSessionGrabOffset,
  dispatchDropTargetChange,
  dispatchToAllDropTargets,
  dispatchToDropTarget,
  getDropTargetShadowRootsByHost,
  getDropTargetsOver,
  refreshHoveredRecords,
} from '../dropTarget';
import { activateMonitors, clearActiveMonitors, dispatchToMonitors } from '../monitor';
import { buildSessionSnapshot, cloneLocationHistory, setDragSession } from '../dragSessionStore';
import { clearPublishedDragPreview } from '../overlay/dragPreviewStore';
import { containConsumerError, elementFromPointIgnoring, getComposedParentElement } from '../utils';
import { getSharedSlot } from '../sharedState';

interface LifecycleState {
  isActive: boolean;
  /** Idempotent full teardown for the active drag (see `tearDown`). */
  dragCleanup: DragCleanupFn | null;
  /**
   * Proper cancel for the active drag (terminal dispatch with `canceled: true`,
   * then teardown). See {@link cancelLifecycleDrag}.
   */
  dragCancel: (() => void) | null;
  /** See {@link refreshDropTargets}. Set during an active drag, cleared on teardown. */
  refreshDropTargets: ((rehitTest: boolean) => void) | null;
  /** Whether a changed element belongs to the current resolution walk. */
  shouldRefreshTargets: ((elements: ReadonlySet<Element>) => boolean) | null;
  queuedParameterTargets: Set<Element> | null;
  /** The session whose parameter refresh owns the queued microtask. */
  queuedParameterRefresh: ((rehitTest: boolean) => void) | null;
  /**
   * Whether an element currently holds delivered hover state. See
   * {@link isHoveredDropTarget}.
   */
  isHovered: ((element: Element) => boolean) | null;
}

const state = getSharedSlot<LifecycleState>('lifecycleManager', () => ({
  isActive: false,
  dragCleanup: null,
  dragCancel: null,
  refreshDropTargets: null,
  queuedParameterRefresh: null,
  shouldRefreshTargets: null,
  queuedParameterTargets: null,
  isHovered: null,
}));

function dropTargetRecordsEqual(a: DropTargetRecord, b: DropTargetRecord): boolean {
  return a.element === b.element;
}

export function canStart(): boolean {
  return !state.isActive;
}

export function isActive(): boolean {
  return state.isActive;
}

/**
 * Re-resolve the active drop-target stack and publish a fresh session snapshot
 * (no-op if no drag is in progress). Called by the `registerDropTarget` cleanup
 * in `registrations.ts` when an element un-registers mid-drag, so subscribers
 * see it leave `dropTargets` without a pointer event.
 */
export function refreshDropTargets(): void {
  state.refreshDropTargets?.(true);
}

/** Coalesce a React commit's drop-target parameter changes into one resolution. */
export function scheduleDropTargetParameterRefresh(element?: Element | null): void {
  const refresh = state.refreshDropTargets;
  if (refresh === null) {
    return;
  }
  if (state.queuedParameterRefresh === refresh) {
    if (element == null) {
      state.queuedParameterTargets = null;
    } else {
      state.queuedParameterTargets?.add(element);
    }
    return;
  }
  state.queuedParameterRefresh = refresh;
  state.queuedParameterTargets = element == null ? null : new Set([element]);
  queueMicrotask(() => {
    // A newer drag can replace this job before it runs. Only the job that still
    // owns the slot may clear it or refresh the current session.
    if (state.queuedParameterRefresh !== refresh) {
      return;
    }
    const targets = state.queuedParameterTargets;
    state.queuedParameterRefresh = null;
    state.queuedParameterTargets = null;
    if (
      state.refreshDropTargets === refresh &&
      (targets === null || state.shouldRefreshTargets?.(targets) !== false)
    ) {
      refresh(false);
    }
  });
}

/**
 * Whether `element` currently holds hover state the engine has actually
 * delivered.
 *
 * Authoritative earlier than the published session snapshot: a target that
 * enters and unregisters within the same change round is already in the
 * lifecycle's bookkeeping but not yet in the snapshot, and reading the snapshot
 * there routes its cleanup down the coalesced path — by which time its
 * registration is gone and its `onDraggableLeave` can no longer be dispatched.
 */
export function isHoveredDropTarget(element: Element): boolean {
  return state.isHovered?.(element) ?? false;
}

/**
 * Cancel the active session at the lifecycle level. Fallback for
 * `engine.cancelDrag()`: the sensors record their session only after `start()` returns,
 * so a `cancelDrag()` from one of the synchronous start dispatches (the initial
 * stack's `canDrop` / `getPayload`, `onGenerateDragPreview`, `onMoveStart`) can
 * reach the session only through this hook. A sensor-owned cancel tears the
 * lifecycle down first, which makes this a no-op.
 */
export function cancelLifecycleDrag(): void {
  state.dragCancel?.();
}

export function start(parameters: StartParameters): DragSessionHandle | null {
  if (state.isActive) {
    return null;
  }
  state.isActive = true;

  const {
    payload: source,
    getSourceHandlers,
    initialInput,
    initialTarget,
    initialEvent,
    grabOffset,
    synthetic,
    onForceCleanup,
  } = parameters;

  // Before the initial stack resolves: records capture the grab offset at
  // creation for `getSnappedLocalPoint({ anchor: 'source' })`.
  setSessionGrabOffset(grabOffset ?? null);

  // The native event the latest sample came from, carried into `eventDetails.event`
  // for the move-derived dispatches. Seeded from the pickup so the events before
  // the first move still report a real one, and advanced by `controller.update`.
  // A drag driven with no event at all (a programmatic session, a test harness)
  // keeps the placeholder `createDragEventDetails` falls back to.
  let lastInputEvent: Event | undefined = initialEvent;
  let lastInputReason: DragMoveReason = 'pointer';

  // The target refusing the drag at the current position (`canDrop` returned
  // `'reject'`), and the value the last published snapshot carried. A rejection
  // flip usually leaves the stack element-equal (empty before, empty after), so
  // it needs its own publish trigger.
  let rejectedTarget: Element | null = null;
  let publishedRejectedTarget: Element | null = null;

  const onReject = (element: Element) => {
    rejectedTarget = element;
  };

  function resolveStack(target: Element | null, input: DragInput): DropTargetRecord[] {
    rejectedTarget = null;
    return getDropTargetsOver(target, { input, source }, onReject);
  }

  // Seeded with an empty stack: the stack under the pickup point resolves below,
  // once `state.dragCancel` is armed and the monitors are active, so a resolver
  // (`canDrop` / `getPayload`) that cancels at pickup ends the drag the same way
  // it does mid-drag rather than being ignored.
  const initialLocation: DragLocation = {
    input: initialInput,
    dropTargets: [],
  };

  const location: DragLocationHistory = {
    grabOffset: grabOffset ? { ...grabOffset } : undefined,
    initial: initialLocation,
    current: initialLocation,
    // No prior event yet, so `previous.input` seeds from the pickup point: a
    // consumer diffing `current` against `previous` reads a zero delta on the
    // first event rather than a jump from nowhere. The stack starts empty
    // because nothing has been entered yet.
    previous: { input: initialLocation.input, dropTargets: [] },
  };

  /**
   * The immutable view of `location` handed to consumers.
   *
   * `location` is the engine's own mutable bookkeeping: `current` is reassigned
   * on every sample and `previous` advances per delivered event. Handing that
   * object out would break the documented snapshot contract twice over — an
   * event stashed for later would report the *drag's* latest position rather than
   * its own, and a handler could `splice()` the shared `dropTargets` array out
   * from under the fan-out still iterating it. One snapshot is built per dispatch
   * round, so every recipient of the same event sees the same frozen state.
   */
  function snapshotLocation(): DragLocationHistory {
    return cloneLocationHistory(location);
  }

  /**
   * The payload for the terminal `onDraggableLeave` the still-hovered targets are owed
   * at the end of a drag: a forked location that already shows them out of
   * `current.dropTargets`, without mutating the location the end handlers saw
   * (and may have stashed) with the drop stack.
   */
  function createTerminalLeavePayload(input: DragInput): DraggableEventMap['onTargetChange'] {
    const leaveLocation = snapshotLocation();
    return {
      location: {
        grabOffset: leaveLocation.grabOffset,
        initial: leaveLocation.initial,
        previous: leaveLocation.current,
        current: { input, dropTargets: [] },
      },
      source,
    };
  }

  // The location snapshot at the last delivered event. Sensors can coalesce
  // several native samples before calling `update`, so `previous` advances at
  // dispatch rather than at raw input frequency.
  let lastDispatched: DragLocation = location.previous;

  // Last DOM target resolved against. Tracked for `refreshDropTargets()` so a
  // mid-drag drop-target unregister can re-walk the DOM from the same starting
  // point.
  let lastTarget: Element | null = initialTarget;

  // Set by `tearDown`. Consumer callbacks can re-enter and tear the session down
  // mid-dispatch; the dispatch paths check this before publishing/scheduling,
  // and the drop-target fan-outs re-check it between deliveries via `isLive`.
  let tornDown = false;
  const isLive = () => !tornDown;

  // Guards the consumer fan-outs: a handler can synchronously unregister a
  // *hovered* drop target, whose cleanup re-resolves the stack synchronously
  // (see `registrations.ts`). Re-entering `updateDropTargets` mid-round would
  // corrupt the round's bookkeeping — on completion the outer round's stale
  // stack overwrites `hoveredDropTargets` and `lastDispatched`, resurrecting
  // the unregistered target — so the refresh queues here and runs when the
  // round finishes (see `drainPendingRefresh`).
  let dispatching = false;
  let refreshPending = false;
  let pendingRefreshNeedsHitTest = false;

  // Whether the terminal `onMoveEnd` has been delivered. The recovery path below
  // reads it so a throw *from* `onMoveEnd` doesn't produce a second one.
  let endDispatched = false;

  // Whether `onMoveStart` has gone out. A refresh requested before that — a
  // consumer unregistering a target from `onGenerateDragPreview` — would resolve
  // and dispatch `onTargetChange`/`onMove` to targets that have not had
  // `onMoveStart` yet, so it queues like a mid-round one.
  let startDispatched = false;

  // The targets whose hover state has actually been delivered. Mutated by
  // `dispatchDropTargetChange` as enters/leaves are dispatched, so when a
  // re-entrant cancel interrupts a change dispatch halfway, the terminal leave
  // in `doDrop`/`doCancel` reaches exactly the targets that still believe they
  // are hovered — not the already-reassigned `location.current` stack.
  //
  // Starts empty even once the initial stack is resolved: the stack
  // under the pickup point is entered one record at a time in `dispatchDragStart`,
  // each pushed here immediately before its own `onDraggableEnter`, exactly as
  // `dispatchDropTargetChange` does mid-drag. Seeding it up front would owe a
  // terminal leave to targets whose enter never ran, which is what a re-entrant
  // cancel from an inner target's enter produces.
  const hoveredDropTargets: DropTargetRecord[] = [];

  /**
   * Best-effort terminal dispatch before an error tears the session down.
   *
   * `tearDown()` alone restores the *engine*, but says nothing to consumers: an
   * app that pairs `onMoveStart` with `onMoveEnd` — a page-level dragging class,
   * a drop indicator, an optimistic reorder — would be stranded in its dragging
   * state by any handler that throws. Deliver one contained `onMoveEnd` first, so
   * that pairing always closes. Contained because a handler that throws again
   * here must not replace the original error being rethrown.
   */
  function dispatchRecoveryEnd(): void {
    if (endDispatched || tornDown) {
      return;
    }
    const endDetails = createDragEventDetails<DragEndReason>('handler-error');
    // Targets that observed an enter still need the matching terminal leave.
    // Dispatch only the target side here: the source callback that brought us
    // into recovery may be the one that throws, and must not prevent the leaves.
    const departedDropTargets = hoveredDropTargets.slice();
    if (departedDropTargets.length > 0) {
      const leavePayload = createTerminalLeavePayload(location.current.input);
      containConsumerError(
        'Base UI: a drag handler threw while another handler error was being recovered. ' +
          'The remaining target cleanup is best-effort.',
        null,
        () =>
          dispatchDropTargetChange(
            departedDropTargets,
            [],
            leavePayload,
            endDetails,
            isLive,
            hoveredDropTargets,
          ),
        undefined,
      );
    }
    const recoveryInput = location.current.input;
    location.previous = lastDispatched;
    location.current = { input: recoveryInput, dropTargets: [] };
    endDispatched = true;
    const endPayload: DraggableEventMap['onMoveEnd'] = {
      location: snapshotLocation(),
      source,
      canceled: true,
      dropTarget: null,
    };
    containConsumerError(
      'Base UI: a drag handler threw, so the drag was torn down. ' +
        'The terminal onMoveEnd is best-effort.',
      null,
      () => {
        getSourceHandlers?.()?.onMoveEnd?.(endPayload, endDetails);
        dispatchToMonitors('onMoveEnd', endPayload, endDetails);
      },
      undefined,
    );
  }

  function publishSession(): void {
    publishedRejectedTarget = rejectedTarget;
    setDragSession(buildSessionSnapshot({ source, location, rejectedTarget }));
  }

  /**
   * The first error thrown by a consumer handler inside the terminal sequence,
   * rethrown once that sequence has finished (see {@link captureTerminalError}).
   */
  let terminalError: { error: unknown } | null = null;

  /**
   * Run one terminal handler, holding any throw until the rest of the
   * end sequence has run.
   *
   * The source and drop target callbacks run before monitors and terminal leaves.
   * An uncontained throw there would skip the remaining notifications, and
   * `dispatchRecoveryEnd` cannot make them up once `endDispatched` is latched.
   * Capture the throw, complete the sequence, and rethrow it after teardown.
   */
  function captureTerminalError(run: () => void): void {
    try {
      run();
    } catch (error) {
      terminalError ??= { error };
    }
  }

  /** Take the swallowed consumer error, clearing it so it can only surface once. */
  function popTerminalError(): unknown {
    const held = terminalError;
    terminalError = null;
    return held?.error;
  }

  /** Rethrow whatever a terminal handler swallowed above, after teardown. */
  function rethrowTerminalError(): void {
    if (terminalError !== null) {
      throw popTerminalError();
    }
  }

  // Keeps `onMoveStart` ahead of any onDraggableDrop/onDraggableEnter: a collection that hasn't
  // seen onMoveStart has an empty dragged-item set and would swallow the drop.
  function dispatchDragStart(): void {
    const dragStartPayload: DraggableEventMap['onMoveStart'] = {
      location: snapshotLocation(),
      source,
    };
    const startDetails = createDragEventDetails('pointer', lastInputEvent);
    dispatching = true;
    try {
      getSourceHandlers?.()?.onMoveStart?.(dragStartPayload, startDetails);
      // A source `onMoveStart` can synchronously cancel the drag (public
      // `cancelDrag()`); the cancel already delivered the terminal events, so
      // the targets/monitors must not see a start for a drag that just ended.
      if (tornDown) {
        return;
      }
      dispatchToAllDropTargets(
        location.current.dropTargets,
        'onDraggableStart',
        dragStartPayload,
        startDetails,
        isLive,
      );
      dispatchToMonitors('onMoveStart', dragStartPayload, startDetails);
      // The stack under the pickup point is published in `dropTargetElements` and
      // owed a terminal `onDraggableLeave` by `doDrop`/`doCancel`, so it has to be told
      // it was entered too. The only other emitter of `onDraggableEnter` is
      // `dispatchDropTargetChange`, which never runs for this first stack: there
      // is no previous stack to diff it against. Last in the round, so
      // `onMoveStart` stays ahead of every enter.
      //
      // Each record joins `hoveredDropTargets` immediately before its own enter,
      // never as a batch: a handler here can cancel the drag re-entrantly, and
      // the outer targets that never got their enter must not then be owed a
      // leave. Same ordering `dispatchDropTargetChange` uses mid-drag.
      for (const record of location.current.dropTargets) {
        if (!isLive()) {
          break;
        }
        hoveredDropTargets.push(record);
        dispatchToDropTarget(record, 'onDraggableEnter', dragStartPayload, startDetails);
      }
    } catch (error) {
      dispatchRecoveryEnd();
      reset();
      throw error;
    } finally {
      dispatching = false;
    }
    if (tornDown) {
      return;
    }
    lastDispatched = location.current;
    startDispatched = true;
    drainPendingRefresh();
  }

  function dispatchDrag(): void {
    // See `lastDispatched`: `previous` reflects the last delivered event.
    location.previous = lastDispatched;
    const dragPayload: DraggableEventMap['onMove'] = { location: snapshotLocation(), source };
    const dragDetails = createDragEventDetails(lastInputReason, lastInputEvent);
    dispatching = true;
    // recover on throw (see dispatchDragStart)
    try {
      captureDropTargetCollision(
        dragPayload.location.current.dropTargets[0],
        dragPayload.location.current.input,
        source,
      );
      getSourceHandlers?.()?.onMove?.(dragPayload, dragDetails);
      // A source `onMove` can synchronously cancel; deliver nothing further.
      if (tornDown) {
        return;
      }
      dispatchToAllDropTargets(
        dragPayload.location.current.dropTargets,
        'onDraggableMove',
        dragPayload,
        dragDetails,
        isLive,
      );
      dispatchToMonitors('onMove', dragPayload, dragDetails);
    } catch (error) {
      dispatchRecoveryEnd();
      reset();
      throw error;
    } finally {
      dispatching = false;
    }
    lastDispatched = location.current;
    drainPendingRefresh();
  }

  // Re-resolve the stack after a registration or parameter change (see the
  // `state.refreshDropTargets` installation below for when this is armed).
  //
  // Two modes. A registration change (`rehitTest`) re-hit-tests from the pointer
  // position rather than walking up from `lastTarget`: a target that mounts
  // *over* a stationary pointer (a panel fading in mid-drag) is not an ancestor
  // of the old target. A parameter change re-walks from `lastTarget` — nothing
  // moved, the DOM is the same, and the hit-test costs a hidden preview and a
  // layout read — unless that target has since been detached (virtualizer/live
  // reorder), where the walk would resolve an empty stack and spuriously leave
  // every hovered target; then it hit-tests too. The preview is skipped so it
  // can't be hit and empty the stack either.
  //
  // `dragDispatchFollows` is passed through to `updateDropTargets`; see there.
  function resolveDropTargetsFromLastTarget(
    rehitTest: boolean,
    dragDispatchFollows: boolean,
  ): void {
    let target = lastTarget;
    if (rehitTest || (target !== null && !target.isConnected)) {
      const { clientX, clientY } = location.current.input;
      const fresh = elementFromPointIgnoring(
        ownerDocument(source.element),
        clientX,
        clientY,
        synthetic.getPreviewElement(),
        getDropTargetShadowRootsByHost(),
      );
      // A `null` hit with a still-connected last target means the pointer is
      // outside the viewport (captured pointer drag); keep the last target so the
      // stack doesn't spuriously empty.
      if (fresh !== null || target == null || !target.isConnected) {
        target = fresh;
      }
    }
    updateDropTargets(location.current.input, target, undefined, undefined, dragDispatchFollows);
  }

  /**
   * Run the refresh a consumer fan-out queued (see `dispatching`). The drain
   * inherits the round's `dragDispatchFollows`: inside the sensor `update` path
   * the caller's `dispatchDrag()` still follows, so the drained round must skip
   * its entry `onMove` too, or every target in the re-resolved stack would get
   * `onMove` twice in one frame.
   */
  function drainPendingRefresh(dragDispatchFollows = false): void {
    while (refreshPending && !tornDown) {
      refreshPending = false;
      const rehitTest = pendingRefreshNeedsHitTest;
      pendingRefreshNeedsHitTest = false;
      resolveDropTargetsFromLastTarget(rehitTest, dragDispatchFollows);
    }
  }

  /**
   * One drop-target-change fan-out round: the source handler, then per-target
   * enter/leave, then the monitors. Any of those consumer callbacks can
   * synchronously cancel the drag (public `cancelDrag()`), and the cancel
   * already delivered the terminal events — so teardown is re-checked between
   * deliveries and the round reports whether the session is still live; callers
   * must dispatch nothing further for a dead session.
   */
  function dispatchChangeRound(
    previousTargets: readonly DropTargetRecord[],
    currentTargets: readonly DropTargetRecord[],
    changePayload: DraggableEventMap['onTargetChange'],
    changeDetails: DraggableEventDetailsMap['onTargetChange'],
  ): boolean {
    captureDropTargetCollision(currentTargets[0], changePayload.location.current.input, source);
    getSourceHandlers?.()?.onTargetChange?.(changePayload, changeDetails);
    if (tornDown) {
      return false;
    }
    dispatchDropTargetChange(
      previousTargets,
      currentTargets,
      changePayload,
      changeDetails,
      isLive,
      hoveredDropTargets,
    );
    if (tornDown) {
      return false;
    }
    dispatchToMonitors('onTargetChange', changePayload, changeDetails);
    return !tornDown;
  }

  /**
   * `dragDispatchFollows` tells this round that the caller runs `dispatchDrag()`
   * right after it (the sensor `update` path), which already delivers `onMove` to
   * every target in the new stack; the refresh paths have no such follow-up and
   * get the entry sync below instead.
   */
  function updateDropTargets(
    input: DragInput,
    rawTarget: Element | null,
    event?: Event,
    reason?: DragMoveReason,
    dragDispatchFollows = false,
  ): void {
    lastTarget = rawTarget;
    // Advanced before any dispatch below reads it, so this round's details carry
    // the sample they describe. A refresh with no event of its own (a mid-drag
    // unregister) keeps the last real one rather than regressing to a placeholder.
    if (event !== undefined) {
      lastInputEvent = event;
    }
    if (reason !== undefined) {
      lastInputReason = reason;
    }

    const newDropTargets = resolveStack(rawTarget, input);
    // A consumer resolver (`getPayload` / `canDrop`) can synchronously cancel the
    // drag. Teardown already delivered the terminal events and cleared the
    // session, so do not mutate or publish location state for the dead drag.
    if (tornDown) {
      return;
    }
    const previousDropTargets = location.current.dropTargets;

    location.current = { input, dropTargets: newDropTargets };

    const targetsChanged = !areArraysEqual(
      previousDropTargets,
      newDropTargets,
      dropTargetRecordsEqual,
    );

    if (targetsChanged) {
      // See `lastDispatched`: `previous` moves only when an event is delivered,
      // not on every raw sample this function absorbs.
      location.previous = lastDispatched;
      const changePayload: DraggableEventMap['onTargetChange'] = {
        location: snapshotLocation(),
        source,
      };
      const moveDetails = createDragEventDetails(lastInputReason, lastInputEvent);
      dispatching = true;
      // recover on throw (see dispatchDragStart)
      try {
        if (!dispatchChangeRound(previousDropTargets, newDropTargets, changePayload, moveDetails)) {
          return;
        }

        // Sync onMove to current targets on entry so target-side hover logic
        // lives in `onMove` without an extra source dispatch. Skipped when the
        // caller's `dispatchDrag()` is about to deliver the same `onMove` to the
        // same targets in this frame: consumer handlers (and any rect they read)
        // would otherwise run twice on every entry frame.
        if (!dragDispatchFollows && newDropTargets.length > 0) {
          const dragPayload: DraggableEventMap['onMove'] = {
            location: snapshotLocation(),
            source,
          };
          dispatchToAllDropTargets(
            newDropTargets,
            'onDraggableMove',
            dragPayload,
            moveDetails,
            isLive,
          );
        }
      } catch (error) {
        dispatchRecoveryEnd();
        reset();
        throw error;
      } finally {
        dispatching = false;
      }

      // Publish only on actual stack change, else selectors re-fire every frame.
      // A re-entrant `cancelDrag()` from one of the dispatches above can tear the
      // session down mid-flight; publishing here would re-populate the store after
      // teardown nulled it, so skip it once torn down.
      if (!tornDown) {
        lastDispatched = location.current;
        publishSession();
      }
      drainPendingRefresh(dragDispatchFollows);
    } else {
      // Element-equal stack, freshly resolved records: no change dispatch runs,
      // so swap the hovered bookkeeping's records here — the terminal leave on
      // drop/cancel reads them, and must report the last-resolved `target.payload`
      // like the intermediate `onMove`s did.
      refreshHoveredRecords(hoveredDropTargets, newDropTargets);
      // A rejection flip with an element-equal stack (empty -> empty) publishes
      // on its own, or `data-rejected` could never appear or clear.
      if (rejectedTarget !== publishedRejectedTarget) {
        publishSession();
      }
    }
  }

  // The single full-engine teardown, run from `doDrop`/`doCancel` and `reset()`.
  // Idempotent: every step guards itself so a second call is a no-op.
  function tearDown(): void {
    if (tornDown) {
      return;
    }
    tornDown = true;
    // Release the shared state before running cleanup callbacks.
    state.isActive = false;
    state.dragCleanup = null;
    state.dragCancel = null;
    state.refreshDropTargets = null;
    state.shouldRefreshTargets = null;
    state.isHovered = null;

    try {
      // Notify the sensor, which owns the preview; no-ops if already torn down.
      containConsumerError(
        'Base UI: the sensor cleanup threw during teardown.',
        null,
        () => onForceCleanup?.(),
        undefined,
      );

      // Clear the published React preview content here rather than relying only on
      // the overlay renderer's clear-on-null effect: if the provider unmounted
      // mid-drag that effect never runs, and the content (plus its detached host)
      // would stay retained until the next pickup.
      clearPublishedDragPreview();
    } finally {
      clearActiveMonitors();
      // Whatever a hovered-then-unregistered target left behind: its leave either
      // went out (releasing the hold) or the drag is over and never will.
      clearRetiringDropTargets();
      setSessionGrabOffset(null);
      setDragSession(null);
    }
  }

  function doDrop(input: DragInput, rawTarget: Element | null, event?: Event): DropOutcome {
    // A stale sensor/controller call can arrive after re-entrant consumer code
    // has already ended the drag. Committing on top of that rollback would
    // deliver a second terminal event for one drag.
    if (tornDown) {
      return { canceled: true, dropTarget: null };
    }
    // The end sequence owns the stack from here: a sync refresh requested by a
    // handler below queues behind `dispatching` and is deliberately never
    // drained — the terminal leaves settle the hover state themselves, and the
    // session-local flag dies with the teardown.
    dispatching = true;

    const freshDropTargets = getDropTargetsOver(rawTarget, { input, source });
    // Final resolution runs consumer getters too. A re-entrant cancellation
    // owns the outcome and has already torn the session down.
    if (tornDown) {
      return { canceled: true, dropTarget: null };
    }
    // Snapshot the drop recipient now, before any end dispatch can mutate the
    // stack. `onMoveEnd` running earlier could re-resolve `location.current` (via
    // an unregister-triggered refresh), and re-reading `[0]` there could hand the
    // drop to a different target than the one this end was resolved against.
    // `null` here — released over no target — is the `outside-release` outcome
    // (`canceled: false`, `dropTarget: null`).
    const innermostDropTarget = freshDropTargets[0] ?? null;
    captureDropTargetCollision(innermostDropTarget, input, source);
    // Captured with the snapshot: the source's `onMoveEnd` (which is told the
    // drop landed first) may synchronously unregister the target while tearing
    // down its zones — the drop it was just told about must still reach the
    // target's `onDraggableDrop` below rather than silently no-op on a re-read.
    const innermostRegistration = innermostDropTarget
      ? captureDropTargetRegistration(innermostDropTarget)
      : undefined;
    // Two outcomes share this path: a committed drop, and a release over nothing.
    // Both are `canceled: false`, which is exactly why the reason exists — and why
    // `onDraggableDrop` fires for the first one only.
    const endDetails = createDragEventDetails<DragEndReason>(
      innermostDropTarget ? 'drop' : 'outside-release',
      event,
    );
    const dropDetails = createDragEventDetails<DragDropReason>('drop', event);
    const previousDropTargets = location.current.dropTargets;

    location.previous = lastDispatched;
    location.current = { input, dropTargets: freshDropTargets };

    // The final pointer position can resolve a different stack than the last
    // sensor update (the sensor calls `drop` directly). Reconcile
    // enter/leave against the fresh stack before the drop so a newly
    // entered/left target gets onDraggableEnter/onDraggableLeave, not a stale-hover onDraggableDrop.
    // recover on throw (see dispatchDragStart)
    try {
      if (!areArraysEqual(previousDropTargets, freshDropTargets, dropTargetRecordsEqual)) {
        const changePayload: DraggableEventMap['onTargetChange'] = {
          location: snapshotLocation(),
          source,
        };
        // A dead round means a consumer canceled re-entrantly; the cancel path
        // already ran `onMoveEnd`/teardown, so skip the drop.
        if (
          !dispatchChangeRound(previousDropTargets, freshDropTargets, changePayload, endDetails)
        ) {
          return { canceled: true, dropTarget: null };
        }
      } else {
        // See the matching branch in `updateDropTargets`: the terminal leave
        // below must report the freshly resolved records, not entry-time ones.
        refreshHoveredRecords(hoveredDropTargets, freshDropTargets);
      }

      // Disarm `refreshDropTargets` for the end dispatch: an `onMoveEnd` that
      // unregisters a target would otherwise re-enter `updateDropTargets` and
      // shift `location.current` out from under the onDraggableDrop/leave dispatch below.
      // It stays disarmed: `tearDown()` clears the slot after the terminal
      // dispatch, and nothing may refresh the committed target stack meanwhile.
      state.refreshDropTargets = null;
      state.shouldRefreshTargets = null;

      // The end sequence is committed: a `cancelDrag()` from one of the end
      // dispatches below must be a no-op, not a recursive second end.
      state.dragCancel = null;

      const endPayload: DraggableEventMap['onMoveEnd'] = {
        location: snapshotLocation(),
        source,
        canceled: false,
        dropTarget: innermostDropTarget,
      };
      // Deliver the source end once, even if its commit handler throws.
      endDispatched = true;
      if (!tornDown) {
        captureTerminalError(() => getSourceHandlers?.()?.onMoveEnd?.(endPayload, endDetails));
      }
      // A consumer `onMoveEnd` can synchronously tear the session down; teardown
      // then already notified the targets/monitors, so don't double-dispatch.
      if (!tornDown) {
        // A drop target's `onDraggableDrop` only fires on a real drop, and only on the
        // innermost target so ancestors don't double-handle the deepest target's
        // drop. Monitors see the end of every drag via `onMoveEnd`. Uses the
        // pre-dispatch snapshot so a re-entrant refresh can't redirect the drop.
        if (innermostDropTarget) {
          const dropPayload: DropTargetEventMap['onDraggableDrop'] = {
            location: snapshotLocation(),
            source,
            dropTarget: innermostDropTarget,
          };
          captureTerminalError(() =>
            dispatchToDropTarget(
              innermostDropTarget,
              'onDraggableDrop',
              dropPayload,
              dropDetails,
              innermostRegistration,
            ),
          );
        }
        dispatchToMonitors('onMoveEnd', endPayload, endDetails);

        // Fire final `onDraggableLeave` for any targets still hovered so imperative
        // hover state clears (the success path never emits a change to empty).
        // Same forked shape as the cancel path (see `createTerminalLeavePayload`).
        const departedDropTargets = hoveredDropTargets.slice();
        if (departedDropTargets.length > 0) {
          const leavePayload = createTerminalLeavePayload(input);
          dispatchDropTargetChange(
            departedDropTargets,
            [],
            leavePayload,
            endDetails,
            isLive,
            hoveredDropTargets,
          );
        }
      }
    } catch (error) {
      dispatchRecoveryEnd();
      reset();
      // The first terminal handler error wins. Anything raised afterwards is
      // downstream of it.
      throw terminalError ? popTerminalError() : error;
    }

    tearDown();
    // The engine is fully restored and every other consumer has had its terminal
    // event; only now does a throwing terminal handler surface.
    rethrowTerminalError();
    return { canceled: false, dropTarget: innermostDropTarget };
  }

  function doCancel(
    input?: DragInput,
    reason: DragCanceledReason = 'imperative-action',
    event?: Event,
  ): void {
    // See `doDrop`: the announcement between the sensor's `clearActive()` and
    // this call can already have ended the drag.
    if (tornDown) {
      return;
    }
    const endDetails = createDragEventDetails<DragEndReason>(reason, event);
    // Already ending: a `cancelDrag()` from one of the dispatches below must be
    // a no-op, not a recursive second cancel.
    state.dragCancel = null;
    // Disarm `refreshDropTargets` for the end dispatch, mirroring `doDrop`: a
    // handler below that unregisters a target would otherwise re-enter
    // `updateDropTargets` against the already-emptied stack, re-resolve the
    // targets still under the pointer, and dispatch `onDraggableEnter` to them
    // mid-cancel with no balancing leave. `tearDown()` nulls it anyway.
    state.refreshDropTargets = null;
    state.shouldRefreshTargets = null;
    const cancelInput = input ?? location.current.input;
    // Terminal-leave recipients are the targets whose hover state was actually
    // delivered. They differ from `location.current.dropTargets` when this
    // cancel re-enters from a handler running inside a change dispatch: the
    // stack was already reassigned there, but the entering targets were never
    // notified — they must not receive a leave for an enter they never saw.
    const departedDropTargets = hoveredDropTargets.slice();
    location.previous = lastDispatched;
    location.current = { input: cancelInput, dropTargets: [] };

    // recover on throw (see dispatchDragStart)
    try {
      if (departedDropTargets.length > 0) {
        const changePayload: DraggableEventMap['onTargetChange'] = {
          location: snapshotLocation(),
          source,
        };
        // A dead round means a consumer tore the session down re-entrantly and
        // the terminal `onMoveEnd` already fired; don't dispatch again.
        if (!dispatchChangeRound(departedDropTargets, [], changePayload, endDetails)) {
          return;
        }
      }

      // `canceled: true` (with a `null` `dropTarget` and the empty `dropTargets`
      // stack) lets source/monitor `onMoveEnd` handlers distinguish a cancel
      // from a real drop.
      const endPayload: DraggableEventMap['onMoveEnd'] = {
        location: snapshotLocation(),
        source,
        canceled: true,
        dropTarget: null,
      };
      endDispatched = true;
      captureTerminalError(() => getSourceHandlers?.()?.onMoveEnd?.(endPayload, endDetails));
      if (!tornDown) {
        dispatchToMonitors('onMoveEnd', endPayload, endDetails);
      }
    } catch (error) {
      dispatchRecoveryEnd();
      reset();
      // A source terminal handler that already threw wins: it is the consumer's
      // own error and the first one, and `captureTerminalError` promised to
      // surface it. Anything raised afterwards is downstream of it.
      throw terminalError ? popTerminalError() : error;
    }

    tearDown();
    // See `doDrop`: a source `onMoveEnd` that threw is rethrown only once the
    // monitors have been told and the engine is back to a startable state.
    rethrowTerminalError();
  }

  const controller: DragSessionController = {
    update(input, target, event, reason = 'pointer') {
      updateDropTargets(input, target, event, reason, true);
      // Sensors coalesce input before `update`, so deliver in that sensor frame.
      // `updateDropTargets` can re-enter `cancelDrag()` via a consumer callback.
      if (!tornDown) {
        dispatchDrag();
      }
    },
    drop: doDrop,
    cancel: doCancel,
  };

  state.dragCleanup = tearDown;
  // Armed before the start-time dispatches below, the initial stack resolution
  // included: the sensors record their session only after `start()` returns, so
  // a `cancelDrag()` from a resolver, `onGenerateDragPreview` or `onMoveStart`
  // can reach the session only through this hook (see `cancelLifecycleDrag`).
  state.dragCancel = doCancel;

  // User callbacks may throw. `activateMonitors` runs the monitor registration
  // getters, and the source's `onGenerateDragPreview` hook runs the consumer's
  // preview `render`. If any throw, the engine state is half-built
  // (`isActive=true`, monitors registered) and a future `canStart()` would
  // return `false` forever. Keep every consumer-reachable step inside one try
  // and tear down before rethrowing.
  try {
    activateMonitors(source);

    // Installed before the initial resolution and the synchronous
    // `onGenerateDragPreview` dispatch so a consumer that unregisters an initial
    // drop target during either has its refresh queued rather than dropped. The
    // refresh waits for `onMoveStart` (see `startDispatched`), so the target is
    // still published and entered with the rest of the initial stack, and then
    // leaves it, with its `onDraggableLeave`, right after that dispatch.
    state.refreshDropTargets = (rehitTest) => {
      // Requested from inside a consumer fan-out, or before `onMoveStart` has
      // been delivered: queue it (see `dispatching` and `startDispatched`).
      if (dispatching || !startDispatched) {
        refreshPending = true;
        pendingRefreshNeedsHitTest ||= rehitTest;
        return;
      }
      resolveDropTargetsFromLastTarget(rehitTest, false);
    };
    state.shouldRefreshTargets = (elements) => {
      // A detached hit requires a fresh hit-test, whose ancestry is not known yet.
      if (lastTarget !== null && !lastTarget.isConnected) {
        return true;
      }
      // Include disabled, abstaining, and rejecting ancestors too. Membership in
      // the accepted stack alone cannot tell whether changed parameters matter.
      for (let node = lastTarget; node !== null; node = getComposedParentElement(node)) {
        if (elements.has(node)) {
          return true;
        }
      }
      return false;
    };
    state.isHovered = (element) => hoveredDropTargets.some((record) => record.element === element);

    // The stack under the pickup point. Resolved only now, with `state.dragCancel`
    // armed and the monitors active, so a `cancelDrag()` from a resolver behaves
    // like one from `onGenerateDragPreview`: `doCancel` delivers the terminal
    // `onMoveEnd` and tears the session down, and the sensor gets `null` below.
    const initialDropTargets = resolveStack(initialTarget, initialInput);
    if (tornDown) {
      return null;
    }
    location.initial = { input: initialInput, dropTargets: initialDropTargets };
    location.current = location.initial;

    const previewPayload: DragPreviewRenderEvent = {
      location: snapshotLocation(),
      source,
    };

    getSourceHandlers?.()?.onGenerateDragPreview?.(previewPayload);
  } catch (error) {
    tearDown();
    throw error;
  }

  // Cancelled from within `onGenerateDragPreview`: the terminal events were
  // delivered and the session is gone. Return `null` so the sensor releases its
  // just-acquired resources through its refused-session path.
  if (tornDown) {
    return null;
  }

  // Initial publish, after the onGenerateDragPreview dispatch so a throw nulls the store cleanly.
  publishSession();

  // Dispatch only now, after the session snapshot, `controller`, and
  // `state.dragCleanup` are live, so a consumer that cancels or updates from
  // within `onMoveStart` acts on a fully-initialized session.
  dispatchDragStart();

  // Same as above: a cancel from within `onMoveStart` already tore the session
  // down; hand the sensor `null` rather than a dead controller.
  return tornDown ? null : { controller };
}

/**
 * Force-end any active drag session. Used both as test cleanup and as the
 * recovery path when a consumer callback throws.
 */
export function reset(): void {
  if (state.isActive) {
    state.dragCleanup?.();
  }
}

export interface SourceHandlers {
  /**
   * Engine-internal preview hook: the sensors' preview builder ends up here (see
   * `useInnerDragEngine`), never a consumer handler — the public parameter types
   * omit it.
   */
  onGenerateDragPreview?: ((parameters: DragPreviewRenderEvent) => void) | undefined;
  onMoveStart?:
    | ((
        parameters: DraggableEventMap['onMoveStart'],
        eventDetails: DraggableEventDetailsMap['onMoveStart'],
      ) => void)
    | undefined;
  onMove?:
    | ((
        parameters: DraggableEventMap['onMove'],
        eventDetails: DraggableEventDetailsMap['onMove'],
      ) => void)
    | undefined;
  onTargetChange?:
    | ((
        parameters: DraggableEventMap['onTargetChange'],
        eventDetails: DraggableEventDetailsMap['onTargetChange'],
      ) => void)
    | undefined;
  onMoveEnd?:
    | ((
        parameters: DraggableEventMap['onMoveEnd'],
        eventDetails: DraggableEventDetailsMap['onMoveEnd'],
      ) => void)
    | undefined;
}

/**
 * What a `drop()` resolved to, mirroring the `onMoveEnd` payload it produced:
 * `canceled` is `true` only when a consumer handler re-entrantly canceled
 * mid-drop, and `dropTarget` is the target the release landed on (`null` for an
 * outside release or a cancel).
 */
export type DropOutcome = Pick<DraggableEventMap['onMoveEnd'], 'canceled' | 'dropTarget'>;

export interface DragSessionController {
  /**
   * `event` is the native input this sample came from. It reaches `eventDetails.event` on
   * `onMove`, `onTargetChange`, `onDraggableEnter` and `onDraggableLeave`, so those
   * handlers can read modifier keys off a real event rather than a placeholder.
   * Sensors may coalesce several raw samples before calling `update`, which then
   * reports the last sample's event alongside its `location.current`.
   */
  update(input: DragInput, target: Element | null, event?: Event, reason?: DragMoveReason): void;
  /**
   * End the drag as a release at `input` over `target`. Returns the outcome the
   * resulting `onMoveEnd` reported. See {@link DropOutcome}.
   */
  drop(input: DragInput, target: Element | null, event?: Event): DropOutcome;
  /**
   * End the drag as an abort. `reason` names the exact cause for
   * `onMoveEnd`'s `eventDetails`; it defaults to the programmatic one because
   * the public `cancelDrag()` is the only caller that doesn't pass one.
   */
  cancel(input?: DragInput, reason?: DragCanceledReason, event?: Event): void;
}

export interface DragSessionHandle {
  controller: DragSessionController;
}

export interface StartParameters {
  payload: DragSource;
  /**
   * Getter for the drag source's latest event handlers, read fresh on every
   * dispatch so a draggable that re-renders mid-drag runs its current closures
   * rather than the ones captured at drag start (only `kind` stays
   * start-time — see the payload snapshot).
   */
  getSourceHandlers?: (() => SourceHandlers | undefined) | undefined;
  initialInput: DragInput;
  initialTarget: Element | null;
  /**
   * The native event the pickup committed on. Reported as
   * `eventDetails.event` on `onMoveStart` and on the initial stack's
   * `onDraggableEnter`, so those aren't handed a placeholder either.
   */
  initialEvent?: Event | undefined;
  /**
   * The press point minus the source's border-box origin, in client pixels,
   * measured before `[data-dragging]` styling applies. Anchors
   * `getSnappedLocalPoint({ anchor: 'source' })`; omitted (a bare lifecycle
   * driver), the source anchor falls back to the pointer.
   */
  grabOffset?: { x: number; y: number } | undefined;
  synthetic: {
    /** The element that follows the pointer, to skip when hit-testing. */
    getPreviewElement(): HTMLElement | null;
  };
  /**
   * Sensor-level cleanup invoked from the lifecycle's full teardown path. The
   * sensor passes its `clearActive()` here so an abnormal end (consumer throw,
   * `reset()`) still releases its `state.active`, listeners, dragRootLock, and
   * preview node — otherwise every subsequent pointerdown would be rejected.
   * Must be idempotent: the normal-end path also runs it after target-clearing.
   */
  onForceCleanup?: (() => void) | undefined;
}
