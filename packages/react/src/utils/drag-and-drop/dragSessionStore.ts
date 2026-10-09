import { Store } from '@base-ui/utils/store';
import type { ReadonlyStore } from '@base-ui/utils/store';
import type {
  DraggableLocation,
  DraggableLocationHistory,
} from '../../draggable/DraggableProvider';
import type { DraggableRootRecord } from '../../draggable/root/DraggableRoot';
import { getSharedSlot } from './sharedState';

/**
 * Snapshot of the active drag, mirrored from the lifecycle for reactive
 * subscribers. `null` when no drag is in progress.
 */
export interface DragSessionState {
  source: DraggableRootRecord;
  location: DraggableLocationHistory;
  /**
   * The target whose `canDrop` returned `'reject'` at the current position, or `null`.
   * A rejection empties the stack, so this is its only record. Drives `data-rejected`.
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

export const dragSessionStore: ReadonlyStore<DragSessionState | null> = slot.store;

/**
 * Publishes a copy of the session's source, since `useStore` re-runs a selector only
 * for a new reference and the session's `source` is mutated in place (see
 * `retargetDragSource`). Don't compare it to an event's `source` by identity.
 */
export const dragSourceStore: ReadonlyStore<DraggableRootRecord | null> = slot.sourceStore;

/**
 * Publish an imperative data update of the active source to `dragSourceStore`.
 * Records read their payload and drag data live, so the session isn't republished.
 */
export function notifyDragSourceUpdated(source: DraggableRootRecord): void {
  if (slot.store.state?.source === source) {
    slot.sourceStore.setState({ ...source });
  }
}

/** Only the lifecycle calls this. */
export function setDragSession(state: DragSessionState | null): void {
  const previous = slot.store.state;
  const sourceChanged = previous?.source !== state?.source;
  if (sourceChanged) {
    slot.sourceVersion += 1;
  }
  slot.store.setState(state);
  // Read the source back from the store, not from `state`: a session subscriber can
  // write again synchronously, and the last call to run must publish the final source.
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
  // Only a source change (drag start or end) can change `accepting` for every target.
  // Movement notifies only elements whose over or rejected state may have changed.
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
} as const;

/** The first bit above the engine's flags. The snapshot encodes the source version from it. */
export const dragTargetStateStride = 8;

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
    // React 18's `useSyncExternalStoreWithSelector` re-runs the selector only when this
    // raw snapshot changes, so the source version is added to recompute `accepting` at
    // drag start and end. The selector masks it out, so an unchanged target doesn't re-render.
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

/**
 * The lifecycle mutates its `location` during the drag, so everything it hands out
 * (session snapshots, event details) is cloned here. A second clone path could miss
 * a shape change and leak live engine references.
 */
export function cloneLocationHistory(location: DraggableLocationHistory): DraggableLocationHistory {
  return {
    grabOffset: { ...location.grabOffset },
    initial: cloneLocation(location.initial),
    current: cloneLocation(location.current),
    previous: cloneLocation(location.previous),
  };
}

function cloneLocation(location: DraggableLocation): DraggableLocation {
  return { input: location.input, targets: location.targets.slice() };
}
