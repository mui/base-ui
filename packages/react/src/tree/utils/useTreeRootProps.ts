'use client';
import * as React from 'react';
import { EMPTY_ARRAY } from '@base-ui/utils/empty';
import { useStore } from '@base-ui/utils/store';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useBaseUiId } from '../../internals/useBaseUiId';
import { resolveRenderedId } from '../../internals/resolveRenderedId';
import { TYPEAHEAD_RESET_MS } from '../../internals/constants';
import { useTypeahead } from '../../utils/popups/interactions/useTypeahead';
import { useTreeRootContext } from '../root/TreeRootContext';
import { useWarnMisplacedTreeRootFeatures } from '../root/TreeRootFeatures';
import { selectors } from '../store/selectors';
import type { TreeItemId } from '../store/types';
import { useIsTreeEmpty } from './useIsTreeEmpty';

/**
 * Returns the DOM props and ref that should be applied to the element
 * with `role="tree"`, or `role="treegrid"` in a tree grid.
 *
 * @param props The list's `id` and `render` props.
 */
export function useTreeRootProps(props: { id?: string | undefined; render?: unknown }) {
  const store = useTreeRootContext();
  useWarnMisplacedTreeRootFeatures(store);

  // A filterable tree needs an id for `Tree.Input` to reference.
  const generatedId = useBaseUiId(props.id);
  const id = store.filtering == null ? props.id : generatedId;
  // An empty id on the `render` element leaves the list without one to reference.
  store.useSyncedValueWithCleanup('listId', resolveRenderedId(props, id) || undefined);

  const multiple = useStore(store, (s) => s.multiple);
  const disabled = useStore(store, (s) => s.disabled);
  const empty = useIsTreeEmpty();
  const labelId = useStore(store, (s) => s.labelId);
  // Not the tabbable id itself, so moving focus between rows does not
  // re-render the whole list.
  const containerFocus = useStore(store, (s): 'tab-stop' | 'focusable' | 'none' => {
    if (selectors.tabbableItemId(s) != null) {
      return 'none';
    }
    // A disabled tree leaves the tab order. It stays focusable to hold the
    // focus of a row that just became disabled.
    return s.disabled ? 'focusable' : 'tab-stop';
  });
  let tabIndex: number | undefined;
  if (containerFocus === 'tab-stop') {
    tabIndex = 0;
  } else if (containerFocus === 'focusable') {
    tabIndex = -1;
  }

  // The rows a typeahead scan reads. Each scan calls `getCount` first, which refreshes them.
  const typeaheadRows = React.useRef<readonly TreeItemId[]>(EMPTY_ARRAY);
  // Like Select, Menu and Listbox: keys typed in quick succession build one search through
  // the rows in view, which resets after a pause. The tree's key handler sends it typed keys.
  const typeahead = useTypeahead({
    getLabel: (index) => selectors.itemLabel(store.state, typeaheadRows.current[index]),
    getCount: () => {
      typeaheadRows.current = selectors.flatList(store.state);
      return typeaheadRows.current.length;
    },
    getActiveIndex: () => {
      const focusedItemId = store.state.focusedItemId;
      return focusedItemId == null ? null : selectors.flatListIndex(store.state, focusedItemId);
    },
    // A disabled row matches while it stays focusable.
    disabledIndices: (index) =>
      !selectors.canItemBeFocused(store.state, typeaheadRows.current[index]),
    resetMs: TYPEAHEAD_RESET_MS,
    onTyping: store.interaction.setTyping,
    onMatch: store.interaction.handleTypeaheadMatch,
  });
  useIsoLayoutEffect(
    () =>
      store.interaction.registerTypeahead({
        onKeyDown: typeahead.onKeyDown,
        endSession: typeahead.endSession,
      }),
    [store, typeahead.onKeyDown, typeahead.endSession],
  );

  const rootProps = {
    id,
    role: store.grid == null ? 'tree' : 'treegrid',
    'aria-labelledby': labelId,
    'aria-multiselectable': (multiple !== false || undefined) as true | undefined,
    'aria-disabled': disabled || undefined,
    // The roving tab stop normally lives on a row. The container takes it when
    // there is no focusable row.
    tabIndex,
    ...store.interaction.rootEventHandlers,
  };

  const rootRef = useRefWithInit(() => (node: HTMLElement | null) => {
    store.context.rootRef.current = node;
  }).current;

  return { rootProps, rootRef, state: { disabled, empty } };
}
