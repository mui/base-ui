'use client';
import * as React from 'react';
import { ownerWindow } from '@base-ui/utils/owner';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { isHTMLElement } from '@floating-ui/utils/dom';
import {
  useFilterDropdownItemContext,
  useFilterDropdownRootContext,
} from '../../filter-dropdown/root/FilterDropdownRootContext';
import { useMenuRootContext } from '../root/MenuRootContext';
import { useDirection } from '../../internals/direction-context/DirectionContext';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import type { BaseUIEvent } from '../../internals/types';
import { stopEvent } from '../../floating-ui-react/utils/event';
import {
  isCrossOrientationCloseKey,
  isCrossOrientationOpenKey,
  isMainOrientationKey,
} from '../../floating-ui-react/utils/listNavigation';

/**
 * Handles keys that only a filterable menu's virtual-focus owner needs. The Menu root still owns
 * the single list-navigation hook; keeping this relay behind the filter root keeps it out of a
 * plain menu.
 */
export function useMenuFilterReferenceKeyDown() {
  const { listRef, store: filterStore } = useFilterDropdownItemContext();
  const { inline } = useFilterDropdownRootContext();
  const { orientation, store: menuStore } = useMenuRootContext();
  const direction = useDirection();

  const activeIndex = filterStore.useState('activeIndex');

  return useStableCallback((event: BaseUIEvent<React.KeyboardEvent<HTMLElement>>) => {
    if (event.which === 229) {
      return;
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

    const activeItem = listRef.current[activeIndex ?? -1];
    if (!activeItem || event.target !== event.currentTarget) {
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
