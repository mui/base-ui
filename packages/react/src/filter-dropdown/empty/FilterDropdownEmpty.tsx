'use client';
import * as React from 'react';
import { useStore } from '@base-ui/utils/store';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import type { BaseUIComponentProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { useFilterDropdownItemContext } from '../root/FilterDropdownRootContext';
import { selectors } from '../store';
import { useInitialLiveRegionTextMutation } from '../../internals/useInitialLiveRegionTextMutation';

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

  // Items mounting in the same commit register in layout effects, after this first render, and
  // don't register on the server at all. Deciding once they have keeps the children from
  // mounting for a frame on every open, and the message out of server markup.
  const [ready, setReady] = React.useState(false);
  useIsoLayoutEffect(() => {
    setReady(true);
  }, []);

  const visible = ready && isEmpty;

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
