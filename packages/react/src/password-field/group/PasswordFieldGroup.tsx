'use client';
import * as React from 'react';
import { useRenderElement } from '../../internals/useRenderElement';
import type { BaseUIComponentProps } from '../../internals/types';
import type { PasswordFieldRoot } from '../root/PasswordFieldRoot';
import { usePasswordFieldRootContext } from '../root/PasswordFieldRootContext';
import { passwordFieldStateAttributesMapping } from '../root/stateAttributesMapping';

/**
 * Groups the password input and its visibility toggle.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Password Field](https://base-ui.com/react/components/password-field)
 */
export const PasswordFieldGroup = React.forwardRef(function PasswordFieldGroup(
  componentProps: PasswordFieldGroup.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, style, ...elementProps } = componentProps;

  const { state } = usePasswordFieldRootContext();

  return useRenderElement('div', componentProps, {
    ref: forwardedRef,
    state,
    props: elementProps,
    stateAttributesMapping: passwordFieldStateAttributesMapping,
  });
});

export interface PasswordFieldGroupState extends PasswordFieldRoot.State {}

export interface PasswordFieldGroupProps extends BaseUIComponentProps<
  'div',
  PasswordFieldGroupState
> {}

export namespace PasswordFieldGroup {
  export type State = PasswordFieldGroupState;
  export type Props = PasswordFieldGroupProps;
}
