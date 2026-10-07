/**
 * The drag lifecycle state machine. It resolves drop targets, dispatches events to
 * the source, targets and monitors, and publishes the session snapshot. Sensors call
 * `start()`, drive the returned controller and own the preview. The rest of the
 * engine reads the session through `dragSession.ts`.
 */

import { areArraysEqual } from '@base-ui/utils/areArraysEqual';
import { REASONS } from '../../../internals/reasons';
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
  DragEndReason,
  DragMoveReason,
  DragStartReason,
  DraggableEventDetailsMap,
} from '../types';
import type { DraggableConfig } from '../draggable';
import type { DragPreview } from '../synthetic/syntheticPreview';
import { createDragEventDetails, createMoveEndEventDetails } from '../dragEventDetails';
import {
  captureDropTargetCollision,
  dispatchToDropTarget,
  getClosedShadowRootsByHost,
  getDropTargetsOver,
} from '../dropTarget';
import type { DropTargetDragData } from '../dropTarget';
import { createHoverLedger } from '../hoverLedger';
import { createMonitorDispatch } from '../monitor';
import { cloneLocationHistory, setDragSession } from '../dragSessionStore';
import { containConsumerError, getComposedParentElement, runAllCleanups } from '../utils';
import { clearActiveSession, getActiveSession, setActiveSession } from './dragSession';
import type { DragSession, DragSessionPhase } from './dragSession';

function dropTargetRecordsEqual(a: DraggableTargetRecord, b: DraggableTargetRecord): boolean {
  return a.element === b.element;
}

export function start(parameters: StartParameters): DragSessionController | null {
  if (getActiveSession() !== null) {
    return null;
  }

  const {
    source,
    getSourceHandlers,
    initialInput,
    initialTarget,
    initialEvent,
    startReason,
    grabOffset,
    hitTest,
    onRelease,
    preview = null,
    sensor,
  } = parameters;

  let phase: DragSessionPhase = 'starting';

  // This drag's monitors and target `dragData`, which end with it.
  const monitors = createMonitorDispatch(source);
  const dispatchToMonitors = monitors.dispatch;
  const targetDragData: DropTargetDragData = new WeakMap();

  // Whether `cancel` and the target refreshes may run. Set before the start
  // dispatches and cleared when the end sequence begins (see `disarmSessionHooks`).
  let armed = false;

  // Run by `tearDown`, whatever ended the session (see `DragSession.onEnd`).
  const endListeners = new Set<() => void>();

  let sensorReleased = false;

  /** Calls `sensor.release` once (see `DragSessionSensor.release`). */
  function releaseSensor(cancelReason?: DragCanceledReason): void {
    if (!sensorReleased) {
      sensorReleased = true;
      sensor?.release(cancelReason);
    }
  }

  // The latest sample's native event, reported as `eventDetails.event`. Starts as
  // the pickup event so events before the first move still report a real one.
  let lastInputEvent: Event | undefined = initialEvent;
  let lastInputReason: DragMoveReason = REASONS.pointer;

  // The target whose `canDrop` rejected at the current position, and the one last
  // published. A rejection change can leave the stack element-equal (empty before
  // and after), so it publishes on its own, or `data-rejected` would never update.
  let rejectedTarget: Element | null = null;
  let publishedRejectedTarget: Element | null = null;

  const onReject = (element: Element) => {
    rejectedTarget = element;
  };

  function resolveStack(target: Element | null, input: DraggableInput): DraggableTargetRecord[] {
    rejectedTarget = null;
    return getDropTargetsOver(target, { input, source }, targetDragData, onReject);
  }

  // Empty until the initial stack resolves below, once cancel is armed.
  const initialLocation: DraggableLocation = {
    input: initialInput,
    targets: [],
  };

  const location: DraggableLocationHistory = {
    grabOffset: { ...grabOffset },
    initial: initialLocation,
    current: initialLocation,
    // The pickup point with nothing entered, so diffing `current` against
    // `previous` reads a zero delta on the first event.
    previous: { input: initialLocation.input, targets: [] },
  };

  /**
   * The copy of `location` consumers receive. `location` is mutable bookkeeping:
   * passed out directly, a saved event would report the latest position instead of
   * its own, and a handler could `splice()` `targets` mid-fan-out. One snapshot per
   * round, so every recipient of an event sees the same state.
   */
  function snapshotLocation(): DraggableLocationHistory {
    return cloneLocationHistory(location);
  }

  /** Event details for a dispatch driven by the latest input. */
  function createMoveDetails(target: DraggableTargetRecord | null) {
    return createDragEventDetails(
      lastInputReason,
      lastInputEvent,
      snapshotLocation(),
      source,
      target,
    );
  }

  /**
   * The location for the terminal `onDraggableLeave`, with `current.targets` empty.
   * A fresh copy, so the location end handlers received with the drop stack doesn't
   * change under them.
   */
  function createTerminalLeaveLocation(input: DraggableInput): DraggableLocationHistory {
    const leaveLocation = snapshotLocation();
    return { ...leaveLocation, previous: leaveLocation.current, current: { input, targets: [] } };
  }

  // The location at the last delivered event. `previous` advances per dispatch,
  // not per raw sample.
  let lastDispatched: DraggableLocation = location.previous;

  // The element the stack was last resolved from. Refreshes walk up from it again.
  let lastTarget: Element | null = initialTarget;

  // Consumer callbacks can tear the session down mid-dispatch, so dispatch paths
  // check this before publishing, and fan-outs check it between deliveries.
  let tornDown = false;
  const isLive = () => !tornDown;

  // Set while consumer code runs. A refresh it triggers (see `releaseTarget`) queues
  // until the round ends: re-entering `updateDropTargets` would let the outer round's
  // stale stack overwrite the ledger and bring an unregistered target back.
  let dispatching = false;
  let refreshPending = false;
  let pendingRefreshNeedsHitTest = false;

  // Latched before the terminal `onMoveEnd`, so recovering from a throw in it
  // doesn't send a second one.
  let endDispatched = false;

  // A refresh before `onMoveStart`, such as an unregister in `onGenerateDragPreview`,
  // queues like a mid-round one. Otherwise targets would get enters before their start.
  let startDispatched = false;

  // Terminal leaves go to the ledger, not `location.current`, which a re-entrant
  // cancel can leave reassigned mid-round. `dispatchDragStart` fills it for the
  // initial stack.
  const hover = createHoverLedger();

  // The parameter refresh queued in a microtask. With `targets: null` it always
  // runs. Otherwise it runs only when one of these elements is on the walk.
  let queuedRefresh: { targets: Set<Element> | null; rehitTest: boolean } | null = null;

  /** Whether a changed element belongs to the current resolution walk. */
  function walksThrough(elements: ReadonlySet<Element>): boolean {
    // A detached last target needs a new hit-test, whose ancestors aren't known yet.
    if (lastTarget !== null && !lastTarget.isConnected) {
      return true;
    }
    // Walk every ancestor as resolution does, not just the accepted stack: a change
    // to a disabled, abstaining or rejecting target can matter too.
    const closedRoots = getClosedShadowRootsByHost();
    for (let node = lastTarget; node !== null; node = getComposedParentElement(node, closedRoots)) {
      if (elements.has(node)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Re-resolves the stack after a registration or parameter change. A refresh
   * requested inside a consumer fan-out, or before `onMoveStart` has gone out,
   * is queued (see `dispatching` and `startDispatched`).
   */
  function refresh(rehitTest: boolean): void {
    if (dispatching || !startDispatched) {
      refreshPending = true;
      pendingRefreshNeedsHitTest ||= rehitTest;
      return;
    }
    resolveDropTargetsFromLastTarget(rehitTest, false);
  }

  // Published through `setActiveSession` below, once the controller is built.
  const session: DragSession = {
    get phase() {
      return phase;
    },
    source,
    grabOffset,
    get preview() {
      // The sensor tears its side down when the end sequence begins, so the
      // preview is no longer the drag's to update or retarget.
      return phase === 'ending' ? null : preview;
    },
    getLocation: snapshotLocation,
    getRawInput: () => sensor?.getRawInput() ?? null,
    notifyScroll() {
      sensor?.notifyScroll();
    },
    cancel() {
      if (armed) {
        doCancel();
      }
    },
    onEnd(listener) {
      if (tornDown) {
        listener();
        return () => {};
      }
      endListeners.add(listener);
      return () => {
        endListeners.delete(listener);
      };
    },
    releaseTarget(element, getParameters) {
      // While starting, any target may be in the not-yet-entered initial stack.
      // Otherwise only a target owed a leave changes the stack. Ask the ledger, not
      // the published snapshot: a target that entered and unregistered in the same
      // round isn't published yet, and the coalesced refresh would run after it's gone.
      if (phase === 'starting' || hover.has(element)) {
        // Keep the registration readable until the leave goes out. The refresh may
        // only queue (see `refresh`), and the registry entry is gone when it drains.
        hover.retain(element, getParameters);
        // Refresh now so subscribers see the leave without waiting for a pointer
        // event. Walk up instead of hit-testing: only registrations changed, and a
        // React unmount runs this mid-commit, where `elementFromPoint` forces layout.
        if (armed) {
          refresh(false);
        }
      } else {
        session.scheduleTargetRefresh(null, true);
      }
    },
    scheduleTargetRefresh(element, rehitTest = false) {
      if (!armed) {
        return;
      }
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
        if (!tornDown && armed && (job.targets === null || walksThrough(job.targets))) {
          refresh(job.rehitTest);
        }
      });
    },
  };

  /**
   * Starts the `ending` phase and turns `cancel` and refreshes off, so only the end
   * sequence updates the stack.
   */
  function disarmSessionHooks(): void {
    armed = false;
    phase = 'ending';
  }

  /**
   * Delivers contained terminal leaves and `onMoveEnd` before an error tears the
   * session down. `tearDown()` notifies no consumer, so an app pairing `onMoveStart`
   * with `onMoveEnd` would otherwise stay in its dragging state. Contained so a
   * second throw can't replace the original error.
   */
  function dispatchRecoveryEnd(): void {
    if (endDispatched || tornDown) {
      return;
    }
    // Recovery owns the terminal sequence, even against callbacks that cancel or
    // unregister a target mid-leave.
    endDispatched = true;
    disarmSessionHooks();
    // `hover.change`, not `dispatchChangeRound`: the source handler may be the one
    // that threw, and must not block the leaves.
    const departedDropTargets = hover.owed();
    if (departedDropTargets.length > 0) {
      const leaveDetails = createDragEventDetails<DragEndReason>(
        REASONS.handlerError,
        undefined,
        createTerminalLeaveLocation(location.current.input),
        source,
        null,
      );
      containConsumerError(
        'Base UI: a drag handler threw while another handler error was being recovered. ' +
          'The remaining target cleanup is best-effort.',
        null,
        () => hover.change(departedDropTargets, [], leaveDetails, isLive),
        undefined,
      );
    }
    location.previous = lastDispatched;
    location.current = { input: location.current.input, targets: [] };
    const endDetails = createMoveEndEventDetails(
      REASONS.handlerError,
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
      location: snapshotLocation(),
      rejectedTarget,
    });
  }

  /** The first terminal-handler error, rethrown after teardown (see `captureTerminalError`). */
  let terminalError: { error: unknown } | null = null;

  /**
   * Runs one terminal handler and holds any throw until the end sequence finishes.
   * Uncontained, a throw would skip the monitors and terminal leaves, and
   * `dispatchRecoveryEnd` can't make them up once `endDispatched` is latched.
   */
  function captureTerminalError(run: () => void): void {
    try {
      run();
    } catch (error) {
      terminalError ??= { error };
    }
  }

  function rethrowTerminalError(): void {
    const held = terminalError;
    if (held !== null) {
      terminalError = null;
      throw held.error;
    }
  }

  /**
   * Ends the drag after a consumer throw, so a new one can start, then rethrows. A
   * held terminal error wins, since it came first. Tears down only this session: a
   * drag a handler started re-entrantly must survive.
   */
  function recover(error: unknown): never {
    dispatchRecoveryEnd();
    tearDown();
    rethrowTerminalError();
    throw error;
  }

  /** Runs a consumer round with `dispatching` set. A throw ends the drag (see `recover`). */
  function runDispatch<T>(dispatch: () => T): T {
    dispatching = true;
    try {
      return dispatch();
    } catch (error) {
      return recover(error);
    } finally {
      dispatching = false;
    }
  }

  // `onMoveStart` precedes every enter and drop: a collection that hasn't seen it
  // has no dragged items and would ignore the drop.
  function dispatchDragStart(): void {
    const startDetails = createDragEventDetails(
      startReason,
      lastInputEvent,
      snapshotLocation(),
      source,
      location.current.targets[0] ?? null,
    );
    runDispatch(() => {
      getSourceHandlers().onMoveStart?.(startDetails);
      // A source `onMoveStart` can cancel synchronously, which already delivered
      // the terminal events.
      if (tornDown) {
        return;
      }
      hover.dispatchToAll(location.current.targets, 'onDraggableStart', startDetails, isLive);
      dispatchToMonitors('onMoveStart', startDetails);
      // No change round runs for the initial stack, so enter it here. One at a
      // time: if an enter cancels, the targets not yet entered must not get a leave.
      for (const record of location.current.targets) {
        if (!isLive()) {
          break;
        }
        hover.enter(record, startDetails);
      }
    });
    if (tornDown) {
      return;
    }
    lastDispatched = location.current;
    startDispatched = true;
    drainPendingRefresh();
  }

  function dispatchDrag(): void {
    location.previous = lastDispatched;
    const dragDetails = createMoveDetails(location.current.targets[0] ?? null);
    const { targets } = dragDetails.location.current;
    runDispatch(() => {
      captureDropTargetCollision(targets[0], source);
      getSourceHandlers().onMove?.(dragDetails);
      // A source `onMove` can cancel synchronously.
      if (tornDown) {
        return;
      }
      hover.dispatchToAll(targets, 'onDraggableMove', dragDetails, isLive);
      dispatchToMonitors('onMove', dragDetails);
    });
    if (tornDown) {
      return;
    }
    lastDispatched = location.current;
    drainPendingRefresh();
  }

  // Re-resolves after a registration or parameter change (see `refresh`). `rehitTest`
  // hit-tests at the pointer, since a target mounting under a stationary pointer isn't an
  // ancestor of `lastTarget`. Otherwise the walk starts at `lastTarget` to skip a layout
  // read, unless a virtualizer or reorder detached it, which would empty the stack.
  function resolveDropTargetsFromLastTarget(
    rehitTest: boolean,
    dragDispatchFollows: boolean,
  ): void {
    let target = lastTarget;
    if (rehitTest || (target !== null && !target.isConnected)) {
      const { clientX, clientY } = location.current.input;
      const fresh = hitTest(clientX, clientY);
      // A `null` hit with a connected last target means the pointer left the
      // viewport. Keep the last target so the stack doesn't empty.
      if (fresh !== null || target == null || !target.isConnected) {
        target = fresh;
      }
    }
    updateDropTargets(location.current.input, target, dragDispatchFollows);
  }

  /**
   * Runs the refresh queued during a consumer fan-out (see `dispatching`). It
   * inherits `dragDispatchFollows`, or targets would get `onMove` twice in an
   * `update` frame.
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
   * Runs one change round: the source, each target's enter or leave, then the
   * monitors. Any callback can cancel, which delivers the terminal events itself.
   * Returns whether the session is still live. Callers must dispatch nothing more
   * once it isn't.
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
    hover.change(previousTargets, currentTargets, changeDetails, isLive);
    if (tornDown) {
      return false;
    }
    dispatchToMonitors('onTargetChange', changeDetails);
    return !tornDown;
  }

  /**
   * `dragDispatchFollows` means the caller runs `dispatchDrag()` right after, as
   * `update` does, so this round skips the entry `onMove`.
   */
  function updateDropTargets(
    input: DraggableInput,
    rawTarget: Element | null,
    dragDispatchFollows: boolean,
  ): void {
    lastTarget = rawTarget;

    // Resolution contains consumer throws, so a throw here is an engine bug.
    // Recover anyway, or the session would stay active and refuse every pickup.
    const newDropTargets = runDispatch(() => resolveStack(rawTarget, input));
    // A consumer `canDrop` can cancel synchronously.
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
      location.previous = lastDispatched;
      const moveDetails = createMoveDetails(newDropTargets[0] ?? null);
      runDispatch(() => {
        if (!dispatchChangeRound(previousDropTargets, newDropTargets, moveDetails)) {
          return;
        }

        // Entry `onDraggableMove`, so hover logic can live in that handler alone.
        // Skipped when `dispatchDrag()` follows (see `dragDispatchFollows`).
        if (!dragDispatchFollows && newDropTargets.length > 0) {
          const entryDetails = createMoveDetails(newDropTargets[0]);
          hover.dispatchToAll(newDropTargets, 'onDraggableMove', entryDetails, isLive);
        }
      });

      // Publish only on a change, or selectors would re-run every frame. Not after
      // a re-entrant cancel, which would refill the store teardown cleared.
      if (!tornDown) {
        lastDispatched = location.current;
        publishSession();
      }
    } else {
      // Same elements, fresh records (see `HoverLedger.refresh`).
      hover.refresh(newDropTargets);
      // See `rejectedTarget`.
      if (rejectedTarget !== publishedRejectedTarget) {
        publishSession();
      }
    }
    drainPendingRefresh(dragDispatchFollows);
  }

  // The only full teardown. Also reached through `resetForTests()` in `dragSession.ts`.
  function tearDown(): void {
    if (tornDown) {
      return;
    }
    tornDown = true;
    phase = 'ending';
    // Release the shared state before running cleanup callbacks.
    clearActiveSession(session);

    try {
      // Releases the sensor only after a handler error or a test reset. The end
      // sequences already did otherwise.
      containConsumerError(
        'Base UI: the sensor cleanup threw during teardown.',
        null,
        () => releaseSensor(REASONS.handlerError),
        undefined,
      );
    } finally {
      monitors.end();
      setDragSession(null);
      runAllCleanups(Array.from(endListeners));
      endListeners.clear();
    }
  }

  function doDrop(input: DraggableInput, rawTarget: Element | null, event?: Event): void {
    // A stale sensor call can arrive after re-entrant consumer code ended the drag,
    // or during error recovery, which ends the drag before releasing the sensor.
    if (tornDown || endDispatched) {
      return;
    }
    // From here only the end sequence updates the stack: a refresh a handler
    // requests queues behind `dispatching` and is never drained. The session stays
    // armed until the release commits, so a change handler can still cancel the drop.
    dispatching = true;
    phase = 'ending';
    // A throwing sensor cleanup must not keep the drop from ending the drag.
    captureTerminalError(() => releaseSensor());

    // The final resolution is inside the `try` too, so a throw from it still ends
    // the drag (see `recover`).
    try {
      const freshDropTargets = getDropTargetsOver(rawTarget, { input, source }, targetDragData);
      // A consumer callback in the final resolution can cancel.
      if (tornDown) {
        return;
      }
      // Capture the recipient before any end dispatch can change the stack. `null`
      // means a release over no target (`outside-release`).
      const innermostDropTarget = freshDropTargets[0] ?? null;
      captureDropTargetCollision(innermostDropTarget, source);
      const endReason: DragEndReason = innermostDropTarget ? REASONS.drop : REASONS.outsideRelease;
      const previousDropTargets = location.current.targets;

      location.previous = lastDispatched;
      location.current = { input, targets: freshDropTargets };

      // The release point can resolve a different stack than the last `update`.
      // Reconcile enters and leaves first, so the drop doesn't land on stale hover state.
      if (!areArraysEqual(previousDropTargets, freshDropTargets, dropTargetRecordsEqual)) {
        const changeDetails = createDragEventDetails(
          endReason,
          event,
          snapshotLocation(),
          source,
          innermostDropTarget,
        );
        // A consumer canceled re-entrantly, which already ended the drag.
        if (!dispatchChangeRound(previousDropTargets, freshDropTargets, changeDetails)) {
          return;
        }
      } else {
        // Same elements, fresh records (see `HoverLedger.refresh`).
        hover.refresh(freshDropTargets);
      }

      // Only now: a change handler above can still cancel, and a canceled drag's
      // preview must not settle as dropped.
      onRelease?.(innermostDropTarget !== null);

      // Committed. From here a `cancelDrag()` must not start a second end, and an
      // unregister must not change `location.current` under the dispatches below.
      disarmSessionHooks();

      const endDetails = createMoveEndEventDetails(
        endReason,
        event,
        snapshotLocation(),
        source,
        innermostDropTarget,
      );
      endDispatched = true;
      captureTerminalError(() => getSourceHandlers().onMoveEnd?.(endDetails));
      // A test reset inside `onMoveEnd` tears the session down without notifying
      // anyone. Skip the remaining dispatches then.
      if (!tornDown) {
        // Only the innermost target gets `onDraggableDrop`, so ancestors don't
        // handle the same drop again.
        if (innermostDropTarget) {
          const dropDetails = createDragEventDetails(
            REASONS.drop,
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

        // A final `onDraggableLeave` to every target still hovered, one at a time
        // (see `HoverLedger.leave`).
        const departedDropTargets = hover.owed();
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
            captureTerminalError(() => hover.leave(target, leaveDetails));
          }
        }
      }
    } catch (error) {
      recover(error);
    }

    tearDown();
    // Only now, with the engine restored and every terminal event delivered.
    rethrowTerminalError();
  }

  function doCancel(
    input?: DraggableInput,
    reason: DragCanceledReason = REASONS.imperativeAction,
    event?: Event,
  ): void {
    // A stale call can arrive after re-entrant consumer code has ended the drag.
    if (tornDown || endDispatched) {
      return;
    }
    // From here a `cancelDrag()` must not start a second cancel, and an unregister
    // must not re-resolve the stack, which would send enters with no matching leave.
    disarmSessionHooks();
    // The ledger, not `location.current` (see `hover`).
    const departedDropTargets = hover.owed();
    location.previous = lastDispatched;
    location.current = { input: input ?? location.current.input, targets: [] };
    // As in `doDrop`, the sensor goes before any terminal event.
    captureTerminalError(() => releaseSensor(reason));

    try {
      if (departedDropTargets.length > 0) {
        const changeDetails = createDragEventDetails<DragEndReason>(
          reason,
          event,
          snapshotLocation(),
          source,
          null,
        );
        // A consumer ended the session re-entrantly, so don't dispatch again.
        if (!dispatchChangeRound(departedDropTargets, [], changeDetails)) {
          return;
        }
      }

      // The `null` target and the cancel reason tell a cancel from a drop.
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
    // As in `doDrop`, only after teardown.
    rethrowTerminalError();
  }

  const controller: DragSessionController = {
    update(input, target, event, reason) {
      // Set before any dispatch, so this round reports its own sample. A refresh
      // has no event and keeps the last one.
      lastInputEvent = event;
      lastInputReason = reason;
      updateDropTargets(input, target, true);
      // Sensors already coalesce input, so deliver `onMove` now unless a callback
      // above canceled.
      if (!tornDown) {
        dispatchDrag();
      }
    },
    drop: doDrop,
    cancel: doCancel,
  };

  // Armed before any start-time callback, so a `cancelDrag()` from a resolver,
  // `onGenerateDragPreview` or `onMoveStart` ends the drag. The sensor's release
  // does nothing until `start()` returns, so the sensor undoes the pickup itself
  // when it gets `null`. An unregister meanwhile waits for `onMoveStart` (see
  // `startDispatched`).
  armed = true;
  setActiveSession(session, tearDown);

  // Consumer code here, such as `onGenerateDragPreview`, may throw. Tear down
  // before rethrowing, or the half-built session would block every later drag.
  try {
    // Now that cancel is armed, a `cancelDrag()` from a resolver ends the drag as it
    // would mid-drag.
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

  // Canceled from `onGenerateDragPreview`. `null` sends the sensor down its
  // refused-session path.
  if (tornDown) {
    return null;
  }

  // After `onGenerateDragPreview`, so a throw there never publishes a session.
  phase = 'live';
  publishSession();

  // Last, so a consumer that cancels or updates from `onMoveStart` acts on a
  // complete session.
  dispatchDragStart();

  // Canceled from `onMoveStart`: return `null`, not a dead controller.
  return tornDown ? null : controller;
}

export type SourceHandlers = Pick<
  DraggableConfig<any, any>,
  'onGenerateDragPreview' | 'onMoveStart' | 'onMove' | 'onTargetChange' | 'onMoveEnd'
>;

export interface DragSessionController {
  /**
   * `event` is this sample's native event, reported as `eventDetails.event` so
   * handlers can read modifier keys. A sensor that coalesces samples passes the last
   * one's event.
   */
  update(input: DraggableInput, target: Element | null, event: Event, reason: DragMoveReason): void;
  /** End the drag as a release at `input` over `target`. */
  drop(input: DraggableInput, target: Element | null, event?: Event): void;
  /**
   * End the drag as a cancel. `reason` defaults to `'imperative-action'`, since only
   * the public `cancelDrag()` omits it.
   */
  cancel(input?: DraggableInput, reason?: DragCanceledReason, event?: Event): void;
}

export interface StartParameters {
  source: DraggableRootRecord;
  /** Read on every dispatch, so a source that re-renders mid-drag runs its current handlers. */
  getSourceHandlers: () => SourceHandlers;
  initialInput: DraggableInput;
  initialTarget: Element | null;
  /**
   * The pickup's native event, reported as `eventDetails.event` on `onMoveStart` and
   * the initial enters.
   */
  initialEvent?: Event | undefined;
  /** Reported as `eventDetails.reason` on `onMoveStart` and the initial enters. */
  startReason: DragStartReason;
  /** See {@link DragSession.grabOffset}. Anchors `getSnappedLocalPoint({ anchor: 'source' })`. */
  grabOffset: { x: number; y: number };
  /** The element under a client point, excluding the drag's own preview. */
  hitTest: (clientX: number, clientY: number) => Element | null;
  /**
   * Called when a release ends the drag, with whether it dropped on a target, before
   * any end handler runs. The sensor marks the settling preview with it.
   */
  onRelease?: ((dropped: boolean) => void) | undefined;
  /** See {@link DragSession.preview}. */
  preview?: DragPreview | null | undefined;
  /** The sensor driving the drag. A drag driven without one, such as a test harness, omits it. */
  sensor?: DragSessionSensor | undefined;
}

export interface DragSessionSensor {
  /** See {@link DragSession.getRawInput}. */
  getRawInput(): DraggableInput | null;
  /** See {@link DragSession.notifyScroll}. */
  notifyScroll(): void;
  /**
   * Releases the sensor's listeners, pointer capture, locks and preview. Called once,
   * before any terminal event: with no reason on a release, the cancel reason on a
   * cancel, and `'handler-error'` at teardown when no end sequence ran, or every later
   * `pointerdown` would be rejected.
   */
  release(cancelReason?: DragCanceledReason): void;
}
