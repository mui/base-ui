'use client';
import * as React from 'react';
import { FloatingFocusManager } from '@floating-ui/react';
import { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useComboboxFloatingContext, useComboboxRootContext } from '../root/ComboboxRootContext';
import { useSelector } from '../../utils/store';
import { selectors } from '../store';

/**
 * A container for the combobox items.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
export const ComboboxPopup = React.forwardRef(function ComboboxPopup(
  componentProps: ComboboxPopup.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, ...elementProps } = componentProps;

  const { store, popupRef, keyboardActiveRef } = useComboboxRootContext();
  const floatingRootContext = useComboboxFloatingContext();
  const popupProps = useSelector(store, selectors.popupProps);

  const element = useRenderElement('div', componentProps, {
    ref: [forwardedRef, popupRef],
    props: [
      popupProps,
      {
        onKeyDownCapture() {
          keyboardActiveRef.current = true;
        },
        onPointerMoveCapture() {
          keyboardActiveRef.current = false;
        },
      },
      elementProps,
    ],
  });

  return (
    <FloatingFocusManager context={floatingRootContext} initialFocus={-1} returnFocus={false}>
      {element}
    </FloatingFocusManager>
  );
});

export namespace ComboboxPopup {
  export interface State {}

  export interface Props extends BaseUIComponentProps<'div', State> {}
}
