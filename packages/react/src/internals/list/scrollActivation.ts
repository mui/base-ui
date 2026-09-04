import type { ListVirtualizationRegistry } from '../virtualization/ListVirtualizationRegistry';

/**
 * What caused an item to become active. Lists that support both keyboard and pointer highlighting
 * record it so the two can be told apart when deciding whether to scroll.
 */
export type ListHighlightReason = 'keyboard' | 'pointer' | 'none';

/**
 * The two scroll decisions a list makes when an item becomes active. They suppress the same
 * behavior from opposite sides, and each is only correct with the other in place:
 *
 * - `shouldScrollItemIntoView` answers for DOM scrolling, done by list navigation on the item's
 *   element. It is turned off while a built-in virtualizer owns the scroll position, because that
 *   virtualizer scrolls by logical index — including to items that have no element yet.
 * - `shouldScrollActiveIntoView` answers for that virtual scroll. It is turned off for activations
 *   the pointer caused, because the pointer is already resting on the item and moving the list
 *   would pull it out from under the cursor.
 *
 * A list passes the first to navigation and publishes the second across the virtualization seam.
 */
export function shouldScrollItemIntoView(registry: ListVirtualizationRegistry) {
  return registry.virtualizer?.enabled !== true;
}

export function shouldScrollActiveIntoView(highlightType: ListHighlightReason) {
  return highlightType !== 'pointer';
}
