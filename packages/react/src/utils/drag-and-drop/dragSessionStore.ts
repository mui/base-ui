import { Store } from '@base-ui/utils/store';
import type { ReadonlyStore } from '@base-ui/utils/store';
import type { DraggableLocationHistory } from '../../draggable/DraggableProvider';
import type { DraggableRootRecord } from '../../draggable/root/DraggableRoot';
import type { DraggableTargetRecord } from '../../draggable/target/DraggableTarget';
import { getSharedSlot } from './sharedState';
import { getActivePreviewHandle } from './activePreview';
import { getOrCreate } from './utils';

/**
 * Snapshot of the active drag, mirrored from the lifecycle for reactive
 * subscribers. `null` when no drag is in progress.
 */
export interface DragSessionState {
  source: DraggableRootRecord;
  location: DraggableLocationHistory;
  /**
   * The target whose `canDrop` returned `'reject'` at the current position, or
   * `null`. A rejection refuses the drop and empties the stack, so this is the
   * only record of it. Drives `data-rejected`.
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
  /** The live record each published target snapshot was copied from. */
  targetSnapshotOrigins: WeakMap<DraggableTargetRecord, DraggableTargetRecord>;
}

const slot = getSharedSlot<DragSessionSlot>('dragSessionStore', () => ({
  store: new Store<DragSessionState | null>(null),
  sourceStore: new Store<DraggableRootRecord | null>(null),
  mirroredSource: null,
  sourceVersion: 0,
  targetListeners: new Map<Element, Set<() => void>>(),
  allTargetListeners: new Set<() => void>(),
  targetSnapshotOrigins: new WeakMap<DraggableTargetRecord, DraggableTargetRecord>(),
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
  // A session subscriber can synchronously cancel or start another drag, so
  // check the source again before publishing it.
  if (slot.store.state?.source === source) {
    slot.sourceStore.setState({ ...source });
  }
}

/** Publish changed target data without resolving the hover stack again. */
export function notifyDragTargetUpdated(source: DraggableRootRecord, element: Element): void {
  const session = slot.store.state;
  if (session?.source !== source) {
    return;
  }
  // A target in none of the stacks has no published snapshot to refresh.
  const { initial, current, previous } = session.location;
  if (
    ![initial, current, previous].some((entry) =>
      entry.targets.some((target) => target.element === element),
    )
  ) {
    return;
  }
  const location = cloneLocationHistory(session.location);
  for (const entry of [location.initial, location.current, location.previous]) {
    entry.targets = entry.targets.map((target) => {
      if (target.element !== element) {
        return target;
      }
      const original = slot.targetSnapshotOrigins.get(target) ?? target;
      const snapshot = { ...original };
      slot.targetSnapshotOrigins.set(snapshot, original);
      return snapshot;
    });
  }
  setDragSession({ ...session, location });
}

/** Writes the session. Only the lifecycle calls it, and `index.ts` doesn't export it. */
export function setDragSession(state: DragSessionState | null): void {
  const previous = slot.store.state;
  const sourceChanged = previous?.source !== state?.source;
  if (sourceChanged) {
    slot.sourceVersion += 1;
  }
  slot.store.setState(state);
  // Publish a copy of the source to its own store. `useStore` re-runs a selector
  // only for a new snapshot reference, and the same `source` object is mutated
  // in place during the drag (see `retargetDragSource`). Read the source back
  // from the store, not from `state`, because a session subscriber can write
  // again synchronously, and the last call to run must publish the final source.
  const source = slot.store.state?.source ?? null;
  if (source !== slot.mirroredSource) {
    slot.mirroredSource = source;
    slot.sourceStore.setState(source ? { ...source } : null);
  }

  const listeners = new Set<() => void>();
  const addElementListeners = (element: Element | null | undefined) => {
    if (!element) {
      return;
    }
    for (const listener of slot.targetListeners.get(element) ?? []) {
      listeners.add(listener);
    }
  };
  // Only a source change, at drag start or end, can change `accepting` for every
  // target. Movement notifies only the elements whose over or rejected state may
  // have changed.
  if (sourceChanged) {
    for (const listener of slot.allTargetListeners) {
      listeners.add(listener);
    }
  } else {
    previous?.location.current.targets.forEach((target) => addElementListeners(target.element));
    state?.location.current.targets.forEach((target) => addElementListeners(target.element));
    addElementListeners(previous?.rejectedTarget);
    addElementListeners(state?.rejectedTarget);
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
 * Creates a per-target view of the session. Movement wakes only the targets in
 * the old and new hover stacks, not the selectors of every target on the page.
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
    } else if (session?.location.current.targets.some((target) => target.element === element)) {
      value += DragTargetState.over;
      if (session.location.current.targets[0]?.element === element) {
        value += DragTargetState.innermost;
      }
    }
    // React 18's `useSyncExternalStoreWithSelector` re-runs the selector only when
    // this raw snapshot changes. Adding the source version lets `accepting` be
    // recomputed at drag start and end. The selector masks the version out, so a
    // target whose selected state stays false doesn't re-render.
    return value + slot.sourceVersion * dragTargetStateStride;
  };

  function addToElement(current: Element | null, listener: () => void): void {
    if (current === null) {
      return;
    }
    getOrCreate(slot.targetListeners, current, () => new Set()).add(listener);
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

/**
 * Moves the active drag source to a new node, for example when a virtualizer
 * remounts the dragged row. Points the session at the new node and moves the
 * preview's source marking (`data-dragging`) to it. Does nothing unless
 * `oldElement` is the active source, so an unrelated draggable's swap can't take
 * over the session.
 *
 * The session's `source` is mutated, not replaced, so `dragSessionStore.state.source`
 * stays `===` to the `source` of every event in the drag. `dragSourceStore`
 * publishes a new copy instead, because its React subscribers need a new
 * reference to re-render. Don't compare a `DraggableRootRecord` read from there
 * to an event's `source` by identity.
 */
export function retargetDragSource(oldElement: Element, newElement: HTMLElement): void {
  const source = slot.store.state?.source;
  if (source?.element !== oldElement) {
    return;
  }
  // Mutated in place because this is the lifecycle's own `source`, which every
  // event of the drag reports. It must point at the live node.
  source.element = newElement;
  // Publishes a copy to `dragSourceStore`. Republishing the mutated object keeps
  // the same reference, so `useActiveDrag()` and `Draggable.Root`'s `dragging`
  // would keep reading the detached node.
  notifyDragSourceUpdated(source);
  getActivePreviewHandle()?.retargetSource(newElement);
}

/**
 * Clone a `DraggableLocationHistory`, giving each entry its own copy of the stack.
 * The lifecycle mutates its `location` during the drag, so everything it hands out,
 * including session snapshots and event details, goes through this one function.
 * A second clone path could miss a shape change and leak live engine references.
 */
export function cloneLocationHistory(location: DraggableLocationHistory): DraggableLocationHistory {
  return {
    grabOffset: { ...location.grabOffset },
    initial: { input: location.initial.input, targets: location.initial.targets.slice() },
    current: { input: location.current.input, targets: location.current.targets.slice() },
    previous: {
      input: location.previous.input,
      targets: location.previous.targets.slice(),
    },
  };
}
