'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useProgressRootContext } from '../root/ProgressRootContext';
import type { ProgressRoot } from '../root/ProgressRoot';
import { progressStateAttributesMapping } from '../root/stateAttributesMapping';
/**
 * A text label displaying the current value.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Progress](https://base-ui.com/react/components/progress)
 */
export const ProgressValue = React.forwardRef(function ProgressValue(
  componentProps: ProgressValue.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { className, render, children, ...elementProps } = componentProps;

  const { value, formattedValue, state } = useProgressRootContext();

  const formattedValueArg = value == null ? 'indeterminate' : formattedValue;
  const formattedValueDisplay = value == null ? null : formattedValue;

  const element = useRenderElement('span', componentProps, {
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

  return element;
});

export interface ProgressValueProps extends Omit<
  BaseUIComponentProps<'span', ProgressRoot.State>,
  'children'
> {
  children?:
    | (null | ((formattedValue: string | null, value: number | null) => React.ReactNode))
    | undefined;
}

export namespace ProgressValue {
  export type Props = ProgressValueProps;
}
