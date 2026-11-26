'use client';
import * as React from 'react';
import { Checkbox } from '../../checkbox';
import type { CheckboxIndicatorState } from '../../checkbox';
import type { BaseUIComponentProps } from '../../internals/types';
import type { TransitionStatus } from '../../internals/useTransitionStatus';
import type { TreeGridRowCheckboxState } from '../row-checkbox/TreeGridRowCheckbox';
import { mapStateProps } from '../../tree/utils/mapStateProps';

function toItemCheckboxIndicatorState(
  state: CheckboxIndicatorState,
): TreeGridRowCheckboxIndicatorState {
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
 * Documentation: [Base UI Tree Grid](https://base-ui.com/react/components/tree-grid)
 */
export const TreeGridRowCheckboxIndicator = React.forwardRef(function TreeGridRowCheckboxIndicator(
  componentProps: TreeGridRowCheckboxIndicator.Props,
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

export interface TreeGridRowCheckboxIndicatorState extends TreeGridRowCheckboxState {
  /**
   * The transition status of the component.
   */
  transitionStatus: TransitionStatus;
}

export interface TreeGridRowCheckboxIndicatorProps extends BaseUIComponentProps<
  'span',
  TreeGridRowCheckboxIndicatorState
> {
  /**
   * Whether to keep the element in the DOM when the checkbox is not checked.
   * @default false
   */
  keepMounted?: boolean | undefined;
}

export namespace TreeGridRowCheckboxIndicator {
  export type State = TreeGridRowCheckboxIndicatorState;
  export type Props = TreeGridRowCheckboxIndicatorProps;
}
