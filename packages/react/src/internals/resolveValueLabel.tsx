'use client';
import * as React from 'react';
import { serializeValue } from './serializeValue';
import { compareItemEquality, type ItemEqualityComparer } from './itemEquality';

type ItemRecord = Record<string, React.ReactNode>;
type ItemsInput = ItemRecord | ReadonlyArray<LabeledItem> | ReadonlyArray<Group<any>> | undefined;

interface LabeledItem<Value = any> {
  value: Value;
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
  if (isLabeledItem(item)) {
    return serializeValue(item.value);
  }
  return serializeValue(item);
}

export function isLabeledItem<Value = any>(item: any): item is LabeledItem<Value> {
  return item && typeof item === 'object' && 'value' in item && 'label' in item;
}

export function inferItemValue<Value>(item: Value | LabeledItem<Value>): Value {
  if (isLabeledItem<Value>(item)) {
    return item.value;
  }

  return item as Value;
}

/**
 * Finds the index of the item matching `value`. A primitive `value` matches a
 * `{ value, label }` entry by its inferred value; the full item is only compared when
 * `value` is itself an object (`<Combobox.Item value={item}>`), so a comparator written
 * for primitive values is never handed the outer labeled item.
 */
export function findItemIndexByValue(
  items: readonly any[],
  value: any,
  isItemEqualToValue: ItemEqualityComparer,
): number {
  // When the selected value is itself a `{ value, label }` item (whole-item mode), only
  // compare against the full item so a comparator written for that shape is never handed
  // the inferred inner value.
  if (isLabeledItem(value)) {
    return items.findIndex(
      (item) => item !== undefined && compareItemEquality(item, value, isItemEqualToValue),
    );
  }

  const valueIsObject = value != null && typeof value === 'object';

  return items.findIndex((item) => {
    if (item === undefined) {
      return false;
    }
    // Match the inferred value (a primitive `value` against a `{ value, label }` entry)
    // first, then the full item for other object values.
    const itemValue = inferItemValue(item);
    return (
      compareItemEquality(itemValue, value, isItemEqualToValue) ||
      (valueIsObject && itemValue !== item && compareItemEquality(item, value, isItemEqualToValue))
    );
  });
}

export function resolveSelectedLabel(
  value: any,
  items: ItemsInput,
  itemToStringLabel?: (item: any) => string,
  isItemEqualToValue?: (itemValue: any, value: any) => boolean,
): React.ReactNode {
  function fallback() {
    return stringifyAsLabel(value, itemToStringLabel);
  }

  if (itemToStringLabel && value != null && typeof value === 'object') {
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
    const arrayItems = items as ReadonlyArray<LabeledItem> | ReadonlyArray<Group<any>>;
    const flatItems: ReadonlyArray<LabeledItem> = isGroupedItems(arrayItems)
      ? arrayItems.flatMap((group) => group.items)
      : arrayItems;

    const match = flatItems.find((item) => {
      const itemValue = inferItemValue(item);
      return isItemEqualToValue && itemValue != null && value != null
        ? isItemEqualToValue(itemValue, value)
        : itemValue === value;
    });
    if (match?.label != null) {
      return match.label;
    }

    // Object without explicit label: try matching by its `value` property
    if (value && typeof value === 'object' && 'value' in value) {
      const valueMatch = flatItems.find((item) => item && item.value === value.value);
      if (valueMatch && valueMatch.label != null) {
        return valueMatch.label;
      }
    }
  }

  return fallback();
}

/**
 * Resolves a selected value to a plain string label suitable for a text input,
 * coercing a `ReactNode` label down to a string and falling back to stringifying
 * the raw value when the label cannot be represented as text (e.g. a JSX label).
 */
export function resolveLabelString(
  value: any,
  items: ItemsInput,
  itemToStringLabel?: (item: any) => string,
  isItemEqualToValue?: (itemValue: any, value: any) => boolean,
): string {
  const label = resolveSelectedLabel(value, items, itemToStringLabel, isItemEqualToValue);

  if (typeof label === 'string' || typeof label === 'number') {
    return String(label);
  }

  return label == null || typeof label === 'boolean'
    ? ''
    : stringifyAsLabel(value, typeof value === 'object' ? itemToStringLabel : undefined);
}

export function resolveMultipleLabels(
  values: any[],
  items: ItemsInput,
  itemToStringLabel?: (item: any) => string,
  isItemEqualToValue?: (itemValue: any, value: any) => boolean,
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
