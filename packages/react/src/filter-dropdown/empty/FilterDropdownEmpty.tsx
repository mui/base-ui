'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import type { BaseUIComponentProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { useFilterDropdownRootContext } from '../root/FilterDropdownRootContext';

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
  return empty ? <FilterDropdownEmptyImpl {...componentProps} ref={forwardedRef} /> : null;
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
