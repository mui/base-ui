'use client';
import * as React from 'react';
import { findItemIndex } from '../../internals/itemEquality';
import { resolveSelectedLabel, stringifyAsLabel } from '../../internals/resolveValueLabel';

export type ComboboxLabelCache = readonly [
  values: readonly any[],
  labels: readonly React.ReactNode[],
];

export function findCachedLabel(
  cache: ComboboxLabelCache,
  value: any,
  isItemEqualToValue: (itemValue: any, value: any) => boolean,
) {
  const index = findItemIndex(cache[0], value, isItemEqualToValue);
  return cache[1][index];
}

export function hasMappedNullItemLabel(items: readonly any[], itemValues: readonly any[]) {
  return items[itemValues.indexOf(null)]?.label != null;
}

export function resolveComboboxSelectedLabel(
  value: any,
  items: readonly any[] | undefined,
  itemToStringLabel?: (item: any) => string,
  itemValues?: readonly any[],
  isItemEqualToValue: (itemValue: any, value: any) => boolean = Object.is,
  labelCache?: ComboboxLabelCache,
): React.ReactNode {
  if (!itemValues) {
    return resolveSelectedLabel(value, items, itemToStringLabel);
  }

  if (itemToStringLabel && value != null) {
    return itemToStringLabel(value);
  }

  if (value && typeof value === 'object' && 'label' in value && value.label != null) {
    return value.label;
  }

  const index = findItemIndex(itemValues, value, isItemEqualToValue);
  const match = items?.[index];
  if (match && match.label != null) {
    return match.label;
  }
  if (labelCache) {
    const cachedLabel = findCachedLabel(labelCache, value, isItemEqualToValue);
    if (cachedLabel !== undefined) {
      return cachedLabel;
    }
  }
  return stringifyAsLabel(value, itemToStringLabel);
}

export function resolveComboboxMultipleLabels(
  values: any[],
  items: readonly any[] | undefined,
  itemToStringLabel?: (item: any) => string,
  itemValues?: readonly any[],
  isItemEqualToValue?: (itemValue: any, value: any) => boolean,
  labelCache?: ComboboxLabelCache,
): React.ReactNode {
  return values.reduce((acc, value, index) => {
    if (index > 0) {
      acc.push(', ');
    }
    acc.push(
      <React.Fragment key={index}>
        {resolveComboboxSelectedLabel(
          value,
          items,
          itemToStringLabel,
          itemValues,
          isItemEqualToValue,
          labelCache,
        )}
      </React.Fragment>,
    );
    return acc;
  }, []);
}
