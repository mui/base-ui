'use client';
import * as React from 'react';
import type { VirtualizerGroupHeaderMetadata } from '../../internals/virtualization/types';

/**
 * Metadata provided by `Virtualizer` to the header of each rendered group.
 */
export type ComboboxVirtualGroupMetadata = VirtualizerGroupHeaderMetadata;

/**
 * Context used to pass virtual group metadata to `Combobox.GroupLabel`.
 */
export const ComboboxVirtualGroupContext = React.createContext<
  ComboboxVirtualGroupMetadata | undefined
>(undefined);

/**
 * Returns virtual group metadata for the current group header, if one is being rendered by
 * `Virtualizer`.
 */
export function useComboboxVirtualGroupContext() {
  return React.useContext(ComboboxVirtualGroupContext);
}
