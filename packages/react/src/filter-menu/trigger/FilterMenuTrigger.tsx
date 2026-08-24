'use client';
import * as React from 'react';
import {
  MenuTrigger,
  type MenuTriggerProps,
  type MenuTriggerState,
} from '../../menu/trigger/MenuTrigger';
import { useMenuRootContext } from '../../menu/root/MenuRootContext';
import { mergeProps } from '../../merge-props';
import type { BaseUIEvent } from '../../internals/types';
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
  const { handle, ...menuProps } = props;

  const rootContext = useMenuRootContext(true);

  if (!rootContext && !handle) {
    throw new Error(
      'Base UI: <FilterMenu.Trigger> must be either used within a <FilterMenu.Root> component or provided with a handle.',
    );
  }

  const triggerProps = mergeProps<typeof MenuTrigger>(
    {
      onKeyDown(event: BaseUIEvent<React.KeyboardEvent<HTMLElement>>) {
        const focusOwner = rootContext?.virtualFocusRef?.current;
        const isArrowKey = event.key.startsWith('Arrow');
        const isTypeaheadKey =
          event.key.length === 1 &&
          event.key !== ' ' &&
          !event.ctrlKey &&
          !event.metaKey &&
          !event.altKey;

        if ((isArrowKey || isTypeaheadKey) && rootContext?.store.select('open') && focusOwner) {
          focusOwner.focus({ preventScroll: true });
          if (isArrowKey) {
            event.preventDefault();
            event.preventBaseUIHandler();
          }
        }
      },
    },
    menuProps,
  );

  return (
    <MenuTrigger
      {...triggerProps}
      aria-haspopup={triggerProps['aria-haspopup'] ?? 'dialog'}
      handle={handle}
      ref={forwardedRef as React.Ref<HTMLButtonElement>}
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
