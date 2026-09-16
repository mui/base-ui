import { EMPTY_ARRAY } from '@base-ui/utils/empty';
import {
  flattenLeafItems,
  getItemValue,
  isGroupedItems,
  stringifyAsLabel,
  type Group,
} from '../../internals/resolveValueLabel';
import type { State } from '../store';

/**
 * Why an `items` prop cannot be windowed, or `null` when it can.
 *
 * `missing` — no `items` at all, so there is no collection to window.
 * `record` — a label map. Its keys are strings and their order is the object's, not the list's,
 * so there is no index a caller could reason about.
 */
export type SelectCollectionProblem = 'missing' | 'record';

export interface SelectCollection {
  /**
   * The flat, ordered rows to window. Empty when the items cannot be windowed, so a misconfigured
   * list renders nothing rather than something subtly wrong.
   */
  items: ReadonlyArray<unknown>;
  /**
   * The grouped view of `items`, when the root's `items` is an array of groups: the same
   * collection partitioned in order, so the group item counts sum to `items.length`. The
   * virtualizer derives its group header rows from it.
   */
  groups: ReadonlyArray<Group<unknown>> | undefined;
  problem: SelectCollectionProblem | null;
}

/**
 * Resolves the collection `<Virtualizer>` windows from the root's `items` prop.
 *
 * A flat array is returned **by identity**. Every geometry cache the engine keeps is keyed on the
 * rows derived from it, so returning a fresh array of equal items would rehydrate all of them on
 * each render — in the component whose whole purpose is not to touch every item. A grouped array
 * is returned by identity too, as `groups`, with its items flattened once per collection: the
 * flattening is what the root's item indexes count, and the virtualizer's own projection caches on
 * the group partition rather than on the array.
 */
export function getSelectCollection(items: State['items']): SelectCollection {
  if (items == null) {
    return { items: EMPTY_ARRAY, groups: undefined, problem: 'missing' };
  }
  if (!Array.isArray(items)) {
    return { items: EMPTY_ARRAY, groups: undefined, problem: 'record' };
  }
  if (isGroupedItems(items)) {
    return { items: flattenLeafItems(items), groups: items, problem: null };
  }
  return { items, groups: undefined, problem: null };
}

/**
 * The string typeahead matches an item against.
 *
 * `itemToStringLabel` is the application's, and it is documented as receiving an item *value*, so
 * it is given the projected value rather than the row. Without it, the row itself is stringified,
 * which is what lets a `{ label, value }` entry keep its label.
 */
export function getSelectItemLabel(
  item: unknown,
  itemToStringLabel: ((itemValue: any) => string) | undefined,
): string {
  if (itemToStringLabel) {
    const projected = getItemValue(item);
    // A nullish value has no label of its own, and `stringifyAsLabel` skips the callback for one,
    // so `{ value: null, label: 'None' }` would stringify to nothing. Fall back to the row's own
    // label — never to handing the callback the row, which is a shape it is given nowhere else and
    // which a value-typed callback would throw on.
    if (projected == null) {
      return stringifyAsLabel(item);
    }
    return stringifyAsLabel(projected, itemToStringLabel);
  }
  return stringifyAsLabel(item);
}
