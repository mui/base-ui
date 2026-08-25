'use client';
import * as React from 'react';
import { useFilterDropdownGroup } from '../../filter-dropdown/group/useFilterDropdownGroup';
import { FilterDropdownGroupContext } from '../../filter-dropdown/group/FilterDropdownGroupContext';
import type { BaseUIComponentProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { FilterMenuRowContext } from './FilterMenuRowContext';

/**
 * Displays a single row of regular items in a grid filter menu.
 * Enable `grid` on the root component to turn the list into a grid.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Filter Menu](https://base-ui.com/react/components/filter-menu)
 */
export const FilterMenuRow = React.forwardRef(function FilterMenuRow(
  componentProps: FilterMenuRow.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, style, hidden: hiddenProp, ...elementProps } = componentProps;

  const { hidden, context, grid } = useFilterDropdownGroup();

  const element = useRenderElement('div', componentProps, {
    ref: forwardedRef,
    props: [
      // Outside grid mode the row would sit inside a `menu`, which cannot own one.
      { role: grid ? 'row' : undefined, hidden: hidden || hiddenProp || undefined },
      elementProps,
    ],
  });

  return (
    <FilterDropdownGroupContext.Provider value={context}>
      <FilterMenuRowContext.Provider value={grid}>{element}</FilterMenuRowContext.Provider>
    </FilterDropdownGroupContext.Provider>
  );
});

export interface FilterMenuRowState {}

export interface FilterMenuRowProps extends BaseUIComponentProps<'div', FilterMenuRowState> {}

export namespace FilterMenuRow {
  export type State = FilterMenuRowState;
  export type Props = FilterMenuRowProps;
}
