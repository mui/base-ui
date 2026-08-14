'use client';
import * as React from 'react';
import { useBaseUiId } from '../internals/useBaseUiId';
import { FilterDropdownTrigger } from '../filter-dropdown/trigger/FilterDropdownTrigger';
import type {
  FilterDropdownTriggerProps,
  FilterDropdownTriggerState,
} from '../filter-dropdown/trigger/FilterDropdownTrigger';
import { MenuTrigger, type MenuTriggerProps } from '../menu/trigger/MenuTrigger';
import { useMenuRootContext } from '../menu/root/MenuRootContext';
import { usePopupHandleStore } from '../utils/popups';

export const FilterMenuTrigger = React.forwardRef(function FilterMenuTrigger(
  props: FilterMenuTrigger.Props,
  forwardedRef: React.ForwardedRef<HTMLElement>,
) {
  const { id: idProp, handle, ...menuProps } = props;
  const rootContext = useMenuRootContext(true);
  const handleStore = usePopupHandleStore(handle);
  const store = handleStore ?? rootContext?.store;

  if (!store) {
    throw new Error(
      'Base UI: <FilterMenu.Trigger> must be either used within <FilterMenu.Root> or provided with a handle.',
    );
  }

  const id = useBaseUiId(idProp);
  const open = store.useState('isOpenedByTrigger', id);
  const popupId = store.useState('triggerPopupId', id);
  const detached = store !== rootContext?.store ? { open, popupId } : undefined;

  return (
    <FilterDropdownTrigger
      {...menuProps}
      id={id}
      detached={detached}
      render={<MenuTrigger {...menuProps} handle={handle} id={id} />}
      ref={forwardedRef}
    />
  );
});

export interface FilterMenuTriggerProps
  extends Omit<MenuTriggerProps, 'id'>, Omit<FilterDropdownTriggerProps, 'id' | 'render'> {
  id?: string | undefined;
}
export interface FilterMenuTriggerState extends FilterDropdownTriggerState {}

export namespace FilterMenuTrigger {
  export type Props = FilterMenuTriggerProps;
  export type State = FilterMenuTriggerState;
}
