'use client';
import * as React from 'react';
import { useRenderElement } from '../../internals/useRenderElement';
import { useLabel } from '../../internals/labelable-provider/useLabel';
import { resolveRenderedId } from '../../internals/resolveRenderedId';
import type { BaseUIComponentProps } from '../../internals/types';
import type { PasswordFieldRoot } from '../root/PasswordFieldRoot';
import { usePasswordFieldRootContext } from '../root/PasswordFieldRootContext';
import { passwordFieldStateAttributesMapping } from '../root/stateAttributesMapping';

/**
 * An accessible label that is automatically associated with the password input.
 * Renders a `<label>` element.
 *
 * Documentation: [Base UI Password Field](https://base-ui.com/react/components/password-field)
 */
export const PasswordFieldLabel = React.forwardRef(function PasswordFieldLabel(
  componentProps: PasswordFieldLabel.Props,
  forwardedRef: React.ForwardedRef<HTMLLabelElement>,
) {
  const { render, className, style, id: idProp, ...elementProps } = componentProps;

  const { state, inputId } = usePasswordFieldRootContext();

  // Inside a Field, the label id is registered so the input's `aria-labelledby` points at it, so
  // an id on the render element, which is the one rendered, is the one registered.
  const labelProps = useLabel({ id: resolveRenderedId(componentProps, idProp), native: true });

  return useRenderElement('label', componentProps, {
    ref: forwardedRef,
    state,
    // `htmlFor` follows the id the input renders with, including one set on its render element.
    props: [labelProps, elementProps, { htmlFor: inputId }],
    stateAttributesMapping: passwordFieldStateAttributesMapping,
  });
});

export interface PasswordFieldLabelState extends PasswordFieldRoot.State {}

export interface PasswordFieldLabelProps extends Omit<
  BaseUIComponentProps<'label', PasswordFieldLabelState>,
  'htmlFor'
> {}

export namespace PasswordFieldLabel {
  export type State = PasswordFieldLabelState;
  export type Props = PasswordFieldLabelProps;
}
