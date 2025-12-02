'use client';
import * as React from 'react';
import { useStore } from '@base-ui-components/utils/store';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useSelectRootContext } from '../root/SelectRootContext';
import { resolveSelectedLabel, resolveMultipleLabels } from '../../utils/resolveValueLabel';
import { selectors } from '../store';
import { StateAttributesMapping } from '../../utils/getStateAttributesProps';

const stateAttributesMapping: StateAttributesMapping<SelectValue.State> = {
  value: () => null,
};

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
  const { className, render, children: childrenProp, ...elementProps } = componentProps;

  const { store, valueRef } = useSelectRootContext();

  const value = useStore(store, selectors.value);
  const items = useStore(store, selectors.items);
  const itemToStringLabel = useStore(store, selectors.itemToStringLabel);
  const serializedValue = useStore(store, selectors.serializedValue);

  const state: SelectValue.State = React.useMemo(
    () => ({
      value,
      placeholder: !serializedValue,
    }),
    [value, serializedValue],
  );

  const children =
    typeof childrenProp === 'function'
      ? childrenProp(value)
      : (childrenProp ??
        (Array.isArray(value)
          ? resolveMultipleLabels(value, itemToStringLabel)
          : resolveSelectedLabel(value, items, itemToStringLabel)));

  const element = useRenderElement('span', componentProps, {
    state,
    ref: [forwardedRef, valueRef],
    props: [{ children }, elementProps],
    stateAttributesMapping,
  });

  return element;
});

export interface SelectValueState {
  /**
   * The value of the currently selected item.
   */
  value: any;
}

export interface SelectValueProps
  extends Omit<BaseUIComponentProps<'span', SelectValue.State>, 'children'> {
  /**
   * Accepts a function that returns a `ReactNode` to format the selected value.
   * @example
   * ```tsx
   * <Select.Value>
   *   {(value: string | null) => value ? labels[value] : 'No value'}
   * </Select.Value>
   * ```
   */
  children?: React.ReactNode | ((value: any) => React.ReactNode);
}

export namespace SelectValue {
  export type State = SelectValueState;
  export type Props = SelectValueProps;
}
