/**
 * The core drag lifecycle state machine.
 *
 * It resolves drop targets, dispatches events to the source, the targets and the
 * monitors, and publishes the session snapshot. Sensors call `start()` and drive
 * the returned controller (`update`, `drop`, `cancel`) from their own listeners.
 * The sensors own the preview (see `synthetic/syntheticPreview`).
 */

import { areArraysEqual } from '@base-ui/utils/areArraysEqual';
import type {
  DraggableLocation,
  DraggableLocationHistory,
  DraggableInput,
} from '../../../draggable/DraggableProvider';
import type { DraggablePreviewRenderParameters } from '../../../draggable/preview/DraggablePreview';
import type { DraggableRootRecord } from '../../../draggable/root/DraggableRoot';
import type { DraggableTargetRecord } from '../../../draggable/target/DraggableTarget';
import type {
  DragCanceledReason,
  DragCleanupFn,
  DragEndReason,
  DragMoveReason,
  DragStartReason,
  DraggableEventDetailsMap,
} from '../types';
import type { DraggableConfig } from '../draggable';
import { createDragEventDetails, createMoveEndEventDetails } from '../dragEventDetails';
import {
  captureDropTargetCollision,
  beginDropTargetSession,
  endDropTargetSession,
  dispatchDropTargetChange,
  dispatchDropTargetLeave,
  dispatchToAllDropTargets,
  dispatchToDropTarget,
  getDropTargetsOver,
  refreshHoveredRecords,
} from '../dropTarget';
import { activateMonitors, clearActiveMonitors, dispatchToMonitors } from '../monitor';
import { cloneLocationHistory, setDragSession } from '../dragSessionStore';
import { clearPublishedDragPreview } from '../overlay/dragPreviewStore';
import { containConsumerError, getComposedParentElement } from '../utils';
import { getSharedSlot } from '../sharedState';

/** The active drag's hooks, published in `state.session` from pickup until teardown. */
interface LifecycleSession {
  /** Idempotent full teardown (see `tearDown`). */
  tearDown: DragCleanupFn;
  /**
   * Cancels the drag. Dispatches the terminal events with a `null` target and a
   * cancel reason, then tears down. See {@link cancelLifecycleDrag}.
   */
  cancel: () => void;
  /** See {@link refreshDropTargets}. */
  refresh: (rehitTest: boolean) => void;
  /** See {@link scheduleDropTargetParameterRefresh}. */
  scheduleRefresh: (element: Element | null, rehitTest: boolean) => void;
  /** Whether an element holds delivered hover state. See {@link isHoveredDropTarget}. */
  isHovered: (element: Element) => boolean;
  /**
   * Whether `cancel` may run. Set before the start dispatches and cleared when
   * the end sequence begins (see `disarmSessionHooks`).
   */
  cancelArmed: boolean;
  /** Whether `refresh` may run. Set once the monitors are active and cleared with `cancelArmed`. */
  refreshArmed: boolean;
}

interface LifecycleState {
  session: LifecycleSession | null;
}

const state = getSharedSlot<LifecycleState>('lifecycleManager', () => ({ session: null }));

function dropTargetRecordsEqual(a: DraggableTargetRecord, b: DraggableTargetRecord): boolean {
  return a.element === b.element;
}

export function isActive(): boolean {
  return state.session !== null;
}

/**
 * Re-resolve the active drop-target stack and publish a new session snapshot.
 * Does nothing when no drag is active. Runs when a hovered target unregisters
 * mid-drag, so subscribers see it leave the stack without waiting for a pointer
 * event. A registration goes through {@link scheduleDropTargetParameterRefresh} instead.
 *
 * Walks up from the last resolved target instead of hit-testing, because the DOM
 * under the pointer hasn't changed, only which of its ancestors are registered. A
 * React unmount runs this from the ref cleanup, inside the commit and before the
 * node is removed, where `elementFromPoint` would force a needless synchronous
 * layout. It hit-tests again only when the last target has been detached (see
 * `resolveDropTargetsFromLastTarget`).
 */
export function refreshDropTargets(): void {
  const session = state.session;
  if (session?.refreshArmed) {
    session.refresh(false);
  }
}

/** Coalesce a React commit's drop-target parameter changes into one resolution. */
export function scheduleDropTargetParameterRefresh(
  element?: Element | null,
  rehitTest = false,
): void {
  const session = state.session;
  if (session?.refreshArmed) {
    session.scheduleRefresh(element ?? null, rehitTest);
  }
}

/**
 * Whether `element` holds hover state that the engine has delivered.
 *
 * It updates earlier than the published session snapshot. A target that
 * enters and unregisters in the same change round is already in the lifecycle's
 * bookkeeping but not yet in the snapshot. Reading the snapshot would send its
 * cleanup down the coalesced path, which runs after its registration is gone,
 * when its `onDraggableLeave` can no longer be dispatched.
 */
export function isHoveredDropTarget(element: Element): boolean {
  return state.session?.isHovered(element) ?? false;
}

/**
 * Cancel the active session at the lifecycle level, as a fallback for
 * `engine.cancelDrag()`. The sensors record their session only after `start()`
 * returns. A `cancelDrag()` from one of the synchronous start dispatches (the
 * initial stack's `canDrop`, `onGenerateDragPreview`, `onMoveStart`) can reach the
 * session only through this function. After a sensor-owned cancel has torn the
 * lifecycle down, this does nothing.
 */
export function cancelLifecycleDrag(): void {
  const session = state.session;
  if (session?.cancelArmed) {
    session.cancel();
  }
}

export function start(parameters: StartParameters): DragSessionController | null {
  if (state.session !== null) {
    return null;
  }

  const {
    payload: source,
    getSourceHandlers,
    initialInput,
    initialTarget,
    initialEvent,
    startReason,
    grabOffset,
    hitTest,
    onForceCleanup,
  } = parameters;

  // Runs before the initial stack resolves, because records capture the grab
  // offset at creation for `getSnappedLocalPoint({ anchor: 'source' })`.
  beginDropTargetSession(source, grabOffset);

  // The native event of the latest sample, reported as `eventDetails.event` by the
  // move-derived dispatches. It starts as the pickup event, so events before the
  // first move still report a real one, and `controller.update` advances it. A
  // drag driven without events, such as a programmatic session or a test harness,
  // gets the placeholder from `createDragEventDetails`.
  let lastInputEvent: Event | undefined = initialEvent;
  let lastInputReason: DragMoveReason = 'pointer';

  // The target whose `canDrop` returned `'reject'` at the current position, and
  // the value in the last published snapshot. A rejection change usually leaves
  // the stack element-equal (empty before and after), so it needs its own
  // publish trigger.
  let rejectedTarget: Element | null = null;
  let publishedRejectedTarget: Element | null = null;

  const onReject = (element: Element) => {
    rejectedTarget = element;
  };

  function resolveStack(target: Element | null, input: DraggableInput): DraggableTargetRecord[] {
    rejectedTarget = null;
    return getDropTargetsOver(target, { input, source }, onReject);
  }

  // Starts with an empty stack. The stack under the pickup point resolves below,
  // once the session's cancel is armed and the monitors are active. A `canDrop`
  // that cancels at pickup then ends the drag as it would mid-drag, instead of
  // being ignored.
  const initialLocation: DraggableLocation = {
    input: initialInput,
    targets: [],
  };

  const location: DraggableLocationHistory = {
    grabOffset: { ...grabOffset },
    initial: initialLocation,
    current: initialLocation,
    // With no prior event, `previous.input` starts at the pickup point, so a
    // consumer diffing `current` against `previous` reads a zero delta on the
    // first event. The stack starts empty because nothing has been entered yet.
    previous: { input: initialLocation.input, targets: [] },
  };

  /**
   * Returns the copy of `location` that consumers receive.
   *
   * `location` is the engine's mutable bookkeeping. `current` is reassigned on
   * every sample, and `previous` advances with each delivered event. Passed out
   * directly, an event saved for later would report the drag's latest position
   * instead of its own, and a handler could `splice()` the `targets` array while
   * the fan-out is still iterating it. One snapshot is built per dispatch round,
   * so every recipient of an event sees the same state.
   */
  function snapshotLocation(): DraggableLocationHistory {
    return cloneLocationHistory(location);
  }

  /**
   * Builds the location for the terminal `onDraggableLeave` that still-hovered
   * targets receive when the drag ends. It is a copy whose `current.targets` is
   * already empty, so the location the end handlers received with the drop stack,
   * and may have kept, doesn't change.
   */
  function createTerminalLeaveLocation(input: DraggableInput): DraggableLocationHistory {
    const leaveLocation = snapshotLocation();
    return { ...leaveLocation, previous: leaveLocation.current, current: { input, targets: [] } };
  }

  // The location at the last delivered event. Sensors can coalesce several
  // native samples before calling `update`, so `previous` advances per dispatch,
  // not per raw input.
  let lastDispatched: DraggableLocation = location.previous;

  // The last DOM element the stack was resolved from. `refreshDropTargets()`
  // walks up from it again when a drop target unregisters mid-drag.
  let lastTarget: Element | null = initialTarget;

  // Set by `tearDown`. Consumer callbacks can tear the session down mid-dispatch,
  // so the dispatch paths check this before publishing or scheduling, and the
  // drop-target fan-outs check it between deliveries through `isLive`.
  let tornDown = false;
  const isLive = () => !tornDown;

  // Set while consumer resolvers and event handlers run. Either can unregister a
  // hovered drop target, whose cleanup re-resolves the stack synchronously (see
  // `registrations.ts`). Re-entering `updateDropTargets` mid-round would corrupt
  // the round's bookkeeping. When the outer round finished, its stale stack would
  // overwrite `hoveredDropTargets` and `lastDispatched` and bring the unregistered
  // target back. The refresh queues instead and runs when the round finishes
  // (see `drainPendingRefresh`).
  let dispatching = false;
  let refreshPending = false;
  let pendingRefreshNeedsHitTest = false;

  // Whether the terminal `onMoveEnd` has been delivered. The recovery path below
  // reads it so a throw from `onMoveEnd` doesn't produce a second one.
  let endDispatched = false;

  // Whether `onMoveStart` has gone out. An earlier refresh, for example from a
  // consumer unregistering a target in `onGenerateDragPreview`, would dispatch
  // `onDraggableEnter` and `onDraggableMove` to targets that haven't received
  // `onDraggableStart`. It queues like a mid-round refresh instead.
  let startDispatched = false;

  // The targets whose enter has been delivered. `dispatchDropTargetChange`
  // updates it as it dispatches enters and leaves. When a re-entrant cancel
  // interrupts a change dispatch halfway, the terminal leave in `doDrop` or
  // `doCancel` reaches exactly the targets that consider themselves hovered, not
  // the already-reassigned `location.current` stack.
  //
  // It stays empty after the initial stack resolves. `dispatchDragStart` enters
  // that stack one record at a time and pushes each record here just before its
  // `onDraggableEnter`, as `dispatchDropTargetChange` does mid-drag. Filling it up
  // front would owe a terminal leave to targets whose enter never ran, which
  // happens when an inner target's enter cancels the drag.
  const hoveredDropTargets: DraggableTargetRecord[] = [];

  // The parameter refresh queued in a microtask. With `targets: null` it always
  // runs. Otherwise it runs only when one of these elements is on the walk.
  let queuedRefresh: { targets: Set<Element> | null; rehitTest: boolean } | null = null;

  /** Whether a changed element belongs to the current resolution walk. */
  function walksThrough(elements: ReadonlySet<Element>): boolean {
    // A detached last target needs a new hit-test, whose ancestors aren't known yet.
    if (lastTarget !== null && !lastTarget.isConnected) {
      return true;
    }
    // Check every ancestor, including disabled, abstaining and rejecting targets.
    // The accepted stack alone can't tell whether changed parameters matter.
    for (let node = lastTarget; node !== null; node = getComposedParentElement(node)) {
      if (elements.has(node)) {
        return true;
      }
    }
    return false;
  }

  // Published in `state.session` below, once the controller is built.
  const session: LifecycleSession = {
    tearDown,
    cancel: doCancel,
    refresh(rehitTest) {
      // Queue a refresh requested inside a consumer fan-out, or before
      // `onMoveStart` has gone out (see `dispatching` and `startDispatched`).
      if (dispatching || !startDispatched) {
        refreshPending = true;
        pendingRefreshNeedsHitTest ||= rehitTest;
        return;
      }
      resolveDropTargetsFromLastTarget(rehitTest, false);
    },
    scheduleRefresh(element, rehitTest) {
      const queued = queuedRefresh;
      if (queued !== null) {
        queued.rehitTest ||= rehitTest;
        if (element === null) {
          queued.targets = null;
        } else {
          queued.targets?.add(element);
        }
        return;
      }
      const job = { targets: element === null ? null : new Set([element]), rehitTest };
      queuedRefresh = job;
      queueMicrotask(() => {
        queuedRefresh = null;
        // The drag may have ended before this job runs.
        if (
          !tornDown &&
          session.refreshArmed &&
          (job.targets === null || walksThrough(job.targets))
        ) {
          session.refresh(job.rehitTest);
        }
      });
    },
    isHovered: (element) => hoveredDropTargets.some((record) => record.element === element),
    cancelArmed: false,
    refreshArmed: false,
  };

  /**
   * Prevents later calls from canceling or refreshing the session. Once the end
   * sequence starts, only it updates the stack.
   */
  function disarmSessionHooks(): void {
    session.cancelArmed = false;
    session.refreshArmed = false;
  }

  /**
   * Delivers a best-effort terminal dispatch before an error tears the session down.
   *
   * `tearDown()` restores the engine but doesn't notify consumers. An app that
   * pairs `onMoveStart` with `onMoveEnd`, for example to toggle a page-level
   * dragging class, would stay in its dragging state after any handler throws.
   * Delivering one contained `onMoveEnd` first closes that pair. It is contained
   * so that a second throw here can't replace the original error being rethrown.
   */
  function dispatchRecoveryEnd(): void {
    if (endDispatched || tornDown) {
      return;
    }
    // Recovery owns the terminal sequence from here, including callbacks that
    // cancel or unregister a target while its leave is being delivered.
    endDispatched = true;
    disarmSessionHooks();
    // Targets that received an enter still need the matching leave. Dispatch only
    // to the targets here, because the source callback that triggered recovery
    // may be the one that throws, and it must not block the leaves.
    const departedDropTargets = hoveredDropTargets.slice();
    if (departedDropTargets.length > 0) {
      const leaveDetails = createDragEventDetails<DragEndReason>(
        'handler-error',
        undefined,
        createTerminalLeaveLocation(location.current.input),
        source,
        null,
      );
      containConsumerError(
        'Base UI: a drag handler threw while another handler error was being recovered. ' +
          'The remaining target cleanup is best-effort.',
        null,
        () =>
          dispatchDropTargetChange(
            departedDropTargets,
            [],
            leaveDetails,
            isLive,
            hoveredDropTargets,
          ),
        undefined,
      );
    }
    location.previous = lastDispatched;
    location.current = { input: location.current.input, targets: [] };
    const endDetails = createMoveEndEventDetails(
      'handler-error',
      undefined,
      snapshotLocation(),
      source,
      null,
    );
    containConsumerError(
      'Base UI: a drag handler threw, so the drag was torn down. ' +
        'The terminal onMoveEnd is best-effort.',
      null,
      () => getSourceHandlers().onMoveEnd?.(endDetails),
      undefined,
    );
    dispatchToMonitors('onMoveEnd', endDetails);
  }

  // Publishes a new snapshot, nested arrays included, so `useStore`'s `Object.is`
  // comparisons see a new reference. Called only when the stack or the rejected
  // target changes.
  function publishSession(): void {
    publishedRejectedTarget = rejectedTarget;
    setDragSession({
      source,
      location: cloneLocationHistory(location),
      dropTargetElements: new Set(location.current.targets.map((target) => target.element)),
      rejectedTarget,
    });
  }

  /**
   * The first error thrown by a consumer handler inside the terminal sequence,
   * rethrown once that sequence has finished (see {@link captureTerminalError}).
   */
  let terminalError: { error: unknown } | null = null;

  /**
   * Runs one terminal handler and holds any throw until the rest of the end
   * sequence has run.
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

  /**
   * Rethrows the error held from a terminal handler, after teardown. Clears it so
   * it surfaces only once.
   */
  function rethrowTerminalError(): void {
    const held = terminalError;
    if (held !== null) {
      terminalError = null;
      throw held.error;
    }
  }

  /**
   * Handles a consumer callback that threw mid-dispatch. Ends the drag so a new
   * one can start, then rethrows. An error already held from a terminal handler
   * takes precedence, because it came first and later errors follow from it.
   *
   * Tears down only this session. A handler may have ended it and started another
   * drag re-entrantly, and that drag must survive this throw.
   */
  function recover(error: unknown): never {
    dispatchRecoveryEnd();
    tearDown();
    rethrowTerminalError();
    throw error;
  }

  // Delivers `onMoveStart` before any `onDraggableEnter` or `onDraggableDrop`. A
  // collection that hasn't seen `onMoveStart` has an empty dragged-item set and
  // would ignore the drop.
  function dispatchDragStart(): void {
    const startDetails = createDragEventDetails(
      startReason,
      lastInputEvent,
      snapshotLocation(),
      source,
      location.current.targets[0] ?? null,
    );
    dispatching = true;
    try {
      getSourceHandlers().onMoveStart?.(startDetails);
      // A source `onMoveStart` can cancel the drag synchronously through
      // `cancelDrag()`. The cancel already delivered the terminal events, so
      // targets and monitors must not receive a start for a drag that has ended.
      if (tornDown) {
        return;
      }
      dispatchToAllDropTargets(location.current.targets, 'onDraggableStart', startDetails, isLive);
      dispatchToMonitors('onMoveStart', startDetails);
      // The stack under the pickup point is published in `dropTargetElements` and
      // gets a terminal `onDraggableLeave` from `doDrop` or `doCancel`, so it
      // needs an enter too. `dispatchDropTargetChange`, the only other source of
      // `onDraggableEnter`, never runs for this first stack because there is no
      // previous stack to diff against. The enters go last in the round, so
      // `onMoveStart` precedes all of them.
      //
      // Each record joins `hoveredDropTargets` just before its own enter, not as
      // a batch. A handler here can cancel the drag re-entrantly, and the outer
      // targets that never received their enter must not then receive a leave.
      // `dispatchDropTargetChange` uses the same order mid-drag.
      for (const record of location.current.targets) {
        if (!isLive()) {
          break;
        }
        hoveredDropTargets.push(record);
        dispatchToDropTarget(record, 'onDraggableEnter', startDetails);
      }
    } catch (error) {
      recover(error);
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
    // `previous` is the location at the last delivered event (see `lastDispatched`).
    location.previous = lastDispatched;
    const locationSnapshot = snapshotLocation();
    const { targets } = locationSnapshot.current;
    const dragDetails = createDragEventDetails(
      lastInputReason,
      lastInputEvent,
      locationSnapshot,
      source,
      targets[0] ?? null,
    );
    dispatching = true;
    // Recover on throw (see `dispatchDragStart`).
    try {
      captureDropTargetCollision(targets[0], source);
      getSourceHandlers().onMove?.(dragDetails);
      // A source `onMove` can cancel synchronously. If it did, deliver nothing more.
      if (tornDown) {
        return;
      }
      dispatchToAllDropTargets(targets, 'onDraggableMove', dragDetails, isLive);
      dispatchToMonitors('onMove', dragDetails);
    } catch (error) {
      recover(error);
    } finally {
      dispatching = false;
    }
    lastDispatched = location.current;
    drainPendingRefresh();
  }

  // Re-resolve the stack after a registration or parameter change (see
  // `session.refresh`, and `refreshArmed` below for when it can run).
  //
  // A registration change (`rehitTest`) hit-tests again at the pointer position
  // instead of walking up from `lastTarget`, because a target that mounts over a
  // stationary pointer, such as a panel fading in mid-drag, isn't an ancestor of
  // the old target. A parameter change walks up from `lastTarget` again, because
  // nothing moved and a hit-test costs a hidden preview and a layout read. The
  // exception is a `lastTarget` detached by a virtualizer or a live reorder. The
  // walk would then resolve an empty stack and leave every hovered target, so it
  // hit-tests too. The hit-test skips the preview, so the preview can't empty the
  // stack either.
  //
  // `dragDispatchFollows` is passed on to `updateDropTargets`.
  function resolveDropTargetsFromLastTarget(
    rehitTest: boolean,
    dragDispatchFollows: boolean,
  ): void {
    let target = lastTarget;
    if (rehitTest || (target !== null && !target.isConnected)) {
      const { clientX, clientY } = location.current.input;
      const fresh = hitTest(clientX, clientY);
      // A `null` hit with a still-connected last target means the captured
      // pointer is outside the viewport. Keep the last target so the stack
      // doesn't empty for no reason.
      if (fresh !== null || target == null || !target.isConnected) {
        target = fresh;
      }
    }
    updateDropTargets(location.current.input, target, dragDispatchFollows);
  }

  /**
   * Runs the refresh queued during a consumer fan-out (see `dispatching`). It
   * inherits the round's `dragDispatchFollows`. In the sensor `update` path, the
   * caller's `dispatchDrag()` still follows, so the drained round must skip its
   * entry `onMove` too. Otherwise every target in the re-resolved stack would get
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
   * Runs one drop-target change round: the source handler, then each target's
   * enter or leave, then the monitors. Any of these callbacks can cancel the drag
   * synchronously through `cancelDrag()`, which delivers the terminal events
   * itself. The round checks for teardown between deliveries and returns whether
   * the session is still live. Callers must dispatch nothing more once it isn't.
   */
  function dispatchChangeRound(
    previousTargets: readonly DraggableTargetRecord[],
    currentTargets: readonly DraggableTargetRecord[],
    changeDetails: DraggableEventDetailsMap['onTargetChange'],
  ): boolean {
    captureDropTargetCollision(currentTargets[0], source);
    getSourceHandlers().onTargetChange?.(changeDetails);
    if (tornDown) {
      return false;
    }
    dispatchDropTargetChange(
      previousTargets,
      currentTargets,
      changeDetails,
      isLive,
      hoveredDropTargets,
    );
    if (tornDown) {
      return false;
    }
    dispatchToMonitors('onTargetChange', changeDetails);
    return !tornDown;
  }

  /**
   * `dragDispatchFollows` means the caller runs `dispatchDrag()` right after this
   * round, as the sensor `update` path does. That call delivers `onMove` to every
   * target in the new stack. The refresh paths have no such follow-up and get the
   * entry `onMove` below instead.
   */
  function updateDropTargets(
    input: DraggableInput,
    rawTarget: Element | null,
    dragDispatchFollows: boolean,
  ): void {
    lastTarget = rawTarget;

    let newDropTargets: DraggableTargetRecord[];
    dispatching = true;
    try {
      newDropTargets = resolveStack(rawTarget, input);
    } finally {
      dispatching = false;
    }
    // A consumer `canDrop` can cancel the drag synchronously. Teardown already
    // delivered the terminal events and cleared the session, so don't update or
    // publish location state for the ended drag.
    if (tornDown) {
      return;
    }
    const previousDropTargets = location.current.targets;

    location.current = { input, targets: newDropTargets };

    const targetsChanged = !areArraysEqual(
      previousDropTargets,
      newDropTargets,
      dropTargetRecordsEqual,
    );

    if (targetsChanged) {
      // `previous` moves only when an event is delivered, not on every raw
      // sample (see `lastDispatched`).
      location.previous = lastDispatched;
      const moveDetails = createDragEventDetails(
        lastInputReason,
        lastInputEvent,
        snapshotLocation(),
        source,
        newDropTargets[0] ?? null,
      );
      dispatching = true;
      // Recover on throw (see `dispatchDragStart`).
      try {
        if (!dispatchChangeRound(previousDropTargets, newDropTargets, moveDetails)) {
          return;
        }

        // Deliver `onDraggableMove` to the new stack on entry, so target hover
        // logic can live in that handler without an extra source dispatch. Skip
        // it when the caller's `dispatchDrag()` delivers the same event to the
        // same targets in this frame. Consumer handlers, and any rect reads in
        // them, would otherwise run twice on every entry frame.
        if (!dragDispatchFollows && newDropTargets.length > 0) {
          const entryDetails = createDragEventDetails(
            lastInputReason,
            lastInputEvent,
            snapshotLocation(),
            source,
            newDropTargets[0],
          );
          dispatchToAllDropTargets(newDropTargets, 'onDraggableMove', entryDetails, isLive);
        }
      } catch (error) {
        recover(error);
      } finally {
        dispatching = false;
      }

      // Publish only when the stack changed, or selectors would re-run every
      // frame. A re-entrant `cancelDrag()` from a dispatch above can tear the
      // session down, and publishing then would refill the store after teardown
      // cleared it.
      if (!tornDown) {
        lastDispatched = location.current;
        publishSession();
      }
    } else {
      // Same elements, newly resolved records. No change dispatch runs, so replace
      // the records in the hovered bookkeeping here. The terminal leave on drop or
      // cancel reads them and must report the latest `target.payload`, as the
      // intermediate `onMove` events did.
      refreshHoveredRecords(hoveredDropTargets, newDropTargets);
      // A rejection change with an element-equal stack (empty before and after)
      // must publish on its own, or `data-rejected` would never appear or clear.
      if (rejectedTarget !== publishedRejectedTarget) {
        publishSession();
      }
    }
    drainPendingRefresh(dragDispatchFollows);
  }

  // The one full teardown, run from `doDrop`, `doCancel`, the error recovery
  // paths and `reset()`. A second call does nothing.
  function tearDown(): void {
    if (tornDown) {
      return;
    }
    tornDown = true;
    // Release the shared state before running cleanup callbacks.
    state.session = null;

    try {
      // Notify the sensor, which owns the preview. It does nothing if it already
      // cleaned up.
      containConsumerError(
        'Base UI: the sensor cleanup threw during teardown.',
        null,
        onForceCleanup,
        undefined,
      );

      // Clear the published React preview content with the session. The overlay
      // renders whatever the store holds, so if a provider unmounted mid-drag,
      // the content and its detached host would stay in memory until the next pickup.
      clearPublishedDragPreview();
    } finally {
      clearActiveMonitors();
      // Release the hold kept for a target that unregistered while hovered. Its
      // leave either went out, which already released it, or will never go out
      // now that the drag is over. The per-target drag data is cleared too.
      endDropTargetSession();
      setDragSession(null);
    }
  }

  function doDrop(input: DraggableInput, rawTarget: Element | null, event?: Event): void {
    // A stale sensor call can arrive after re-entrant consumer code has ended
    // the drag. Committing then would deliver a second terminal event for the
    // same drag.
    if (tornDown) {
      return;
    }
    // The end sequence owns the stack from here. A synchronous refresh requested
    // by a handler below queues behind `dispatching` and is never drained. The
    // terminal leaves settle the hover state, and the queued flag is discarded
    // with the session.
    dispatching = true;

    const freshDropTargets = getDropTargetsOver(rawTarget, { input, source });
    // The final resolution runs consumer getters too. If one of them canceled
    // the drag, the cancel has already torn the session down.
    if (tornDown) {
      return;
    }
    // Capture the drop recipient now, before an end dispatch can change the
    // stack. An `onMoveEnd` that unregisters a target can re-resolve
    // `location.current`, and reading `[0]` after that could hand the drop to a
    // different target. `null` means the release was over no target, which is
    // the `outside-release` outcome (`canceled: false`, `target: null`).
    const innermostDropTarget = freshDropTargets[0] ?? null;
    captureDropTargetCollision(innermostDropTarget, source);
    // This path covers a drop on a target and a release over nothing. Neither is
    // a cancel, and the reason tells them apart. Only a drop fires `onDraggableDrop`.
    const endReason: DragEndReason = innermostDropTarget ? 'drop' : 'outside-release';
    const previousDropTargets = location.current.targets;

    location.previous = lastDispatched;
    location.current = { input, targets: freshDropTargets };

    // The final pointer position can resolve a different stack than the last
    // sensor update, because the sensor calls `drop` directly. Reconcile enters
    // and leaves against the new stack before the drop, so a target entered or
    // left at release gets `onDraggableEnter` or `onDraggableLeave` instead of an
    // `onDraggableDrop` based on stale hover state.
    // Recover on throw (see `dispatchDragStart`).
    try {
      if (!areArraysEqual(previousDropTargets, freshDropTargets, dropTargetRecordsEqual)) {
        const changeDetails = createDragEventDetails(
          endReason,
          event,
          snapshotLocation(),
          source,
          innermostDropTarget,
        );
        // A torn-down round means a consumer canceled re-entrantly. The cancel
        // already ran `onMoveEnd` and the teardown, so skip the drop.
        if (!dispatchChangeRound(previousDropTargets, freshDropTargets, changeDetails)) {
          return;
        }
      } else {
        // As in `updateDropTargets`, the terminal leave below must report the
        // newly resolved records, not the ones from entry.
        refreshHoveredRecords(hoveredDropTargets, freshDropTargets);
      }

      // The end sequence is committed. A `cancelDrag()` from an end dispatch
      // below must do nothing instead of starting a second end. An `onMoveEnd`
      // that unregisters a target must not re-enter `updateDropTargets` and
      // change `location.current` under the drop and leave dispatches below.
      // `tearDown()` clears these hooks anyway.
      disarmSessionHooks();

      const endDetails = createMoveEndEventDetails(
        endReason,
        event,
        snapshotLocation(),
        source,
        innermostDropTarget,
      );
      // Deliver the source end once, even if its commit handler throws.
      endDispatched = true;
      captureTerminalError(() => getSourceHandlers().onMoveEnd?.(endDetails));
      // A consumer `onMoveEnd` can tear the session down synchronously. Teardown
      // then already notified the targets and monitors, so don't dispatch again.
      if (!tornDown) {
        // `onDraggableDrop` fires only on a drop, and only on the innermost
        // target, so ancestors don't handle the same drop again. Monitors see the
        // end of every drag through `onMoveEnd`. The recipient captured before
        // dispatch is used, so a re-entrant refresh can't redirect the drop and
        // an `onMoveEnd` that unregistered the target can't swallow it.
        if (innermostDropTarget) {
          const dropDetails = createDragEventDetails(
            'drop',
            event,
            snapshotLocation(),
            source,
            innermostDropTarget,
          );
          captureTerminalError(() =>
            dispatchToDropTarget(innermostDropTarget, 'onDraggableDrop', dropDetails),
          );
        }
        dispatchToMonitors('onMoveEnd', endDetails);

        // Send a final `onDraggableLeave` to every target still hovered, so
        // imperative hover state clears. The drop path never emits a change to an
        // empty stack. `createTerminalLeaveLocation` builds the location. Leaves
        // go out one at a time, each removing only its own record from the
        // hovered bookkeeping. A leave handler that unregisters a sibling target
        // must still find that sibling hovered, or the sibling never gets its leave.
        const departedDropTargets = hoveredDropTargets.slice();
        if (departedDropTargets.length > 0) {
          const leaveDetails = createDragEventDetails(
            endReason,
            event,
            createTerminalLeaveLocation(input),
            source,
            null,
          );
          for (const target of departedDropTargets) {
            if (!isLive()) {
              break;
            }
            captureTerminalError(() =>
              dispatchDropTargetLeave(target, leaveDetails, hoveredDropTargets),
            );
          }
        }
      }
    } catch (error) {
      recover(error);
    }

    tearDown();
    // The engine is restored and every other consumer has received its terminal
    // event. Only now does an error from a terminal handler surface.
    rethrowTerminalError();
  }

  function doCancel(
    input?: DraggableInput,
    reason: DragCanceledReason = 'imperative-action',
    event?: Event,
  ): void {
    // As in `doDrop`, code that runs between the sensor's `clearActive()` and
    // this call can already have ended the drag.
    if (tornDown || endDispatched) {
      return;
    }
    // The drag is ending. A `cancelDrag()` from a dispatch below must do nothing
    // instead of starting a second cancel. A handler that unregisters a target
    // must not re-enter `updateDropTargets` against the emptied stack, because it
    // would re-resolve the targets under the pointer and send them
    // `onDraggableEnter` with no matching leave.
    disarmSessionHooks();
    // The terminal leave goes to the targets whose enter was delivered. They
    // differ from `location.current.targets` when this cancel comes from a
    // handler inside a change dispatch. The stack was already reassigned there,
    // but the entering targets were never notified, so they must not get a leave.
    const departedDropTargets = hoveredDropTargets.slice();
    location.previous = lastDispatched;
    location.current = { input: input ?? location.current.input, targets: [] };

    // Recover on throw (see `dispatchDragStart`).
    try {
      if (departedDropTargets.length > 0) {
        const changeDetails = createDragEventDetails<DragEndReason>(
          reason,
          event,
          snapshotLocation(),
          source,
          null,
        );
        // A torn-down round means a consumer ended the session re-entrantly and
        // the terminal `onMoveEnd` already fired. Don't dispatch again.
        if (!dispatchChangeRound(departedDropTargets, [], changeDetails)) {
          return;
        }
      }

      // The `null` target, the cancel reason and the empty `targets` stack let
      // source and monitor `onMoveEnd` handlers tell a cancel from a drop.
      const endDetails = createMoveEndEventDetails(reason, event, snapshotLocation(), source, null);
      endDispatched = true;
      captureTerminalError(() => getSourceHandlers().onMoveEnd?.(endDetails));
      if (!tornDown) {
        dispatchToMonitors('onMoveEnd', endDetails);
      }
    } catch (error) {
      recover(error);
    }

    tearDown();
    // As in `doDrop`, an error from the source `onMoveEnd` is rethrown only after
    // the monitors are notified and a new drag can start.
    rethrowTerminalError();
  }

  const controller: DragSessionController = {
    update(input, target, event, reason) {
      // Set before any dispatch reads them, so this round's details carry the
      // sample they describe. A refresh, such as one from a mid-drag unregister,
      // has no event of its own and keeps the last one.
      lastInputEvent = event;
      lastInputReason = reason;
      updateDropTargets(input, target, true);
      // Sensors coalesce input before calling `update`, so deliver `onMove` in
      // this frame. A consumer callback in `updateDropTargets` can call `cancelDrag()`.
      if (!tornDown) {
        dispatchDrag();
      }
    },
    drop: doDrop,
    cancel: doCancel,
  };

  // Armed before the start-time dispatches below, including the initial stack
  // resolution. The sensors record their session only after `start()` returns,
  // so a `cancelDrag()` from a resolver, `onGenerateDragPreview` or `onMoveStart`
  // can reach the session only through this hook (see `cancelLifecycleDrag`).
  session.cancelArmed = true;
  state.session = session;

  // Consumer code may throw here. `activateMonitors` runs the monitor getters,
  // and the source's `onGenerateDragPreview` runs the consumer's preview
  // `render`. A throw would leave the engine half-built, with the session set
  // and the monitors active, and `isActive()` would stay `true` for good. Every
  // step that runs consumer code stays inside this `try`, which tears down
  // before rethrowing.
  try {
    activateMonitors(source);

    // Armed before the initial resolution and the synchronous
    // `onGenerateDragPreview` dispatch, so a consumer that unregisters an initial
    // drop target during either gets its refresh queued instead of lost. The
    // refresh waits for `onMoveStart` (see `startDispatched`), so the target is
    // still published and entered with the rest of the initial stack, and then
    // leaves it, with its `onDraggableLeave`, right after that dispatch.
    session.refreshArmed = true;

    // Resolve the stack under the pickup point now that the cancel is armed and
    // the monitors are active. A `cancelDrag()` from a resolver then behaves
    // like one from `onGenerateDragPreview`. `doCancel` delivers the terminal
    // `onMoveEnd` and tears the session down, and the sensor gets `null` below.
    const initialDropTargets = resolveStack(initialTarget, initialInput);
    if (tornDown) {
      return null;
    }
    location.initial = { input: initialInput, targets: initialDropTargets };
    location.current = location.initial;

    const previewPayload: DraggablePreviewRenderParameters = {
      location: snapshotLocation(),
      source,
    };

    getSourceHandlers().onGenerateDragPreview?.(previewPayload);
  } catch (error) {
    tearDown();
    throw error;
  }

  // Canceled from `onGenerateDragPreview`. The terminal events went out and the
  // session is gone. Return `null` so the sensor releases the resources it just
  // acquired through its refused-session path.
  if (tornDown) {
    return null;
  }

  // The first publish comes after `onGenerateDragPreview`, so a throw there
  // never publishes a session.
  publishSession();

  // Dispatch only once the session snapshot, `controller` and `state.session`
  // are in place, so a consumer that cancels or updates from `onMoveStart`
  // acts on a complete session.
  dispatchDragStart();

  // As above, a cancel from `onMoveStart` has already torn the session down.
  // Return `null` to the sensor instead of a dead controller.
  return tornDown ? null : controller;
}

/**
 * Ends the active drag session without terminal dispatch. Only test cleanup
 * uses it, because a session recovering from a consumer throw tears itself down.
 */
export function reset(): void {
  state.session?.tearDown();
}

export type SourceHandlers = Pick<
  DraggableConfig<any, any>,
  'onGenerateDragPreview' | 'onMoveStart' | 'onMove' | 'onTargetChange' | 'onMoveEnd'
>;

export interface DragSessionController {
  /**
   * `event` is the native event this sample came from. It reaches `eventDetails.event` on
   * `onMove`, `onTargetChange`, `onDraggableEnter` and `onDraggableLeave`, so those
   * handlers can read modifier keys from a real event instead of a placeholder.
   * Sensors may coalesce several raw samples before calling `update`, which then
   * reports the last sample's event alongside its `location.current`.
   */
  update(input: DraggableInput, target: Element | null, event: Event, reason: DragMoveReason): void;
  /** End the drag as a release at `input` over `target`. */
  drop(input: DraggableInput, target: Element | null, event?: Event): void;
  /**
   * End the drag as a cancel. `reason` is reported in `onMoveEnd`'s `eventDetails`.
   * It defaults to `'imperative-action'` because the public `cancelDrag()` is the
   * only caller that doesn't pass one.
   */
  cancel(input?: DraggableInput, reason?: DragCanceledReason, event?: Event): void;
}

export interface StartParameters {
  payload: DraggableRootRecord;
  /**
   * Returns the drag source's latest event handlers. It is read on every dispatch,
   * so a draggable that re-renders mid-drag runs its current closures. Only the
   * source's `kind` stays fixed at drag start.
   */
  getSourceHandlers: () => SourceHandlers;
  initialInput: DraggableInput;
  initialTarget: Element | null;
  /**
   * The native event the pickup committed on. Reported as `eventDetails.event` on
   * `onMoveStart` and on the initial stack's `onDraggableEnter`, so those don't get
   * a placeholder.
   */
  initialEvent?: Event | undefined;
  /**
   * Why the pickup started, reported as `eventDetails.reason` on `onMoveStart`
   * and on the initial stack's `onDraggableEnter`.
   */
  startReason: DragStartReason;
  /**
   * The press point minus the source's border-box origin, in client pixels,
   * measured before `[data-dragging]` styling applies. Anchors
   * `getSnappedLocalPoint({ anchor: 'source' })`.
   */
  grabOffset: { x: number; y: number };
  /** The element under a client point, excluding the drag's own preview. */
  hitTest: (clientX: number, clientY: number) => Element | null;
  /**
   * Sensor cleanup, called from the lifecycle's teardown. The sensor passes its
   * `clearActive()`, so an abnormal end, such as a consumer throw or `reset()`,
   * still releases its `state.active`, listeners, `dragRootLock` and preview node.
   * Otherwise every later `pointerdown` would be rejected. Must be idempotent,
   * because the normal end path also runs it after the sensor cleared itself.
   */
  onForceCleanup: () => void;
}
