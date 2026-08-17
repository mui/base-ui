import { Store, type ReadonlyStore } from '@base-ui/utils/store';
import type { DragLocationHistory, DragMode, DragSource } from '../../types/drag';
import { getSharedSlot } from './sharedState';

/**
 * Snapshot of the active drag, mirrored from the lifecycle for reactive
 * subscribers. `null` when no drag is in progress.
 */
export interface DragSessionState {
  source: DragSource;
  location: DragLocationHistory;
  mode: DragMode;
  /** Element refs of every drop target in the active stack. Enables O(1) `isOverElement` lookups. */
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
  sourceStore: Store<DragSource | null>;
  sourceSnapshot: DragSource | null;
  sourceVersion: number;
  sourceStoreSubscription?: (() => void) | undefined;
  targetListeners: Map<Element, Set<() => void>>;
  allTargetListeners: Set<() => void>;
}

const slot = getSharedSlot<DragSessionSlot>('dragSessionStore', () => ({
  store: new Store<DragSessionState | null>(null),
  sourceStore: new Store<DragSource | null>(null),
  sourceSnapshot: null,
  sourceVersion: 0,
  targetListeners: new Map<Element, Set<() => void>>(),
  allTargetListeners: new Set<() => void>(),
}));
// Forward-compatible with a slot created by an older copy during development.
slot.sourceStore ??= new Store<DragSource | null>(slot.store.state?.source ?? null);
slot.sourceSnapshot ??= slot.store.state?.source ?? null;
slot.sourceVersion ??= 0;
slot.sourceStoreSubscription ??= slot.store.subscribe((state) => {
  const source = state?.source ?? null;
  if (source !== slot.sourceSnapshot) {
    slot.sourceSnapshot = source;
    slot.sourceStore.setState(source);
  }
});
slot.targetListeners ??= new Map<Element, Set<() => void>>();
slot.allTargetListeners ??= new Set<() => void>();

/**
 * Read-only handle to the singleton drag-session store. Subscribe with
 * `useStore(dragSessionStore, selector)` or `dragSessionStore.subscribe(fn)`.
 */
export const dragSessionStore: ReadonlyStore<DragSessionState | null> = slot.store;

export const dragSourceStore: ReadonlyStore<DragSource | null> = slot.sourceStore;

export function selectDragSource(source: DragSource | null): DragSource | null {
  return source;
}

/** Internal: lifecycle-only writer. Not exported from `index.ts`. */
export function setDragSession(state: DragSessionState | null): void {
  const previous = slot.store.state;
  if (previous?.source !== state?.source) {
    slot.sourceVersion += 1;
  }
  slot.store.setState(state);

  const listeners = new Set<() => void>();
  // `accepting` changes for potentially every target only when the source
  // changes (drag start/end). Ordinary movement notifies only elements whose
  // over/rejected relationship can have changed.
  if (previous?.source !== state?.source) {
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
      if (session.location.current.dropTargets[0]?.element === element) {
        value += DragTargetState.innermost;
      }
    }
    // React 18's `useSyncExternalStoreWithSelector` does not re-run the selector
    // unless this raw snapshot changes. Include a source revision so `accepting`
    // can be recomputed at drag start/end; the selector masks it back out, so a
    // target whose selected state stays false still does not re-render.
    return value + slot.sourceVersion * dragTargetStateStride;
  };

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
      if (element !== null) {
        let set = slot.targetListeners.get(element);
        if (!set) {
          set = new Set();
          slot.targetListeners.set(element, set);
        }
        set.add(notify);
      }
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
        if (nextElement !== null) {
          let set = slot.targetListeners.get(nextElement);
          if (!set) {
            set = new Set();
            slot.targetListeners.set(nextElement, set);
          }
          set.add(listener);
        }
        listener();
      }
    },
  };
  return store;
}

export function updateDragSourceElement(oldElement: Element, newElement: HTMLElement): boolean {
  const state = slot.store.state;
  if (!state || state.source.element !== oldElement) {
    return false;
  }
  state.source.element = newElement;
  slot.store.setState({ ...state });
  // Wake subscribers whose selector returns the source.
  slot.sourceStore.setState({ ...state.source });
  return true;
}

type State = DragSessionState | null;

export const selectors = {
  /**
   * Whether `element` is the element currently being dragged. `false` when
   * `element` is `null` or no drag is active. Drives `Draggable.Root`'s
   * `isDragging` return value.
   */
  isDraggingElement: (state: State, element: Element | null) => {
    if (!state || !element) {
      return false;
    }
    return state.source.element === element;
  },
  /**
   * Whether `element` is in the active drop-target stack at any depth.
   * `false` when `element` is `null` or no drag is active. Drives
   * `DropTarget.Root`'s `over` state.
   */
  isOverElement: (state: State, element: Element | null) => {
    if (!state || !element) {
      return false;
    }
    return state.dropTargetElements.has(element);
  },
  /**
   * Whether `element` is the innermost drop target. A nested ancestor returns
   * `true` for `isOverElement` but `false` here while a descendant target is
   * hovered.
   */
  isOverInnerElement: (state: State, element: Element | null) => {
    if (!state || !element) {
      return false;
    }
    return state.location.current.dropTargets[0]?.element === element;
  },
  /**
   * Whether `element` is the target currently refusing the drag (`canDrop`
   * returned `'reject'` at the current position). Drives `DropTarget.Root`'s
   * `rejected` state.
   */
  isRejectedElement: (state: State, element: Element | null) => {
    if (!state || !element) {
      return false;
    }
    return state.rejectedTarget === element;
  },
};

/**
 * Clone a `DragLocationHistory`, giving each entry its own copy of the stack.
 * The lifecycle's `location` is live mutable bookkeeping, so everything handed
 * out — session snapshots here, per-dispatch event payloads in the lifecycle —
 * must go through this one clone: a shape change updated in only one hand-out
 * path would silently leak live engine references again.
 */
export function cloneLocationHistory(location: DragLocationHistory): DragLocationHistory {
  return {
    initial: { input: location.initial.input, dropTargets: location.initial.dropTargets.slice() },
    current: { input: location.current.input, dropTargets: location.current.dropTargets.slice() },
    previous: {
      input: location.previous.input,
      dropTargets: location.previous.dropTargets.slice(),
    },
  };
}

/**
 * Build a fresh `DragSessionState` from the lifecycle's mutable
 * `DragLocationHistory`, rebuilding nested objects and arrays so `useStore`
 * `Object.is` comparisons see a new reference per update. Snapshots build only
 * on stack change, so the clone is cheap.
 */
export function buildSessionSnapshot(parameters: {
  source: DragSource;
  location: DragLocationHistory;
  mode: DragMode;
  rejectedTarget: Element | null;
}): DragSessionState {
  const { source, location, mode, rejectedTarget } = parameters;
  const currentDropTargets = location.current.dropTargets;
  const dropTargetElements = new Set<Element>();
  for (let i = 0; i < currentDropTargets.length; i += 1) {
    dropTargetElements.add(currentDropTargets[i].element);
  }
  return {
    source,
    mode,
    location: cloneLocationHistory(location),
    dropTargetElements,
    rejectedTarget,
  };
}
