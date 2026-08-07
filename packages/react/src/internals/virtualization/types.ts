import type * as React from 'react';
import type { HTMLProps } from '../types';

/**
 * Row model built for each item in the list's filtered collection.
 */
export interface VirtualizerItemRowModel<Item> {
  item: Item;
  itemIndex: number;
}

/**
 * A row measured and windowed by the virtualizer.
 */
export interface VirtualizerRow<RowModel> {
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
export interface VirtualizerRenderRowParameters<RowModel> {
  /**
   * The row being rendered.
   */
  row: VirtualizerRow<RowModel>;
  /**
   * Index in the virtual row collection.
   */
  rowIndex: number;
}

/**
 * Accessibility and collection metadata for a virtualized item.
 *
 * A list's own `<Item>` applies these itself. Items rendered without one receive them as the third
 * argument of the item renderer, to spread onto the element that represents the item.
 */
export type VirtualizerItemProps = HTMLProps & {
  /** Logical index exposed as a DOM data attribute. */
  'data-index': number;
};

/**
 * Metadata provided to an item rendered by the virtualizer.
 */
export interface VirtualizerItemMetadata {
  /** Logical index in the full collection. */
  index: number;
  /** Accessibility and collection metadata applied to the item. */
  props: VirtualizerItemProps;
  /** Registers the item rendered for this virtual row. */
  registerItem: (() => () => void) | undefined;
}
