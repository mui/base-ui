import type { CollectionItemId } from '../../types/collection';
import { isRtlElement } from './utils';

/**
 * Where a dragged item lands relative to the target row.
 */
export type DropPosition = 'before' | 'after' | 'on';

/** @internal Runtime brand used to distinguish Tree payloads from arbitrary draggables. */
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

/**
 * Which drop positions a collection can resolve to, derived from the configured
 * callbacks. `hasOn` allows dropping "on" a row (reparent / item drop), while
 * `hasBeforeAfter` allows dropping between rows (reorder / insert).
 *
 * The allowed positions are derived from the callbacks that can commit a drop of
 * the given origin — an internal drag routes to `onMove`/`onReorder`/`onItemDrop`,
 * an external one to `onInsert`/`onItemDrop` — so a position never lights up an
 * indicator only for its drop to no-op. The trade-off is that adding an
 * `onItemDrop`/`onMove` handler introduces the "on" zone and reshapes the
 * before/after hit areas of every row. Per origin, the mapping is:
 *
 * | Configured callbacks | Internal drag       | External drag       |
 * | -------------------- | ------------------- | ------------------- |
 * | none                 | before / after / on | before / after / on |
 * | reorder only         | before / after      | —                   |
 * | insert only          | —                   | before / after      |
 * | itemDrop only        | on                  | on                  |
 * | move                 | before / after / on | —                   |
 *
 * A collection with no resolvable position for the drag's origin ("—") rejects
 * the row as a drop target entirely, so the drop falls through to the root / an
 * outer target. With no callbacks at all (a collection driven manually through
 * `onStateChange`) every position resolves. To keep a callback wired (e.g. for
 * logging) without it changing the geometry, veto the unwanted position per
 * target from `canDrop`.
 */
export interface DropCapabilities {
  hasOn: boolean;
  hasBeforeAfter: boolean;
}

/** Which side of the collection a drag came from, for {@link getDropCapabilities}. */
export type DropOrigin = 'internal' | 'external';

export function getDropCapabilities(
  config: {
    onReorder?: unknown;
    onInsert?: unknown;
    onMove?: unknown;
    onItemDrop?: unknown;
  },
  origin: DropOrigin,
): DropCapabilities {
  if (!config.onReorder && !config.onInsert && !config.onMove && !config.onItemDrop) {
    // No drop callbacks at all: the consumer commits drops manually (via
    // `onStateChange`), so every position stays resolvable.
    return { hasOn: true, hasBeforeAfter: true };
  }
  return origin === 'internal'
    ? {
        hasOn: !!(config.onMove || config.onItemDrop),
        hasBeforeAfter: !!(config.onMove || config.onReorder),
      }
    : {
        hasOn: !!config.onItemDrop,
        hasBeforeAfter: !!config.onInsert,
      };
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
 * with reading order, matching the keyboard collision and auto-scroller RTL
 * handling.
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
