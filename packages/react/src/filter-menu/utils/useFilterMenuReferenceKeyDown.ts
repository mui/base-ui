'use client';
import * as React from 'react';
import { ownerWindow } from '@base-ui/utils/owner';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import {
  useFilterDropdownItemContext,
  useFilterDropdownRootContext,
} from '../../filter-dropdown/root/FilterDropdownRootContext';
import { useMenuRootContext } from '../../menu/root/MenuRootContext';
import { useDirection } from '../../internals/direction-context/DirectionContext';
import type { BaseUIEvent } from '../../internals/types';
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
  const { activeIndex } = useFilterDropdownRootContext();
  const { listRef } = useFilterDropdownItemContext();
  const { orientation, store } = useMenuRootContext();
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

    const isRtl = direction === 'rtl';
    const shouldForwardCrossAxisKey =
      isCrossOrientationOpenKey(event.key, orientation, isRtl) ||
      isCrossOrientationCloseKey(event.key, orientation, isRtl, false);
    if (!shouldForwardCrossAxisKey) {
      return;
    }

    const KeyboardEventConstructor = ownerWindow(activeItem).KeyboardEvent;
    const forwardEvent = new KeyboardEventConstructor(event.type, {
      key: event.key,
      bubbles: true,
      cancelable: true,
      composed: true,
      altKey: event.altKey,
      ctrlKey: event.ctrlKey,
      metaKey: event.metaKey,
      shiftKey: event.shiftKey,
    });
    if (!activeItem.dispatchEvent(forwardEvent) || forwardEvent.cancelBubble) {
      stopEvent(event);
      event.preventBaseUIHandler();
    }
  });
}
