'use client';
import * as React from 'react';
import { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useComboboxRootContext } from '../root/ComboboxRootContext';
import { useSelector } from '../../utils/store';
import { selectors } from '../store';
import { useEventCallback } from '../../utils/useEventCallback';
import { useModernLayoutEffect } from '../../utils/useModernLayoutEffect';

/**
 * The container for the combobox items when rendered inline, instead of `Popup`.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
export const ComboboxList = React.forwardRef(function ComboboxList(
  componentProps: ComboboxList.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, ...elementProps } = componentProps;

  const { store } = useComboboxRootContext();
  const popupProps = useSelector(store, selectors.popupProps);

  const setPositionerElement = useEventCallback((element) => {
    store.set('positionerElement', element);
  });

  useModernLayoutEffect(() => {
    store.set('inline', true);
    return () => {
      store.set('inline', false);
    };
  }, [store]);

  const element = useRenderElement('div', componentProps, {
    ref: [forwardedRef, setPositionerElement],
    props: [
      popupProps,
      {
        role: 'listbox',
      },
      elementProps,
    ],
  });

  return element;
});

export namespace ComboboxList {
  export interface State {}

  export interface Props extends BaseUIComponentProps<'div', State> {}
}
