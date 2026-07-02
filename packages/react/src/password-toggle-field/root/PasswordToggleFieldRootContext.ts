'use client';
import * as React from 'react';
import type { PasswordToggleFieldRoot } from './PasswordToggleFieldRoot';

export interface PasswordToggleFieldRootContext {
  /**
   * Whether the password is currently revealed as plain text.
   */
  visible: boolean;
  /**
   * Updates the visibility, running `onVisibleChange` and respecting cancelation.
   */
  setVisible: (visible: boolean, eventDetails: PasswordToggleFieldRoot.ChangeEventDetails) => void;
  /**
   * Whether the field should ignore user interaction.
   */
  disabled: boolean;
  /**
   * Ref to the password input element.
   */
  inputRef: React.RefObject<HTMLInputElement | null>;
  /**
   * The resolved id of the input, used by the toggle's `aria-controls`.
   */
  inputId: string | undefined;
  /**
   * Reports the input's id so the toggle can reference it.
   */
  setInputId: (id: string | undefined) => void;
}

export const PasswordToggleFieldRootContext = React.createContext<
  PasswordToggleFieldRootContext | undefined
>(undefined);

export function usePasswordToggleFieldRootContext() {
  const context = React.useContext(PasswordToggleFieldRootContext);

  if (context === undefined) {
    throw new Error(
      'Base UI: PasswordToggleFieldRootContext is missing. PasswordToggleField parts must be placed within <PasswordToggleField.Root>.',
    );
  }

  return context;
}
