'use client';
import type * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { findScrollContainer } from '../utils/findScrollContainer';
import { scrollIntoContainerView } from '../utils/viewport';
import { ITEM_SELECTOR } from '../utils/itemIdKey';
import { useTreeRootContext } from '../root/TreeRootContext';

/**
 * Attaches the viewport of a list that renders every row, which brings rows
 * into view within the nearest scroll container around the list.
 */
export function useTreeListViewport(listRef: React.RefObject<HTMLElement | null>) {
  const store = useTreeRootContext();

  useIsoLayoutEffect(() => {
    const listEl = listRef.current;
    if (!listEl) {
      return undefined;
    }
    const scrollContainer = findScrollContainer(listEl);

    // Rows are aligned with the nearest edge of the tree's own scroll container,
    // like Menu, Select and Combobox do.
    return store.items.attachViewport({
      // Rows of a plain list can differ in height, so measure the row itself.
      getRowHeight: (itemId) =>
        (store.items.getItemDOMElement(itemId) ?? listEl.querySelector<HTMLElement>(ITEM_SELECTOR))
          ?.offsetHeight ?? 0,
      getScrollportHeight: () => scrollContainer.clientHeight,
      scrollToItem: (itemId) =>
        scrollIntoContainerView(
          scrollContainer,
          store.items.getItemDOMElement(itemId),
          'vertical',
          store.state.direction,
        ),
      scrollIntoViewHorizontally: (element) =>
        scrollIntoContainerView(scrollContainer, element, 'horizontal', store.state.direction),
    });
  }, [store, listRef]);
}
