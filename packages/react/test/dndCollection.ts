/**
 * Test utilities specific to `useDraggableCollection`.
 *
 * Generic drag-and-drop test helpers live in `./dnd.ts`.
 */
import * as React from 'react';
import { vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { CollectionActions, CollectionItemId } from '../src/types/collection';
import { registerCleanup } from './dnd';
import { DraggablePreviewProvider } from '../src/draggable/preview-provider/DraggablePreviewProvider';
import { useDraggableCollection } from '../src/utils/drag-and-drop/useDraggableCollection';
import type {
  DraggableCollectionState,
  UseDraggableCollectionParameters,
} from '../src/utils/drag-and-drop/useDraggableCollection';

// ---------------------------------------------------------------------------
// Mock context
// ---------------------------------------------------------------------------

interface MockContextOptions {
  /** Item ids that exist in this collection. */
  knownItemIds?: Array<string | number> | undefined;
  /** Map of parentId → childIds. `null` key = root children. */
  childrenMap?: Record<string, Array<string | number>> | undefined;
  /** Map of itemId → parentId. */
  parentMap?: Record<string, string | number | null> | undefined;
  /** Currently selected item ids. */
  selectedItemIds?: Set<string | number> | undefined;
  /** Item ids that are expandable. */
  expandableItemIds?: Set<string | number> | undefined;
  /** Overrides for individual context methods. */
  overrides?: Partial<CollectionActions> | undefined;
}

interface MockContextResult {
  context: CollectionActions;
  onStateChange: (state: DraggableCollectionState) => void;
  pruneDraggedItems: (itemIds: Set<CollectionItemId>) => Set<CollectionItemId>;
  isDropTargetInvalid: (
    dropTargetItemId: CollectionItemId,
    draggedItemIds: Set<CollectionItemId>,
  ) => boolean;
  /** All states received via `onStateChange`, in order. */
  states: DraggableCollectionState[];
  /** The most recent state, or `null` if none yet. */
  lastState: () => DraggableCollectionState | null;
}

function isDescendantOf(
  parentMap: Record<string, string | number | null>,
  itemId: CollectionItemId,
  ancestorId: CollectionItemId,
): boolean {
  let current: string | number | null = parentMap[String(itemId)] ?? null;
  while (current != null) {
    if (current === ancestorId) {
      return true;
    }
    current = parentMap[String(current)] ?? null;
  }
  return false;
}

function createMockContext(options: MockContextOptions = {}): MockContextResult {
  const {
    knownItemIds = [],
    parentMap = {},
    selectedItemIds = new Set<string | number>(),
    overrides = {},
  } = options;

  const knownSet = new Set<string | number>(knownItemIds);
  const states: DraggableCollectionState[] = [];
  const onStateChange = vi.fn((state: DraggableCollectionState) => {
    states.push(state);
  });

  const context: CollectionActions = {
    hasItem: (id) => knownSet.has(id),
    getSelectedItemIds: () => selectedItemIds,
    getItemModels: (itemIds) => [...itemIds].filter((id) => knownSet.has(id)),
    ...overrides,
  };

  const pruneDraggedItems = (itemIds: Set<CollectionItemId>) => {
    const result = new Set<CollectionItemId>();
    for (const id of itemIds) {
      let isDesc = false;
      for (const otherId of itemIds) {
        if (otherId !== id && isDescendantOf(parentMap, id, otherId)) {
          isDesc = true;
          break;
        }
      }
      if (!isDesc) {
        result.add(id);
      }
    }
    return result;
  };

  const isDropTargetInvalid = (
    dropTargetItemId: CollectionItemId,
    draggedItemIds: Set<CollectionItemId>,
  ) => {
    for (const id of draggedItemIds) {
      if (isDescendantOf(parentMap, dropTargetItemId, id)) {
        return true;
      }
    }
    return false;
  };

  return {
    context,
    onStateChange,
    pruneDraggedItems,
    isDropTargetInvalid,
    states,
    lastState: () => (states.length > 0 ? states[states.length - 1] : null),
  };
}

// ---------------------------------------------------------------------------
// Plugin setup helper
// ---------------------------------------------------------------------------

export interface SetupResult {
  plugin: ReturnType<typeof useDraggableCollection>;
  context: CollectionActions;
  states: DraggableCollectionState[];
  lastState: () => DraggableCollectionState | null;
  cleanup: () => void;
}

/**
 * Create a `useDraggableCollection` plugin with a mock context and return
 * everything needed for test assertions.
 */
export function setupPlugin(
  // `onStateChange` / `pruneDraggedItems` / `isDropTargetInvalid` are supplied by
  // the mock context below; excluding them here makes a caller-supplied override
  // a compile error instead of a silently discarded parameter.
  params: Omit<
    UseDraggableCollectionParameters,
    'getActions' | 'onStateChange' | 'pruneDraggedItems' | 'isDropTargetInvalid'
  >,
  contextOptions?: MockContextOptions,
  renderOptions?: {
    wrapper?: React.JSXElementConstructor<{ children: React.ReactNode }> | undefined;
  },
): SetupResult {
  const { context, onStateChange, pruneDraggedItems, isDropTargetInvalid, states, lastState } =
    createMockContext(contextOptions);

  // The drag engine is global, but a preview with content renders in the React
  // tree a `Draggable.PreviewProvider` supplies, so item drag previews need one.
  // Any caller-supplied wrapper (e.g. a `LocalizationProvider`) stays outside it
  // so the drag engine reads the active translations.
  const Outer = renderOptions?.wrapper ?? React.Fragment;
  const wrapper: React.JSXElementConstructor<{ children: React.ReactNode }> = ({ children }) =>
    React.createElement(Outer, null, React.createElement(DraggablePreviewProvider, null, children));

  const { result } = renderHook(
    () =>
      useDraggableCollection({
        ...params,
        onStateChange,
        pruneDraggedItems,
        isDropTargetInvalid,
        getActions: () => context,
      }),
    { wrapper },
  );

  // Auto-queue every registration this plugin takes out. `setupItem`/`setupRoot`
  // register a draggable and a drop target on a document-level registry and
  // install static DOM setup; a test that forgets its cleanup leaks both into
  // every later test in the file. Wrapping here means no caller has to remember.
  //
  // The wrappers shadow the prototype methods on the real instance (rather than
  // returning a shallow copy): a test that calls `plugin.destroy()` /
  // `plugin.connect()` must act on the same `this` the queued teardown destroys,
  // or a reconnect would leak its monitor into the shared registry for the rest
  // of the run. The final `destroy()` below also covers any cleanup a mid-test
  // `connect()` created.
  const plugin = result.current;
  const rawSetupItem = plugin.setupItem.bind(plugin);
  const rawSetupDropTarget = plugin.setupDropTarget.bind(plugin);
  const rawSetupRoot = plugin.setupRoot.bind(plugin);
  plugin.setupItem = (...args: Parameters<typeof rawSetupItem>) => {
    const cleanup = rawSetupItem(...args);
    registerCleanup(cleanup);
    return cleanup;
  };
  plugin.setupDropTarget = (...args: Parameters<typeof rawSetupDropTarget>) => {
    const cleanup = rawSetupDropTarget(...args);
    registerCleanup(cleanup);
    return cleanup;
  };
  plugin.setupRoot = (...args: Parameters<typeof rawSetupRoot>) => {
    const cleanup = rawSetupRoot(...args);
    registerCleanup(cleanup);
    return cleanup;
  };
  registerCleanup(() => plugin.destroy());

  return {
    plugin,
    context,
    states,
    lastState,
    cleanup: () => plugin.destroy(),
  };
}
