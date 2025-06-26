'use client';
import * as React from 'react';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useComboboxFloatingContext, useComboboxRootContext } from '../root/ComboboxRootContext';
import { useEventCallback } from '../../utils/useEventCallback';
import { useModernLayoutEffect } from '../../utils/useModernLayoutEffect';
import { useComboboxPositionerContext } from '../positioner/ComboboxPositionerContext';
import { useSelector } from '../../utils/store';
import { selectors } from '../store';

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

  const { store, select, keyboardActiveRef, cols } = useComboboxRootContext();
  const multiple = select === 'multiple';
  const hasPositionerContext = Boolean(useComboboxPositionerContext(true));
  const floatingRootContext = useComboboxFloatingContext();

  const popupProps = useSelector(store, selectors.popupProps);

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
      popupProps,
      {
        tabIndex: -1,
        id: floatingRootContext.floatingId,
        role: cols > 1 ? 'grid' : 'listbox',
        'aria-multiselectable': multiple ? 'true' : undefined,
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
});

export namespace ComboboxList {
  export interface State {}

  export interface Props extends BaseUIComponentProps<'div', State> {}
}
