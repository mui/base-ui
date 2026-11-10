'use client';
import * as React from 'react';
import { useStore } from '@base-ui/utils/store';
import { useRefWithInit } from '@base-ui/utils/useRefWithInit';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import type { BaseUIComponentProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import type { StateAttributesMapping } from '../../internals/getStateAttributesProps';
import { useInitialLiveRegionTextMutation } from '../../internals/useInitialLiveRegionTextMutation';
import { TreeStatusPlugin } from '../plugins/TreeStatusPlugin';
import { useTreeRootContext } from '../root/TreeRootContext';
import type { TreeItemId, TreeState } from '../store/types';

const stateAttributesMapping: StateAttributesMapping<TreeStatus.State> = {
  change: () => null,
  message: () => null,
};

function selectStatusChange(state: TreeState) {
  return state.statusChange;
}

function getSelectedCountMessage(count: number) {
  if (count === 0) {
    return 'No items selected.';
  }
  return count === 1 ? '1 item selected.' : `${count} items selected.`;
}

/**
 * The default message of a change. Empty for what `Tree.Empty` announces: a filter
 * without matches.
 */
function getStatusMessage(change: TreeStatusChange | null) {
  switch (change?.type) {
    case 'filter':
      if (change.matchCount === 0) {
        return '';
      }
      return change.matchCount === 1 ? '1 result.' : `${change.matchCount} results.`;
    case 'selection': {
      const { item, count } = change;
      const messages: string[] = [];
      if (item != null) {
        messages.push(item.selected ? `${item.label} selected.` : `${item.label} not selected.`);
      }
      if (count === 'all') {
        messages.push('All items selected.');
      } else if (count != null) {
        messages.push(getSelectedCountMessage(count));
      }
      return messages.join(' ');
    }
    default:
      return '';
  }
}

/**
 * Displays a status message whose content changes are announced politely to screen readers.
 * By default, announces in English the number of items matching the filter and the
 * selection changes made by pressing items or with the keyboard. Pass a function as
 * `children` to build the message from `change` in another language.
 * This component's root element must remain mounted in the DOM to announce
 * changes consistently across screen readers. Avoid hiding or removing the
 * component itself with `display: none`, `hidden`, `aria-hidden`, or conditional
 * rendering. Prefer updating or conditionally rendering its children instead.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Tree](https://base-ui.com/react/components/tree)
 */
export const TreeStatus = React.forwardRef(function TreeStatus(
  componentProps: TreeStatus.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, style, children: childrenProp, ...elementProps } = componentProps;

  const store = useTreeRootContext();
  const status = useRefWithInit(() => TreeStatusPlugin.install(store)).current;
  useIsoLayoutEffect(() => status.enable(), [status]);

  const change = useStore(store, selectStatusChange);
  const message = getStatusMessage(change);

  const statusRef = useInitialLiveRegionTextMutation<HTMLDivElement>();

  const state: TreeStatus.State = { change, message };

  let children: React.ReactNode;
  if (typeof childrenProp === 'function') {
    children = childrenProp(state);
  } else {
    children = childrenProp === undefined ? message : childrenProp;
  }

  return useRenderElement('div', componentProps, {
    state,
    ref: [forwardedRef, statusRef],
    props: [
      {
        children,
        role: 'status',
        'aria-live': 'polite',
        'aria-atomic': true,
      },
      elementProps,
    ],
    stateAttributesMapping,
  });
});

/** The number of items matching the filter changed with the query, mode, or external matches. */
export interface TreeStatusFilterChange {
  type: 'filter';
  /** The number of items matching the filter. */
  matchCount: number;
}

/**
 * The selection changed after pressing an item or a key.
 */
export interface TreeStatusSelectionChange {
  type: 'selection';
  /**
   * The item the change selected or deselected, or the only item left selected
   * when the change replaced the selection. `null` when several items changed.
   */
  item: { itemId: TreeItemId; label: string; selected: boolean } | null;
  /**
   * The number of selected items, `'all'` when every item is selected, or `null`
   * when naming the item is enough: in single selection mode, and when the change
   * selects the first item or deselects the last one.
   */
  count: number | 'all' | null;
}

export type TreeStatusChange = TreeStatusFilterChange | TreeStatusSelectionChange;

export interface TreeStatusState {
  /**
   * The latest change to announce, or `null` when there is none, such as once the
   * filter query is cleared.
   */
  change: TreeStatusChange | null;
  /** The English message of the change, or an empty string when there is nothing to announce. */
  message: string;
}

export interface TreeStatusProps extends Omit<
  BaseUIComponentProps<'div', TreeStatusState>,
  'children'
> {
  /**
   * The status content, or a function that receives the state and returns it.
   * Defaults to the English message of the latest change.
   */
  children?: React.ReactNode | ((state: TreeStatusState) => React.ReactNode) | undefined;
}

export namespace TreeStatus {
  export type State = TreeStatusState;
  export type Props = TreeStatusProps;
  export type Change = TreeStatusChange;
  export type FilterChange = TreeStatusFilterChange;
  export type SelectionChange = TreeStatusSelectionChange;
}
