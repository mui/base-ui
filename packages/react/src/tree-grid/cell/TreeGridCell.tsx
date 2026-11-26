'use client';
import * as React from 'react';
import { fastComponentRef } from '@base-ui/utils/fastHooks';
import type { BaseUIComponentProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { useTreeRootContext } from '../../tree/root/TreeRootContext';
import { useTreeItemContext } from '../../tree/item/TreeItemContext';
import { assertTreeGrid } from '../../tree/utils/assertTreeKind';

/**
 * A cell of a row, which holds content and controls.
 * In a row of several cells, the arrow keys also stop at each cell without a control.
 * Requires `TreeGrid.Root`.
 * Renders a `<div>` element with `role="gridcell"`.
 *
 * Documentation: [Base UI Tree Grid](https://base-ui.com/react/components/tree-grid)
 */
export const TreeGridCell = fastComponentRef(function TreeGridCell(
  componentProps: TreeGridCell.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, style, ...elementProps } = componentProps;

  const store = useTreeRootContext();
  assertTreeGrid(store, 'Cell');
  // Throws outside a `TreeGrid.Row`: a cell needs its row.
  const itemId = useTreeItemContext();
  const grid = store.grid;

  const registerRef = React.useCallback(
    (element: HTMLDivElement | null) =>
      element == null ? undefined : grid.registerCell(itemId, element),
    [grid, itemId],
  );

  // Unlike the row, the cell takes its name from its content. An `aria-label` would leave out
  // the visible text of its controls, which fails label in name (WCAG 2.5.3).
  return useRenderElement('div', componentProps, {
    state: {},
    ref: [forwardedRef, registerRef],
    props: [{ role: 'gridcell' }, elementProps],
  });
});

export interface TreeGridCellState {}

export interface TreeGridCellProps extends BaseUIComponentProps<'div', TreeGridCellState> {}

export namespace TreeGridCell {
  export type State = TreeGridCellState;
  export type Props = TreeGridCellProps;
}
