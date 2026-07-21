import type * as React from 'react';
import { isGroupedItems, type Group } from '../../internals/resolveValueLabel';

/** An item supplied to Select through the `items` prop. */
export interface SelectItemData<Value> {
  value: Value;
  label: React.ReactNode;
}

export type SelectItems<Value> =
  | Record<string, React.ReactNode>
  | ReadonlyArray<SelectItemData<Value>>
  | ReadonlyArray<Group<SelectItemData<Value>>>;

export interface ResolvedSelectItems<Value> {
  flatItems: ReadonlyArray<SelectItemData<Value>>;
  hasItems: boolean;
  isGrouped: boolean;
}

const EMPTY_ITEMS: ReadonlyArray<SelectItemData<never>> = [];

/** Normalizes Select's lookup-oriented `items` formats into a flat logical collection. */
export function resolveSelectItems<Value>(
  items: SelectItems<Value> | undefined,
): ResolvedSelectItems<Value> {
  if (items === undefined) {
    return { flatItems: EMPTY_ITEMS, hasItems: false, isGrouped: false };
  }

  if (!Array.isArray(items)) {
    return {
      flatItems: Object.entries(items).map(([value, label]) => ({ value: value as Value, label })),
      hasItems: true,
      isGrouped: false,
    };
  }

  const arrayItems = items as
    | ReadonlyArray<SelectItemData<Value>>
    | ReadonlyArray<Group<SelectItemData<Value>>>;
  const isGrouped = isGroupedItems(arrayItems);

  return {
    flatItems: isGrouped ? arrayItems.flatMap((group) => group.items) : arrayItems,
    hasItems: true,
    isGrouped,
  };
}
