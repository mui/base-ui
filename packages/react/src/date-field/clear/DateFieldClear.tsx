'use client';
import * as React from 'react';
import { BaseUIComponentProps, NativeButtonProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useDateFieldRootContext } from '../root/DateFieldRootContext';
import { useButton } from '../../use-button';

/**
 * Clears the field value when clicked.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Date Field](https://base-ui.com/react/components/unstable-date-field)
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
    nativeButton = true,
    // Props forwarded to the DOM element
    ...elementProps
  } = componentProps;

  const store = useDateFieldRootContext();
  const { props, state } = store.useState('clearPropsAndState', disabledProp);

  const { buttonRef, getButtonProps } = useButton({
    disabled: state.disabled,
    native: nativeButton,
  });

  return useRenderElement('button', componentProps, {
    state,
    ref: [forwardedRef, buttonRef],
    props: [props, store.clearEventHandlers, elementProps, getButtonProps],
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

export interface DateFieldClearProps
  extends BaseUIComponentProps<'button', DateFieldClearState>, NativeButtonProps {
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
