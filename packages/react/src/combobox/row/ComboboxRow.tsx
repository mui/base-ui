'use client';
import * as React from 'react';
import { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { ComboboxRowContext } from './ComboboxRowContext';

/**
 * Displays a single row of items in a grid list.
 * Enable `grid` on the root component to turn the listbox into a grid.
 * Renders a `<div>` element.
 */
export const ComboboxRow = React.forwardRef(function ComboboxRow(
  componentProps: ComboboxRow.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, ...elementProps } = componentProps;

  const element = useRenderElement('div', componentProps, {
    ref: forwardedRef,
    props: [{ role: 'row' }, elementProps],
  });

  return <ComboboxRowContext.Provider value>{element}</ComboboxRowContext.Provider>;
});

export interface ComboboxRowState {}

export interface ComboboxRowProps extends BaseUIComponentProps<'div', ComboboxRow.State> {}

export namespace ComboboxRow {
  export type State = ComboboxRowState;
  export type Props = ComboboxRowProps;
}
