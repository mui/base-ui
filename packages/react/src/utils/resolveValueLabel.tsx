'use client';
import * as React from 'react';
import { compareItemEquality, type ItemEqualityComparer } from './itemEquality';
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

function hasValueAndLabelItems(items: readonly any[]): boolean {
  return (
    items.length > 0 &&
    items.every((item) => item && typeof item === 'object' && 'value' in item && 'label' in item)
  );
}

export function hasValueAndLabelItemsInput(
  items: ReadonlyArray<any | Group<any>> | undefined,
): boolean {
  if (!items || items.length === 0) {
    return false;
  }

  if (isGroupedItems(items)) {
    return items.every((group) => hasValueAndLabelItems(group.items));
  }

  return hasValueAndLabelItems(items);
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

export function inferItemValue(item: any) {
  if (item && typeof item === 'object' && 'value' in item) {
    return item.value;
  }

  return item;
}

export function hasPrimitiveSelectionValue(value: any, multiple: boolean): boolean {
  if (multiple) {
    return (
      Array.isArray(value) && value.length > 0 && value.every((item) => typeof item !== 'object')
    );
  }

  return value != null && typeof value !== 'object';
}

export function hasEmptySelectionValue(value: any, multiple: boolean): boolean {
  if (multiple) {
    return Array.isArray(value) && value.length === 0;
  }

  return value == null;
}

export function mapItemValues(
  items: readonly any[],
  getItemValue?: ((item: any) => any) | undefined,
) {
  return items.map((item) => (getItemValue ? getItemValue(item) : item));
}

function findMatchingItem(
  items: ReadonlyArray<LabeledItem>,
  value: any,
  isItemEqualToValue?: ItemEqualityComparer<any, any>,
) {
  return items.find((item) => {
    const itemValue = inferItemValue(item);
    return isItemEqualToValue
      ? compareItemEquality(itemValue, value, isItemEqualToValue)
      : itemValue === value;
  });
}

function findItemByValueProperty(items: ReadonlyArray<LabeledItem>, value: any) {
  return items.find((item) => item && item.value === value);
}

export function resolveSelectedLabel(
  value: any,
  items: ItemsInput,
  itemToStringLabel?: (item: any) => string,
  isItemEqualToValue?: ItemEqualityComparer<any, any>,
): React.ReactNode {
  function fallback() {
    return stringifyAsLabel(value, itemToStringLabel);
  }

  // Custom object with explicit label takes precedence
  if (value && typeof value === 'object' && 'label' in value && value.label != null) {
    return value.label;
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
      const match = findMatchingItem(flatItems, value, isItemEqualToValue);
      if (match && match.label != null) {
        return match.label;
      }
    } else if ('value' in value) {
      const match = findItemByValueProperty(flatItems, value.value);
      if (match && match.label != null) {
        return match.label;
      }
    }
  }

  if (itemToStringLabel && value != null) {
    return itemToStringLabel(value);
  }

  return fallback();
}

export function resolveSelectedLabelString(
  value: any,
  items: ItemsInput,
  itemToStringLabel?: (item: any) => string,
  isItemEqualToValue?: ItemEqualityComparer<any, any>,
): string {
  const label = resolveSelectedLabel(value, items, itemToStringLabel, isItemEqualToValue);

  if (label == null || typeof label === 'boolean') {
    return '';
  }

  if (typeof label === 'string' || typeof label === 'number') {
    return String(label);
  }

  return stringifyAsLabel(value);
}

export function resolveMultipleLabels(
  values: any[],
  items: ItemsInput,
  itemToStringLabel?: (item: any) => string,
  isItemEqualToValue?: ItemEqualityComparer<any, any>,
): React.ReactNode {
  return values.reduce((acc, value, index) => {
    if (index > 0) {
      acc.push(', ');
    }
    acc.push(
      <React.Fragment key={index}>
        {resolveSelectedLabel(value, items, itemToStringLabel, isItemEqualToValue)}
      </React.Fragment>,
    );
    return acc;
  }, []);
}
