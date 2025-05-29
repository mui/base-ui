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
    initialLabel,
    ...elementProps
  } = componentProps;

  const { value, label: contextLabel, valueRef } = useSelectRootContext();

  const label = contextLabel || initialLabel;
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
     * <Select.Value initialLabel="Select an item">
     *   {(label, value) => value !== null ? `${label} (${value})` : label}
     * </Select.Value>
     * ```
     */
    children?: React.ReactNode | ((label: React.ReactNode, value: any) => React.ReactNode);
    /**
     * Specifies the initial value label before hydration and before the popup is opened for the first time.
     * If no item is selected, it acts as a placeholder label. If an item is pre-selected, it should match
     * the selected item’s label.
     *
     * ```tsx
     * <Select.Value initialLabel="Select an item" />
     * ```
     */
    initialLabel: React.ReactNode;
  }

  export interface State {}
}
