'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import type { BaseUIComponentProps, HTMLProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { useFilterDropdownRootContext } from '../root/FilterDropdownRootContext';

/**
 * @internal
 */
export const FilterDropdownList = React.forwardRef(function FilterDropdownList(
  componentProps: FilterDropdownList.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, style, id: idProp, ...elementProps } = componentProps;
  const context = useFilterDropdownRootContext();
  const { setListId } = context;
  const id = idProp ?? context.listId;
  const hasAriaLabel = elementProps['aria-label'] || elementProps['aria-labelledby'];
  const ariaLabelledBy = hasAriaLabel ? elementProps['aria-labelledby'] : context.triggerId;

  useIsoLayoutEffect(() => {
    setListId(id);
  }, [id, setListId]);

  const defaultProps: HTMLProps = {
    role: 'menu',
    id,
    'aria-labelledby': ariaLabelledBy,
    onMouseDown(event) {
      // Keep focus on the input when list content is pressed.
      event.preventDefault();
    },
  };

  return useRenderElement('div', componentProps, {
    ref: forwardedRef,
    props: [defaultProps, elementProps],
  });
});

export interface FilterDropdownListState {}

export interface FilterDropdownListProps extends BaseUIComponentProps<
  'div',
  FilterDropdownListState
> {
  id: string | undefined;
}

export namespace FilterDropdownList {
  export type Props = FilterDropdownListProps;
  export type State = FilterDropdownListState;
}
