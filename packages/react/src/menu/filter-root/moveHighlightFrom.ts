import type * as React from 'react';
import { EMPTY_ARRAY } from '@base-ui/utils/empty';
import {
  getMaxListIndex,
  getMinListIndex,
  getNextListIndex,
} from '../../internals/composite/listIndex';
import { isMainOrientationToEndKey } from '../../utils/popups/interactions/useListNavigation';
import { REASONS } from '../../internals/reasons';
import type { MenuRoot } from '../root/MenuRoot';
import type { MenuStore } from '../store/MenuStore';

/**
 * Moves a menu's highlight from `item` one step in the direction of a main-orientation arrow key,
 * with the same step as the menu's own list navigation, and returns the newly highlighted item.
 * A step that would leave a menu whose navigation escapes to its input keeps the highlight.
 */
export function moveHighlightFrom(
  store: MenuStore<unknown>,
  item: HTMLElement,
  event: React.KeyboardEvent,
  options: MoveHighlightOptions,
): HTMLElement | undefined {
  const { orientation, rtl, loopFocus, allowEscape } = options;
  const listRef = store.context.itemDomElements;
  const items = listRef.current;
  const { index } = getNextListIndex(items, items.indexOf(item), {
    decrement: !isMainOrientationToEndKey(event.key, orientation, rtl),
    loopFocus,
    allowEscape,
    // Match the menu's list navigation: `aria-disabled` items stay reachable.
    disabledIndices: EMPTY_ARRAY,
    minIndex: getMinListIndex(listRef, EMPTY_ARRAY),
    maxIndex: getMaxListIndex(listRef, EMPTY_ARRAY),
  });

  const next = items[index];
  if (next) {
    store.setActiveIndex(index, REASONS.keyboard, event.nativeEvent);
    next.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  }
  return next ?? undefined;
}

export interface MoveHighlightOptions {
  orientation: MenuRoot.Orientation;
  rtl: boolean;
  loopFocus: boolean;
  /** Whether the menu's navigation escapes to its input at either end instead of wrapping. */
  allowEscape: boolean;
}
