'use client';
import * as React from 'react';
import type { HTMLProps } from '../../internals/types';

export interface SelectVirtualItemMetadata {
  index: number;
  props: HTMLProps & {
    'data-index': number;
  };
  registerItem: (() => () => void) | undefined;
}

export const SelectVirtualItemContext = React.createContext<SelectVirtualItemMetadata | undefined>(
  undefined,
);

export function useSelectVirtualItemContext() {
  return React.useContext(SelectVirtualItemContext);
}
