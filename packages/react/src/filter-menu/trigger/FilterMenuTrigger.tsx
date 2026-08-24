'use client';
import * as React from 'react';
import { useBaseUiId } from '../../internals/useBaseUiId';
import { FilterDropdownTrigger } from '../../filter-dropdown/trigger/FilterDropdownTrigger';
import {
  MenuTrigger,
  type MenuTriggerProps,
  type MenuTriggerState,
} from '../../menu/trigger/MenuTrigger';
import { useMenuRootContext } from '../../menu/root/MenuRootContext';
import { usePopupHandleStore } from '../../utils/popups';
import type { FilterMenuHandle } from '../store/FilterMenuHandle';

/**
 * A button that opens the filter menu.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Filter Menu](https://base-ui.com/react/components/filter-menu)
 */
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
      'Base UI: <FilterMenu.Trigger> must be either used within a <FilterMenu.Root> component or provided with a handle.',
    );
  }

  const id = useBaseUiId(idProp);
  const open = store.useState('isOpenedByTrigger', id);
  const popupId = store.useState('triggerPopupId', id);

  return (
    <FilterDropdownTrigger
      id={id}
      popupState={{ open, popupId }}
      // The consumer's props and ref go to the inner trigger only. Applying them to both layers
      // would run each handler twice for one interaction.
      render={
        <MenuTrigger
          {...menuProps}
          handle={handle}
          id={id}
          ref={forwardedRef as React.Ref<HTMLButtonElement>}
        />
      }
    />
  );
}) as FilterMenuTrigger;

export interface FilterMenuTrigger {
  <Payload>(
    props: FilterMenuTriggerProps<Payload> & React.RefAttributes<HTMLElement>,
  ): React.JSX.Element;
}

export interface FilterMenuTriggerProps<Payload = unknown> extends Omit<
  MenuTriggerProps<Payload>,
  'handle'
> {
  /**
   * A handle that associates the trigger with a filter menu.
   */
  handle?: FilterMenuHandle<Payload> | undefined;
}

export interface FilterMenuTriggerState extends MenuTriggerState {}

export namespace FilterMenuTrigger {
  export type Props<Payload = unknown> = FilterMenuTriggerProps<Payload>;
  export type State = FilterMenuTriggerState;
}
