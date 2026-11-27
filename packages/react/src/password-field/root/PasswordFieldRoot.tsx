'use client';
import * as React from 'react';
import { useControlled } from '@base-ui/utils/useControlled';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useBaseUiId } from '../../internals/useBaseUiId';
import { NOOP } from '../../internals/noop';
import { useFieldRootContext } from '../../internals/field-root-context/FieldRootContext';
import { useFieldsetRootContext } from '../../fieldset/root/FieldsetRootContext';
import { useLabelableContext } from '../../internals/labelable-provider/LabelableContext';
import type { BaseUIChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import type { REASONS } from '../../internals/reasons';
import type { FieldRootState } from '../../field/root/FieldRoot';
import { PasswordFieldRootContext } from './PasswordFieldRootContext';

/**
 * Provides the password visibility and the input's id to the other parts.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Password Field](https://base-ui.com/react/components/password-field)
 */
export function PasswordFieldRoot(props: PasswordFieldRoot.Props) {
  const {
    id: idProp,
    revealed: revealedProp,
    defaultRevealed = false,
    onRevealedChange,
    disabled: disabledProp = false,
    children,
  } = props;

  // A native `<fieldset disabled>` doesn't disable a non-native toggle, so the Fieldset's state is
  // read directly, as `Field.Root` does, for a field that isn't wrapped in one.
  const disabledFieldset = useFieldsetRootContext(true)?.disabled;
  const { disabled: fieldDisabled, state: fieldState } = useFieldRootContext();
  const disabled = disabledFieldset || fieldDisabled || disabledProp;

  // `Field.Control` resolves its id as `controlId ?? id`. Inside a Field, an input without an
  // explicit id takes the Field's id, so only a standalone input needs a generated one.
  const { controlId, registerControlId } = useLabelableContext();
  const defaultId = useBaseUiId();
  const inputIdProp = idProp ?? (registerControlId === NOOP ? defaultId : undefined);
  // An id on the input's render element wins, so the Input publishes it once mounted.
  const [renderedInputId, setRenderedInputId] = React.useState<string | undefined>(undefined);
  const inputId = (renderedInputId ?? controlId ?? inputIdProp) || undefined;

  const [revealed, setRevealedState] = useControlled({
    controlled: revealedProp,
    default: defaultRevealed,
    name: 'PasswordField',
    state: 'revealed',
  });
  const [initialRevealed] = React.useState(revealed);

  const setRevealed = useStableCallback(
    (nextRevealed: boolean, eventDetails: PasswordFieldRoot.ChangeEventDetails) => {
      if (nextRevealed === revealed) {
        return;
      }

      onRevealedChange?.(nextRevealed, eventDetails);

      if (eventDetails.isCanceled) {
        return;
      }

      setRevealedState(nextRevealed);
    },
  );

  const inputRef = React.useRef<HTMLInputElement>(null);

  const state: PasswordFieldRoot.State = React.useMemo(
    () => ({ ...fieldState, disabled, revealed }),
    [fieldState, disabled, revealed],
  );

  const contextValue: PasswordFieldRootContext = React.useMemo(
    () => ({
      state,
      setRevealed,
      initialRevealed,
      inputId,
      inputIdProp,
      setRenderedInputId,
      inputRef,
    }),
    [state, setRevealed, initialRevealed, inputId, inputIdProp],
  );

  return (
    <PasswordFieldRootContext.Provider value={contextValue}>
      {children}
    </PasswordFieldRootContext.Provider>
  );
}

export interface PasswordFieldRootState extends FieldRootState {
  /**
   * Whether the password is currently revealed as plain text.
   */
  revealed: boolean;
}

export interface PasswordFieldRootProps {
  /**
   * The id of the input element.
   */
  id?: string | undefined;
  /**
   * Whether the password is currently revealed as plain text.
   *
   * To render an uncontrolled password field, use the `defaultRevealed` prop instead.
   */
  revealed?: boolean | undefined;
  /**
   * Whether the password is initially revealed as plain text.
   *
   * To render a controlled password field, use the `revealed` prop instead.
   * @default false
   */
  defaultRevealed?: boolean | undefined;
  /**
   * Callback fired when the password visibility changes.
   * Besides the toggle, resetting the owning form restores the initial visibility.
   * Cancel `'form-reset'` to prevent it.
   */
  onRevealedChange?:
    ((revealed: boolean, eventDetails: PasswordFieldRoot.ChangeEventDetails) => void) | undefined;
  /**
   * Whether the component should ignore user interaction.
   * Applies to both the input and the toggle.
   * @default false
   */
  disabled?: boolean | undefined;
  /**
   * The parts of the password field.
   */
  children?: React.ReactNode;
}

export type PasswordFieldRootChangeEventReason = typeof REASONS.none | typeof REASONS.formReset;
export type PasswordFieldRootChangeEventDetails =
  BaseUIChangeEventDetails<PasswordFieldRoot.ChangeEventReason>;

export namespace PasswordFieldRoot {
  export type State = PasswordFieldRootState;
  export type Props = PasswordFieldRootProps;
  export type ChangeEventReason = PasswordFieldRootChangeEventReason;
  export type ChangeEventDetails = PasswordFieldRootChangeEventDetails;
}
