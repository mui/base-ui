import type * as React from 'react';
import type { HTMLProps } from '../types';
import type { VirtualizerScrollAlignment } from './ListVirtualizationRegistry';

/**
 * An activation of an item, describing what should happen to the viewport along with it.
 *
 * Scrolling responds to the activation rather than to the resulting state: the same item can be
 * activated by a keypress that should bring it into view, or by the pointer already resting on it,
 * which must not move the list. Both facts arrive together so they cannot drift apart.
 */
export interface VirtualizerActiveItem {
  /**
   * Where to place the item in the scrollport. `auto` only scrolls when the item is outside the
   * visible area.
   * @default 'auto'
   */
  align?: VirtualizerScrollAlignment | undefined;
  /**
   * Index of the item in the collection.
   */
  index: number;
  /**
   * Whether this activation scrolls the item into view.
   * @default true
   */
  scroll?: boolean | undefined;
}

/**
 * The active item, as an index alone or as an activation that also describes the scroll it wants.
 */
export type VirtualizerActiveIndex = number | VirtualizerActiveItem;

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
