'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { useStore } from '@base-ui/utils/store';
import type { BaseUIComponentProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { useFilterDropdownPopupContext } from '../popup/FilterDropdownPopupContext';
import { useFilterDropdownRootContext } from '../root/FilterDropdownRootContext';
import { selectors } from '../store';

const FilterDropdownEmptyImpl = React.forwardRef(function FilterDropdownEmptyImpl(
  componentProps: FilterDropdownEmpty.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, style, ...elementProps } = componentProps;
  const context = useFilterDropdownRootContext();
  const sourceRef = React.useRef<HTMLDivElement | null>(null);
  const [announcementText, setAnnouncementText] = React.useState('');

  // Mirror consumer-rendered content into the live region. Keyed on `children` because the
  // message can change while Empty stays mounted, for example "No matches for {query}".
  useIsoLayoutEffect(() => {
    const textContent = sourceRef.current?.textContent;
    if (textContent) {
      setAnnouncementText(textContent);
    }
  }, [componentProps.children]);

  const element = useRenderElement('div', componentProps, {
    ref: [forwardedRef, sourceRef],
    props: [elementProps],
  });

  return (
    <React.Fragment>
      {element}
      {/**
       * Keep the live-region copy outside the popup. If this was in situ, screen readers would
       * count it as a third dialog item even though users can interact only with the input and list.
       * The portal also prevents it from affecting layout when styling.
       */}
      {announcementText &&
        context.liveRegionElement &&
        ReactDOM.createPortal(<div>{announcementText}</div>, context.liveRegionElement)}
    </React.Fragment>
  );
});

/**
 * @internal
 */
export const FilterDropdownEmpty = React.forwardRef(function FilterDropdownEmpty(
  componentProps: FilterDropdownEmpty.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { empty } = useFilterDropdownRootContext();
  const { store } = useFilterDropdownPopupContext();
  const registryEmpty = useStore(store, selectors.isEmpty);
  const isEmpty = empty ?? registryEmpty;

  return isEmpty ? <FilterDropdownEmptyImpl {...componentProps} ref={forwardedRef} /> : null;
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
