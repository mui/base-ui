export type ComboboxGroup<Item> = {
  /**
   * A label or value that identifies this group when required by the consumer.
   * When `Item` is an object with a `value` field, this should typically match that type;
   * however, for simple string items it can be any value.
   */
  value: unknown;
  items: Item[];
};

/**
 * The default filtering behaviour matches the stringified value of the item against the query.
 *
 * • When `item` is an object with a `value` property, that property is used.
 * • When `item` is a primitive (e.g. `string`), it is used directly.
 */
export function defaultItemFilter<Item>(item: Item, query: string) {
  if (item == null) {
    return false;
  }

  let candidate: unknown = item;

  if (typeof item === 'object' && 'value' in (item as any)) {
    candidate = (item as any).value;
  }

  return String(candidate).toLowerCase().includes(query);
}

export function isGroupedItems<Item>(
  items: (Item | ComboboxGroup<Item>)[] | undefined,
): items is ComboboxGroup<Item>[] {
  return (
    items != null &&
    items.length > 0 &&
    typeof items[0] === 'object' &&
    'items' in (items[0] as any)
  );
}

export function defaultGroupFilter<Item>(
  group: ComboboxGroup<Item>,
  query: string,
  itemFilter: (item: Item, query: string) => boolean,
): ComboboxGroup<Item> | null {
  if (query.trim() === '') {
    return group;
  }

  const filteredItems = group.items.filter((item) => itemFilter(item, query));

  if (filteredItems.length === 0) {
    return null;
  }

  return {
    ...group,
    items: filteredItems,
  };
}

export function getFormValue(value: any) {
  if (value && typeof value === 'object') {
    return value.value ?? String(value);
  }
  return String(value);
}
