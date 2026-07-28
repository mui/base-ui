'use client';
import * as React from 'react';
import { BaseUIComponentProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { ComboboxRowContext } from './ComboboxRowContext';
import { ComboboxItemValueContext, NO_COMBOBOX_ITEM_VALUE } from '../item/ComboboxItemValueContext';

/**
 * Displays a single row of items in a grid list.
 * Enable `grid` on the root component to turn the listbox into a grid.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
export const ComboboxRow = React.forwardRef(function ComboboxRow(
  componentProps: ComboboxRow.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, style, ...elementProps } = componentProps;

  const element = useRenderElement('div', componentProps, {
    ref: forwardedRef,
    props: [{ role: 'row' }, elementProps],
  });

  // A row is a container, not a selectable item, so its cells must not inherit the collection
  // value that was supplied for the row itself.
  return (
    <ComboboxItemValueContext.Provider value={NO_COMBOBOX_ITEM_VALUE}>
      <ComboboxRowContext.Provider value>{element}</ComboboxRowContext.Provider>
    </ComboboxItemValueContext.Provider>
  );
});

export interface ComboboxRowState {}

export interface ComboboxRowProps extends BaseUIComponentProps<'div', ComboboxRowState> {}

export namespace ComboboxRow {
  export type State = ComboboxRowState;
  export type Props = ComboboxRowProps;
}
