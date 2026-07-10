'use client';
import * as React from 'react';
import type { PasswordFieldRoot } from './PasswordFieldRoot';

export interface PasswordFieldRootContext {
  /**
   * Whether the password is currently revealed as plain text.
   */
  visible: boolean;
  /**
   * Updates the visibility, running `onVisibleChange` and respecting cancelation.
   */
  setVisible: (visible: boolean, eventDetails: PasswordFieldRoot.ChangeEventDetails) => void;
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

export const PasswordFieldRootContext = React.createContext<PasswordFieldRootContext | undefined>(
  undefined,
);

export function usePasswordFieldRootContext() {
  const context = React.useContext(PasswordFieldRootContext);

  if (context === undefined) {
    throw new Error(
      'Base UI: PasswordFieldRootContext is missing. PasswordField parts must be placed within <PasswordField.Root>.',
    );
  }

  return context;
}
