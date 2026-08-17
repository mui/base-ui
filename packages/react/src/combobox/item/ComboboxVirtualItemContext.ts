'use client';
import * as React from 'react';
import type { VirtualizerItemMetadata } from '../../internals/virtualization/types';

/**
 * Metadata provided by `Virtualizer` to each rendered `Combobox.Item`.
 */
export type ComboboxVirtualItemMetadata = VirtualizerItemMetadata;

/**
 * Context used to pass virtual item metadata to `Combobox.Item`.
 */
export const ComboboxVirtualItemContext = React.createContext<
  ComboboxVirtualItemMetadata | undefined
>(undefined);

/**
 * Returns virtual item metadata for the current `Combobox.Item`, if one is being rendered by
 * `Virtualizer`.
 */
export function useComboboxVirtualItemContext() {
  return React.useContext(ComboboxVirtualItemContext);
}
