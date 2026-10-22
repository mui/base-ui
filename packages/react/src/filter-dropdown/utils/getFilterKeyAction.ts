import type * as React from 'react';
import type { Orientation } from '../../internals/types';
import {
  isCrossOrientationCloseKey,
  isCrossOrientationOpenKey,
  isMainOrientationKey,
} from '../../utils/popups/interactions/useListNavigation';

export type FilterKeyAction =
  /** Native text editing in the input; list navigation and parent handlers stay out of it. */
  | 'edit'
  /** The host's list navigation handles the key. */
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

export interface FilterKeyContext {
  orientation: Orientation;
  rtl: boolean;
  /** Whether an item is highlighted. */
  hasActiveItem: boolean;
  /** Whether the highlighted item opens a submenu. */
  activeItemOpensSubmenu: boolean;
  /** Whether the input has text. */
  hasValue: boolean;
}

/**
 * Decides what a key does while the filter input owns the keyboard.
 */
export function getFilterKeyAction(
  event: React.KeyboardEvent,
  context: FilterKeyContext,
): FilterKeyAction {
  const { orientation, rtl, hasActiveItem, activeItemOpensSubmenu, hasValue } = context;
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
  // Home and End move the caret while the input has text, and jump to the ends of the list
  // otherwise once an item is highlighted.
  if (isBoundary) {
    return hasActiveItem && !hasValue ? 'navigate' : 'edit';
  }
  if (!isArrow) {
    return 'navigate';
  }

  if (isMainOrientationKey(key, orientation)) {
    // Left and Right move the caret of a non-empty input while nothing is highlighted.
    return orientation === 'horizontal' && !hasActiveItem && hasValue ? 'edit' : 'navigate';
  }

  // A highlighted submenu trigger takes the cross-axis keys to open or close its submenu.
  if (
    activeItemOpensSubmenu &&
    (isCrossOrientationOpenKey(key, orientation, rtl) ||
      isCrossOrientationCloseKey(key, orientation, rtl, false))
  ) {
    return 'submenu';
  }
  if (orientation === 'horizontal' && !hasActiveItem) {
    return 'enter-list';
  }
  // Otherwise the cross-axis keys move the caret. On an empty input they fall through so they
  // can still close a submenu.
  return hasValue ? 'edit' : 'navigate';
}
