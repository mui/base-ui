'use client';
import * as React from 'react';
import { useStore } from '@base-ui/utils/store';
import type { BaseUIComponentProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { useFilterDropdownItemContext } from '../root/FilterDropdownRootContext';
import { selectors } from '../store';
import { useInitialLiveRegionTextMutation } from '../../internals/useInitialLiveRegionTextMutation';
import { useIsHydrating } from '../../utils/useIsHydrating';

/**
 * @internal
 */
export const FilterDropdownEmpty = React.forwardRef(function FilterDropdownEmpty(
  componentProps: FilterDropdownEmpty.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, style, ...elementProps } = componentProps;

  const { store } = useFilterDropdownItemContext();
  const isEmpty = useStore(store, selectors.isEmpty);
  // Items register in layout effects, which don't run on the server, so server markup would
  // otherwise show every item and the empty message at the same time.
  const hydrating = useIsHydrating();
  const visible = isEmpty && !hydrating;
  const emptyRef = useInitialLiveRegionTextMutation<HTMLDivElement>(visible);

  return useRenderElement('div', componentProps, {
    enabled: visible,
    ref: [forwardedRef, emptyRef],
    props: [
      {
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
