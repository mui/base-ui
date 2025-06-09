'use client';
import * as React from 'react';
import { useSelector } from '../../utils/store';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useSelectRootContext } from '../root/SelectRootContext';
import { selectors } from '../store';
import { useOnFirstRender } from '../../utils/useOnFirstRender';

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
  const {
    className,
    render,
    children: childrenProp,
    placeholder,
    ...elementProps
  } = componentProps;

  const { store, valueRef } = useSelectRootContext();
  const value = useSelector(store, selectors.value);
  const defaultLabel = useSelector(store, selectors.defaultLabel);
  const label = useSelector(store, selectors.label);

  let printedValue: React.ReactNode = '';
  if (value == null) {
    printedValue = placeholder;
  } else {
    printedValue = label || defaultLabel;
  }

  useOnFirstRender(() => {
    if (process.env.NODE_ENV !== 'production') {
      if (value != null && defaultLabel === '') {
        throw new Error(
          'Base UI: Missing `defaultLabel` prop on <Select.Root>. A default label must be provided when an item is initially selected to display in <Select.Value>.',
        );
      }
    }
  });

  const children =
    typeof childrenProp === 'function'
      ? childrenProp(printedValue, value)
      : childrenProp || printedValue;

  const element = useRenderElement('span', componentProps, {
    ref: [forwardedRef, valueRef],
    props: [{ children }, elementProps],
  });

  return element;
});

export namespace SelectValue {
  export interface Props extends Omit<BaseUIComponentProps<'span', State>, 'children'> {
    children?: null | ((label: React.ReactNode, value: any) => React.ReactNode);
    /**
     * A placeholder to display when no value is selected.
     */
    placeholder?: React.ReactNode;
  }

  export interface State {}
}
