'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';

/**
 * Displays a single row of regular items in a grid filter menu.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Filter Menu](https://base-ui.com/react/components/filter-menu)
 */
export const FilterMenuRow = React.forwardRef(function FilterMenuRow(
  componentProps: FilterMenuRow.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, style, ...elementProps } = componentProps;

  return useRenderElement('div', componentProps, {
    ref: forwardedRef,
    props: [{ role: 'row' }, elementProps],
  });
});

export interface FilterMenuRowState {}

export interface FilterMenuRowProps extends BaseUIComponentProps<'div', FilterMenuRowState> {}

export namespace FilterMenuRow {
  export type State = FilterMenuRowState;
  export type Props = FilterMenuRowProps;
}
