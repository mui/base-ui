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
    'items' in (items[0] as object)
  );
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

  // Custom object with explicit label takes precedence
  if (value && typeof value === 'object' && 'label' in value && value.label != null) {
    return value.label;
  }

  // Items provided as plain record map
  if (items && !Array.isArray(items)) {
    return (items as any)[value] ?? stringifyAsLabel(value, itemToStringLabel);
  }

  // Items provided as array (flat or grouped)
  if (Array.isArray(items)) {
    const flatItems: LabeledItem[] = isGroupedItems(items)
      ? (items as Group<LabeledItem>[]).flatMap((g) => g.items)
      : (items as LabeledItem[]);

    // If no value selected, prefer the null option label when available
    if (value == null) {
      const nullItem = flatItems.find((it) => it.value == null);
      if (nullItem && nullItem.label != null) {
        return nullItem.label;
      }
      return stringifyAsLabel(value, itemToStringLabel);
    }

    // Primitive selected value: map to first matching item's label
    if (typeof value !== 'object') {
      const match = flatItems.find((it) => it && it.value === value);
      if (match && match.label != null) {
        return match.label;
      }
      return stringifyAsLabel(value, itemToStringLabel);
    }

    // Object without explicit label: try matching by its `value` property
    if ('value' in value) {
      const match = flatItems.find((it) => it && it.value === value.value);
      if (match && match.label != null) {
        return match.label;
      }
    }
  }

  return stringifyAsLabel(value, itemToStringLabel);
}

export function resolveMultipleLabels(
  values: any[] | undefined,
  itemToStringLabel?: (item: any) => string,
): string {
  if (!Array.isArray(values) || values.length === 0) {
    return '';
  }
  return values.map((v) => stringifyAsLabel(v, itemToStringLabel)).join(', ');
}
