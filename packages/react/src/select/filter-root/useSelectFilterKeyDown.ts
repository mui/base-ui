'use client';
import type * as React from 'react';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { getMenuFilterKeyAction } from '../../menu/filter-root/useMenuFilterKeyDown';
import { isMainOrientationKey } from '../../floating-ui-react/hooks/useListNavigation';
import { stopEvent } from '../../floating-ui-react/utils/event';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import { dispatchClickWithModifiers } from '../../utils/dispatchClickWithModifiers';
import { useSelectRootContext } from '../root/SelectRootContext';
import { useSelectFilterNavigationContext } from './SelectFilterContext';
import { useSelectFilterTrapsFocus } from './useSelectFilterTrapsFocus';

/**
 * Routes keys for a filterable select's input, which holds real focus while the list is
 * navigated with `aria-activedescendant`. Keys reaching the input, and those an option that
 * received real focus from assistive technology hands back, go through here. Navigation runs the
 * select's own `useListNavigation` handler directly.
 */
export function useSelectFilterKeyDown(hasValue: boolean) {
  const store = useSelectRootContext();
  const { navigationProps } = useSelectFilterNavigationContext();
  const trapsFocus = useSelectFilterTrapsFocus();

  return useStableCallback((event: React.KeyboardEvent<HTMLElement>) => {
    const activeIndex = store.state.activeIndex;
    const activeItem = activeIndex === null ? null : store.context.listRef.current[activeIndex];
    const action = getMenuFilterKeyAction(event, {
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
        navigationProps.onKeyDown?.(event as React.KeyboardEvent<any>);
        break;
      case 'activate':
        event.preventDefault();
        dispatchClickWithModifiers(activeItem!, event);
        break;
      case 'close': {
        // Mirror the plain select: Shift+Tab closes the popup and returns focus to the trigger. A
        // trapped popup keeps both Tabs inside instead.
        if (trapsFocus) {
          break;
        }
        stopEvent(event);
        const trigger = store.state.triggerElement;
        store.context.setOpen(false, createChangeEventDetails(REASONS.focusOut, event.nativeEvent));
        trigger?.focus();
        break;
      }
      default:
        break;
    }
  });
}
