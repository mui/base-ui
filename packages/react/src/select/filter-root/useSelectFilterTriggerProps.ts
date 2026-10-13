'use client';
import * as React from 'react';
import { useFilterDropdownValueContext } from '../../filter-dropdown/root/FilterDropdownRootContext';
import { isTypingKey } from '../../filter-dropdown/utils/isTypingKey';
import { isVirtualPointerEvent } from '../../floating-ui-react/utils/event';
import type { BaseUIEvent, HTMLProps } from '../../internals/types';
import { useSelectRootContext } from '../root/SelectRootContext';
import { useSelectFilterNavigationContext } from './SelectFilterContext';
import { useSelectFilterKeyDown } from './useSelectFilterKeyDown';

/**
 * The props a filterable select adds to its trigger: screen reader press tracking, and a relay of
 * list navigation and typing on the trigger to the input, which holds real focus while the popup
 * is open.
 */
export function useSelectFilterTriggerProps(): HTMLProps {
  const store = useSelectRootContext();
  const value = useFilterDropdownValueContext();
  const { virtualPressRef } = useSelectFilterNavigationContext();
  const handleInputKeyDown = useSelectFilterKeyDown(value !== '');

  return React.useMemo<HTMLProps>(
    () => ({
      onPointerDown(event: React.PointerEvent<HTMLElement>) {
        virtualPressRef.current = isVirtualPointerEvent(event.nativeEvent);
      },
      onKeyDown(event: BaseUIEvent<React.KeyboardEvent<HTMLElement>>) {
        const focusOwner = store.context.virtualFocusRef?.current;
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
    [store, virtualPressRef, handleInputKeyDown],
  );
}
