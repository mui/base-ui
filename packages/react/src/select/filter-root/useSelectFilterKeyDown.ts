'use client';
import type * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { getFilterKeyAction } from '../../filter-dropdown/utils/getFilterKeyAction';
import { isMainOrientationKey } from '../../utils/popups/interactions/useListNavigation';
import { stopEvent } from '../../utils/popups/event';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import { dispatchClickWithModifiers } from '../../utils/dispatchClickWithModifiers';
import { useSelectRootContext } from '../root/SelectRootContext';

/**
 * Routes keys for a filterable select's input, which holds real focus while the list is
 * navigated with `aria-activedescendant`. Keys reaching the input, and those an option that
 * received real focus from assistive technology hands back, go through here. Navigation runs the
 * select's own `useListNavigation` handler directly.
 */
export function useSelectFilterKeyDown(hasValue: boolean) {
  const store = useSelectRootContext();

  return useStableCallback((event: React.KeyboardEvent<HTMLElement>) => {
    // Like a plain select, ignore keys while the popup animates out with the input still focused.
    if (!store.state.open) {
      return;
    }
    const activeItem = store.state.highlightedItem;
    const action = getFilterKeyAction(event, {
      orientation: 'vertical',
      rtl: false,
      hasActiveItem: activeItem != null,
      activeItemOpensSubmenu: false,
      hasValue,
    });

    switch (action) {
      case 'edit':
        event.stopPropagation();
        break;
      case 'navigate':
        if (isMainOrientationKey(event.key, 'vertical')) {
          // Keep the same event from reaching the popup's list navigation and moving the virtual
          // cursor a second time.
          event.stopPropagation();
        }
        store.state.inputProps.onKeyDown?.(event as React.KeyboardEvent<any>);
        break;
      case 'activate':
        event.preventDefault();
        dispatchClickWithModifiers(activeItem!, event);
        break;
      case 'close': {
        // Mirror the plain select: Shift+Tab closes the popup and returns focus to the trigger.
        stopEvent(event);
        const details = createChangeEventDetails(REASONS.focusOut, event.nativeEvent);
        store.context.setOpen(false, details);
        if (!details.isCanceled) {
          store.state.triggerElement?.focus();
        }
        break;
      }
      default:
        break;
    }
  });
}
