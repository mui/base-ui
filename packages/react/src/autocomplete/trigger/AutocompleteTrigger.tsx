'use client';
import type * as React from 'react';
import { ComboboxTrigger } from '../../combobox/trigger/ComboboxTrigger';
import type { FieldRootState } from '../../field/root/FieldRoot';
import type { Side } from '../../utils/useAnchorPositioning';
import type { NativeButtonComponentProps } from '../../internals/types';

/**
 * A button that opens the popup.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Autocomplete](https://base-ui.com/react/components/autocomplete)
 */
export const AutocompleteTrigger = ComboboxTrigger as AutocompleteTrigger;

export interface AutocompleteTriggerState extends FieldRootState {
  /**
   * Whether the popup is open.
   */
  open: boolean;
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
  /**
   * Indicates which side the corresponding popup is positioned relative to its anchor.
   */
  popupSide: Side | null;
  /**
   * Present when the corresponding items list is empty.
   */
  listEmpty: boolean;
}

export type AutocompleteTriggerProps<
  TNativeButton extends boolean = true,
  TElement extends React.ElementType = 'button',
> = Omit<
  NativeButtonComponentProps<TNativeButton, TElement, AutocompleteTrigger.State>,
  'disabled'
> & {
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
};

export interface AutocompleteTrigger {
  <TElement extends React.ElementType = 'button'>(
    componentProps: AutocompleteTrigger.Props<true, TElement> &
      React.RefAttributes<HTMLButtonElement>,
  ): React.JSX.Element;
  <TElement extends React.ElementType = 'button'>(
    componentProps: AutocompleteTrigger.Props<false, TElement> & {
      nativeButton: false;
    } & React.RefAttributes<HTMLElement>,
  ): React.JSX.Element;
  <TElement extends React.ElementType = 'button'>(
    componentProps: AutocompleteTrigger.Props<boolean, TElement> & {
      nativeButton: boolean;
    } & React.RefAttributes<HTMLElement>,
  ): React.JSX.Element;
}

export namespace AutocompleteTrigger {
  export type State = AutocompleteTriggerState;
  export type Props<
    TNativeButton extends boolean = true,
    TElement extends React.ElementType = 'button',
  > = AutocompleteTriggerProps<TNativeButton, TElement>;
}
