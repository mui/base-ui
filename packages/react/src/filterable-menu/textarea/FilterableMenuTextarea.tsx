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

  const {
    store,
    keyboardActiveRef,
    fieldControlValidation,
    handleEnterSelection,
    setOpen,
    setIndices,
  } = useComboboxRootContext();

  const hasPositionerParent = Boolean(useComboboxPositionerContext(true));

  const inputProps = useStore(store, selectors.inputProps);
  const open = useStore(store, selectors.open);

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
        onChange() {
          if (open && store.state.activeIndex !== null) {
            setIndices({
              activeIndex: null,
              type: keyboardActiveRef.current ? 'pointer' : 'keyboard',
            });
          }
        },
        onKeyDown(event) {
          keyboardActiveRef.current = true;

          // If the menu is open, Enter should select the highlighted item.
          // If nothing is highlighted, close the menu and allow newline.
          if (event.key === 'Enter' && open) {
            stopEvent(event);

            if (store.state.activeIndex === null) {
              setOpen(false, event.nativeEvent, undefined);
              return;
            }

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
