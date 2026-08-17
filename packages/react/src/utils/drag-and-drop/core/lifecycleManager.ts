/**
 * Core drag lifecycle state machine.
 *
 * Drop-target resolution, monitor dispatch, the rAF-throttled `onDrag`
 * scheduler, and the session snapshot all live here. The pointer-events sensor
 * starts a session with `start()` and drives the returned controller
 * (`update` / `drop` / `cancel`) from its own listeners. The preview itself is
 * owned by the sensors (see `synthetic/syntheticPreview`).
 */

import { ownerDocument, ownerWindow } from '@base-ui/utils/owner';
import { areArraysEqual } from '@base-ui/utils/areArraysEqual';
import { AnimationFrame } from '@base-ui/utils/useAnimationFrame';
import type {
  DragCanceledReason,
  DragCleanupFn,
  DragDropReason,
  DragEndReason,
  DragLocation,
  DragLocationHistory,
  DragMode,
  DropTargetRecord,
  DragSource,
  DragEventDetailsMap,
  DragEventMap,
  DragInput,
  DragPreviewRenderEvent,
} from '../../../types/drag';
import { createDragEventDetails } from '../dragEventDetails';
import {
  captureDropTargetRegistration,
  clearRetiringDropTargets,
  setSessionGrabOffset,
  dispatchDropTargetChange,
  dispatchToAllDropTargets,
  dispatchToDropTarget,
  getDropTargetShadowRoots,
  getDropTargetsOver,
  refreshHoveredRecords,
} from '../dropTarget';
import { activateMonitors, clearActiveMonitors, dispatchToMonitors } from '../monitor';
import { buildSessionSnapshot, cloneLocationHistory, setDragSession } from '../dragSessionStore';
import { clearPublishedDragPreview } from '../overlay/dragPreviewStore';
import { containConsumerError, elementFromPointIgnoring } from '../utils';
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
  refreshDropTargets: (() => void) | null;
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
 * (no-op if no drag is in progress). Called by `dropTarget()` cleanup when an
 * element un-registers mid-drag, so subscribers see it leave `dropTargets`
 * without a pointer event.
 */
export function refreshDropTargets(): void {
  state.refreshDropTargets?.();
}

/**
 * Whether `element` currently holds hover state the engine has actually
 * delivered.
 *
 * Authoritative earlier than the published session snapshot: a target that
 * enters and unregisters within the same change round is already in the
 * lifecycle's bookkeeping but not yet in the snapshot, and reading the snapshot
 * there routes its cleanup down the coalesced path — by which time its
 * registration is gone and its `onDragLeave` can no longer be dispatched.
 */
export function isHoveredDropTarget(element: Element): boolean {
  return state.isHovered?.(element) ?? false;
}

/**
 * Cancel the active session at the lifecycle level. Fallback for
 * `engine.cancelDrag()`: the sensors record their session only after `start()` returns,
 * so a `cancelDrag()` from one of the synchronous start dispatches
 * (`onGenerateDragPreview` / `onDragStart`) can reach the session only through
 * this hook. A sensor-owned cancel tears the lifecycle down first, which makes
 * this a no-op.
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
    mode,
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

  // The target refusing the drag at the current position (`canDrop` returned
  // `'reject'`), and the value the last published snapshot carried. A rejection
  // flip usually leaves the stack element-equal (empty before, empty after), so
  // it needs its own publish trigger.
  let rejectedTarget: Element | null = null;
  let publishedRejectedTarget: Element | null = null;

  function resolveStack(target: Element | null, input: DragInput): DropTargetRecord[] {
    rejectedTarget = null;
    return getDropTargetsOver(target, { input, source }, (element) => {
      rejectedTarget = element;
    });
  }

  const initialDropTargets = resolveStack(initialTarget, initialInput);

  const initialLocation: DragLocation = {
    input: initialInput,
    dropTargets: initialDropTargets,
  };

  const location: DragLocationHistory = {
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

  // The location snapshot at the last *delivered* event. `location.previous` is
  // documented as "the location at the prior event", but raw pointer samples
  // arrive several times per rAF-throttled `onDrag` — so `previous` is
  // reassigned from this snapshot right before each dispatch, never per raw
  // sample, keeping a consumer's `current` vs `previous` diff the movement
  // since the last event it actually saw.
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

  // Whether the terminal `onDragEnd` has been delivered. The recovery path below
  // reads it so a throw *from* `onDragEnd` doesn't produce a second one.
  let endDispatched = false;

  // The outcome the committed end sequence reported, recorded before the
  // consumer terminal dispatches. `doDrop` rethrows a throwing consumer handler
  // *instead of returning*, so a sensor that needs the outcome anyway (keyboard
  // focus restore) reads it here rather than misreading the drop as a cancel.
  let committedOutcome: DropOutcome | null = null;

  // Whether `onDragStart` has gone out. A refresh requested before that — a
  // consumer unregistering a target from `onGenerateDragPreview` — would resolve
  // and dispatch `onDropTargetChange`/`onDrag` to targets that have not had
  // `onDragStart` yet, so it queues like a mid-round one.
  let startDispatched = false;

  // The targets whose hover state has actually been delivered. Mutated by
  // `dispatchDropTargetChange` as enters/leaves are dispatched, so when a
  // re-entrant cancel interrupts a change dispatch halfway, the terminal leave
  // in `doDrop`/`doCancel` reaches exactly the targets that still believe they
  // are hovered — not the already-reassigned `location.current` stack.
  //
  // Starts empty even though `initialDropTargets` is already resolved: the stack
  // under the pickup point is entered one record at a time in `dispatchDragStart`,
  // each pushed here immediately before its own `onDragEnter`, exactly as
  // `dispatchDropTargetChange` does mid-drag. Seeding it up front would owe a
  // terminal leave to targets whose enter never ran, which is what a re-entrant
  // cancel from an inner target's enter produces.
  const hoveredDropTargets: DropTargetRecord[] = [];

  /**
   * Best-effort terminal dispatch before an error tears the session down.
   *
   * `tearDown()` alone restores the *engine*, but says nothing to consumers: an
   * app that pairs `onDragStart` with `onDragEnd` — a page-level dragging class,
   * a drop indicator, an optimistic reorder — would be stranded in its dragging
   * state by any handler that throws. Deliver one contained `onDragEnd` first, so
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
      const leaveLocation = snapshotLocation();
      const leavePayload: DragEventMap['onDropTargetChange'] = {
        location: {
          initial: leaveLocation.initial,
          previous: leaveLocation.current,
          current: { input: leaveLocation.current.input, dropTargets: [] },
        },
        source,
        mode,
      };
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
    const endPayload: DragEventMap['onDragEnd'] = {
      location: snapshotLocation(),
      source,
      mode,
      canceled: true,
      dropTarget: null,
    };
    containConsumerError(
      'Base UI: a drag handler threw, so the drag was torn down. ' +
        'The terminal onDragEnd is best-effort.',
      null,
      () => {
        getSourceHandlers?.()?.onDragEnd?.(endPayload, endDetails);
        dispatchToMonitors('onDragEnd', endPayload, endDetails);
      },
      undefined,
    );
  }

  function publishSession(): void {
    publishedRejectedTarget = rejectedTarget;
    setDragSession(buildSessionSnapshot({ source, location, mode, rejectedTarget }));
  }

  /**
   * The first error thrown by a *source* handler inside the terminal sequence,
   * rethrown once that sequence has finished (see {@link captureTerminalError}).
   */
  let terminalError: { error: unknown } | null = null;

  /**
   * Run one source-side terminal handler, holding any throw until the rest of the
   * end sequence has run.
   *
   * Everywhere else in the engine a broken consumer costs only its own callback —
   * `containConsumerError` per monitor, `safeCall` per drop target. The source's
   * `onDrop`/`onDragEnd` were the exception: an uncontained throw there skipped
   * the drop target's `onDrop`, both monitor dispatches, and every terminal
   * `onDragLeave` — and `dispatchRecoveryEnd` cannot make up for it, since
   * `endDispatched` is already latched by then. So the throw is captured, the
   * sequence completes, and it is rethrown at the end: the same shape
   * `runAllCleanups` uses.
   */
  function captureTerminalError(run: () => void): void {
    try {
      run();
    } catch (error) {
      terminalError ??= { error };
    }
  }

  /** Take the swallowed source error, clearing it so it can only surface once. */
  function popTerminalError(): unknown {
    const held = terminalError;
    terminalError = null;
    return held?.error;
  }

  /** Rethrow whatever a source terminal handler swallowed above, after teardown. */
  function rethrowTerminalError(): void {
    if (terminalError !== null) {
      throw popTerminalError();
    }
  }

  // Keeps `onDragStart` ahead of any onDrop/onDragEnter: a collection that hasn't
  // seen onDragStart has an empty dragged-item set and would swallow the drop.
  function dispatchDragStart(): void {
    const dragStartPayload: DragEventMap['onDragStart'] = {
      location: snapshotLocation(),
      source,
      mode,
    };
    const startDetails = createDragEventDetails(mode, lastInputEvent);
    dispatching = true;
    try {
      getSourceHandlers?.()?.onDragStart?.(dragStartPayload, startDetails);
      // A source `onDragStart` can synchronously cancel the drag (public
      // `cancelDrag()`); the cancel already delivered the terminal events, so
      // the targets/monitors must not see a start for a drag that just ended.
      if (tornDown) {
        return;
      }
      dispatchToAllDropTargets(
        location.current.dropTargets,
        'onDragStart',
        dragStartPayload,
        startDetails,
        isLive,
      );
      dispatchToMonitors('onDragStart', dragStartPayload, startDetails);
      // The stack under the pickup point is published in `dropTargetElements` and
      // owed a terminal `onDragLeave` by `doDrop`/`doCancel`, so it has to be told
      // it was entered too. The only other emitter of `onDragEnter` is
      // `dispatchDropTargetChange`, which never runs for this first stack: there
      // is no previous stack to diff it against. Last in the round, so
      // `onDragStart` stays ahead of every enter.
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
        dispatchToDropTarget(record, 'onDragEnter', dragStartPayload, startDetails);
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
    lastDispatched = {
      input: location.current.input,
      dropTargets: location.current.dropTargets,
    };
    startDispatched = true;
    drainPendingRefresh();
  }

  // Schedule in the source window so popout drags are not throttled with their opener.
  const dragFrame = new AnimationFrame(ownerWindow(source.element));
  // A flag rather than a prebuilt payload: `location.previous` only advances
  // below, at delivery, so a payload snapshotted when the sample arrived would
  // carry a `previous` from before the coalescing window.
  let dragPending = false;

  function dispatchPendingDrag(): void {
    if (!dragPending) {
      return;
    }
    dragPending = false;
    // See `lastDispatched`: `previous` reflects the last delivered event, so
    // several coalesced raw samples read as one movement here.
    location.previous = lastDispatched;
    const dragPayload: DragEventMap['onDrag'] = { location: snapshotLocation(), source, mode };
    const dragDetails = createDragEventDetails(mode, lastInputEvent);
    dispatching = true;
    // recover on throw (see dispatchDragStart)
    try {
      getSourceHandlers?.()?.onDrag?.(dragPayload, dragDetails);
      // A source `onDrag` can synchronously cancel; deliver nothing further.
      if (tornDown) {
        return;
      }
      dispatchToAllDropTargets(
        dragPayload.location.current.dropTargets,
        'onDrag',
        dragPayload,
        dragDetails,
        isLive,
      );
      dispatchToMonitors('onDrag', dragPayload, dragDetails);
    } catch (error) {
      dispatchRecoveryEnd();
      reset();
      throw error;
    } finally {
      dispatching = false;
    }
    lastDispatched = {
      input: location.current.input,
      dropTargets: location.current.dropTargets,
    };
    drainPendingRefresh();
  }

  function scheduleDrag(): void {
    dragPending = true;
    // Only arm a frame when none is pending; further moves in the same frame just
    // re-set `dragPending`, coalescing into one onDrag per frame.
    if (dragFrame.currentId === null) {
      dragFrame.request(dispatchPendingDrag);
    }
  }

  // Dispatch any pending throttled `onDrag` immediately (see DragSessionController.flushDrag).
  function flushDrag(): void {
    dragFrame.cancel();
    dispatchPendingDrag();
  }

  function cancelPendingDrag(): void {
    dragFrame.cancel();
    dragPending = false;
  }

  // Re-resolve the stack after a registration change (see the
  // `state.refreshDropTargets` installation below for when this is armed).
  // Always re-hit-test from the pointer position rather than walking up from
  // `lastTarget`: a target that mounts *over* a stationary pointer (a panel
  // fading in mid-drag) is not an ancestor of the old target, and a detached
  // `lastTarget` (virtualizer/live reorder) would resolve an empty stack. The
  // preview is skipped so it can't be hit and spuriously empty the stack.
  function resolveDropTargetsFromLastTarget(): void {
    let target = lastTarget;
    const { clientX, clientY } = location.current.input;
    const fresh = elementFromPointIgnoring(
      ownerDocument(source.element),
      clientX,
      clientY,
      synthetic.getPreviewElement(),
      getDropTargetShadowRoots(),
    );
    // A `null` hit with a still-connected last target means the pointer is
    // outside the viewport (captured pointer drag); keep the last target so the
    // stack doesn't spuriously empty.
    if (fresh !== null || target == null || !target.isConnected) {
      target = fresh;
    }
    updateDropTargets(location.current.input, target);
  }

  function drainPendingRefresh(): void {
    while (refreshPending && !tornDown) {
      refreshPending = false;
      resolveDropTargetsFromLastTarget();
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
    changePayload: DragEventMap['onDropTargetChange'],
    changeDetails: DragEventDetailsMap['onDropTargetChange'],
  ): boolean {
    getSourceHandlers?.()?.onDropTargetChange?.(changePayload, changeDetails);
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
    dispatchToMonitors('onDropTargetChange', changePayload, changeDetails);
    return !tornDown;
  }

  function updateDropTargets(input: DragInput, rawTarget: Element | null, event?: Event): void {
    lastTarget = rawTarget;
    // Advanced before any dispatch below reads it, so this round's details carry
    // the sample they describe. A refresh with no event of its own (a mid-drag
    // unregister) keeps the last real one rather than regressing to a placeholder.
    if (event !== undefined) {
      lastInputEvent = event;
    }

    const newDropTargets = resolveStack(rawTarget, input);
    // A consumer resolver (`getPayload` / `canDrop`) can synchronously cancel the
    // drag. Teardown already delivered the terminal events and cleared the
    // session, so do not mutate or publish location state for the dead drag.
    if (tornDown) {
      return;
    }
    const previousDropTargets = location.current.dropTargets;
    // Captured before `location.current` is reassigned below. `refreshDropTargets`
    // re-runs with the same `input` (no pointer movement), so this lets the change
    // branch tell a genuine new-input update from an unrelated refresh.
    const previousInput = location.current.input;

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
      const changePayload: DragEventMap['onDropTargetChange'] = {
        location: snapshotLocation(),
        source,
        mode,
      };
      const moveDetails = createDragEventDetails(mode, lastInputEvent);
      dispatching = true;
      // recover on throw (see dispatchDragStart)
      try {
        if (!dispatchChangeRound(previousDropTargets, newDropTargets, changePayload, moveDetails)) {
          return;
        }

        // Cancel stale onDrag only when this change came from genuine new pointer
        // input; a stack change from an unrelated `refreshDropTargets()` (e.g. a
        // virtualizer unregister) must not discard a queued real-movement onDrag.
        if (input !== previousInput) {
          cancelPendingDrag();
        }

        // Sync onDrag to current targets on the entering frame so target-side
        // hover logic lives in `onDrag` only (source `onDrag` stays throttled).
        if (newDropTargets.length > 0) {
          const dragPayload: DragEventMap['onDrag'] = {
            location: snapshotLocation(),
            source,
            mode,
          };
          dispatchToAllDropTargets(newDropTargets, 'onDrag', dragPayload, moveDetails, isLive);
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
        lastDispatched = { input, dropTargets: newDropTargets };
        publishSession();
      }
      drainPendingRefresh();
    } else {
      // Element-equal stack, freshly resolved records: no change dispatch runs,
      // so swap the hovered bookkeeping's records here — the terminal leave on
      // drop/cancel reads them, and must report the last-resolved `self.payload`
      // like the intermediate `onDrag`s did.
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
    dragPending = false;

    // Release the shared state before running cleanup callbacks.
    state.isActive = false;
    state.dragCleanup = null;
    state.dragCancel = null;
    state.refreshDropTargets = null;
    state.isHovered = null;

    dragFrame.cancel();
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

  function doDrop(
    input: DragInput,
    rawTarget: Element | null,
    event?: Event,
    onResolved?: ((location: DragLocationHistory) => void) | undefined,
  ): DropOutcome {
    // A stale sensor/controller call can arrive after re-entrant consumer code
    // has already ended the drag. Committing on top of that rollback would
    // deliver a second terminal event for one drag.
    if (tornDown) {
      return { canceled: true, dropTarget: null };
    }
    cancelPendingDrag();
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
    // stack. `onDragEnd` running earlier could re-resolve `location.current` (via
    // an unregister-triggered refresh), and re-reading `[0]` there could hand the
    // drop to a different target than the one this end was resolved against.
    // `null` here — released over no target — is the `outside-release` outcome
    // (`canceled: false`, `dropTarget: null`).
    const innermostDropTarget = freshDropTargets[0] ?? null;
    // Captured with the snapshot: the source's `onDragEnd` (which is told the
    // drop landed first) may synchronously unregister the target while tearing
    // down its zones — the drop it was just told about must still reach the
    // target's `onDrop` below rather than silently no-op on a re-read.
    const innermostRegistration = innermostDropTarget
      ? captureDropTargetRegistration(innermostDropTarget)
      : undefined;
    // Two outcomes share this path: a committed drop, and a release over nothing.
    // Both are `canceled: false`, which is exactly why the reason exists — and why
    // `onDrop` fires for the first one only.
    const endDetails = createDragEventDetails<DragEndReason>(
      innermostDropTarget ? 'drop' : 'outside-release',
      event,
    );
    const dropDetails = createDragEventDetails<DragDropReason>('drop', event);
    const previousDropTargets = location.current.dropTargets;

    location.previous = lastDispatched;
    location.current = { input, dropTargets: freshDropTargets };

    // The final pointer position can resolve a different stack than the last
    // throttled `update` (the sensor calls `drop` directly). Reconcile
    // enter/leave against the fresh stack before the drop so a newly
    // entered/left target gets onDragEnter/onDragLeave, not a stale-hover onDrop.
    // recover on throw (see dispatchDragStart)
    try {
      if (!areArraysEqual(previousDropTargets, freshDropTargets, dropTargetRecordsEqual)) {
        const changePayload: DragEventMap['onDropTargetChange'] = {
          location: snapshotLocation(),
          source,
          mode,
        };
        // A dead round means a consumer canceled re-entrantly; the cancel path
        // already ran `onDragEnd`/teardown, so skip the drop.
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

      // Keyboard announcements must describe this freshly validated stack, not
      // the last movement snapshot. Run before terminal leaves reset collection
      // position state, but after canDrop and the final change round have settled.
      onResolved?.(snapshotLocation());
      if (tornDown) {
        return { canceled: true, dropTarget: null };
      }

      // Disarm `refreshDropTargets` for the end dispatch: an `onDragEnd` that
      // unregisters a target would otherwise re-enter `updateDropTargets` and
      // shift `location.current` out from under the onDrop/leave dispatch below.
      // `tearDown()` nulls it anyway, so restoring right after the try is fine.
      const savedRefreshFn = state.refreshDropTargets;
      state.refreshDropTargets = null;

      // The end sequence is committed: a `cancelDrag()` from one of the end
      // dispatches below must be a no-op, not a recursive second end.
      state.dragCancel = null;

      const endPayload: DragEventMap['onDragEnd'] = {
        location: snapshotLocation(),
        source,
        mode,
        canceled: false,
        dropTarget: innermostDropTarget,
      };
      // The source's own `onDrop` fires first and only for a committed drop, so
      // the common "commit the move" handler never has to test `canceled` or
      // null-check `dropTarget`. `onDragEnd` still follows for cleanup.
      if (innermostDropTarget) {
        const sourceDropPayload: DragEventMap['onDrop'] = {
          location: snapshotLocation(),
          source,
          mode,
          dropTarget: innermostDropTarget,
        };
        captureTerminalError(() => getSourceHandlers?.()?.onDrop?.(sourceDropPayload, dropDetails));
      }
      // Latched immediately before the dispatch it guards, not above `onDrop`:
      // `onDrop` is the handler the docs steer consumers to for committing a
      // move, so it is the likeliest to throw — and latching earlier would make
      // `dispatchRecoveryEnd` bail, leaving an app that pairs `onDragStart` with
      // `onDragEnd` stranded in its dragging state. `doCancel` latches here too.
      endDispatched = true;
      committedOutcome = { canceled: false, dropTarget: innermostDropTarget };
      if (!tornDown) {
        captureTerminalError(() => getSourceHandlers?.()?.onDragEnd?.(endPayload, endDetails));
      }
      // A consumer `onDragEnd` can synchronously tear the session down; teardown
      // then already notified the targets/monitors, so don't double-dispatch.
      if (!tornDown) {
        // A drop target's `onDrop` only fires on a real drop, and only on the
        // innermost target so ancestors don't double-handle the deepest target's
        // drop. Monitors see the end of every drag via `onDragEnd`. Uses the
        // pre-dispatch snapshot so a re-entrant refresh can't redirect the drop.
        if (innermostDropTarget) {
          const dropPayload: DragEventMap['onDrop'] = {
            location: snapshotLocation(),
            source,
            mode,
            dropTarget: innermostDropTarget,
          };
          dispatchToDropTarget(
            innermostDropTarget,
            'onDrop',
            dropPayload,
            dropDetails,
            innermostRegistration,
          );
          dispatchToMonitors('onDrop', dropPayload, dropDetails);
        }
        dispatchToMonitors('onDragEnd', endPayload, endDetails);

        // Fire final `onDragLeave` for any targets still hovered so imperative
        // hover state clears (the success path never emits a change to empty).
        // Dispatched with a forked location so the leave reports the same shape
        // as the cancel path — the departing targets already out of
        // `current.dropTargets` — without mutating the location `onDrop` /
        // `onDragEnd` handlers saw (and may have stashed) with the drop stack.
        const departedDropTargets = hoveredDropTargets.slice();
        if (departedDropTargets.length > 0) {
          const leaveLocation = snapshotLocation();
          const leavePayload: DragEventMap['onDropTargetChange'] = {
            location: {
              initial: leaveLocation.initial,
              previous: leaveLocation.current,
              current: { input, dropTargets: [] },
            },
            source,
            mode,
          };
          dispatchDropTargetChange(
            departedDropTargets,
            [],
            leavePayload,
            endDetails,
            isLive,
            hoveredDropTargets,
          );
        }

        state.refreshDropTargets = savedRefreshFn;
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
    // The engine is fully restored and every other consumer has had its terminal
    // event; only now does a throwing source handler surface.
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
    // targets still under the pointer, and dispatch `onDragEnter` to them
    // mid-cancel with no balancing leave. `tearDown()` nulls it anyway.
    state.refreshDropTargets = null;
    cancelPendingDrag();

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
        const changePayload: DragEventMap['onDropTargetChange'] = {
          location: snapshotLocation(),
          source,
          mode,
        };
        // A dead round means a consumer tore the session down re-entrantly and
        // the terminal `onDragEnd` already fired; don't dispatch again.
        if (!dispatchChangeRound(departedDropTargets, [], changePayload, endDetails)) {
          return;
        }
      }

      // `canceled: true` (with a `null` `dropTarget` and the empty `dropTargets`
      // stack) lets source/monitor `onDragEnd` handlers distinguish a cancel
      // from a real drop.
      const endPayload: DragEventMap['onDragEnd'] = {
        location: snapshotLocation(),
        source,
        mode,
        canceled: true,
        dropTarget: null,
      };
      endDispatched = true;
      captureTerminalError(() => getSourceHandlers?.()?.onDragEnd?.(endPayload, endDetails));
      if (!tornDown) {
        dispatchToMonitors('onDragEnd', endPayload, endDetails);
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
    // See `doDrop`: a source `onDragEnd` that threw is rethrown only once the
    // monitors have been told and the engine is back to a startable state.
    rethrowTerminalError();
  }

  const controller: DragSessionController = {
    update(input, target, event) {
      updateDropTargets(input, target, event);
      // `updateDropTargets` can re-enter `cancelDrag()` via a consumer callback and
      // tear the session down; scheduling an onDrag after teardown would re-arm a
      // dead session, so only schedule while still live.
      if (!tornDown) {
        scheduleDrag();
      }
    },
    flushDrag,
    drop: doDrop,
    cancel: doCancel,
    get committedOutcome() {
      return committedOutcome;
    },
  };

  state.dragCleanup = tearDown;
  // Armed before the start-time dispatches below: the sensors record their
  // session only after `start()` returns, so a `cancelDrag()` from
  // `onGenerateDragPreview`/`onDragStart` can reach the session only through
  // this hook (see `cancelLifecycleDrag`).
  state.dragCancel = doCancel;

  // User callbacks may throw. `activateMonitors` runs the monitor registration
  // getters, and the source's `onGenerateDragPreview` hook runs the consumer's
  // preview `render`. If any throw, the engine state is half-built
  // (`isActive=true`, monitors registered) and a future `canStart()` would
  // return `false` forever. Keep every consumer-reachable step inside one try
  // and tear down before rethrowing.
  try {
    activateMonitors(source);

    const previewPayload: DragPreviewRenderEvent = {
      location: snapshotLocation(),
      source,
      mode,
    };

    // Installed before the synchronous `onGenerateDragPreview` dispatch so a
    // consumer that unregisters an initial drop target during it gets the stale
    // target dropped from the stack rather than published onDragStart.
    state.refreshDropTargets = () => {
      // Requested from inside a consumer fan-out, or before `onDragStart` has
      // been delivered: queue it (see `dispatching` and `startDispatched`).
      if (dispatching || !startDispatched) {
        refreshPending = true;
        return;
      }
      resolveDropTargetsFromLastTarget();
    };
    state.isHovered = (element) => hoveredDropTargets.some((record) => record.element === element);

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
  // within `onDragStart` acts on a fully-initialized session.
  dispatchDragStart();

  // Same as above: a cancel from within `onDragStart` already tore the session
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
  onDragStart?:
    | ((
        parameters: DragEventMap['onDragStart'],
        eventDetails: DragEventDetailsMap['onDragStart'],
      ) => void)
    | undefined;
  onDrag?:
    | ((parameters: DragEventMap['onDrag'], eventDetails: DragEventDetailsMap['onDrag']) => void)
    | undefined;
  onDropTargetChange?:
    | ((
        parameters: DragEventMap['onDropTargetChange'],
        eventDetails: DragEventDetailsMap['onDropTargetChange'],
      ) => void)
    | undefined;
  onDrop?:
    | ((parameters: DragEventMap['onDrop'], eventDetails: DragEventDetailsMap['onDrop']) => void)
    | undefined;
  onDragEnd?:
    | ((
        parameters: DragEventMap['onDragEnd'],
        eventDetails: DragEventDetailsMap['onDragEnd'],
      ) => void)
    | undefined;
}

/**
 * What a `drop()` resolved to, mirroring the `onDragEnd` payload it produced:
 * `canceled` is `true` only when a consumer handler re-entrantly canceled
 * mid-drop, and `dropTarget` is the target the release landed on (`null` for an
 * outside release or a cancel).
 */
export type DropOutcome = Pick<DragEventMap['onDragEnd'], 'canceled' | 'dropTarget'>;

export interface DragSessionController {
  /**
   * `event` is the native input this sample came from — the `pointermove` or
   * `keydown` the sensor is reacting to. It reaches `eventDetails.event` on
   * `onDrag`, `onDropTargetChange`, `onDragEnter` and `onDragLeave`, so those
   * handlers can read modifier keys off a real event rather than a placeholder.
   * Several raw samples coalesce into one `onDrag`, which then reports the last
   * one's event — the same sample its `location.current` came from.
   */
  update(input: DragInput, target: Element | null, event?: Event): void;
  /**
   * Flush the throttled `onDrag` synchronously so logic that runs right after a
   * move (e.g. keyboard announcements) observes the just-resolved hover state
   * rather than the previous frame's.
   */
  flushDrag(): void;
  /**
   * End the drag as a release at `input` over `target`. Returns the outcome the
   * resulting `onDragEnd` reported. See {@link DropOutcome}.
   */
  drop(
    input: DragInput,
    target: Element | null,
    event?: Event,
    onResolved?: ((location: DragLocationHistory) => void) | undefined,
  ): DropOutcome;
  /**
   * The outcome the committed end sequence reported, or `null` while the drag is
   * live (or after a recovery end). Unlike `drop`'s return value, this survives
   * the rethrow of a throwing consumer terminal handler: the drop did commit,
   * and a caller restoring focus off the outcome must not misread it as a cancel.
   */
  readonly committedOutcome: DropOutcome | null;
  /**
   * End the drag as an abort. `reason` names the exact cause for
   * `onDragEnd`'s `eventDetails`; it defaults to the programmatic one because
   * the public `cancelDrag()` is the only caller that doesn't pass one.
   */
  cancel(input?: DragInput, reason?: DragCanceledReason, event?: Event): void;
}

export interface DragSessionHandle {
  controller: DragSessionController;
}

export interface StartParameters {
  mode: DragMode;
  payload: DragSource;
  /**
   * Getter for the drag source's latest event handlers, read fresh on every
   * dispatch so a draggable that re-renders mid-drag runs its current closures
   * rather than the ones captured at drag start (only `label`/`kind` stay
   * start-time — see the payload snapshot).
   */
  getSourceHandlers?: (() => SourceHandlers | undefined) | undefined;
  initialInput: DragInput;
  initialTarget: Element | null;
  /**
   * The native event the pickup committed on — the `pointermove` that crossed
   * the activation threshold, or the `keydown` that lifted the item. Reported as
   * `eventDetails.event` on `onDragStart` and on the initial stack's
   * `onDragEnter`, so those aren't handed a placeholder either.
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
   * Must be idempotent: the normal-end path also runs it after self-clearing.
   */
  onForceCleanup?: (() => void) | undefined;
}
