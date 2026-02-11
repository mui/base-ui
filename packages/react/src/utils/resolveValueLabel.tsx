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

export function isPrimitiveValue(value: unknown): boolean {
  return value != null && typeof value !== 'object' && typeof value !== 'function';
}

export function hasValueField(item: any): item is { value: unknown } {
  return item != null && typeof item === 'object' && 'value' in item;
}

export function getItemValue(item: any) {
  return hasValueField(item) ? item.value : item;
}

export interface Group<Item = any> {
  value: unknown;
  items: ReadonlyArray<Item>;
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

export function getFirstFlatItem(items: readonly any[] | readonly Group<any>[] | undefined) {
  if (items == null || items.length === 0) {
    return undefined;
  }

  if (isGroupedItems(items)) {
    return items[0]?.items[0];
  }

  return items[0];
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
    if (
      'label' in item &&
      item.label != null &&
      (typeof item.label === 'string' ||
        typeof item.label === 'number' ||
        typeof item.label === 'bigint')
    ) {
      return String(item.label);
    }
    if ('value' in item) {
      return serializeValue(item.value);
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
    return (items as any)[value] ?? fallback();
  }

  // Items provided as array (flat or grouped)
  if (Array.isArray(items)) {
    const flatItems: LabeledItem[] = isGroupedItems(items) ? items.flatMap((g) => g.items) : items;

    if (value == null || typeof value !== 'object') {
      const match = flatItems.find((item) => Object.is(item.value, value));
      if (match && match.label != null) {
        return match.label;
      }
      return fallback();
    }

    // Object without explicit label: try matching by its `value` property
    if ('value' in value) {
      const match = flatItems.find((item) => item && Object.is(item.value, value.value));
      if (match && match.label != null) {
        return match.label;
      }
    }
  }

  return fallback();
}

export function resolveSelectedLabelString(
  value: any,
  items: ItemsInput,
  itemToStringLabel?: (item: any) => string,
): string {
  const label = resolveSelectedLabel(value, items, itemToStringLabel);
  if (label == null || typeof label === 'boolean') {
    return '';
  }
  if (typeof label === 'string' || typeof label === 'number' || typeof label === 'bigint') {
    return String(label);
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
