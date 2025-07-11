'use client';
import * as React from 'react';
import { useSelector } from '@base-ui-components/utils/store';
import { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { selectors } from '../store';
import { useComboboxRootContext } from '../root/ComboboxRootContext';

/**
 * Displays a status message for the combobox with screen reader support.
 * Renders a `<div>` element.
 * This component must not be conditionally rendered — conditionally render the
 * children instead.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
export const ComboboxStatus = React.forwardRef(function ComboboxStatus(
  componentProps: ComboboxStatus.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, ...elementProps } = componentProps;

  const { store } = useComboboxRootContext();
  const open = useSelector(store, selectors.open);

  return useRenderElement('div', componentProps, {
    enabled: open,
    ref: forwardedRef,
    props: [
      {
        role: 'status',
        'aria-live': 'polite',
        'aria-atomic': true,
      },
      elementProps,
    ],
  });
});

export namespace ComboboxStatus {
  export interface State {}

  export interface Props extends BaseUIComponentProps<'div', State> {}
}
