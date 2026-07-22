'use client';
import * as React from 'react';
import type { ListVirtualizerItemMetadata } from '../../internals/virtualization/ListVirtualizerAdapter';

/**
 * Metadata provided by `Combobox.Virtualizer` to each rendered `Combobox.Item`.
 */
export type ComboboxVirtualItemMetadata = ListVirtualizerItemMetadata;

/**
 * Context used to pass virtual item metadata to `Combobox.Item`.
 */
export const ComboboxVirtualItemContext = React.createContext<
  ComboboxVirtualItemMetadata | undefined
>(undefined);

/**
 * Returns virtual item metadata for the current `Combobox.Item`, if one is being rendered by
 * `Combobox.Virtualizer`.
 */
export function useComboboxVirtualItemContext() {
  return React.useContext(ComboboxVirtualItemContext);
}
