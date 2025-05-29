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
  const {
    className,
    render,
    children: childrenProp,
    initialSelectedLabel,
    placeholder,
    ...elementProps
  } = componentProps;

  const { value, label: contextLabel, valueRef } = useSelectRootContext();

  const label = value == null ? placeholder : contextLabel || initialSelectedLabel;
  const children =
    typeof childrenProp === 'function' ? childrenProp(label, value) : childrenProp || label;

  const element = useRenderElement('span', componentProps, {
    ref: [forwardedRef, valueRef],
    props: [{ children }, elementProps],
  });

  return element;
});

export namespace SelectValue {
  export interface Props extends Omit<BaseUIComponentProps<'span', State>, 'children'> {
    /**
     * Specifies a controlled label or a callback to customize the value label when uncontrolled.
     *
     * ```tsx
     * <Select.Value initialSelectedLabel="Select an item">
     *   {(label, value) => value !== null ? `${label} (${value})` : label}
     * </Select.Value>
     * ```
     */
    children?: React.ReactNode | ((label: React.ReactNode, value: any) => React.ReactNode);
    /**
     * When an item is pre-selected, this specifies the initial value label before hydration and
     * before the popup is opened for the first time. It should be identical to the selected item’s label.
     *
     * ```tsx
     * <Select.Value initialSelectedLabel="Red" />
     * ```
     */
    initialSelectedLabel?: React.ReactNode;
    /**
     * Specifies the placeholder label when no item is selected.
     *
     * ```tsx
     * <Select.Value placeholder="Select an item" />
     * ```
     */
    placeholder?: React.ReactNode;
  }

  export interface State {}
}
