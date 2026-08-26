'use client';
import * as React from 'react';
import { EMPTY_ARRAY } from '@base-ui/utils/empty';
import { ownerWindow } from '@base-ui/utils/owner';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { isHTMLElement } from '@floating-ui/utils/dom';
import {
  useFilterDropdownItemContext,
  useFilterDropdownRootContext,
} from '../../filter-dropdown/root/FilterDropdownRootContext';
import { useMenuRootContext } from '../../menu/root/MenuRootContext';
import { useDirection } from '../../internals/direction-context/DirectionContext';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import type { BaseUIEvent } from '../../internals/types';
import { gridNavigation } from '../../floating-ui-react/hooks/gridNavigation';
import { isTypeableElement } from '../../floating-ui-react/utils/element';
import { stopEvent } from '../../floating-ui-react/utils/event';
import { dispatchClickWithModifiers } from '../../utils/dispatchClickWithModifiers';
import {
  isCrossOrientationCloseKey,
  isCrossOrientationOpenKey,
  isMainOrientationKey,
} from '../../floating-ui-react/utils/listNavigation';

/**
 * Handles keys that only a FilterMenu virtual-focus owner needs. The Menu root still owns the
 * single list-navigation hook; keeping this relay in the adapter avoids shipping it in plain Menu.
 */
export function useFilterMenuReferenceKeyDown() {
  const { grid, listRef, store: filterStore } = useFilterDropdownItemContext();
  const { inline, virtualized } = useFilterDropdownRootContext();
  const { loopFocus, orientation, store: menuStore } = useMenuRootContext();
  const direction = useDirection();

  const activeIndex = filterStore.useState('activeIndex');

  return useStableCallback((event: BaseUIEvent<React.KeyboardEvent<HTMLElement>>) => {
    if (event.which === 229) {
      return;
    }

    // A windowed registry ends at the mounted window's edge, so boundary keys would treat that
    // edge as the end of the list. Stretch it to the full count before the navigation handlers
    // read it; the trailing holes are navigable and the virtualizer mounts them once highlighted.
    // Re-applied on every key because the composite registry resets the length on each flush.
    if (typeof virtualized === 'number' && listRef.current.length !== virtualized) {
      listRef.current.length = virtualized;
    }

    if (event.key === 'Tab') {
      // Mirror the plain menu: Shift+Tab closes the popup and returns focus to the trigger.
      // The generic close branch in `useListNavigation` skips virtual focus, and a forward Tab
      // already closes through focus-out once focus leaves the popup.
      if (event.shiftKey && !inline) {
        stopEvent(event);
        const trigger = menuStore.state.activeTriggerElement;
        menuStore.setOpen(false, createChangeEventDetails(REASONS.focusOut, event.nativeEvent));
        if (isHTMLElement(trigger)) {
          trigger.focus();
        }
      }
      return;
    }

    if (
      isTypeableElement(event.currentTarget) &&
      (event.shiftKey || event.ctrlKey || event.metaKey || event.altKey)
    ) {
      // Modified arrows and boundary keys are native text-editing commands (extend the selection,
      // move by word or to a text boundary), which the input's own handler keeps native.
      return;
    }

    const isRtl = direction === 'rtl';
    if (
      grid &&
      (event.key === 'ArrowUp' || event.key === 'ArrowDown') &&
      event.target === event.currentTarget
    ) {
      const nextIndex = gridNavigation(
        event,
        activeIndex ?? -1,
        listRef,
        orientation,
        loopFocus,
        isRtl,
        EMPTY_ARRAY,
        0,
        listRef.current.length - 1,
      );
      if (nextIndex !== undefined) {
        menuStore.context.highlightReason = 'keyboard';
        menuStore.set('activeIndex', nextIndex);
      }
      return;
    }

    if (isMainOrientationKey(event.key, orientation)) {
      // The reference handler owns main-axis navigation. Keep the same event from reaching the
      // popup's floating handler and moving the virtual cursor a second time.
      event.stopPropagation();
    }

    const activeItem = listRef.current[activeIndex ?? -1];
    if (!activeItem || event.target !== event.currentTarget) {
      return;
    }

    const isActivationKey = event.key === 'Enter' || event.key === ' ';
    if (!isTypeableElement(event.currentTarget) && isActivationKey) {
      // Space during an inputless typeahead session belongs to the typed string.
      if (event.key === ' ' && menuStore.context.typingRef.current) {
        return;
      }

      stopEvent(event);
      event.preventBaseUIHandler();
      dispatchClickWithModifiers(activeItem, event);
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
