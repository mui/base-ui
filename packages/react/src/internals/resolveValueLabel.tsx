'use client';
import * as React from 'react';
import { serializeValue } from './serializeValue';

type ItemRecord = Record<string, React.ReactNode>;
type ItemsInput =
  | ItemRecord
  | ReadonlyArray<LabeledItem>
  | ReadonlyArray<Group<any>>
  | ReadonlyArray<unknown>
  | undefined;

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

/**
 * Whether an item carries both its own label and its own value — the `{ label, value }` shape the
 * `items` prop accepts alongside plain values.
 *
 * Null-safe: `typeof null === 'object'`, and `'value' in null` throws.
 */
export function isLabeledItem(item: unknown): item is LabeledItem {
  return item != null && typeof item === 'object' && 'value' in item && 'label' in item;
}

/**
 * The value an item stands for, left exactly as it was given.
 *
 * `stringifyAsValue` applies the same shape test but serializes the result for form submission.
 * Anything comparing against a selected value needs the value itself, or object and numeric values
 * would only ever match their string forms.
 */
export function getItemValue(item: unknown): any {
  return isLabeledItem(item) ? item.value : item;
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
      // `getItemValue` rather than `item.value`: the array may hold plain values, and it may hold
      // `null`, which dereferencing would throw on.
      const match = flatItems.find((item) => getItemValue(item) === value);
      if (isLabeledItem(match) && match.label != null) {
        return match.label;
      }
      return fallback();
    }

    // Object without explicit label: try matching by its `value` property
    if ('value' in value) {
      const match = flatItems.find((item) => getItemValue(item) === value.value);
      if (isLabeledItem(match) && match.label != null) {
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
