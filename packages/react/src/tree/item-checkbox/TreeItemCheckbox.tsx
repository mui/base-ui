'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { StateAttributesMapping } from '../../utils/getStateAttributesProps';
import { useTreeRootContext } from '../root/TreeRootContext';
import { useTreeItemContext } from '../item/TreeItemContext';
import { TreeItemCheckboxDataAttributes } from './TreeItemCheckboxDataAttributes';

const stateAttributesMapping: StateAttributesMapping<TreeItemCheckbox.State> = {
  checked: (v) => (v ? { [TreeItemCheckboxDataAttributes.checked]: '' } : null),
  unchecked: (v) => (v ? { [TreeItemCheckboxDataAttributes.unchecked]: '' } : null),
  indeterminate: (v) => (v ? { [TreeItemCheckboxDataAttributes.indeterminate]: '' } : null),
  disabled: (v) => (v ? { [TreeItemCheckboxDataAttributes.disabled]: '' } : null),
};

/**
 * A checkbox for selecting a tree item.
 * Renders an `<input>` element.
 *
 * Documentation: [Base UI Tree](https://base-ui.com/react/components/tree)
 */
export const TreeItemCheckbox = React.forwardRef(function TreeItemCheckbox(
  componentProps: TreeItemCheckbox.Props,
  forwardedRef: React.ForwardedRef<HTMLInputElement>,
) {
  const { className, render, ...elementProps } = componentProps;

  const store = useTreeRootContext();
  const { itemId } = useTreeItemContext();
  const propsFromState = store.useState('checkboxProps', itemId);

  const checkboxRef = React.useRef<HTMLInputElement>(null);

  // Sync indeterminate property (not available as HTML attribute)
  React.useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate = propsFromState.indeterminate;
    }
  }, [propsFromState.indeterminate]);

  const state: TreeItemCheckbox.State = {
    checked: propsFromState.checked,
    unchecked: !propsFromState.checked && !propsFromState.indeterminate,
    indeterminate: propsFromState.indeterminate,
    disabled: propsFromState.disabled,
  };

  const element = useRenderElement('input', componentProps, {
    state,
    ref: [forwardedRef, checkboxRef],
    props: [
      {
        type: 'checkbox',
        'aria-hidden': true,
        tabIndex: -1,
        checked: propsFromState.checked,
        disabled: propsFromState.disabled,
        onChange: (event: React.ChangeEvent<HTMLInputElement>) => {
          store.checkboxEventHandlers.onChange(event, itemId);
        },
        onClick: (event: React.MouseEvent) => {
          // Prevent the item click handler from firing
          event.stopPropagation();
        },
      },
      elementProps,
    ],
    stateAttributesMapping,
  });

  // Don't render the checkbox when the item's selection is disabled
  if (propsFromState.hidden) {
    return null;
  }

  return element;
});

export interface TreeItemCheckboxState {
  checked: boolean;
  unchecked: boolean;
  indeterminate: boolean;
  disabled: boolean;
}

export interface TreeItemCheckboxProps extends BaseUIComponentProps<
  'input',
  TreeItemCheckboxState
> {}

export namespace TreeItemCheckbox {
  export type State = TreeItemCheckboxState;
  export type Props = TreeItemCheckboxProps;
}
