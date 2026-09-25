'use client';
import * as React from 'react';
import { ownerWindow } from '@base-ui/utils/owner';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { EMPTY_ARRAY } from '@base-ui/utils/empty';
import { isHTMLElement } from '@floating-ui/utils/dom';
import { useMenuRootContext } from '../root/MenuRootContext';
import { useMenuSubmenuRootContext } from '../submenu-root/MenuSubmenuRootContext';
import { useDirection } from '../../internals/direction-context/DirectionContext';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import type { MenuRoot } from '../root/MenuRoot';
import { stopEvent } from '../../floating-ui-react/utils/event';
import { getMaxListIndex, getMinListIndex } from '../../floating-ui-react/utils/composite';
import { dispatchClickWithModifiers } from '../../utils/dispatchClickWithModifiers';
import {
  isCrossOrientationCloseKey,
  isCrossOrientationOpenKey,
  isMainOrientationKey,
} from '../../floating-ui-react/hooks/useListNavigation';

export type MenuFilterKeyAction =
  /** Native text editing in the input; list navigation and parent handlers stay out of it. */
  | 'edit'
  /** The menu's list navigation handles the key. */
  | 'navigate'
  /** A horizontal list is entered from the input with a vertical arrow. */
  | 'enter-list'
  /** The highlighted item handles the key, which opens or closes its submenu. */
  | 'submenu'
  /** The highlighted item is activated. */
  | 'activate'
  /** The popup closes and focus returns to where it came from. */
  | 'close'
  /** The key belongs to an IME composition or leaves the popup (Tab). */
  | 'ignore';

/**
 * Decides what a key does while the filter input owns the keyboard.
 */
export function getMenuFilterKeyAction(
  event: React.KeyboardEvent,
  orientation: MenuRoot.Orientation,
  rtl: boolean,
  hasActiveItem: boolean,
  hasValue: boolean,
): MenuFilterKeyAction {
  const { key } = event;
  // Enter that commits an IME composition belongs to the input, not the list.
  if (event.which === 229) {
    return 'ignore';
  }
  if (key === 'Tab') {
    return event.shiftKey ? 'close' : 'ignore';
  }
  if (key === 'Enter') {
    return hasActiveItem ? 'activate' : 'navigate';
  }

  const isArrow = key.startsWith('Arrow');
  const isBoundary = key === 'Home' || key === 'End';

  // Modified arrows and boundary keys are text-editing commands (extend the selection, move by
  // word or to a text boundary), like a modified character.
  if (event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) {
    return isArrow || isBoundary || key.length === 1 ? 'edit' : 'navigate';
  }
  // Characters stay out of parent handlers such as typeahead.
  if (key.length === 1) {
    return 'edit';
  }
  // Home and End move the caret unless an item is highlighted, even in an empty input.
  if (isBoundary) {
    return hasActiveItem ? 'navigate' : 'edit';
  }
  if (!isArrow) {
    return 'navigate';
  }

  if (isMainOrientationKey(key, orientation)) {
    // Left and Right move the caret of a non-empty input while nothing is highlighted.
    return orientation === 'horizontal' && !hasActiveItem && hasValue ? 'edit' : 'navigate';
  }

  if (hasActiveItem) {
    return isCrossOrientationOpenKey(key, orientation, rtl) ||
      isCrossOrientationCloseKey(key, orientation, rtl, false)
      ? 'submenu'
      : 'navigate';
  }
  if (orientation === 'horizontal') {
    return 'enter-list';
  }
  // With nothing highlighted, Left and Right move the caret. On an empty input they fall
  // through so they can still close a submenu.
  return hasValue ? 'edit' : 'navigate';
}

/**
 * Routes keys for a filterable menu's input, which holds real focus while the list is navigated
 * with `aria-activedescendant`. Every key that reaches the input, the trigger while the popup is
 * open, or an item that received real focus from assistive technology goes through here, and
 * navigation runs the menu's own `useListNavigation` handler directly.
 */
export function useMenuFilterKeyDown(hasValue: boolean) {
  const { orientation, store } = useMenuRootContext();
  const submenuContext = useMenuSubmenuRootContext();
  const direction = useDirection();

  return useStableCallback((event: React.KeyboardEvent<HTMLElement>) => {
    const activeItem = store.state.highlightedItem;
    const action = getMenuFilterKeyAction(
      event,
      orientation,
      direction === 'rtl',
      activeItem != null,
      hasValue,
    );

    switch (action) {
      case 'edit':
        event.stopPropagation();
        break;
      case 'navigate': {
        if (isMainOrientationKey(event.key, orientation)) {
          // Keep the same event from reaching the popup's list navigation and moving the virtual
          // cursor a second time.
          event.stopPropagation();
        }
        store.state.inputProps.onKeyDown?.(event as React.KeyboardEvent<any>);
        break;
      }
      case 'enter-list': {
        event.stopPropagation();
        const listRef = store.context.itemDomElements;
        const index =
          event.key === 'ArrowDown'
            ? getMinListIndex(listRef, EMPTY_ARRAY)
            : getMaxListIndex(listRef, EMPTY_ARRAY);
        if (listRef.current[index]) {
          event.preventDefault();
          store.setActiveIndex(index, REASONS.keyboard);
        }
        break;
      }
      case 'submenu': {
        // The highlighted item's own handlers decide, since opening depends on the item and on
        // both menus' orientations, and they read `currentTarget`, so the key is dispatched on
        // it. Its propagation reaches the popup, which closes a submenu.
        stopEvent(event);
        const KeyboardEventConstructor = ownerWindow(activeItem).KeyboardEvent;
        activeItem!.dispatchEvent(new KeyboardEventConstructor(event.type, event.nativeEvent));
        break;
      }
      case 'activate':
        event.preventDefault();
        dispatchClickWithModifiers(activeItem!, event);
        break;
      case 'close': {
        // Mirror the plain menu: Shift+Tab closes the popup and returns focus. A submenu returns
        // to the element that held focus in its parent, which is the parent's input rather than
        // its untabbable trigger when the parent is filterable too.
        stopEvent(event);
        const returnElement =
          (store.state.parent.type === 'menu' && submenuContext?.getReturnElement?.()) ||
          store.state.activeTriggerElement;
        const details = createChangeEventDetails(REASONS.focusOut, event.nativeEvent);
        store.setOpen(false, details);
        if (!details.isCanceled && isHTMLElement(returnElement)) {
          returnElement.focus();
        }
        break;
      }
      default:
        break;
    }
  });
}
