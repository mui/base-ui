'use client';
import * as React from 'react';
import { useFilterDropdownRootContext } from '../../filter-dropdown/root/FilterDropdownRootContext';
import { isTypingKey } from '../../filter-dropdown/utils/isTypingKey';
import { isVirtualPointerEvent } from '../../utils/popups/event';
import { getFloatingFocusElement } from '../../utils/popups/element';
import type { BaseUIEvent, HTMLProps } from '../../internals/types';
import { useSelectRootContext } from '../root/SelectRootContext';
import { useSelectFilterNavigationContext } from './SelectFilterContext';
import { useSelectFilterKeyDown } from './useSelectFilterKeyDown';

/**
 * The props a filterable select adds to its trigger: screen reader press tracking, and a relay of
 * list navigation and typing on the trigger to the input, which holds real focus while the popup
 * is open. Like a combobox with its input inside the popup, the trigger stays a combobox that
 * opens a dialog holding the input and the list.
 */
export function useSelectFilterTriggerProps(): HTMLProps {
  const store = useSelectRootContext();
  const open = store.useState('open');
  const positionerElement = store.useState('positionerElement');
  const { focusOwnerRef } = useFilterDropdownRootContext();
  const { virtualPressRef } = useSelectFilterNavigationContext();
  // The trigger only relays the vertical arrows, which navigate whether or not the input has text.
  const handleInputKeyDown = useSelectFilterKeyDown(false);

  return React.useMemo<HTMLProps>(
    () => ({
      'aria-haspopup': 'dialog',
      'aria-controls': open ? getFloatingFocusElement(positionerElement)?.id : undefined,
      onPointerDown(event: React.PointerEvent<HTMLElement>) {
        virtualPressRef.current = isVirtualPointerEvent(event.nativeEvent);
      },
      onKeyDown(event: BaseUIEvent<React.KeyboardEvent<HTMLElement>>) {
        const focusOwner = focusOwnerRef.current;
        if (!store.state.open || !focusOwner) {
          return;
        }

        if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
          focusOwner.focus({ preventScroll: true });
          handleInputKeyDown(event);
          event.preventDefault();
          event.preventBaseUIHandler();
        } else if (isTypingKey(event)) {
          focusOwner.focus({ preventScroll: true });
        }
      },
    }),
    [open, positionerElement, store, focusOwnerRef, virtualPressRef, handleInputKeyDown],
  );
}
