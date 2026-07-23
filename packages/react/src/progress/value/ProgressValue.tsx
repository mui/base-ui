'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { useProgressRootContext } from '../root/ProgressRootContext';
import type { ProgressRootState } from '../root/ProgressRoot';
import { progressStateAttributesMapping } from '../root/stateAttributesMapping';
/**
 * A text element displaying the current value.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Progress](https://base-ui.com/react/components/progress)
 */
export const ProgressValue = React.forwardRef(function ProgressValue(
  componentProps: ProgressValue.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { className, render, children, style, ...elementProps } = componentProps;

  const { value, formattedValue, state } = useProgressRootContext();

  const indeterminate = state.status === 'indeterminate';
  const formattedValueArg = indeterminate ? 'indeterminate' : formattedValue;
  const formattedValueDisplay = indeterminate ? null : formattedValue;

  return useRenderElement('span', componentProps, {
    state,
    ref: forwardedRef,
    props: [
      {
        'aria-hidden': true,
        children:
          typeof children === 'function'
            ? children(formattedValueArg, value)
            : formattedValueDisplay,
      },
      elementProps,
    ],
    stateAttributesMapping: progressStateAttributesMapping,
  });
});

export interface ProgressValueState extends ProgressRootState {}

export interface ProgressValueProps extends Omit<
  BaseUIComponentProps<'span', ProgressValueState>,
  'children'
> {
  children?:
    | null
    | ((formattedValue: string | null, value: number | null) => React.ReactNode)
    | undefined;
}

export namespace ProgressValue {
  export type State = ProgressValueState;
  export type Props = ProgressValueProps;
}
