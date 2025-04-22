'use client';
import * as React from 'react';
import { useSelectRootContext } from '../root/SelectRootContext';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import type { BaseUIComponentProps } from '../../utils/types';
import { useForkRef } from '../../utils/useForkRef';
import { mergeProps } from '../../merge-props';

/**
 * A text label of the currently selected item.
 * Renders a `<span>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export const SelectValue = React.forwardRef(function SelectValue(
  props: SelectValue.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { className, render, children, placeholder, ...otherProps } = props;

  const { value, label, valueRef } = useSelectRootContext();

  const mergedRef = useForkRef(forwardedRef, valueRef);

  const state: SelectValue.State = React.useMemo(() => ({}), []);

  const getValueProps = React.useCallback(
    (externalProps = {}) =>
      mergeProps(
        {
          children:
            typeof children === 'function'
              ? children(!label && placeholder ? placeholder : label, value)
              : label || placeholder,
        },
        externalProps,
      ),
    [children, label, placeholder, value],
  );

  const { renderElement } = useComponentRenderer({
    propGetter: getValueProps,
    render: render ?? 'span',
    className,
    state,
    ref: mergedRef,
    extraProps: otherProps,
  });

  return renderElement();
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
