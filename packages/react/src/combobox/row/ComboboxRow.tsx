'use client';
import * as React from 'react';
import { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { ComboboxRowContext } from './ComboboxRowContext';

/**
 * Displays a single row of items in a grid list.
 * Specify `cols` on the root component to indicate the number of columns.
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

export namespace ComboboxRow {
  export interface State {}

  export interface Props extends BaseUIComponentProps<'div', State> {}
}
