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
 * Renders a `<div>` element with `role="gridcell"`, named after its item.
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
  const itemId = useTreeItemContext();
  // Otherwise the cell's name joins every label inside it, which screen readers read when
  // focus moves to one of its controls: "Select Documents Collapse Documents Documents".
  const label = store.useState('itemLabel', itemId);

  return useRenderElement('div', componentProps, {
    state: {},
    ref: forwardedRef,
    props: [{ role: 'gridcell', 'aria-label': label }, elementProps],
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
