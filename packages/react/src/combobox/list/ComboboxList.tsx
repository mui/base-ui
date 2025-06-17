'use client';
import * as React from 'react';
import { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useComboboxFloatingContext, useComboboxRootContext } from '../root/ComboboxRootContext';
import { useEventCallback } from '../../utils/useEventCallback';
import { useModernLayoutEffect } from '../../utils/useModernLayoutEffect';
import { useComboboxPositionerContext } from '../positioner/ComboboxPositionerContext';

/**
 * The container for the combobox items.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
export const ComboboxList = React.forwardRef(function ComboboxList(
  componentProps: ComboboxList.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, ...elementProps } = componentProps;

  const { store, multiple } = useComboboxRootContext();
  const hasPositionerContext = Boolean(useComboboxPositionerContext(true));
  const floatingRootContext = useComboboxFloatingContext();

  const setPositionerElement = useEventCallback((element) => {
    store.set('positionerElement', element);
  });

  const setListElement = useEventCallback((element) => {
    store.set('listElement', element);
  });

  useModernLayoutEffect(() => {
    if (hasPositionerContext) {
      return undefined;
    }

    store.set('inline', true);
    return () => {
      store.set('inline', false);
    };
  }, [hasPositionerContext, store]);

  return useRenderElement('div', componentProps, {
    ref: [forwardedRef, setListElement, hasPositionerContext ? null : setPositionerElement],
    props: [
      {
        id: floatingRootContext.floatingId,
        role: 'listbox',
        'aria-multiselectable': multiple ? 'true' : undefined,
      },
      elementProps,
    ],
  });
});

export namespace ComboboxList {
  export interface State {}

  export interface Props extends BaseUIComponentProps<'div', State> {}
}
