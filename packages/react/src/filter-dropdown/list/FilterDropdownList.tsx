'use client';
import * as React from 'react';
import type { BaseUIComponentProps, HTMLProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { useFilterDropdownRootContext } from '../root/FilterDropdownRootContext';
import { FilterDropdownGroupContext } from '../group/FilterDropdownGroupContext';
import { useRenderedId } from '../../internals/resolveRenderedId';
import { getTarget } from '../../floating-ui-react/utils';
import { refocusOwner } from '../utils/refocusOwner';

/**
 * @internal
 */
export const FilterDropdownList = React.forwardRef(function FilterDropdownList(
  componentProps: FilterDropdownList.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  // `id` is resolved by `useRenderedId`, which also honors an id on the `render` element.
  const { render, className, style, id: idProp, ...elementProps } = componentProps;

  const context = useFilterDropdownRootContext();

  const [id, registerIdRef] = useRenderedId(
    componentProps,
    context.defaultListId,
    context.setRenderedListId,
  );

  const defaultProps: HTMLProps = {
    // Chromium includes scrollable elements in sequential focus navigation by default.
    tabIndex: -1,
    id,
    onFocus(event) {
      // A press on the list's own content, such as its background, a group, or a group label,
      // focuses the list.
      const owner = context.focusOwnerRef.current;
      if (
        owner &&
        event.relatedTarget === owner &&
        getTarget(event.nativeEvent) === event.currentTarget
      ) {
        refocusOwner(owner);
      }
    },
    onPointerMove() {
      context.setKeyboardModality(false);
    },
    onPointerDown() {
      context.setKeyboardModality(false);
    },
  };

  return useRenderElement('div', componentProps, {
    ref: [forwardedRef, registerIdRef],
    props: [
      defaultProps,
      elementProps,
      {
        // The list's groups and items belong to this root's query. A nested root's list renders
        // inside an enclosing group, which must not count them as its own members.
        children: (
          <FilterDropdownGroupContext.Provider value={null}>
            {elementProps.children}
          </FilterDropdownGroupContext.Provider>
        ),
      },
    ],
  });
});

export interface FilterDropdownListState {}

export interface FilterDropdownListProps extends BaseUIComponentProps<
  'div',
  FilterDropdownListState
> {
  id?: string | undefined;
}

export namespace FilterDropdownList {
  export type Props = FilterDropdownListProps;
  export type State = FilterDropdownListState;
}
