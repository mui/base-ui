'use client';
import * as React from 'react';
import type { PasswordFieldRoot } from './PasswordFieldRoot';

export interface PasswordFieldRootContext {
  /**
   * The Root's state, the single source of truth for the visibility, the disabled state and the
   * Field state that every part reads.
   */
  state: PasswordFieldRoot.State;
  /**
   * Updates the visibility, running `onRevealedChange` and respecting cancelation.
   */
  setRevealed: (revealed: boolean, eventDetails: PasswordFieldRoot.ChangeEventDetails) => void;
  /**
   * Whether the input is masked while its form submits, regardless of `revealed`.
   */
  maskedForSubmit: boolean;
  /**
   * The id the input renders with, used by the toggle's `aria-controls`.
   */
  inputId: string | undefined;
  /**
   * The id to pass to the input's `Field.Control`, which resolves it against a surrounding Field.
   */
  inputIdProp: string | undefined;
  /**
   * Publishes an id set on the input's render element, so `inputId` follows it.
   */
  setRenderedInputId: (id: string | undefined) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
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
