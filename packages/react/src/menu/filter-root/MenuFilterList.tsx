'use client';
import * as React from 'react';
import { ownerDocument } from '@base-ui/utils/owner';
import { contains } from '@base-ui/utils/shadowDom';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { isHTMLElement } from '@floating-ui/utils/dom';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { activeElement, getTarget } from '../../floating-ui-react/utils';
import { FilterDropdownList } from '../../filter-dropdown/list/FilterDropdownList';
import { mergeProps } from '../../merge-props';
import { useMenuFilterKeyDown } from './useMenuFilterKeyDown';
import { isMainOrientationKey } from '../../floating-ui-react/hooks/useListNavigation';
import { useMenuRootContext } from '../root/MenuRootContext';
import type { MenuList } from '../list/MenuList';
import { useCompositeListContext } from '../../internals/composite/list/CompositeListContext';
import {
  useFilterDropdownItemContext,
  useFilterDropdownRootContext,
  useFilterDropdownValueContext,
} from '../../filter-dropdown/root/FilterDropdownRootContext';
import { resolvePopupLabel } from '../../internals/resolvePopupLabel';
import { useDirection } from '../../internals/direction-context/DirectionContext';
import { moveHighlightFrom } from './moveHighlightFrom';

/**
 * The list of a filterable menu: it takes the `menu` role while the popup is a dialog holding
 * the input, and it forwards keys that land on it to the input.
 */
export const MenuFilterList = React.forwardRef(function MenuFilterList(
  componentProps: MenuList.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { store, syncHighlightedItem, orientation, loopFocus } = useMenuRootContext();
  const direction = useDirection();
  const { onItemsChange, focusOwnerRef, keyReplayRef, triggerId } = useFilterDropdownRootContext();
  const { listRef } = useFilterDropdownItemContext();
  const { subscribeMapChange } = useCompositeListContext();

  const handleInputKeyDown = useMenuFilterKeyDown(useFilterDropdownValueContext() !== '');

  const handleKeyDown = useStableCallback((event: React.KeyboardEvent<HTMLElement>) => {
    const owner = focusOwnerRef.current;
    const target = getTarget(event.nativeEvent) as Element;
    const ownerFocused = owner != null && activeElement(ownerDocument(owner)) === owner;
    const fromNestedPopup = !contains(event.currentTarget, target);
    // Keys the input forwards to its highlighted item arrive here while the input still holds
    // focus, and a nested popup's keys bubble through this React tree from outside the list.
    if (owner == null || ownerFocused || fromNestedPopup) {
      if (
        event.which !== 229 &&
        !event.shiftKey &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey &&
        isMainOrientationKey(event.key, orientation)
      ) {
        // Keep main-axis keys from reaching this popup's own list navigation, which lost its
        // place while the nested popup held focus. A plain submenu that closes on the key hands
        // focus back and lets it through, so move on from its trigger as a plain parent would.
        event.stopPropagation();
        const trigger = fromNestedPopup && ownerFocused ? getNestedPopupTrigger(target) : undefined;
        if (trigger) {
          moveHighlightFrom(store, trigger, event.key, orientation, direction === 'rtl', loopFocus);
        }
      }
      return;
    }

    // An item that already acted on the key (Enter and Space activate it) keeps it.
    if (event.defaultPrevented) {
      return;
    }

    // Real focus can land inside the list while the input still owns the keyboard: a scrollbar
    // press focuses the list itself, and a screen reader following `aria-activedescendant`
    // focuses the highlighted item. Hand focus back and route the key as the input would; a
    // typing key's default action follows the moved focus into the input.
    keyReplayRef.current = true;
    try {
      owner.focus({ preventScroll: true });
    } finally {
      keyReplayRef.current = false;
    }
    handleInputKeyDown(event);
  });

  // The item whose `aria-controls` popup holds `target`.
  function getNestedPopupTrigger(target: Element) {
    const doc = ownerDocument(target);
    return listRef.current.find((item): item is HTMLElement => {
      const popupId = item?.getAttribute('aria-controls');
      return (
        popupId != null && isHTMLElement(item) && contains(doc.getElementById(popupId), target)
      );
    });
  }

  // `null` distinguishes the initial registration from a list emptied by filtering.
  const previousItemsRef = React.useRef<readonly (HTMLElement | null)[] | null>(null);

  const handleItemMapChange = useStableCallback(() => {
    const items = [...listRef.current];
    const previousItems = previousItemsRef.current;
    const changed =
      previousItems === null ||
      previousItems.length !== items.length ||
      items.some((item, index) => item !== previousItems[index]);

    // Resolved before the highlight is reported, so a positional highlight never reports the
    // item that took its index.
    if (changed && previousItems !== null) {
      onItemsChange(previousItems);
    }
    previousItemsRef.current = items;
    syncHighlightedItem();
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
