'use client';
import * as React from 'react';
import { ownerWindow } from '@base-ui/utils/owner';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useFilterDropdownRootContext } from '../../filter-dropdown/root/FilterDropdownRootContext';
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
} from './listNavigation';

/**
 * Handles keys that only a FilterMenu virtual-focus owner needs. The Menu root still owns the
 * single list-navigation hook; keeping this relay in the adapter avoids shipping it in plain Menu.
 */
export function useFilterMenuReferenceKeyDown() {
  const { listRef, activeIndex } = useFilterDropdownRootContext();
  const { orientation } = useMenuRootContext();
  const direction = useDirection();

  return useStableCallback((event: BaseUIEvent<React.KeyboardEvent<HTMLElement>>) => {
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
      if (event.key === ' ') {
        event.preventDefault();
      }
      stopEvent(event);
      event.preventBaseUIHandler();
      dispatchClickWithModifiers(activeItem, event);
      return;
    }

    const isRtl = direction === 'rtl';
    const shouldForwardCrossAxisKey =
      orientation !== undefined &&
      (isCrossOrientationOpenKey(event.key, orientation, isRtl) ||
        isCrossOrientationCloseKey(event.key, orientation, isRtl, false));
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
