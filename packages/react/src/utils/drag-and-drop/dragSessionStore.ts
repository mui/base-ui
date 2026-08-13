import { Store, type ReadonlyStore } from '@base-ui/utils/store';
import type { DragLocationHistory, DragMode, DragSource } from '../../types/drag';
import { getSharedSlot } from './sharedState';
import { matchesAccept } from './dragKind';
import type { RegisterDropTargetParameters } from '../../types/dragRegistration';

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
  targetListeners: Map<Element, Set<() => void>>;
  allTargetListeners: Set<() => void>;
}

const slot = getSharedSlot<DragSessionSlot>('dragSessionStore', () => ({
  store: new Store<DragSessionState | null>(null),
  targetListeners: new Map<Element, Set<() => void>>(),
  allTargetListeners: new Set<() => void>(),
}));
// Forward-compatible with a slot created by an older copy during development.
slot.targetListeners ??= new Map<Element, Set<() => void>>();
slot.allTargetListeners ??= new Set<() => void>();

/**
 * Read-only handle to the singleton drag-session store. Subscribe with
 * `useStore(dragSessionStore, selector)` or `dragSessionStore.subscribe(fn)`.
 */
export const dragSessionStore: ReadonlyStore<DragSessionState | null> = slot.store;

/** Internal: lifecycle-only writer. Not exported from `index.ts`. */
export function setDragSession(state: DragSessionState | null): void {
  const previous = slot.store.state;
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

interface LatestValue<T> {
  readonly next: T;
}

export interface DragTargetStateStore extends ReadonlyStore<number> {
  setElement(element: Element | null): void;
}

/**
 * A per-target session view. Movement wakes only targets in the old/new hover
 * stack instead of synchronously running selectors for every target on the page.
 */
export function createDragTargetStateStore(
  disabledRef: LatestValue<boolean | undefined>,
  acceptRef: LatestValue<RegisterDropTargetParameters['accept']>,
): DragTargetStateStore {
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
    const source = session?.source ?? null;
    if (source !== null && !disabledRef.next && matchesAccept(acceptRef.next, source)) {
      value += DragTargetState.accepting;
    }
    return value;
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

/**
 * Re-point the active session's source at a new element when the dragged
 * draggable re-registers mid-drag (a virtualizer remounting the item to a fresh
 * node). The lifecycle holds the `source` object by reference, so mutating
 * `source.element` in place keeps every in-flight closure consistent; we then
 * publish a fresh snapshot object so `useStore` `Object.is` subscribers (the
 * `isDragging` selector) re-run against the new node. No-op when no drag is
 * active or `oldElement` isn't the current source. Returns whether it matched.
 */
export function updateDragSourceElement(oldElement: Element, newElement: HTMLElement): boolean {
  const state = slot.store.state;
  if (!state || state.source.element !== oldElement) {
    return false;
  }
  state.source.element = newElement;
  slot.store.setState({ ...state });
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
   * The active drag source as a strongly-typed `DragSource`, or `null`
   * when no drag is in progress. Reference-stable for the lifetime of the
   * session — subscribers re-render only on drag start / end, not per frame.
   */
  dragSource: (state: State): DragSource | null => state?.source ?? null,
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
