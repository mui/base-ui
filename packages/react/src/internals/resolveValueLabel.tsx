'use client';
import * as React from 'react';
import { serializeValue } from './serializeValue';
import { defaultItemEquality, findItemIndex, type ItemEqualityComparer } from './itemEquality';

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

export function isGroupedItems(
  items: ReadonlyArray<any | Group<any>> | undefined,
): items is ReadonlyArray<Group<any>> {
  return (
    items != null &&
    items.length > 0 &&
    typeof items[0] === 'object' &&
    items[0] != null &&
    'items' in items[0]
  );
}

/**
 * Checks if the items array contains an item with a null value that has a non-null label.
 * When `itemValues` is provided, the value comes from the projection rather than `item.value`.
 */
export function hasNullItemLabel(items: ItemsInput, itemValues?: readonly any[]): boolean {
  if (itemValues) {
    return (items as ReadonlyArray<LabeledItem>)?.[itemValues.indexOf(null)]?.label != null;
  }

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
  itemValues?: readonly any[],
  isItemEqualToValue: ItemEqualityComparer = defaultItemEquality,
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

  // Values projected from source items via `itemToValue`: the label lives on the source item at
  // the same index, so the value is matched positionally rather than against `item.value`.
  if (itemValues) {
    const match = (items as ReadonlyArray<LabeledItem>)?.[
      findItemIndex(itemValues, value, isItemEqualToValue)
    ];
    return match?.label != null ? match.label : fallback();
  }

  // Items provided as plain record map
  if (items && !Array.isArray(items)) {
    return (items as any)[value] ?? fallback();
  }

  // Items provided as array (flat or grouped)
  if (Array.isArray(items)) {
    const arrayItems = items as ReadonlyArray<LabeledItem> | ReadonlyArray<Group<any>>;
    const flatItems: ReadonlyArray<LabeledItem> = isGroupedItems(arrayItems)
      ? arrayItems.flatMap((group) => group.items)
      : arrayItems;

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
  itemValues?: readonly any[],
  isItemEqualToValue?: ItemEqualityComparer,
): React.ReactNode {
  return values.reduce((acc, value, index) => {
    if (index > 0) {
      acc.push(', ');
    }
    acc.push(
      <React.Fragment key={index}>
        {resolveSelectedLabel(value, items, itemToStringLabel, itemValues, isItemEqualToValue)}
      </React.Fragment>,
    );
    return acc;
  }, []);
}
