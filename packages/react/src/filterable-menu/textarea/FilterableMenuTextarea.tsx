'use client';
import * as React from 'react';
import { useStore } from '@base-ui-components/utils/store';
import { useEventCallback } from '@base-ui-components/utils/useEventCallback';
import { useRenderElement } from '../../utils/useRenderElement';
import type { BaseUIComponentProps } from '../../utils/types';
import { selectors } from '../../combobox/store';
import { stopEvent } from '../../floating-ui-react/utils';
import { useComboboxRootContext } from '../../combobox/root/ComboboxRootContext';
import { useComboboxPositionerContext } from '../../combobox/positioner/ComboboxPositionerContext';

/**
 * A textarea that can be used as the input surface for FilterableMenu.
 * Renders a `<textarea>` element.
 */
export const FilterableMenuTextarea = React.forwardRef(function FilterableMenuTextarea(
  componentProps: FilterableMenuTextarea.Props,
  forwardedRef: React.ForwardedRef<HTMLTextAreaElement>,
) {
  const { render, className, ...elementProps } = componentProps;

  const { store, keyboardActiveRef, fieldControlValidation, handleEnterSelection } =
    useComboboxRootContext();

  const hasPositionerParent = Boolean(useComboboxPositionerContext(true));

  const inputProps = useStore(store, selectors.inputProps);

  const setAnchorElement = useEventCallback((element: Element | null) => {
    // When not inside a Positioner, the reference anchor is this textarea
    if (hasPositionerParent) {
      return;
    }
    store.set('anchorElement', element);
  });

  const setInputElement = useEventCallback((element: Element | null) => {
    store.set('inputElement', element);
  });

  const element = useRenderElement('textarea', componentProps, {
    ref: [forwardedRef, setAnchorElement, setInputElement],
    props: [
      inputProps,
      {
        onChange: elementProps.onChange,
        onKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
          keyboardActiveRef.current = true;

          if (event.key === 'Enter') {
            // Select highlighted item when pressing Enter
            stopEvent(event);
            handleEnterSelection(event.nativeEvent);
          }
        },
        onPointerMove() {
          keyboardActiveRef.current = false;
        },
        onPointerDown() {
          keyboardActiveRef.current = false;
        },
      },
      fieldControlValidation.getValidationProps(elementProps),
    ],
  });

  return element;
});

export namespace FilterableMenuTextarea {
  export interface Props extends BaseUIComponentProps<'textarea', {}> {}
}
