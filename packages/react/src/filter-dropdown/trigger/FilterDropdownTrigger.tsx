'use client';
import * as React from 'react';
import { NOOP } from '@base-ui/utils/empty';
import type { BaseUIComponentProps, NativeButtonProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { pressableTriggerOpenStateMapping } from '../../utils/popupStateMapping';
import { useFilterDropdownRootContext } from '../root/FilterDropdownRootContext';
import { useRenderedId } from '../../internals/useRenderedId';

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
    popupState,
    ...elementProps
  } = componentProps;

  const context = useFilterDropdownRootContext(popupState !== undefined);
  const setTriggerId = context?.setTriggerId;
  const renderedIdRef = useRenderedId(
    setTriggerId ?? NOOP,
    context?.defaultTriggerId,
    idProp != null,
  );

  const id = idProp ?? context?.defaultTriggerId;
  const open = popupState?.open ?? context?.open ?? false;
  const popupId = popupState?.popupId ?? context?.popupId;

  const state: FilterDropdownTriggerState = {
    disabled,
    open,
  };

  return useRenderElement('button', componentProps, {
    state,
    ref: [forwardedRef, context?.setTriggerElement, renderedIdRef],
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
    id?: string | undefined;
    /**
     * Trigger-scoped popup state from the host, which knows which trigger opened the popup.
     */
    popupState?: { open: boolean; popupId: string | undefined } | undefined;
  };

export namespace FilterDropdownTrigger {
  export type Props = FilterDropdownTriggerProps;
  export type State = FilterDropdownTriggerState;
}
