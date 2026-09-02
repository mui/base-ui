'use client';
import * as React from 'react';
import { serializeValue } from './serializeValue';

type ItemRecord = Record<string, React.ReactNode>;
type ItemsInput = ItemRecord | ReadonlyArray<LabeledItem> | ReadonlyArray<Group<any>> | undefined;

interface LabeledItem {
  value: any;
  label: React.ReactNode;
}

export interface Group<Item = any> {
  [key: string]: unknown;
  items: ReadonlyArray<Item>;
}

function isGroup(item: any): item is Group<any> {
  return typeof item === 'object' && item != null && Array.isArray(item.items);
}

export function isGroupedItems(
  items: ReadonlyArray<any | Group<any>> | undefined,
): items is ReadonlyArray<Group<any>> {
  // A group must carry an actual `items` array: key presence alone would misclassify an item
  // with an unrelated or optional `items` field.
  return isGroup(items?.[0]);
}

export function flattenLeafItems<Item>(
  items: readonly Item[] | readonly Group<Item>[],
): readonly Item[] {
  return isGroupedItems(items)
    ? (items as readonly Group<Item>[]).flatMap((group) => group.items)
    : (items as readonly Item[]);
}

// `includes` reads a sparse slot as `undefined`, unlike `some`, so array holes count as nullish.
function hasNullishEntry(list: readonly unknown[]): boolean {
  return list.includes(null) || list.includes(undefined);
}

/**
 * Drops nullish entries, which are holes in the data rather than items or groups, including the
 * sparse slots of an array. Returns the input itself when there is nothing to drop, so its
 * identity is preserved.
 */
export function removeNullishItems<Items extends readonly unknown[] | undefined>(
  items: Items,
): Items {
  if (!items) {
    return items;
  }

  // Compacted before classifying: `isGroupedItems` reads the first entry, so a nullish group
  // entry would otherwise misclassify the array or be dereferenced below.
  const entries = hasNullishEntry(items) ? items.filter((item) => item != null) : items;

  if (!isGroupedItems(entries)) {
    return entries as Items;
  }

  const groups = entries as readonly Group<unknown>[];
  if (!groups.some((group) => hasNullishEntry(group.items))) {
    return entries as Items;
  }

  return groups.map((group) =>
    hasNullishEntry(group.items)
      ? { ...group, items: group.items.filter((item) => item != null) }
      : group,
  ) as unknown as Items;
}

/**
 * Checks if the items array contains an item with a null value that has a non-null label.
 */
export function hasNullItemLabel(items: ItemsInput): boolean {
  if (!Array.isArray(items)) {
    return items != null && 'null' in items;
  }

  const arrayItems = items as ReadonlyArray<LabeledItem> | ReadonlyArray<Group<any>>;

  if (isGroupedItems(arrayItems)) {
    for (const group of arrayItems) {
      for (const item of group.items) {
        if (item && item.value == null && item.label != null) {
          return true;
        }
      }
    }
    return false;
  }

  for (const item of arrayItems) {
    if (item && item.value == null && item.label != null) {
      return true;
    }
  }

  return false;
}

export function stringifyAsLabel(item: any, itemToStringLabel?: (item: any) => string) {
  if (itemToStringLabel && item != null) {
    return itemToStringLabel(item) ?? '';
  }
  if (item && typeof item === 'object') {
    if ('label' in item && item.label != null) {
      return String(item.label);
    }
    if ('value' in item) {
      return String(item.value);
    }
  }
  return serializeValue(item);
}

export function stringifyAsValue(item: any, itemToStringValue?: (item: any) => string) {
  if (itemToStringValue && item != null) {
    return itemToStringValue(item) ?? '';
  }
  if (item && typeof item === 'object' && 'value' in item && 'label' in item) {
    return serializeValue(item.value);
  }
  return serializeValue(item);
}

export function resolveSelectedLabel(
  value: any,
  items: ItemsInput,
  itemToStringLabel?: (item: any) => string,
): React.ReactNode {
  function fallback() {
    return stringifyAsLabel(value, itemToStringLabel);
  }

  if (itemToStringLabel && value != null) {
    return itemToStringLabel(value);
  }

  // Custom object with explicit label takes precedence
  if (value && typeof value === 'object' && 'label' in value && value.label != null) {
    return value.label;
  }

  // Items provided as plain record map
  if (items && !Array.isArray(items)) {
    const label = Object.hasOwn(items, value) ? (items as any)[value] : undefined;
    return label ?? fallback();
  }

  // Items provided as array (flat or grouped)
  if (Array.isArray(items)) {
    const arrayItems = items as ReadonlyArray<LabeledItem> | ReadonlyArray<Group<any>>;
    const flatItems = flattenLeafItems<LabeledItem>(arrayItems);

    if (value == null || typeof value !== 'object') {
      const match = flatItems.find((item) => item.value === value);
      if (match && match.label != null) {
        return match.label;
      }
      return fallback();
    }

    // Object without explicit label: try matching by its `value` property
    if ('value' in value) {
      const match = flatItems.find((item) => item && item.value === value.value);
      if (match && match.label != null) {
        return match.label;
      }
    }
  }

  return fallback();
}

export function resolveMultipleLabels(
  values: any[],
  items: ItemsInput,
  itemToStringLabel?: (item: any) => string,
): React.ReactNode {
  return values.reduce((acc, value, index) => {
    if (index > 0) {
      acc.push(', ');
    }
    acc.push(
      <React.Fragment key={index}>
        {resolveSelectedLabel(value, items, itemToStringLabel)}
      </React.Fragment>,
    );
    return acc;
  }, []);
}
