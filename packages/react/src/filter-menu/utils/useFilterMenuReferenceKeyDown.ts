'use client';
import * as React from 'react';
import { EMPTY_ARRAY } from '@base-ui/utils/empty';
import { ownerWindow } from '@base-ui/utils/owner';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import {
  useFilterDropdownItemContext,
  useFilterDropdownActiveIndex,
} from '../../filter-dropdown/root/FilterDropdownRootContext';
import { useMenuRootContext } from '../../menu/root/MenuRootContext';
import { useDirection } from '../../internals/direction-context/DirectionContext';
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
  const activeIndex = useFilterDropdownActiveIndex();
  const { grid, listRef } = useFilterDropdownItemContext();
  const { loopFocus, orientation, store } = useMenuRootContext();
  const direction = useDirection();

  return useStableCallback((event: BaseUIEvent<React.KeyboardEvent<HTMLElement>>) => {
    if (event.which === 229) {
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
    if (grid && (event.key === 'ArrowUp' || event.key === 'ArrowDown')) {
      const nextIndex = gridNavigation(
        event,
        activeIndex ?? -1,
        listRef,
        'horizontal',
        loopFocus,
        isRtl,
        EMPTY_ARRAY,
        0,
        listRef.current.length - 1,
      );
      if (nextIndex !== undefined) {
        store.set('activeIndex', nextIndex);
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
      if (event.key === ' ' && store.context.typingRef.current) {
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
