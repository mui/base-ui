'use client';
import * as React from 'react';
import type { VirtualizerItemMetadata } from '../../internals/virtualization/types';

/**
 * Metadata provided by `Virtualizer` to each rendered `Select.Item`.
 */
export type SelectVirtualItemMetadata = VirtualizerItemMetadata;

/**
 * Context used to pass virtual item metadata to `Select.Item`.
 */
export const SelectVirtualItemContext = React.createContext<SelectVirtualItemMetadata | undefined>(
  undefined,
);

/**
 * Returns virtual item metadata for the current `Select.Item`, if one is being rendered by
 * `Virtualizer`.
 */
export function useSelectVirtualItemContext() {
  return React.useContext(SelectVirtualItemContext);
}
