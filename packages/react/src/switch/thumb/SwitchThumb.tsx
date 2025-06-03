'use client';
import * as React from 'react';
import type { SwitchRoot } from '../root/SwitchRoot';
import { useSwitchRootContext } from '../root/SwitchRootContext';
import { useRenderElement } from '../../utils/useRenderElement';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import type { BaseUIComponentProps } from '../../utils/types';
import { styleHookMapping } from '../styleHooks';

/**
 * The movable part of the switch that indicates whether the switch is on or off.
 * Renders a `<span>`.
 *
 * Documentation: [Base UI Switch](https://base-ui.com/react/components/switch)
 */
export const SwitchThumb = React.forwardRef(function SwitchThumb(
  componentProps: SwitchThumb.Props,
  forwardedRef: React.ForwardedRef<HTMLSpanElement>,
) {
  const { render, className, ...elementProps } = componentProps;

  const { state: fieldState } = useFieldRootContext();

  const state = useSwitchRootContext();
  const extendedState = { ...fieldState, ...state };

  return useRenderElement('span', componentProps, {
    state: extendedState,
    ref: forwardedRef,
    customStyleHookMapping: styleHookMapping,
    props: elementProps,
  });
});

export namespace SwitchThumb {
  export interface Props extends BaseUIComponentProps<'span', State> {}

  export interface State extends SwitchRoot.State {}
}
