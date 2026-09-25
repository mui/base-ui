'use client';
import * as React from 'react';
import { ownerWindow } from '@base-ui/utils/owner';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { EMPTY_ARRAY } from '@base-ui/utils/empty';
import { isHTMLElement } from '@floating-ui/utils/dom';
import { useFilterDropdownItemContext } from '../../filter-dropdown/root/FilterDropdownRootContext';
import { useMenuRootContext } from '../root/MenuRootContext';
import { useMenuSubmenuRootContext } from '../submenu-root/MenuSubmenuRootContext';
import { useDirection } from '../../internals/direction-context/DirectionContext';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import type { BaseUIEvent } from '../../internals/types';
import { stopEvent } from '../../floating-ui-react/utils/event';
import { getMaxListIndex, getMinListIndex } from '../../floating-ui-react/utils/composite';
import {
  isCrossOrientationCloseKey,
  isCrossOrientationOpenKey,
  isMainOrientationKey,
} from '../../floating-ui-react/hooks/useListNavigation';

/**
 * Handles keys that only a filterable menu's virtual-focus owner needs. The Menu root still owns
 * the single list-navigation hook; keeping this relay behind the filter root keeps it out of a
 * plain menu.
 */
export function useMenuFilterReferenceKeyDown() {
  const { listRef } = useFilterDropdownItemContext();
  const { orientation, store: menuStore } = useMenuRootContext();
  const direction = useDirection();
  const submenuContext = useMenuSubmenuRootContext();

  return useStableCallback((event: BaseUIEvent<React.KeyboardEvent<HTMLElement>>) => {
    if (event.which === 229) {
      return;
    }

    if (event.key === 'Tab') {
      // Mirror the plain menu: Shift+Tab closes the popup and returns focus to the trigger.
      // The generic close branch in `useListNavigation` skips virtual focus. Forward Tab
      // closes through focus-out once focus leaves the popup.
      if (event.shiftKey) {
        stopEvent(event);
        // A submenu returns to the element that held focus in its parent, which is the parent's
        // input rather than its untabbable trigger when the parent is filterable too.
        const returnElement =
          (menuStore.state.parent.type === 'menu' && submenuContext?.getReturnElement?.()) ||
          menuStore.state.activeTriggerElement;
        const details = createChangeEventDetails(REASONS.focusOut, event.nativeEvent);
        menuStore.setOpen(false, details);
        if (!details.isCanceled && isHTMLElement(returnElement)) {
          returnElement.focus();
        }
      }
      return;
    }

    if (event.shiftKey || event.ctrlKey || event.metaKey || event.altKey) {
      // Modified arrows and boundary keys are native text-editing commands (extend the selection,
      // move by word or to a text boundary), which the input's own handler keeps native.
      return;
    }

    const isRtl = direction === 'rtl';
    if (isMainOrientationKey(event.key, orientation)) {
      // The reference handler owns main-axis navigation. Keep the same event from reaching the
      // popup's floating handler and moving the virtual cursor a second time.
      event.stopPropagation();
    }

    if (event.target !== event.currentTarget) {
      return;
    }

    const activeItem = listRef.current[menuStore.select('activeIndex') ?? -1];
    if (!activeItem) {
      // Left and Right move the caret while nothing is highlighted, so the vertical arrows are
      // what enter a horizontal list, from either end.
      const isVerticalArrow = event.key === 'ArrowUp' || event.key === 'ArrowDown';
      if (orientation === 'horizontal' && isVerticalArrow) {
        const index =
          event.key === 'ArrowDown'
            ? getMinListIndex(listRef, EMPTY_ARRAY)
            : getMaxListIndex(listRef, EMPTY_ARRAY);
        if (listRef.current[index]) {
          event.preventDefault();
          menuStore.setActiveIndex(index, REASONS.keyboard);
        }
      }
      return;
    }

    const shouldForwardCrossAxisKey =
      isCrossOrientationOpenKey(event.key, orientation, isRtl) ||
      isCrossOrientationCloseKey(event.key, orientation, isRtl, false);
    if (!shouldForwardCrossAxisKey) {
      return;
    }

    const KeyboardEventConstructor = ownerWindow(activeItem).KeyboardEvent;
    const forwardEvent = new KeyboardEventConstructor(event.type, event.nativeEvent);
    if (!activeItem.dispatchEvent(forwardEvent) || forwardEvent.cancelBubble) {
      stopEvent(event);
      event.preventBaseUIHandler();
    }
  });
}
