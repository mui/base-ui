'use client';
import type * as React from 'react';
import { ownerWindow } from '@base-ui/utils/owner';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { EMPTY_ARRAY } from '@base-ui/utils/empty';
import { isHTMLElement } from '@floating-ui/utils/dom';
import { useMenuRootContext } from '../root/MenuRootContext';
import { useMenuSubmenuRootContext } from '../submenu-root/MenuSubmenuRootContext';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import type { MenuRoot } from '../root/MenuRoot';
import { stopEvent } from '../../utils/popups/event';
import { getMaxListIndex, getMinListIndex } from '../../internals/composite/listIndex';
import { dispatchClickWithModifiers } from '../../utils/dispatchClickWithModifiers';
import {
  isMainOrientationKey,
  isCrossOrientationOpenKey,
  isCrossOrientationCloseKey,
} from '../../utils/popups/interactions/useListNavigation';
import { useDirection } from '../../internals/direction-context/DirectionContext';

export type MenuFilterKeyAction =
  /** Native text editing in the input; list navigation and parent handlers stay out of it. */
  | 'edit'
  /** The menu's list navigation handles the key. */
  | 'navigate'
  /** A horizontal list is entered from the input with a vertical arrow. */
  | 'enter-list'
  /** The highlighted item handles Space or an arrow key. */
  | 'item'
  /** The highlighted item is activated. */
  | 'activate'
  /** The popup closes and focus returns to where it came from. */
  | 'close'
  /** The key belongs to an IME composition or leaves the popup (Tab). */
  | 'ignore';

export interface MenuFilterKeyContext {
  orientation: MenuRoot.Orientation;
  /** Whether an item is highlighted. */
  hasActiveItem: boolean;
  /** Whether the input has text. */
  hasValue: boolean;
  /** Whether a horizontal arrow can navigate the list or a submenu at a collapsed caret boundary. */
  isCaretAtBoundary: boolean;
}

/**
 * Decides what a key does while the filter input owns the keyboard.
 */
export function getMenuFilterKeyAction(
  event: React.KeyboardEvent,
  context: MenuFilterKeyContext,
): MenuFilterKeyAction {
  const { orientation, hasActiveItem, hasValue, isCaretAtBoundary } = context;
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
  if (
    isArrow &&
    (isCaretAtBoundary ||
      (orientation === 'horizontal' && hasActiveItem && !isMainOrientationKey(key, orientation)))
  ) {
    return hasActiveItem ? 'item' : 'navigate';
  }
  if (!hasValue && (key === ' ' || (isArrow && hasActiveItem))) {
    return hasActiveItem ? 'item' : 'navigate';
  }
  // Characters stay out of parent handlers such as typeahead.
  if (key.length === 1) {
    return 'edit';
  }
  // Home and End move the caret while the input has text, and jump to the ends of the list
  // otherwise once an item is highlighted.
  if (isBoundary) {
    return hasActiveItem && !hasValue ? 'navigate' : 'edit';
  }
  if (!isArrow) {
    return 'navigate';
  }

  if (isMainOrientationKey(key, orientation)) {
    // Left and Right move the caret while inside the input text.
    return orientation === 'horizontal' && hasValue ? 'edit' : 'navigate';
  }

  if (orientation === 'horizontal' && !hasActiveItem) {
    return 'enter-list';
  }
  // Otherwise the cross-axis keys move the caret. On an empty input they fall through so they
  // can still close a submenu.
  return hasValue ? 'edit' : 'navigate';
}

/**
 * Routes keys for a filterable menu's input, which holds real focus while the list is navigated
 * with `aria-activedescendant`. Keys reaching the input, and those an item that received real
 * focus from assistive technology hands back, go through here; the trigger relays only the
 * vertical arrows while the popup is open. Navigation runs the menu's own `useListNavigation`
 * handler directly.
 */
export function useMenuFilterKeyDown(hasValue: boolean) {
  const { orientation, store } = useMenuRootContext();
  const submenuContext = useMenuSubmenuRootContext();
  const direction = useDirection();

  return useStableCallback((event: React.KeyboardEvent<HTMLElement>) => {
    // Like a plain menu, ignore keys while the popup animates out with the input still focused.
    if (!store.select('open')) {
      return;
    }
    const activeItem = store.state.highlightedItem;
    const input = store.context.virtualFocusRef?.current;
    const inputWindow = ownerWindow(input);
    const isTextInput =
      input instanceof inputWindow.HTMLInputElement ||
      input instanceof inputWindow.HTMLTextAreaElement;
    const hasCollapsedCaret =
      isTextInput && input.selectionStart !== null && input.selectionStart === input.selectionEnd;
    const rtl = direction === 'rtl';
    const canOpenSubmenu =
      activeItem?.hasAttribute('aria-haspopup') &&
      isCrossOrientationOpenKey(event.key, orientation, rtl);
    const canCloseSubmenu =
      store.state.parent.type === 'menu' &&
      isCrossOrientationCloseKey(event.key, orientation, rtl, false);
    const canNavigateAtBoundary =
      (orientation === 'horizontal' && isMainOrientationKey(event.key, orientation)) ||
      canOpenSubmenu ||
      canCloseSubmenu;
    const inputRtl =
      hasCollapsedCaret &&
      canNavigateAtBoundary &&
      inputWindow.getComputedStyle(input).direction === 'rtl';
    const isCaretAtBoundary =
      canNavigateAtBoundary &&
      hasCollapsedCaret &&
      ((event.key === (inputRtl ? 'ArrowRight' : 'ArrowLeft') && input.selectionStart === 0) ||
        (event.key === (inputRtl ? 'ArrowLeft' : 'ArrowRight') &&
          input.selectionStart === input.value.length));
    const action = getMenuFilterKeyAction(event, {
      orientation,
      hasActiveItem: activeItem != null,
      hasValue,
      isCaretAtBoundary,
    });

    switch (action) {
      case 'edit':
        event.stopPropagation();
        // Typing ends pointer modality, as it does in a combobox, so a result change that moves
        // the highlighted item out from under a resting pointer doesn't clear the highlight.
        if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
          store.state.inputProps.onKeyDown?.(event as React.KeyboardEvent<any>);
        }
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
          store.setActiveIndex(index, REASONS.keyboard, event.nativeEvent);
        }
        break;
      }
      case 'item': {
        // Item handlers need their own target for activation and submenu navigation.
        // Main-axis arrows continue through the list's navigation handler.
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
