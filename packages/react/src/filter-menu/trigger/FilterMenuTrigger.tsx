'use client';
import * as React from 'react';
import { ownerWindow } from '@base-ui/utils/owner';
import {
  MenuTrigger,
  type MenuTriggerProps,
  type MenuTriggerState,
} from '../../menu/trigger/MenuTrigger';
import { useMenuRootContext } from '../../menu/root/MenuRootContext';
import { mergeProps } from '../../merge-props';
import type { BaseUIEvent } from '../../internals/types';
import type { FilterMenuHandle } from '../store/FilterMenuHandle';
import { usePopupHandleStore } from '../../utils/popups';

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
  const handleStore = usePopupHandleStore(handle);
  const store = handleStore ?? rootContext?.store;

  // `virtualFocus` marks a FilterMenu root; a plain <Menu.Root> never sets it.
  if (!store || (!rootContext?.virtualFocus && !handle)) {
    throw new Error(
      'Base UI: <FilterMenu.Trigger> must be either used within a <FilterMenu.Root> component or provided with a handle.',
    );
  }

  const triggerProps = mergeProps<typeof MenuTrigger>(
    {
      'aria-haspopup': 'dialog',
      onKeyDown(event: BaseUIEvent<React.KeyboardEvent<HTMLElement>>) {
        const focusOwner = store.context.virtualFocusRef?.current;
        if (!store.select('open') || !focusOwner) {
          return;
        }

        const isVerticalArrow = event.key === 'ArrowUp' || event.key === 'ArrowDown';
        const isTypeaheadKey =
          event.key.length === 1 &&
          event.key !== ' ' &&
          !event.ctrlKey &&
          !event.metaKey &&
          !event.altKey;

        if (isVerticalArrow) {
          const KeyboardEventConstructor = ownerWindow(focusOwner).KeyboardEvent;
          focusOwner.dispatchEvent(new KeyboardEventConstructor(event.type, event.nativeEvent));
          // Let the forwarded navigation commit before focus would seed the first item.
          queueMicrotask(() => focusOwner.focus({ preventScroll: true }));
          event.preventDefault();
          event.preventBaseUIHandler();
        } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          // Cross-axis keys drive submenu open/close, which the trigger must not relay.
          event.preventBaseUIHandler();
        } else if (isTypeaheadKey) {
          focusOwner.focus({ preventScroll: true });
        }
      },
    },
    menuProps,
  );

  return (
    <MenuTrigger
      {...triggerProps}
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
