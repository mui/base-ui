'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import type { BaseUIComponentProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { useFilterDropdownPopupContext } from '../popup/FilterDropdownPopupContext';

/**
 * @internal
 */
export const FilterDropdownList = React.forwardRef(function FilterDropdownList(
  componentProps: FilterDropdownList.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, style, id: idProp, ...elementProps } = componentProps;
  const popupContext = useFilterDropdownPopupContext();
  const { setListId } = popupContext;
  const id = idProp ?? popupContext.listId;

  useIsoLayoutEffect(() => {
    setListId(id);
  }, [id, setListId]);

  return useRenderElement('div', componentProps, {
    ref: forwardedRef,
    props: [
      {
        role: 'menu',
        id,
        // Prevent scrollable lists from being focusable with virtual cursor on tab keypress.
        tabIndex: -1,
        onMouseDown(event) {
          // Keep focus on the input when list content is pressed.
          event.preventDefault();
        },
      },
      elementProps,
    ],
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
