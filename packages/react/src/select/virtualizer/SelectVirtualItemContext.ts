'use client';
import * as React from 'react';
import type { ListVirtualizerItemMetadata } from '../../internals/virtualization/ListVirtualizerAdapter';

export type SelectVirtualItemMetadata = ListVirtualizerItemMetadata;

export const SelectVirtualItemContext = React.createContext<SelectVirtualItemMetadata | undefined>(
  undefined,
);

export function useSelectVirtualItemContext() {
  return React.useContext(SelectVirtualItemContext);
}
