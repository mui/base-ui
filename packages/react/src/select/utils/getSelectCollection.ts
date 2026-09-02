import { EMPTY_ARRAY } from '@base-ui/utils/empty';
import {
  flattenLeafItems,
  getItemValue,
  isGroupedItems,
  stringifyAsLabel,
} from '../../internals/resolveValueLabel';
import type { State } from '../store';

/**
 * Why an `items` prop cannot be windowed, or `null` when it can.
 *
 * `missing` — no `items` at all, so there is no collection to window.
 * `grouped` — an array of groups. The virtualization seam windows a single ordered sequence.
 * `record` — a label map. Its keys are strings and their order is the object's, not the list's,
 * so there is no index a caller could reason about.
 */
export type SelectCollectionProblem = 'missing' | 'grouped' | 'record';

export interface SelectCollection {
  /**
   * The flat, ordered rows to window. Empty when the items cannot be windowed, so a misconfigured
   * list renders nothing rather than something subtly wrong.
   */
  items: ReadonlyArray<unknown>;
  problem: SelectCollectionProblem | null;
}

/**
 * Resolves the collection `<Virtualizer>` windows from the root's `items` prop.
 *
 * A flat array is returned **by identity**. Every geometry cache the engine keeps is keyed on the
 * rows derived from it, so returning a fresh array of equal items would rehydrate all of them on
 * each render — in the component whose whole purpose is not to touch every item.
 */
export function getSelectCollection(items: State['items']): SelectCollection {
  if (items == null) {
    return { items: EMPTY_ARRAY, problem: 'missing' };
  }
  if (!Array.isArray(items)) {
    return { items: EMPTY_ARRAY, problem: 'record' };
  }
  if (isGroupedItems(items)) {
    // Flattened rather than dropped: the configuration is unsupported and diagnosed, but a list
    // that renders its items is far easier to recognise as wrong than an empty one.
    return { items: flattenLeafItems(items), problem: 'grouped' };
  }
  return { items, problem: null };
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
