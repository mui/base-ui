'use client';
import * as React from 'react';
import { stringifyItem } from '../combobox/root/utils';

type ItemRecord = Record<string, React.ReactNode>;
type ItemsInput = ItemRecord | LabeledItem[] | Group<LabeledItem>[] | undefined;

interface LabeledItem {
  value: any;
  label: React.ReactNode;
}

interface Group<Item = any> {
  value: unknown;
  items: Item[];
}

export function resolveSelectedLabel(
  value: any,
  items: ItemsInput,
  itemToStringLabel?: (item: any) => string,
): React.ReactNode {
  // Custom object with explicit label takes precedence
  if (value && typeof value === 'object' && 'label' in value && value.label != null) {
    return value.label;
  }

  // Items provided as plain record map
  if (items && !Array.isArray(items)) {
    return items[value] ?? stringifyItem(value, itemToStringLabel);
  }

  // Items provided as array (flat or grouped)
  if (Array.isArray(items)) {
    const flatItems: LabeledItem[] =
      Array.isArray(items) && items.length > 0 && 'items' in items[0]
        ? (items as Group<LabeledItem>[]).flatMap((g) => g.items)
        : (items as LabeledItem[]);

    // If no value selected, prefer the null option label when available
    if (value == null) {
      const nullItem = flatItems.find((it) => it.value == null);
      if (nullItem && nullItem.label != null) {
        return nullItem.label;
      }
      return stringifyItem(value, itemToStringLabel);
    }

    // Primitive selected value: map to first matching item's label
    if (typeof value !== 'object') {
      const match = flatItems.find((it) => it && it.value === value);
      if (match && match.label != null) {
        return match.label;
      }
      return stringifyItem(value, itemToStringLabel);
    }

    // Object without explicit label: try matching by its `value` property
    if ('value' in value) {
      const match = flatItems.find((it) => it && it.value === value.value);
      if (match && match.label != null) {
        return match.label;
      }
    }
  }

  return stringifyItem(value, itemToStringLabel);
}

export function resolveMultipleLabels(
  values: any[] | undefined,
  itemToStringLabel?: (item: any) => string,
): string {
  if (!Array.isArray(values) || values.length === 0) {
    return '';
  }
  return values.map((v) => stringifyItem(v, itemToStringLabel)).join(', ');
}
