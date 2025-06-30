export type ComboboxGroup<Item extends { value: unknown }> = {
  value: unknown;
  items: Item[];
};

export function defaultItemFilter<Item extends { value: unknown }>(item: Item, query: string) {
  if (item == null) {
    return false;
  }
  return String(item.value).toLowerCase().includes(query);
}

export function isGroupedItems<Item extends { value: unknown }>(
  items: (Item | ComboboxGroup<Item>)[] | undefined,
): items is ComboboxGroup<Item>[] {
  return items != null && items.length > 0 && 'items' in items[0];
}

export function defaultGroupFilter<Item extends { value: unknown }>(
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
