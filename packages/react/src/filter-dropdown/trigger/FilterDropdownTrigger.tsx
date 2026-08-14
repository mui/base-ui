'use client';
import * as React from 'react';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import type { BaseUIComponentProps, NativeButtonProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { pressableTriggerOpenStateMapping } from '../../utils/popupStateMapping';
import { useFilterDropdownRootContext } from '../root/FilterDropdownRootContext';

/**
 * @internal
 */
export const FilterDropdownTrigger = React.forwardRef(function FilterDropdownTrigger(
  componentProps: FilterDropdownTrigger.Props,
  forwardedRef: React.ForwardedRef<HTMLElement>,
) {
  const {
    render,
    className,
    style,
    disabled = false,
    id: idProp,
    detached,
    ...elementProps
  } = componentProps;
  const context = useFilterDropdownRootContext(detached !== undefined);
  const setTriggerId = context?.setTriggerId;
  const id = idProp ?? context?.triggerId;
  const open = context?.open ?? detached?.open ?? false;
  const popupId = context?.popupId ?? detached?.popupId;

  useIsoLayoutEffect(() => {
    setTriggerId?.(id);
  }, [id, setTriggerId]);

  const state: FilterDropdownTriggerState = {
    disabled,
    open,
  };

  return useRenderElement('button', componentProps, {
    state,
    ref: [forwardedRef, context?.setTriggerElement],
    props: [
      {
        id,
        'aria-haspopup': 'dialog',
        'aria-expanded': open,
        'aria-controls': open ? popupId : undefined,
      },
      elementProps,
    ],
    stateAttributesMapping: pressableTriggerOpenStateMapping,
  });
});

export interface FilterDropdownTriggerState {
  /**
   * Whether the trigger is disabled.
   */
  disabled: boolean;
  /**
   * Whether the popup is open.
   */
  open: boolean;
}

export type FilterDropdownTriggerProps = NativeButtonProps &
  BaseUIComponentProps<'button', FilterDropdownTriggerState> & {
    id: string | undefined;
    /**
     * State supplied by a detached trigger that cannot access the FilterDropdown root context.
     */
    detached?: { open: boolean; popupId: string | undefined } | undefined;
  };

export namespace FilterDropdownTrigger {
  export type Props = FilterDropdownTriggerProps;
  export type State = FilterDropdownTriggerState;
}
