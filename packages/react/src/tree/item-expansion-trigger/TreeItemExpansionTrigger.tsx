'use client';
import * as React from 'react';
import { fastComponentRef } from '@base-ui/utils/fastHooks';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { StateAttributesMapping } from '../../utils/getStateAttributesProps';
import { useButton } from '../../use-button/useButton';
import { useTreeRootContext } from '../root/TreeRootContext';
import { useTreeItemContext } from '../item/TreeItemContext';
import { TreeItemExpansionTriggerDataAttributes } from './TreeItemExpansionTriggerDataAttributes';

const EXPANDED_HOOK = { [TreeItemExpansionTriggerDataAttributes.expanded]: '' };
const COLLAPSED_HOOK = { [TreeItemExpansionTriggerDataAttributes.collapsed]: '' };

const stateAttributesMapping = {
  expanded(v: boolean) {
    return v ? EXPANDED_HOOK : COLLAPSED_HOOK;
  },
} satisfies StateAttributesMapping<TreeItemExpansionTrigger.State>;

/**
 * A button that toggles the expansion state of a tree item.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Tree](https://base-ui.com/react/components/tree)
 */
export const TreeItemExpansionTrigger = fastComponentRef(function TreeItemExpansionTrigger(
  componentProps: TreeItemExpansionTrigger.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const { className, render, ...elementProps } = componentProps;

  const store = useTreeRootContext();
  const itemId = useTreeItemContext();
  const expanded = store.useState('isItemExpanded', itemId);
  const expandable = store.useState('isItemExpandable', itemId);

  const { getButtonProps, buttonRef } = useButton({
    disabled: !expandable,
  });

  const state: TreeItemExpansionTrigger.State = {
    expanded,
    expandable,
  };

  return useRenderElement('button', componentProps, {
    state,
    ref: [forwardedRef, buttonRef],
    props: [
      getButtonProps({
        'aria-hidden': true,
        tabIndex: -1,
        onClick: (event: React.MouseEvent) => {
          store.expansionTriggerEventHandlers.onClick(event, itemId);
        },
      }),
      elementProps,
    ],
    stateAttributesMapping,
    enabled: expandable,
  });
});

export interface TreeItemExpansionTriggerState {
  /**
   * Whether the item is currently expanded.
   */
  expanded: boolean;
  /**
   * Whether the item has children and can be expanded.
   */
  expandable: boolean;
}

export interface TreeItemExpansionTriggerProps extends BaseUIComponentProps<
  'button',
  TreeItemExpansionTriggerState
> {}

export namespace TreeItemExpansionTrigger {
  export type State = TreeItemExpansionTriggerState;
  export type Props = TreeItemExpansionTriggerProps;
}
