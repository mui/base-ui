'use client';
import * as React from 'react';
import { useFilterDropdownRootContext } from '../../filter-dropdown/root/FilterDropdownRootContext';
import { isTypingKey } from '../../filter-dropdown/utils/isTypingKey';
import { isVirtualPointerEvent } from '../../utils/popups/event';
import { getFloatingFocusElement } from '../../utils/popups/element';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import type { BaseUIEvent, HTMLProps } from '../../internals/types';
import { useSelectRootContext } from '../root/SelectRootContext';
import { useSelectFilterNavigationContext } from './SelectFilterContext';
import { useSelectFilterKeyDown } from './useSelectFilterKeyDown';

/**
 * The props a filterable select adds to its trigger: screen reader press tracking, and a relay of
 * list navigation and typing on the trigger to the input, which holds real focus while the popup
 * is open. Typing on the closed trigger opens the popup with the typed character as the query. The popup is a dialog holding the input and the list, so the trigger stays a plain
 * button: no element carries the combobox role, and the listbox carries `aria-readonly` and
 * `aria-required`. A button exposes no value apart from its name, so the name joins the label and
 * the trigger's own text, which shows the selected value.
 */
export function useSelectFilterTriggerProps(
  id: string | undefined,
  ariaLabelledBy: string | undefined,
): HTMLProps {
  const store = useSelectRootContext();
  const open = store.useState('open');
  const positionerElement = store.useState('positionerElement');
  const { focusOwnerRef, disabled, onValueChange } = useFilterDropdownRootContext();
  const { virtualPressRef } = useSelectFilterNavigationContext();
  // The trigger only relays the vertical arrows, which navigate whether or not the input has text.
  const handleInputKeyDown = useSelectFilterKeyDown(false);

  return React.useMemo<HTMLProps>(
    () => ({
      role: undefined,
      'aria-labelledby': ariaLabelledBy && id ? `${ariaLabelledBy} ${id}` : ariaLabelledBy,
      'aria-haspopup': 'dialog',
      'aria-controls': open ? getFloatingFocusElement(positionerElement)?.id : undefined,
      'aria-readonly': undefined,
      'aria-required': undefined,
      onPointerDown(event: React.PointerEvent<HTMLElement>) {
        virtualPressRef.current = isVirtualPointerEvent(event.nativeEvent);
      },
      onKeyDown(event: BaseUIEvent<React.KeyboardEvent<HTMLElement>>) {
        if (!store.state.open) {
          if (!disabled && isTypingKey(event)) {
            event.preventDefault();
            onValueChange(
              event.key,
              createChangeEventDetails(REASONS.inputChange, event.nativeEvent),
            );
            store.setOpen(true, createChangeEventDetails(REASONS.triggerPress, event.nativeEvent));
          }
          return;
        }

        const focusOwner = focusOwnerRef.current;
        if (!focusOwner) {
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
    [
      id,
      ariaLabelledBy,
      open,
      positionerElement,
      store,
      focusOwnerRef,
      disabled,
      onValueChange,
      virtualPressRef,
      handleInputKeyDown,
    ],
  );
}
