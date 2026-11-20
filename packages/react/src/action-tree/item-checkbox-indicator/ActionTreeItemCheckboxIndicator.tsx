'use client';
import * as React from 'react';
import { Checkbox } from '../../checkbox';
import type { CheckboxIndicatorState } from '../../checkbox';
import type { BaseUIComponentProps } from '../../internals/types';
import type { TransitionStatus } from '../../internals/useTransitionStatus';
import type { ActionTreeItemCheckboxState } from '../item-checkbox/ActionTreeItemCheckbox';
import { mapStateProps } from '../../tree/utils/mapStateProps';

function toItemCheckboxIndicatorState(
  state: CheckboxIndicatorState,
): ActionTreeItemCheckboxIndicatorState {
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
 * Documentation: [Base UI Action Tree](https://base-ui.com/react/components/action-tree)
 */
export const ActionTreeItemCheckboxIndicator = React.forwardRef(
  function ActionTreeItemCheckboxIndicator(
    componentProps: ActionTreeItemCheckboxIndicator.Props,
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
  },
);

export interface ActionTreeItemCheckboxIndicatorState extends ActionTreeItemCheckboxState {
  /**
   * The transition status of the component.
   */
  transitionStatus: TransitionStatus;
}

export interface ActionTreeItemCheckboxIndicatorProps extends BaseUIComponentProps<
  'span',
  ActionTreeItemCheckboxIndicatorState
> {
  /**
   * Whether to keep the element in the DOM when the checkbox is not checked.
   * @default false
   */
  keepMounted?: boolean | undefined;
}

export namespace ActionTreeItemCheckboxIndicator {
  export type State = ActionTreeItemCheckboxIndicatorState;
  export type Props = ActionTreeItemCheckboxIndicatorProps;
}
