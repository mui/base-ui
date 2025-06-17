'use client';
import * as React from 'react';
import { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useComboboxRootContext } from '../root/ComboboxRootContext';
import { useSelector } from '../../utils/store';
import { selectors } from '../store';
import { useEventCallback } from '../../utils/useEventCallback';
import { triggerOpenStateMapping } from '../../utils/popupStateMapping';
import { useModernLayoutEffect } from '../../utils/useModernLayoutEffect';

/**
 * A text input to search for items in the list.
 * Renders an `<input>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
export const ComboboxInput = React.forwardRef(function ComboboxInput(
  componentProps: ComboboxInput.Props,
  forwardedRef: React.ForwardedRef<HTMLInputElement>,
) {
  const { render, className, ...elementProps } = componentProps;

  const { store, setValue, valuesRef, setOpen, keyboardActiveRef, onItemHighlighted, multiple } =
    useComboboxRootContext();

  const triggerProps = useSelector(store, selectors.triggerProps);
  const open = useSelector(store, selectors.open);
  const activeIndex = useSelector(store, selectors.activeIndex);
  const value = useSelector(store, selectors.value);

  const setTriggerElement = useEventCallback((element) => {
    store.set('triggerElement', element);
  });

  const state: ComboboxInput.State = React.useMemo(
    () => ({
      open,
    }),
    [open],
  );

  const [inputValue, setInputValue] = React.useState(value);

  useModernLayoutEffect(() => {
    setInputValue(value);
  }, [value]);

  const element = useRenderElement('input', componentProps, {
    state,
    ref: [forwardedRef, setTriggerElement],
    props: [
      triggerProps,
      {
        value: inputValue,
        onChange(event) {
          setInputValue(event.target.value);
          store.set('activeIndex', null);
          if (activeIndex !== null) {
            onItemHighlighted(undefined, keyboardActiveRef.current ? 'keyboard' : 'pointer');
          }
        },
        onKeyDown(event) {
          keyboardActiveRef.current = true;

          // Printable characters
          if (
            event.key === 'Backspace' ||
            (event.key.length === 1 &&
              !event.ctrlKey &&
              !event.metaKey &&
              !event.altKey &&
              !event.shiftKey)
          ) {
            setOpen(true, event.nativeEvent, undefined);
            store.set('activeIndex', null);
            if (activeIndex !== null) {
              onItemHighlighted(undefined, keyboardActiveRef.current ? 'keyboard' : 'pointer');
            }
          }

          if (activeIndex === null) {
            return;
          }

          if (event.key === 'Enter') {
            event.preventDefault();
            setValue(valuesRef.current[activeIndex], event.nativeEvent, 'item-press');
            if (!multiple) {
              setOpen(false, event.nativeEvent, 'item-press');
            }
          }
        },
        onPointerMove() {
          keyboardActiveRef.current = false;
        },
        onPointerDown() {
          keyboardActiveRef.current = false;
        },
      },
      elementProps,
    ],
    customStyleHookMapping: triggerOpenStateMapping,
  });

  return element;
});

export namespace ComboboxInput {
  export interface State {
    /**
     * Whether the combobox popup is open.
     */
    open: boolean;
  }

  export interface Props extends BaseUIComponentProps<'input', State> {}
}
