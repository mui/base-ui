import { EMPTY_ARRAY } from '@base-ui/utils/empty';
import { findNonDisabledListIndex } from '../../floating-ui-react/utils/composite';
import { REASONS } from '../../internals/reasons';
import type { MenuRoot } from '../root/MenuRoot';
import type { MenuStore } from '../store/MenuStore';

/**
 * Moves a menu's highlight from `item` to its neighbor in the direction of a main-orientation
 * arrow key, as the menu's own list navigation would, and returns the newly highlighted item.
 */
export function moveHighlightFrom(
  store: MenuStore<unknown>,
  item: HTMLElement,
  key: string,
  orientation: MenuRoot.Orientation,
  rtl: boolean,
  loopFocus: boolean,
): HTMLElement | undefined {
  const items = store.context.itemDomElements.current;
  const decrement =
    orientation === 'vertical' ? key === 'ArrowUp' : key === (rtl ? 'ArrowRight' : 'ArrowLeft');
  // Match `useListNavigation`: `aria-disabled` items stay reachable.
  let nextIndex = findNonDisabledListIndex(items, {
    startingIndex: items.indexOf(item),
    decrement,
    disabledIndices: EMPTY_ARRAY,
  });

  if (loopFocus && (nextIndex < 0 || nextIndex >= items.length)) {
    nextIndex = findNonDisabledListIndex(items, {
      startingIndex: decrement ? items.length : -1,
      decrement,
      disabledIndices: EMPTY_ARRAY,
    });
  }

  const next = items[nextIndex];
  if (next) {
    store.setActiveIndex(nextIndex, REASONS.keyboard);
    next.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
  }
  return next ?? undefined;
}
