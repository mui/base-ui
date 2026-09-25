'use client';
import * as React from 'react';
import { ownerDocument, ownerWindow } from '@base-ui/utils/owner';
import { contains } from '@base-ui/utils/shadowDom';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { activeElement, getTarget } from '../../floating-ui-react/utils';
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
import { resolvePopupLabel } from '../../internals/resolvePopupLabel';
import type { BaseUIEvent } from '../../internals/types';

/**
 * The list of a filterable menu: it takes the `menu` role while the popup is a dialog holding
 * the input, and it forwards keys that land on it to the input.
 */
export const MenuFilterList = React.forwardRef(function MenuFilterList(
  componentProps: MenuList.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { syncHighlightedItem, orientation } = useMenuRootContext();
  const { onItemsChange, focusOwnerRef, keyReplayRef, triggerId } = useFilterDropdownRootContext();
  const { store: filterStore, listRef } = useFilterDropdownItemContext();
  const { subscribeMapChange } = useCompositeListContext();

  const handleReferenceKeyDown = useMenuFilterReferenceKeyDown();

  const handleKeyDown = useStableCallback(
    (event: BaseUIEvent<React.KeyboardEvent<HTMLElement>>) => {
      const owner = focusOwnerRef.current;
      // Keys the input forwards to its highlighted item arrive here while the input still holds
      // focus, and a nested popup's keys bubble through this React tree from outside the list.
      if (
        owner == null ||
        activeElement(ownerDocument(owner)) === owner ||
        !contains(event.currentTarget, getTarget(event.nativeEvent) as Element)
      ) {
        handleReferenceKeyDown(event);
        return;
      }

      // An item that already acted on the key (Enter and Space activate it) keeps it.
      if (event.defaultPrevented) {
        return;
      }

      // Real focus can land inside the list while the input still owns the keyboard: a scrollbar
      // press focuses the list itself, and a screen reader following `aria-activedescendant`
      // focuses the highlighted item. Hand focus back and replay the key on the input so its
      // handlers run instead of the list scrolling or the key being dropped; a typing key's
      // default action follows the moved focus into the input.
      keyReplayRef.current = true;
      try {
        owner.focus({ preventScroll: true });
      } finally {
        keyReplayRef.current = false;
      }
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
    const items = [...listRef.current];
    const previousItems = previousItemsRef.current;
    const changed =
      previousItems === null ||
      previousItems.length !== items.length ||
      items.some((item, index) => item !== previousItems[index]);

    // A positional highlight must not silently move to another action when live items are
    // inserted, removed, or reordered, so it's invalidated before the highlight is reported.
    if (changed && previousItems !== null) {
      onItemsChange(items.length > 0);
    }
    syncHighlightedItem();

    if (!changed) {
      return;
    }
    previousItemsRef.current = items;

    // Composite items receive their final indexes from this map update. Publish after their
    // synchronous layout updates commit so the active item's rendered id has settled.
    queueMicrotask(() => {
      filterStore.set('items', items);
    });
  });

  useIsoLayoutEffect(() => {
    return subscribeMapChange(handleItemMapChange);
  }, [subscribeMapChange, handleItemMapChange]);

  const { ariaLabelledBy } = resolvePopupLabel(componentProps, null, triggerId ?? null);

  const listProps = mergeProps<typeof FilterDropdownList>(
    {
      role: 'menu',
      'aria-labelledby': ariaLabelledBy,
      'aria-orientation': orientation === 'horizontal' ? 'horizontal' : undefined,
      onKeyDown: handleKeyDown,
    },
    componentProps,
  );

  return <FilterDropdownList {...listProps} ref={forwardedRef} />;
});
