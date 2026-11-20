'use client';
import type * as React from 'react';
import { fastComponentRef } from '@base-ui/utils/fastHooks';
import type { BaseUIComponentProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { useTreeRootContext } from '../../tree/root/TreeRootContext';
import { useTreeItemContext } from '../../tree/item/TreeItemContext';
import { assertActionTree } from '../../tree/utils/assertTreeKind';

/**
 * Contains the interactive content of a tree item.
 * Requires `ActionTree.Root`.
 * Renders a `<div>` element with `role="gridcell"`.
 *
 * Documentation: [Base UI Action Tree](https://base-ui.com/react/components/action-tree)
 */
export const ActionTreeItemContent = fastComponentRef(function ActionTreeItemContent(
  componentProps: ActionTreeItemContent.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { className, render, style, ...elementProps } = componentProps;

  const store = useTreeRootContext();
  assertActionTree(store, 'ItemContent');
  // Throws outside an `ActionTree.Item`: a cell needs its row.
  useTreeItemContext();

  // Unlike the row, the cell takes its name from its content. An `aria-label` would leave out
  // the visible text of its controls, which fails label in name (WCAG 2.5.3).
  return useRenderElement('div', componentProps, {
    state: {},
    ref: forwardedRef,
    props: [{ role: 'gridcell' }, elementProps],
  });
});

export interface ActionTreeItemContentState {}

export interface ActionTreeItemContentProps extends BaseUIComponentProps<
  'div',
  ActionTreeItemContentState
> {}

export namespace ActionTreeItemContent {
  export type State = ActionTreeItemContentState;
  export type Props = ActionTreeItemContentProps;
}
