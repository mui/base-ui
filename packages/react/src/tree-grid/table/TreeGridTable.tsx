'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../internals/types';
import { useTreeRootContext } from '../../tree/root/TreeRootContext';
import { useTreeListElement } from '../../tree/list/useTreeListElement';
import { assertTreeGrid } from '../../tree/utils/assertTreeKind';

/**
 * The tree grid, which contains the header row and the rows.
 * Pass a function as `children` to render the row of each item. With a header row,
 * render `<TreeGrid.HeaderRow>` and `<TreeGrid.Collection>` inside instead.
 * Renders a `<div>` element with `role="treegrid"`.
 *
 * Documentation: [Base UI Tree Grid](https://base-ui.com/react/components/tree-grid)
 */
export const TreeGridTable = React.forwardRef(function TreeGridTable<TItem = any>(
  componentProps: TreeGridTable.Props<TItem>,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { children, className, render, style, ...elementProps } = componentProps;
  const store = useTreeRootContext();
  assertTreeGrid(store, 'Table');
  return useTreeListElement(componentProps, forwardedRef, elementProps, children);
}) as <TItem = any>(
  props: TreeGridTable.Props<TItem> & React.RefAttributes<HTMLDivElement>,
) => React.JSX.Element;

export interface TreeGridTableState {
  /**
   * Whether the tree grid is disabled.
   */
  disabled: boolean;
  /**
   * Whether the tree grid has no visible rows, or no item matches the filter.
   */
  empty: boolean;
}

export interface TreeGridTableProps<TItem = any> extends Omit<
  BaseUIComponentProps<'div', TreeGridTableState>,
  'children'
> {
  /**
   * The render function for the row of each item, or the header row and the
   * collection of rows.
   * Pass the item type to `TreeGrid.Table` to type the `item` parameter.
   */
  children?: React.ReactNode | ((item: TItem) => React.ReactNode);
}

export namespace TreeGridTable {
  export type Props<TItem = any> = TreeGridTableProps<TItem>;
  export type State = TreeGridTableState;
}
