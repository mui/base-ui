'use client';
import type * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { findScrollContainers } from '../utils/findScrollContainer';
import { scrollIntoContainersView } from '../utils/viewport';
import { ITEM_SELECTOR } from '../utils/itemIdKey';
import { useTreeRootContext } from '../root/TreeRootContext';

/**
 * Attaches the viewport of a list that renders every row, which brings rows
 * into view within the nearest scroll container around the list, and within the
 * outer ones while the row has focus.
 */
export function useTreeListViewport(listRef: React.RefObject<HTMLElement | null>) {
  const store = useTreeRootContext();

  useIsoLayoutEffect(() => {
    const listEl = listRef.current;
    if (!listEl) {
      return undefined;
    }
    const scrollContainers = findScrollContainers(listEl, 'vertical');
    const scrollContainer = scrollContainers[0];
    // A wrapper can scroll along one axis only, such as `overflow-x: auto` with
    // `overflow-y: hidden`, so each axis has its own containers.
    const horizontalScrollContainers = findScrollContainers(listEl, 'horizontal');

    // Rows are aligned with the nearest edge of the tree's own scroll container,
    // like Menu, Select and Combobox do.
    return store.items.attachViewport({
      // Rows of a plain list can differ in height, so measure the row itself.
      getRowHeight: (itemId) =>
        (store.items.getItemDOMElement(itemId) ?? listEl.querySelector<HTMLElement>(ITEM_SELECTOR))
          ?.offsetHeight ?? 0,
      getScrollportHeight: () => scrollContainer.clientHeight,
      scrollToItem: (itemId) =>
        scrollIntoContainersView(
          scrollContainers,
          store.items.getItemDOMElement(itemId),
          'vertical',
        ),
      scrollElementIntoView: (element) => {
        scrollIntoContainersView(scrollContainers, element, 'vertical');
        scrollIntoContainersView(horizontalScrollContainers, element, 'horizontal');
      },
    });
  }, [store, listRef]);
}
