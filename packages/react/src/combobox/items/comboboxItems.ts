import { stringifyAsDefaultLabel } from '../../internals/serializeValue';

/**
 * Marks the plain-object payload produced by `Combobox.items()`. A string key (rather than a
 * symbol) so the payload survives React Server Component serialization.
 */
export const ITEMS_PAYLOAD_MARKER = '__baseUIItems';

export function resolveItemsAccessors<Item, Value>(
  options: Pick<ComboboxItemsOptions<Item, Value>, 'value' | 'label'>,
): Required<Pick<ComboboxItemsOptions<Item, Value>, 'value' | 'label'>> {
  const value = options.value ?? ((item: Item) => item as unknown as Value);
  const label = options.label ?? ((item: Item) => stringifyAsDefaultLabel(value(item)));
  return { value, label };
}

/**
 * Normalizes items into a serializable payload for the `useItems()` hook.
 * A hook-free variant of `useItems()` usable in React Server Components: the accessors run
 * eagerly here, and passing the result to `useItems()` on the client re-brands it into a
 * collection for the root's `items` prop.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
export function comboboxItems<Item, Value = Item>(
  data: readonly Item[],
  options: ComboboxItemsOptions<Item, Value> = {},
): ComboboxItemsPayload<Item, Value> {
  const accessors = resolveItemsAccessors(options);
  return {
    [ITEMS_PAYLOAD_MARKER]: true,
    items: data,
    values: data.map(accessors.value),
    labels: data.map(accessors.label),
  } as unknown as ComboboxItemsPayload<Item, Value>;
}

export interface ComboboxItemsOptions<Item, Value = Item> {
  /**
   * Projects an item to the primitive value that identifies it, used as the item's
   * selection value.
   * By default, the item itself is used as the value.
   */
  value?: ((item: Item) => Value) | undefined;
  /**
   * Projects an item to the label string that represents it in the input and, by default,
   * when matching the typed query. The root's `itemToStringLabel` prop takes precedence.
   * By default, the item's derived value is stringified.
   */
  label?: ((item: Item) => string) | undefined;
}

/**
 * Serializable normalized items produced by `items()`. Re-branded into a collection
 * by passing it to `useItems()` on the client.
 */
export declare class ComboboxItemsPayload<Item = any, Value = any> {
  private constructor();
  private readonly __itemsPayloadBrand: (item: Item) => Value;
}

export interface ItemsPayload<Item = any, Value = any> {
  [ITEMS_PAYLOAD_MARKER]: true;
  items: readonly Item[];
  values: readonly Value[];
  labels: readonly string[];
}

export function isItemsPayload(items: unknown): items is ItemsPayload {
  return (
    typeof items === 'object' &&
    items !== null &&
    (items as Record<string, unknown>)[ITEMS_PAYLOAD_MARKER] === true
  );
}
