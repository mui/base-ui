'use client';
import type * as React from 'react';
import { ComboboxClear } from '../../combobox/clear/ComboboxClear';
import type { BaseUIComponentProps, NativeButtonProps } from '../../utils/types';
import type { TransitionStatus } from '../../utils/useTransitionStatus';

/**
 * Clears the value when clicked.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Autocomplete](https://base-ui.com/react/components/autocomplete)
 */
export const AutocompleteClear = ComboboxClear as AutocompleteClear;

export interface AutocompleteClearState {
  /**
   * Whether the popup is open.
   */
  open: boolean;
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
  /**
   * The transition status of the component.
   */
  transitionStatus: TransitionStatus;
}

export interface AutocompleteClearProps
  extends NativeButtonProps, BaseUIComponentProps<'button', AutocompleteClearState> {
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * Whether the component should remain mounted in the DOM when not visible.
   * @default false
   */
  keepMounted?: boolean | undefined;
}

export interface AutocompleteClear {
  (
    componentProps: AutocompleteClearProps & React.RefAttributes<HTMLButtonElement>,
  ): React.JSX.Element | null;
}

export namespace AutocompleteClear {
  export type State = AutocompleteClearState;
  export type Props = AutocompleteClearProps;
}
