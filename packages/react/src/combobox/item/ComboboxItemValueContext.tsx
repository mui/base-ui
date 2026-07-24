'use client';
import * as React from 'react';

/**
 * Sentinel distinguishing "not inside a collection" from any user-provided item value
 * (including `undefined`).
 */
export const NO_COMBOBOX_ITEM_VALUE = Symbol();

/**
 * Holds the source item for each child rendered by `Combobox.Collection`, letting
 * `Combobox.Item` default its `value` to the item it was rendered from.
 */
export const ComboboxItemValueContext = React.createContext<any>(NO_COMBOBOX_ITEM_VALUE);

export function useComboboxItemValueContext() {
  return React.useContext(ComboboxItemValueContext);
}
