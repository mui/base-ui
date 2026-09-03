'use client';
import * as React from 'react';
import { ownerWindow } from '@base-ui/utils/owner';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import {
  FilterDropdownList,
  type FilterDropdownListProps,
  type FilterDropdownListState,
} from '../../filter-dropdown/list/FilterDropdownList';
import { mergeProps } from '../../merge-props';
import { useMenuFilterReferenceKeyDown } from '../filter-root/useMenuFilterReferenceKeyDown';
import { useCompositeListContext } from '../../internals/composite/list/CompositeListContext';
import {
  useFilterDropdownItemContext,
  useFilterDropdownRootContext,
} from '../../filter-dropdown/root/FilterDropdownRootContext';
import type { BaseUIEvent } from '../../internals/types';

/**
 * A container for the items of a filterable menu, rendered inside `Menu.Popup` next to
 * `Menu.FilterInput`.
 * Requires `Menu.FilterRoot` or `Menu.FilterSubmenuRoot`.
 * Renders a `<div>` element with a `menu` role.
 *
 * Documentation: [Base UI Menu](https://base-ui.com/react/components/menu)
 */
export const MenuFilterList = React.forwardRef(function MenuFilterList(
  componentProps: MenuFilterList.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { onItemsChange, focusOwnerRef } = useFilterDropdownRootContext();
  const { store: filterStore } = useFilterDropdownItemContext();
  const { subscribeMapChange } = useCompositeListContext();
  const handleReferenceKeyDown = useMenuFilterReferenceKeyDown();

  const handleKeyDown = useStableCallback(
    (event: BaseUIEvent<React.KeyboardEvent<HTMLElement>>) => {
      const owner = focusOwnerRef.current;
      if (owner == null || event.target !== event.currentTarget) {
        handleReferenceKeyDown(event);
        return;
      }

      // A scrollbar press moves real focus onto the list itself while the input still owns the
      // keyboard. Hand focus back and replay the key on the input so its handlers run instead of
      // the list scrolling; a typing key's default action follows the moved focus into the input.
      owner.focus({ preventScroll: true });
      const KeyboardEventConstructor = ownerWindow(owner).KeyboardEvent;
      const replayedEvent = new KeyboardEventConstructor(event.type, event.nativeEvent);
      const handled = !owner.dispatchEvent(replayedEvent) || replayedEvent.cancelBubble;
      // The replay already bubbled from the input through this tree; don't deliver it twice.
      event.stopPropagation();
      if (handled) {
        event.preventDefault();
      }
    },
  );

  const previousItemsRef = React.useRef<readonly Element[]>([]);
  // Distinguishes "no snapshot yet" from "the last snapshot was empty". Comparing against the
  // empty initial value would also skip the list repopulating after a query matched nothing.
  const hasPublishedItemsRef = React.useRef(false);

  const handleItemMapChange = useStableCallback((map: Map<Element, { index: number }>) => {
    const items = Array.from(map.keys());
    const previousItems = previousItemsRef.current;
    const itemsChanged =
      hasPublishedItemsRef.current &&
      (previousItems.length !== items.length ||
        items.some((item, index) => item !== previousItems[index]));
    previousItemsRef.current = items;
    hasPublishedItemsRef.current = true;

    // Composite items receive their final indexes from this map update. Read their rendered ids
    // after those synchronous layout updates commit instead of publishing the previous indexes.
    queueMicrotask(() => {
      if (itemsChanged) {
        // A positional highlight must not silently move to another action when live items are
        // inserted, removed, or reordered.
        onItemsChange(items.length > 0);
      }
      const nextIds: (string | undefined)[] = [];
      map.forEach((metadata, element) => {
        nextIds[metadata.index] = element.id;
      });
      const currentIds = filterStore.state.itemIds;
      // A fresh array always fails the store's identity check, and every item, group, and the
      // input subscribe to it. Filtering rarely changes the ids themselves, so compare first.
      let idsChanged = currentIds.length !== nextIds.length;
      for (let i = 0; !idsChanged && i < nextIds.length; i += 1) {
        idsChanged = nextIds[i] !== currentIds[i];
      }
      if (idsChanged) {
        filterStore.set('itemIds', nextIds);
      }
    });
  });

  useIsoLayoutEffect(
    () => subscribeMapChange(handleItemMapChange),
    [subscribeMapChange, handleItemMapChange],
  );

  const listProps = mergeProps<typeof FilterDropdownList>(
    { role: 'menu', onKeyDown: handleKeyDown },
    componentProps,
  );

  return <FilterDropdownList {...listProps} ref={forwardedRef} />;
});

export interface MenuFilterListState extends FilterDropdownListState {}

export interface MenuFilterListProps extends FilterDropdownListProps {}

export namespace MenuFilterList {
  export type Props = MenuFilterListProps;
  export type State = MenuFilterListState;
}
