'use client';
import * as React from 'react';
import { useCheckboxRootContext } from '../root/CheckboxRootContext';
import { getCheckboxStateAttributesMapping } from '../utils/getCheckboxStateAttributesMapping';
import type { CheckboxRootState } from '../root/CheckboxRoot';
import type { BaseUIComponentProps } from '../../internals/types';
import type { TransitionStatus } from '../../internals/useTransitionStatus';
import { transitionStatusMapping } from '../../internals/stateAttributesMapping';
import { useSelectionIndicator } from '../../utils/ItemIndicator';

/**
 * Indicates whether the checkbox is ticked.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Checkbox](https://base-ui.com/react/components/checkbox)
 */
export const CheckboxIndicator = React.forwardRef(function CheckboxIndicator(
  componentProps: CheckboxIndicator.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const rootState = useCheckboxRootContext();

  return useSelectionIndicator(
    componentProps,
    forwardedRef,
    rootState.checked || rootState.indeterminate,
    rootState,
    {
      ...getCheckboxStateAttributesMapping(rootState),
      ...transitionStatusMapping,
    },
  );
});

export interface CheckboxIndicatorState extends CheckboxRootState {
  /**
   * The transition status of the component.
   */
  transitionStatus: TransitionStatus;
}

export interface CheckboxIndicatorProps extends BaseUIComponentProps<
  'span',
  CheckboxIndicatorState
> {
  /**
   * Whether to keep the element in the DOM when the checkbox is not checked.
   * @default false
   */
  keepMounted?: boolean | undefined;
}

export namespace CheckboxIndicator {
  export type State = CheckboxIndicatorState;
  export type Props = CheckboxIndicatorProps;
}
