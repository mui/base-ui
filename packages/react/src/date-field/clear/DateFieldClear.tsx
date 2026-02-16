'use client';
import * as React from 'react';
import { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useTemporalFieldRootContext } from '../utils/TemporalFieldRootContext';
import { useButton } from '../../use-button';

/**
 * Clears the field value when clicked.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Date Field](https://base-ui.com/react/components/date-field)
 */
export const DateFieldClear = React.forwardRef(function DateFieldClear(
  componentProps: DateFieldClear.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const {
    // Rendering props
    className,
    render,
    // Component props
    disabled: disabledProp = false,
    // Props forwarded to the DOM element
    ...elementProps
  } = componentProps;

  const store = useTemporalFieldRootContext();
  const propsFromState = store.useState('clearProps');
  const storeDisabled = store.useState('disabled');
  const empty = store.useState('areAllSectionsEmpty');

  const disabled = storeDisabled || disabledProp;

  const { buttonRef, getButtonProps } = useButton({
    disabled,
  });

  const state: DateFieldClear.State = {
    disabled,
    empty,
  };

  return useRenderElement('button', componentProps, {
    state,
    ref: [forwardedRef, buttonRef],
    props: [propsFromState, store.clearEventHandlers, elementProps, getButtonProps],
  });
});

export interface DateFieldClearState {
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
  /**
   * Whether the field value is empty (all sections are empty).
   */
  empty: boolean;
}

export interface DateFieldClearProps extends BaseUIComponentProps<'button', DateFieldClearState> {
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
}

export namespace DateFieldClear {
  export type Props = DateFieldClearProps;
  export type State = DateFieldClearState;
}
