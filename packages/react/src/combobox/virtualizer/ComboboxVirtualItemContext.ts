'use client';
import * as React from 'react';
import type { HTMLProps } from '../../internals/types';

/**
 * Metadata provided by `Combobox.Virtualizer` to each rendered `Combobox.Item`.
 */
export interface ComboboxVirtualItemMetadata {
  /**
   * Logical index of the item in the full filtered collection.
   */
  index: number;
  /**
   * Accessibility and collection metadata applied to the item.
   */
  props: HTMLProps & {
    /**
     * Logical index exposed as a DOM data attribute.
     */
    'data-index': number;
  };
  /**
   * Ref callback that measures the item element.
   */
  measureRef: React.RefCallback<HTMLElement> | undefined;
  /**
   * Registers the item rendered for this virtual row.
   */
  registerItem: (() => () => void) | undefined;
}

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
