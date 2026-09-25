import { Store, type ReadonlyStore } from '@base-ui/utils/store';
import type {
  DraggableLocationHistory,
  DraggableRootRecord,
  DraggableTargetRecord,
} from '../../types/drag';
import { getSharedSlot } from './sharedState';
import { retargetActivePreviewSource } from './activePreview';

/**
 * Snapshot of the active drag, mirrored from the lifecycle for reactive
 * subscribers. `null` when no drag is in progress.
 */
export interface DragSessionState {
  source: DraggableRootRecord;
  location: DraggableLocationHistory;
  /** Element refs of every drop target in the active stack. Enables O(1) membership lookups. */
  dropTargetElements: ReadonlySet<Element>;
  /**
   * The target whose `canDrop` returned `'reject'` for the current position, or
   * `null`. The stack is empty while set (rejection refuses the drop outright),
   * so this is the only record of it; drives `data-rejected`.
   */
  rejectedTarget: Element | null;
}

interface DragSessionSlot {
  store: Store<DragSessionState | null>;
  sourceStore: Store<DraggableRootRecord | null>;
  /** The session source `sourceStore` last published, so a re-entrant write mirrors once. */
  mirroredSource: DraggableRootRecord | null;
  sourceVersion: number;
  targetListeners: Map<Element, Set<() => void>>;
  allTargetListeners: Set<() => void>;
}

const slot = getSharedSlot<DragSessionSlot>('dragSessionStore', () => ({
  store: new Store<DragSessionState | null>(null),
  sourceStore: new Store<DraggableRootRecord | null>(null),
  mirroredSource: null,
  sourceVersion: 0,
  targetListeners: new Map<Element, Set<() => void>>(),
  allTargetListeners: new Set<() => void>(),
}));

/**
 * Read-only handle to the singleton drag-session store. Subscribe with
 * `useStore(dragSessionStore, selector)` or `dragSessionStore.subscribe(fn)`.
 */
export const dragSessionStore: ReadonlyStore<DragSessionState | null> = slot.store;

export const dragSourceStore: ReadonlyStore<DraggableRootRecord | null> = slot.sourceStore;

/** Publish an imperative data update to subscribers of the active source. */
export function notifyDragSourceUpdated(source: DraggableRootRecord): void {
  const session = slot.store.state;
  if (session?.source !== source) {
    return;
  }
  slot.store.setState({ ...session });
  // A session subscriber can synchronously cancel or start another drag.
  if (slot.store.state?.source === source) {
    slot.sourceStore.setState({ ...source });
  }
}

const targetSnapshotOrigins = getSharedSlot(
  'dragSessionStore.targetSnapshotOrigins',
  () => new WeakMap<DraggableTargetRecord, DraggableTargetRecord>(),
);

/** Publish changed target data without resolving the hover stack again. */
export function notifyDragTargetUpdated(source: DraggableRootRecord, element: Element): void {
  const session = slot.store.state;
  if (session?.source !== source) {
    return;
  }
  const location = cloneLocationHistory(session.location);
  for (const entry of [location.initial, location.current, location.previous]) {
    entry.targets = entry.targets.map((target) => {
      if (target.element !== element) {
        return target;
      }
      const original = targetSnapshotOrigins.get(target) ?? target;
      const snapshot = { ...original };
      targetSnapshotOrigins.set(snapshot, original);
      return snapshot;
    });
  }
  setDragSession({ ...session, location });
}

/** Internal: lifecycle-only writer. Not exported from `index.ts`. */
export function setDragSession(state: DragSessionState | null): void {
  const previous = slot.store.state;
  const sourceChanged = previous?.source !== state?.source;
  if (sourceChanged) {
    slot.sourceVersion += 1;
  }
  slot.store.setState(state);
  // Mirror the source for its own subscribers, as a copy: `useStore` re-runs a
  // selector only on a new snapshot reference, and the same `source` object is
  // mutated in place across the drag (see `updateDragSourceElement`). Read back
  // from the store rather than `state`: a session subscriber can synchronously
  // write again, and whichever call runs this last must publish the final source.
  const source = slot.store.state?.source ?? null;
  if (source !== slot.mirroredSource) {
    slot.mirroredSource = source;
    slot.sourceStore.setState(source ? { ...source } : null);
  }

  const listeners = new Set<() => void>();
  // `accepting` changes for potentially every target only when the source
  // changes (drag start/end). Ordinary movement notifies only elements whose
  // over/rejected relationship can have changed.
  if (sourceChanged) {
    for (const listener of slot.allTargetListeners) {
      listeners.add(listener);
    }
  } else {
    for (const element of previous?.dropTargetElements ?? []) {
      for (const listener of slot.targetListeners.get(element) ?? []) {
        listeners.add(listener);
      }
    }
    for (const element of state?.dropTargetElements ?? []) {
      for (const listener of slot.targetListeners.get(element) ?? []) {
        listeners.add(listener);
      }
    }
    for (const element of [previous?.rejectedTarget, state?.rejectedTarget]) {
      if (element) {
        for (const listener of slot.targetListeners.get(element) ?? []) {
          listeners.add(listener);
        }
      }
    }
  }
  for (const listener of listeners) {
    listener();
  }
}

export const DragTargetState = {
  over: 1,
  innermost: 2,
  rejected: 4,
  accepting: 8,
} as const;

export const dragTargetStateStride = DragTargetState.accepting;

export interface DragTargetStateStore extends ReadonlyStore<number> {
  setElement(element: Element | null): void;
}

/**
 * A per-target session view. Movement wakes only targets in the old/new hover
 * stack instead of synchronously running selectors for every target on the page.
 */
export function createDragTargetStateStore(): DragTargetStateStore {
  let element: Element | null = null;
  const listeners = new Set<() => void>();

  const getSnapshot = () => {
    if (element === null) {
      return 0;
    }
    const session = slot.store.state;
    let value = 0;
    if (session?.rejectedTarget === element) {
      value += DragTargetState.rejected;
    } else if (session?.dropTargetElements.has(element)) {
      value += DragTargetState.over;
      if (session.location.current.targets[0]?.element === element) {
        value += DragTargetState.innermost;
      }
    }
    // React 18's `useSyncExternalStoreWithSelector` does not re-run the selector
    // unless this raw snapshot changes. Include a source revision so `accepting`
    // can be recomputed at drag start/end; the selector masks it back out, so a
    // target whose selected state stays false still does not re-render.
    return value + slot.sourceVersion * dragTargetStateStride;
  };

  function addToElement(current: Element | null, listener: () => void): void {
    if (current === null) {
      return;
    }
    let set = slot.targetListeners.get(current);
    if (!set) {
      set = new Set();
      slot.targetListeners.set(current, set);
    }
    set.add(listener);
  }

  function removeFromElement(current: Element | null, listener: () => void): void {
    if (current === null) {
      return;
    }
    const set = slot.targetListeners.get(current);
    set?.delete(listener);
    if (set?.size === 0) {
      slot.targetListeners.delete(current);
    }
  }

  const store: DragTargetStateStore = {
    get state() {
      return getSnapshot();
    },
    getSnapshot,
    subscribe(listener) {
      const notify = () => listener(getSnapshot());
      listeners.add(notify);
      slot.allTargetListeners.add(notify);
      addToElement(element, notify);
      return () => {
        listeners.delete(notify);
        slot.allTargetListeners.delete(notify);
        removeFromElement(element, notify);
      };
    },
    setElement(nextElement) {
      if (element === nextElement) {
        return;
      }
      const previousElement = element;
      element = nextElement;
      for (const listener of listeners) {
        removeFromElement(previousElement, listener);
        addToElement(nextElement, listener);
        listener();
      }
    },
  };
  return store;
}

function updateDragSourceElement(oldElement: Element, newElement: HTMLElement): boolean {
  const state = slot.store.state;
  if (!state || state.source.element !== oldElement) {
    return false;
  }
  // Mutated in place: this is the lifecycle's own `source`, the object every
  // event of the drag reports, and it has to keep reporting the live node.
  state.source.element = newElement;
  slot.store.setState({ ...state });
  // Wake subscribers whose selector returns the source. A copy, not the same
  // object: `useStore` re-runs a selector only on a new snapshot reference, so
  // republishing the mutated object would leave `useActiveDrag()` and
  // `Draggable.Root`'s `dragging` reading the detached node. The mirror above
  // skipped it for the same identity reason.
  slot.sourceStore.setState({ ...state.source });
  return true;
}

/**
 * Follow the active drag source to a fresh node (a virtualizer remounting the
 * dragged row): re-point the session at it, and move the preview's source
 * marking (`data-dragging`) with it. A no-op unless `oldElement` is the active
 * source, so a swap from an unrelated draggable can't hijack the session.
 *
 * The session's `source` is mutated rather than replaced, so
 * `dragSessionStore.state.source` stays `===` the `source` on every event of the
 * drag. `dragSourceStore` publishes a fresh copy instead (its React subscribers
 * need a new reference to re-render), so a `DraggableRootRecord` read from there must not
 * be compared by identity against an event's `source`.
 */
export function retargetDragSource(oldElement: Element, newElement: HTMLElement): void {
  if (updateDragSourceElement(oldElement, newElement)) {
    retargetActivePreviewSource(newElement);
  }
}

/** Whether `element` is the active drag source. */
export function isDraggingElement(
  state: DragSessionState | null,
  element: Element | null,
): boolean {
  if (!state || !element) {
    return false;
  }
  return state.source.element === element;
}

/**
 * Clone a `DraggableLocationHistory`, giving each entry its own copy of the stack.
 * The lifecycle's `location` is live mutable bookkeeping, so everything handed
 * out — session snapshots here, per-dispatch event payloads in the lifecycle —
 * must go through this one clone: a shape change updated in only one hand-out
 * path would silently leak live engine references again.
 */
export function cloneLocationHistory(location: DraggableLocationHistory): DraggableLocationHistory {
  return {
    grabOffset: location.grabOffset ? { ...location.grabOffset } : undefined,
    initial: { input: location.initial.input, targets: location.initial.targets.slice() },
    current: { input: location.current.input, targets: location.current.targets.slice() },
    previous: {
      input: location.previous.input,
      targets: location.previous.targets.slice(),
    },
  };
}

/**
 * Build a fresh `DragSessionState` from the lifecycle's mutable
 * `DraggableLocationHistory`, rebuilding nested objects and arrays so `useStore`
 * `Object.is` comparisons see a new reference per update. Snapshots build only
 * on stack change, so the clone is cheap.
 */
export function buildSessionSnapshot(parameters: {
  source: DraggableRootRecord;
  location: DraggableLocationHistory;
  rejectedTarget: Element | null;
}): DragSessionState {
  const { source, location, rejectedTarget } = parameters;
  const currentDropTargets = location.current.targets;
  const dropTargetElements = new Set<Element>();
  for (let i = 0; i < currentDropTargets.length; i += 1) {
    dropTargetElements.add(currentDropTargets[i].element);
  }
  return {
    source,
    location: cloneLocationHistory(location),
    dropTargetElements,
    rejectedTarget,
  };
}
