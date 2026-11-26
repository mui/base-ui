'use client';
import * as React from 'react';
import { useStore } from '@base-ui/utils/store';
import { error } from '@base-ui/utils/error';
import { EMPTY_ARRAY } from '@base-ui/utils/empty';
import { useRenderElement } from '../../internals/useRenderElement';
import type { UseRenderElementComponentProps } from '../../internals/useRenderElement';
import { useTreeRootContext } from '../root/TreeRootContext';
import { selectors } from '../store/selectors';
import type { TreeItemId } from '../store/types';
import { getItemIdKey, ITEM_KEY_ATTRIBUTE, ITEM_SELECTOR } from '../utils/itemIdKey';
import { useTreeRootProps } from '../utils/useTreeRootProps';
import { TreeRows } from './TreeRows';
import { useTreeListViewport } from './useTreeListViewport';
import type { TreeListState } from './TreeList';

/**
 * Renders the element with `role="tree"`, or `role="treegrid"` in a tree grid,
 * around `children`, and keeps the focused row in view.
 * A function child renders each row in view.
 */
export function useTreeListElement(
  componentProps: UseRenderElementComponentProps<TreeListState> & {
    id?: string | undefined;
  },
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
  elementProps: React.HTMLAttributes<HTMLDivElement>,
  children: React.ReactNode | ((item: any) => React.ReactNode),
) {
  const { rootProps, rootRef, state } = useTreeRootProps(componentProps);
  const renderFunction = typeof children === 'function';

  const listRef = React.useRef<HTMLDivElement | null>(null);

  useTreeListViewport(listRef);

  if (process.env.NODE_ENV !== 'production') {
    // The build-time environment never changes during a component's lifetime.
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useUnrenderedItemsCheck(listRef, !renderFunction);
  }

  return useRenderElement('div', componentProps, {
    state,
    ref: [forwardedRef, rootRef, listRef],
    props: [
      rootProps,
      { children: renderFunction ? <TreeRows>{children}</TreeRows> : children },
      elementProps,
    ],
  });
}

const selectNoItems = (): readonly TreeItemId[] => EMPTY_ARRAY;

/**
 * Reports an item in view that the plain children of `Tree.List` don't render, as
 * keyboard navigation can't move focus to it. A tree grid's plain children are its
 * header row and collection, which may render no rows at all.
 */
function useUnrenderedItemsCheck(
  listRef: React.RefObject<HTMLElement | null>,
  plainChildren: boolean,
) {
  const store = useTreeRootContext();
  const enabled = plainChildren && store.grid == null;
  const flatList = useStore(store, enabled ? selectors.flatList : selectNoItems);

  React.useEffect(() => {
    const listElement = listRef.current;
    if (listElement == null || flatList.length === 0) {
      return;
    }
    // Reads the DOM, as an item registers its element a commit after rendering it.
    const renderedKeys = new Set(
      Array.from(listElement.querySelectorAll(ITEM_SELECTOR), (element) =>
        element.getAttribute(ITEM_KEY_ATTRIBUTE),
      ),
    );
    const unrendered = flatList.find((itemId) => !renderedKeys.has(getItemIdKey(itemId)));
    if (unrendered !== undefined) {
      error(
        `The item ${JSON.stringify(unrendered)} is in view, but the children of <Tree.List> ` +
          "don't render it, so keyboard navigation can't reach it. Render an item part for " +
          'each item in `items`, including the children of each item, or pass a function ' +
          'to <Tree.List> to render them.',
      );
    }
  }, [store, listRef, flatList]);
}
