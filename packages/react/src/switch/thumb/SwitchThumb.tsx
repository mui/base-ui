'use client';
import * as React from 'react';
import type { SwitchRoot } from '../root/SwitchRoot';
import { useSwitchRootContext } from '../root/SwitchRootContext';
import { useComponentRenderer } from '../../utils/useComponentRenderer';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import type { BaseUIComponentProps } from '../../utils/types';
import { stateAttributesMapping } from '../stateAttributesMapping';

/**
 * The movable part of the switch that indicates whether the switch is on or off.
 * Renders a `<span>`.
 *
 * Documentation: [Base UI Switch](https://base-ui.com/react/components/switch)
 */
export const SwitchThumb = React.forwardRef(function SwitchThumb(
  props: SwitchThumb.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { render, className, ...other } = props;

  const { state: fieldState } = useFieldRootContext();

  const state = useSwitchRootContext();
  const extendedState = { ...fieldState, ...state };

  const { renderElement } = useComponentRenderer({
    render: render || 'span',
    className,
    state: extendedState,
    extraProps: other,
    stateAttributesMapping: stateAttributesMapping,
    ref: forwardedRef,
  });

  return renderElement();
});

export namespace SwitchThumb {
  export interface Props extends BaseUIComponentProps<'span', State> {}

  export interface State extends SwitchRoot.State {}
}
