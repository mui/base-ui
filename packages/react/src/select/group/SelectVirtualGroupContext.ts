'use client';
import * as React from 'react';
import type { VirtualizerGroupHeaderMetadata } from '../../internals/virtualization/types';

/**
 * Metadata provided by `Virtualizer` to the header of each rendered group.
 */
export type SelectVirtualGroupMetadata = VirtualizerGroupHeaderMetadata;

/**
 * Context used to pass virtual group metadata to `Select.GroupLabel`.
 */
export const SelectVirtualGroupContext = React.createContext<
  SelectVirtualGroupMetadata | undefined
>(undefined);

/**
 * Returns virtual group metadata for the current group header, if one is being rendered by
 * `Virtualizer`.
 */
export function useSelectVirtualGroupContext() {
  return React.useContext(SelectVirtualGroupContext);
}
