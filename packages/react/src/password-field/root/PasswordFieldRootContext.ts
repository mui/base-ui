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
   * The id the input renders with, used by the toggle's `aria-controls`.
   */
  inputId: string | undefined;
  /**
   * The id to pass to the input's `Field.Control`, which resolves it against a surrounding Field.
   */
  inputIdProp: string | undefined;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

export const PasswordFieldRootContext = React.createContext<PasswordFieldRootContext | undefined>(
  undefined,
);

export function usePasswordFieldRootContext() {
  const context = React.useContext(PasswordFieldRootContext);

  if (context === undefined) {
    throw new Error(
      'Base UI: PasswordFieldRootContext is missing, so the part cannot read or change the password visibility. ' +
        'PasswordField parts must be placed within <PasswordField.Root>.',
    );
  }

  return context;
}
