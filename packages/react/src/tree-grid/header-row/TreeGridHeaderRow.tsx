'use client';
import type * as React from 'react';
import { fastComponentRef } from '@base-ui/utils/fastHooks';
import type { BaseUIComponentProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { useTreeRootContext } from '../../tree/root/TreeRootContext';
import { assertTreeGrid } from '../../tree/utils/assertTreeKind';

/**
 * The row of column headers, which names the columns for assistive technology.
 * Place it in `TreeGrid.Table`, before `TreeGrid.Collection`.
 * Renders a `<div>` element with `role="row"`.
 *
 * Documentation: [Base UI Tree Grid](https://base-ui.com/react/components/tree-grid)
 */
export const TreeGridHeaderRow = fastComponentRef(function TreeGridHeaderRow(
  componentProps: TreeGridHeaderRow.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, style, ...elementProps } = componentProps;

  const store = useTreeRootContext();
  assertTreeGrid(store, 'HeaderRow');

  return useRenderElement('div', componentProps, {
    state: {},
    ref: forwardedRef,
    props: [{ role: 'row' }, elementProps],
  });
});

export interface TreeGridHeaderRowState {}

export interface TreeGridHeaderRowProps extends BaseUIComponentProps<
  'div',
  TreeGridHeaderRowState
> {}

export namespace TreeGridHeaderRow {
  export type State = TreeGridHeaderRowState;
  export type Props = TreeGridHeaderRowProps;
}
