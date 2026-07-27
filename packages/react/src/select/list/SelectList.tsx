'use client';
import * as React from 'react';
import { useStore } from '@base-ui/utils/store';
import type { BaseUIComponentProps, HTMLProps } from '../../internals/types';
import { useSelectRootContext } from '../root/SelectRootContext';
import { useSelectPositionerContext } from '../positioner/SelectPositionerContext';
import { useRenderElement } from '../../internals/useRenderElement';
import { styleDisableScrollbar } from '../../utils/styles';
import { LIST_FUNCTIONAL_STYLES } from '../popup/utils';
import { selectors } from '../store';
import { FilterDropdownList } from '../../filter-dropdown/list/FilterDropdownList';

const SELECT_LIST_ROLE = 'listbox';

const SelectListImpl = React.forwardRef(function SelectListImpl(
  componentProps: SelectList.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { id, render, className, style, ...elementProps } = componentProps;

  const { store, scrollHandlerRef, multiple } = useSelectRootContext();
  const { alignItemWithTriggerActive } = useSelectPositionerContext();

  const hasScrollArrows = useStore(store, selectors.hasScrollArrows);
  const openMethod = useStore(store, selectors.openMethod);

  const defaultProps: HTMLProps = {
    id,
    role: SELECT_LIST_ROLE,
    'aria-multiselectable': multiple || undefined,
    onScroll(event) {
      scrollHandlerRef.current?.(event.currentTarget);
    },
    ...(alignItemWithTriggerActive && {
      style: LIST_FUNCTIONAL_STYLES,
    }),
    className:
      hasScrollArrows && openMethod !== 'touch' ? styleDisableScrollbar.className : undefined,
  };

  const setListElement = store.useStateSetter('listElement');

  const element = useRenderElement('div', componentProps, {
    ref: [forwardedRef, setListElement],
    props: [defaultProps, elementProps],
  });

  return element;
});

/**
 * A container for the select items.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export const SelectList = React.forwardRef(function SelectList(
  componentProps: SelectList.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { store } = useSelectRootContext();
  const filterable = useStore(store, selectors.filterable);
  const rootId = useStore(store, selectors.id);
  const id = `${rootId}-list`;
  const selectList = <SelectListImpl id={id} {...componentProps} ref={forwardedRef} />;

  return filterable ? (
    // FilterDropdownList composes onto SelectListImpl so its implementation
    // overrides SelectListImpl's implementation.
    <FilterDropdownList role={SELECT_LIST_ROLE} id={id} render={selectList} />
  ) : (
    selectList
  );
});

export interface SelectListProps extends BaseUIComponentProps<'div', SelectListState> {}

export interface SelectListState {}

export namespace SelectList {
  export type Props = SelectListProps;
  export type State = SelectListState;
}
