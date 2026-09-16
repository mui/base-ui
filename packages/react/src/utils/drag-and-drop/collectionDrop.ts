import type { CollectionItemId } from '../../types/collection';
import { isRtlElement } from './utils';

/**
 * Where a dragged item lands relative to the target row.
 */
export type DropPosition = 'before' | 'after' | 'on';

/** Runtime brand used to distinguish collection payloads from arbitrary draggables. */
export const treeDragPayloadBrand: unique symbol = Symbol.for('base-ui.tree-drag-payload');

/**
 * The wire format carried with a collection drag, so cross-collection monitors
 * read the same shape regardless of which collection produced the drag.
 */
export type DragSourceData<TItem> = {
  sourceInstanceId: number;
  itemIds: Set<CollectionItemId>;
  draggedItemId: CollectionItemId;
  items: TItem[];
  draggedItem: TItem | undefined;
  remove: () => void;
  readonly [treeDragPayloadBrand]: true;
};

/** Which drop positions a collection can resolve to. */
export interface DropCapabilities {
  hasOn: boolean;
  hasBeforeAfter: boolean;
}

/**
 * The axis along which a sortable resolves before/after. `'vertical'` reads the
 * pointer's `clientY` within the row; `'horizontal'` reads `clientX`.
 */
export type CollectionOrientation = 'vertical' | 'horizontal';

/**
 * Resolve the drop position from the pointer's position within the target row.
 * For `'vertical'` orientation the vertical axis is used; for `'horizontal'`
 * the horizontal axis is used. A zero-size row is treated as centered to avoid
 * `NaN`.
 *
 * A `'horizontal'` list in an RTL container reads right-to-left, so the visual
 * "before" is the right half — the axis is flipped so before/after stay aligned
 * with reading order and the auto-scroller's RTL handling.
 */
// `getComputedStyle` forces style resolution and this runs per hovered frame for
// horizontal lists, so the direction is cached per row element — but only for the
// current drag. `direction` is an ordinary CSS property an app can flip (a locale
// switch, a user preference); a cache keyed to the element's lifetime would keep
// returning the old before/after for every later drag. A direction change *within*
// one drag is still not a supported scenario.
let directionGeneration = 0;
const directionCache = new WeakMap<HTMLElement, { generation: number; rtl: boolean }>();

/** Drop the cached row directions. Called when a collection drag starts. */
export function invalidateDirectionCache(): void {
  directionGeneration += 1;
}

function isRtl(element: HTMLElement): boolean {
  const cached = directionCache.get(element);
  if (cached !== undefined && cached.generation === directionGeneration) {
    return cached.rtl;
  }
  const rtl = isRtlElement(element);
  directionCache.set(element, { generation: directionGeneration, rtl });
  return rtl;
}

export function computeDropPosition(
  element: HTMLElement,
  clientPosition: number,
  { hasOn, hasBeforeAfter }: DropCapabilities,
  orientation: CollectionOrientation = 'vertical',
): DropPosition {
  const rect = element.getBoundingClientRect();
  const size = orientation === 'horizontal' ? rect.width : rect.height;
  const start = orientation === 'horizontal' ? rect.left : rect.top;
  let relative = size > 0 ? (clientPosition - start) / size : 0.5;
  if (orientation === 'horizontal' && isRtl(element)) {
    relative = 1 - relative;
  }

  if (hasOn && hasBeforeAfter) {
    if (relative < 0.25) {
      return 'before';
    }
    if (relative > 0.75) {
      return 'after';
    }
    return 'on';
  }

  if (hasBeforeAfter) {
    return relative < 0.5 ? 'before' : 'after';
  }

  return hasOn ? 'on' : 'after';
}
