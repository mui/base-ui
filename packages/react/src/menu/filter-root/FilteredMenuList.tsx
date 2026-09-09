'use client';
import * as React from 'react';
import { ownerWindow } from '@base-ui/utils/owner';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { FilterDropdownList } from '../../filter-dropdown/list/FilterDropdownList';
import { mergeProps } from '../../merge-props';
import { useMenuFilterReferenceKeyDown } from './useMenuFilterReferenceKeyDown';
import { useMenuRootContext } from '../root/MenuRootContext';
import type { MenuList } from '../list/MenuList';
import { useCompositeListContext } from '../../internals/composite/list/CompositeListContext';
import {
  useFilterDropdownItemContext,
  useFilterDropdownRootContext,
} from '../../filter-dropdown/root/FilterDropdownRootContext';
import type { BaseUIEvent } from '../../internals/types';

/**
 * The list of a filterable menu: it takes the `menu` role while the popup is a dialog holding
 * the input, and it forwards keys that land on it to the input.
 */
export const FilteredMenuList = React.forwardRef(function FilteredMenuList(
  componentProps: MenuList.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { syncHighlightedItem, orientation } = useMenuRootContext();
  const { onItemsChange, focusOwnerRef } = useFilterDropdownRootContext();
  const { store: filterStore, listRef } = useFilterDropdownItemContext();
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

  // `null` distinguishes the initial registration from a list emptied by filtering.
  const previousItemsRef = React.useRef<readonly (HTMLElement | null)[] | null>(null);

  const handleItemMapChange = useStableCallback(() => {
    syncHighlightedItem();
    const items = [...listRef.current];
    const previousItems = previousItemsRef.current;
    const itemsChanged =
      previousItems !== null &&
      (previousItems.length !== items.length ||
        items.some((item, index) => item !== previousItems[index]));
    previousItemsRef.current = items;
    if (previousItems !== null && !itemsChanged) {
      return;
    }

    // Composite items receive their final indexes from this map update. Publish after their
    // synchronous layout updates commit so the active item's rendered id has settled.
    queueMicrotask(() => {
      if (itemsChanged) {
        // A positional highlight must not silently move to another action when live items are
        // inserted, removed, or reordered.
        onItemsChange(items.length > 0);
      }
      filterStore.set('items', items);
    });
  });

  useIsoLayoutEffect(() => {
    return subscribeMapChange(handleItemMapChange);
  }, [subscribeMapChange, handleItemMapChange]);

  const listProps = mergeProps<typeof FilterDropdownList>(
    {
      'aria-orientation': orientation === 'horizontal' ? 'horizontal' : undefined,
      onKeyDown: handleKeyDown,
    },
    componentProps,
  );

  return <FilterDropdownList {...listProps} ref={forwardedRef} />;
});
