'use client';
import * as React from 'react';
import { useNumberFieldRootContext } from '../root/NumberFieldRootContext';
import type { NumberFieldRoot } from '../root/NumberFieldRoot';
import type { BaseUIComponentProps } from '../../utils/types';
import { stateAttributesMapping } from '../utils/stateAttributesMapping';
import { useRenderElement } from '../../utils/useRenderElement';

/**
 * Groups the input with the increment and decrement buttons.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Number Field](https://base-ui.com/react/components/number-field)
 */
export const NumberFieldGroup = React.forwardRef(function NumberFieldGroup(
  componentProps: NumberFieldGroup.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, ...elementProps } = componentProps;

  const { state } = useNumberFieldRootContext();

  const element = useRenderElement('div', componentProps, {
    ref: forwardedRef,
    state,
    props: [{ role: 'group' }, elementProps],
    stateAttributesMapping,
  });

  return element;
});

export interface NumberFieldGroupState extends NumberFieldRoot.State {}

export interface NumberFieldGroupProps extends BaseUIComponentProps<
  'div',
  NumberFieldGroup.State
> {}

export namespace NumberFieldGroup {
  export type State = NumberFieldGroupState;
  export type Props = NumberFieldGroupProps;
}
