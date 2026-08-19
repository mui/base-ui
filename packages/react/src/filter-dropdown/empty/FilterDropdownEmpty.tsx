'use client';
import * as React from 'react';
import { useStore } from '@base-ui/utils/store';
import type { BaseUIComponentProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { useFilterDropdownItemContext } from '../root/FilterDropdownRootContext';
import { selectors } from '../store';
import { useInitialLiveRegionTextMutation } from '../../combobox/utils/useInitialLiveRegionTextMutation';

/**
 * @internal
 */
export const FilterDropdownEmpty = React.forwardRef(function FilterDropdownEmpty(
  componentProps: FilterDropdownEmpty.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, style, children: childrenProp, ...elementProps } = componentProps;

  const { store } = useFilterDropdownItemContext();
  const isEmpty = useStore(store, selectors.isEmpty);
  const emptyRef = useInitialLiveRegionTextMutation<HTMLDivElement>();
  const children = isEmpty ? childrenProp : null;

  return useRenderElement('div', componentProps, {
    ref: [forwardedRef, emptyRef],
    props: [
      {
        children,
        role: 'status',
        'aria-live': 'polite',
        'aria-atomic': true,
      },
      elementProps,
    ],
  });
});

export interface FilterDropdownEmptyState {}

export interface FilterDropdownEmptyProps extends BaseUIComponentProps<
  'div',
  FilterDropdownEmptyState
> {}

export namespace FilterDropdownEmpty {
  export type Props = FilterDropdownEmptyProps;
  export type State = FilterDropdownEmptyState;
}
