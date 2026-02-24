'use client';
import * as React from 'react';
import { serializeValue } from './serializeValue';

type ItemRecord = Record<string, React.ReactNode>;
type ItemsInput =
  | ItemRecord
  | ReadonlyArray<LabeledItem>
  | ReadonlyArray<Group<LabeledItem>>
  | undefined;

interface LabeledItem {
  value: any;
  label: React.ReactNode;
}

export interface Group<Item = any> {
  value: unknown;
  items: Item[];
}

export function isGroupedItems(
  items: ReadonlyArray<any | Group<any>> | undefined,
): items is Group<any>[] {
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
 */
export function hasNullItemLabel(items: ItemsInput): boolean {
  if (!Array.isArray(items)) {
    return items != null && !('null' in items);
  }

  if (isGroupedItems(items)) {
    for (const group of items) {
      for (const item of group.items) {
        if (item && item.value == null && item.label != null) {
          return true;
        }
      }
    }
    return false;
  }

  for (const item of items) {
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
  if (itemToStringLabel && value != null) {
    return itemToStringLabel(value);
  }

  if (value == null) {
    return stringifyAsLabel(value, itemToStringLabel);
  }

  if (typeof value === 'object' && 'label' in value && value.label != null) {
    return value.label;
  }

  if (items && !Array.isArray(items)) {
    return (items as any)[value] ?? stringifyAsLabel(value, itemToStringLabel);
  }

  if (Array.isArray(items)) {
    const flatItems: LabeledItem[] = items.flatMap((item) => item.items ?? [item]);
    const matchValue = typeof value === 'object' && 'value' in value ? value.value : value;
    const label = flatItems.find((item) => item?.value === matchValue)?.label;
    if (label != null) {
      return label;
    }
  }

  return stringifyAsLabel(value, itemToStringLabel);
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
