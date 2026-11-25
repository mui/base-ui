'use client';
import type * as React from 'react';
import { fastComponentRef } from '@base-ui/utils/fastHooks';
import type { BaseUIComponentProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { useTreeRootContext } from '../../tree/root/TreeRootContext';
import { assertTreeGrid } from '../../tree/utils/assertTreeKind';

/**
 * The header of a column, which screen readers announce when focus enters one of its cells.
 * Render one per column, in the order of the cells.
 * Renders a `<div>` element with `role="columnheader"`.
 *
 * Documentation: [Base UI Tree Grid](https://base-ui.com/react/components/tree-grid)
 */
export const TreeGridHeaderCell = fastComponentRef(function TreeGridHeaderCell(
  componentProps: TreeGridHeaderCell.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, style, ...elementProps } = componentProps;

  const store = useTreeRootContext();
  assertTreeGrid(store, 'HeaderCell');

  return useRenderElement('div', componentProps, {
    state: {},
    ref: forwardedRef,
    props: [{ role: 'columnheader' }, elementProps],
  });
});

export interface TreeGridHeaderCellState {}

export interface TreeGridHeaderCellProps extends BaseUIComponentProps<
  'div',
  TreeGridHeaderCellState
> {}

export namespace TreeGridHeaderCell {
  export type State = TreeGridHeaderCellState;
  export type Props = TreeGridHeaderCellProps;
}
