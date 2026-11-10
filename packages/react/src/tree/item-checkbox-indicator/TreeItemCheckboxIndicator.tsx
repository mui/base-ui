'use client';
import * as React from 'react';
import { Checkbox } from '../../checkbox';
import type { CheckboxIndicatorState } from '../../checkbox';
import type { BaseUIComponentProps } from '../../internals/types';
import type { TransitionStatus } from '../../internals/useTransitionStatus';
import type { TreeItemCheckboxState } from '../item-checkbox/TreeItemCheckbox';
import { mapStateProps } from '../utils/mapStateProps';

function toItemCheckboxIndicatorState(
  state: CheckboxIndicatorState,
): TreeItemCheckboxIndicatorState {
  return {
    checked: state.checked,
    indeterminate: state.indeterminate,
    disabled: state.disabled,
    transitionStatus: state.transitionStatus,
  };
}

/**
 * Renders when the tree item checkbox is checked or mixed.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Tree](https://base-ui.com/react/components/tree)
 */
export const TreeItemCheckboxIndicator = React.forwardRef(function TreeItemCheckboxIndicator(
  componentProps: TreeItemCheckboxIndicator.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { className, style, render, ...otherProps } = componentProps;
  return (
    <Checkbox.Indicator
      {...otherProps}
      {...mapStateProps({ className, style, render }, toItemCheckboxIndicatorState)}
      ref={forwardedRef}
    />
  );
});

export interface TreeItemCheckboxIndicatorState extends TreeItemCheckboxState {
  /**
   * The transition status of the component.
   */
  transitionStatus: TransitionStatus;
}

export interface TreeItemCheckboxIndicatorProps extends BaseUIComponentProps<
  'span',
  TreeItemCheckboxIndicatorState
> {
  /**
   * Whether to keep the element in the DOM when the checkbox is not checked.
   * @default false
   */
  keepMounted?: boolean | undefined;
}

export namespace TreeItemCheckboxIndicator {
  export type State = TreeItemCheckboxIndicatorState;
  export type Props = TreeItemCheckboxIndicatorProps;
}
