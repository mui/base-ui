import type * as React from 'react';
import type { HTMLProps } from '../types';

/**
 * Row model built for each item in the list's filtered collection.
 */
export interface ListVirtualizerItemRowModel<Item> {
  item: Item;
  itemIndex: number;
}

/**
 * A row measured and windowed by the virtualizer.
 */
export interface ListVirtualizerRow<RowModel> {
  /**
   * Stable identity used by React and the measurement cache.
   */
  id: React.Key;
  /**
   * Data associated with the row.
   */
  model: RowModel;
}

/**
 * Parameters provided when rendering a row.
 */
export interface ListVirtualizerRenderRowParameters<RowModel> {
  /**
   * The row being rendered.
   */
  row: ListVirtualizerRow<RowModel>;
  /**
   * Index in the virtual row collection.
   */
  rowIndex: number;
}

/**
 * Metadata provided to an item rendered by the virtualizer.
 */
export interface ListVirtualizerItemMetadata {
  /** Logical index in the full collection. */
  index: number;
  /** Accessibility and collection metadata applied to the item. */
  props: HTMLProps & {
    /** Logical index exposed as a DOM data attribute. */
    'data-index': number;
  };
  /** Registers the item rendered for this virtual row. */
  registerItem: (() => () => void) | undefined;
}
