'use client';
import * as React from 'react';
import { useSelector } from '../../utils/store';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useSelectRootContext } from '../root/SelectRootContext';
import { selectors } from '../store';
import { CustomStyleHookMapping } from '../../utils/getStyleHookProps';

const customStyleHookMapping: CustomStyleHookMapping<SelectValue.State> = {
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

  const { store, valueRef, multiple } = useSelectRootContext();
  const value = useSelector(store, selectors.value);
  const items = useSelector(store, selectors.items);

  // Pre-compute a value → label map to enable O(1) look-ups when deriving the
  // display label(s).
  const valueLabelMap = React.useMemo(() => {
    if (!items) {
      return undefined;
    }

    if (Array.isArray(items)) {
      const map = new Map<any, React.ReactNode>();
      for (const { value: itemValue, label } of items) {
        map.set(itemValue, label);
      }
      return map;
    }

    return new Map<any, React.ReactNode>(Object.entries(items));
  }, [items]);

  const labelFromItems = React.useMemo(() => {
    if (!valueLabelMap) {
      return null;
    }

    if (multiple && Array.isArray(value)) {
      const selectedLabels = value.map((v) => {
        const label = valueLabelMap.get(v) ?? valueLabelMap.get(String(v));
        return label ?? v; // fallback to raw value if label not found
      });
      return selectedLabels.length > 0 ? selectedLabels.join(', ') : null;
    }

    const label = valueLabelMap.get(value) ?? valueLabelMap.get(String(value));
    return label ?? null;
  }, [valueLabelMap, value, multiple]);

  const state: SelectValue.State = React.useMemo(
    () => ({
      value,
    }),
    [value],
  );

  const children =
    typeof childrenProp === 'function'
      ? childrenProp(value)
      : (childrenProp ?? labelFromItems ?? value);

  const element = useRenderElement('span', componentProps, {
    state,
    ref: [forwardedRef, valueRef],
    props: [{ children }, elementProps],
    customStyleHookMapping,
  });

  return element;
});

export namespace SelectValue {
  export interface Props extends Omit<BaseUIComponentProps<'span', State>, 'children'> {
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

  export interface State {
    /**
     * The value of the currently selected item.
     */
    value: any;
  }
}
