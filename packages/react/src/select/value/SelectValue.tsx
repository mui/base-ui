'use client';
import * as React from 'react';
import { useSelectRootContext } from '../root/SelectRootContext';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';

/**
 * A text label of the currently selected item.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export const SelectValue = React.forwardRef(function SelectValue(
  componentProps: SelectValue.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { className, render, children, placeholder, ...elementProps } = componentProps;

  const { value, label, valueRef } = useSelectRootContext();

  const element = useRenderElement('span', componentProps, {
    ref: [forwardedRef, valueRef],
    props: [
      {
        children:
          typeof children === 'function'
            ? children(!label && placeholder ? placeholder : label, value)
            : label || placeholder,
      },
      elementProps,
    ],
  });

  return element;
});

export namespace SelectValue {
  export interface Props extends Omit<BaseUIComponentProps<'span', State>, 'children'> {
    children?: null | ((label: string, value: any) => React.ReactNode);
    /**
     * A placeholder value to display when no value is selected.
     *
     * You can use this prop to pre-render the displayed text
     * during SSR in order to avoid the hydration flash.
     */
    placeholder?: string;
  }

  export interface State {}
}
