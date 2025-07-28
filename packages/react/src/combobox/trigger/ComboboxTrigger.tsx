'use client';
import * as React from 'react';
import { useSelector } from '@base-ui-components/utils/store';
import { useEventCallback } from '@base-ui-components/utils/useEventCallback';
import { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useButton } from '../../use-button';
import { useComboboxRootContext } from '../root/ComboboxRootContext';
import { selectors } from '../store';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { triggerOpenStateMapping } from '../../utils/popupStateMapping';

/**
 * A button that opens the combobox popup.
 * Renders a `<button>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
export const ComboboxTrigger = React.forwardRef(function ComboboxTrigger(
  componentProps: ComboboxTrigger.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const {
    render,
    className,
    nativeButton = true,
    disabled: disabledProp = false,
    ...elementProps
  } = componentProps;

  const { disabled: fieldDisabled } = useFieldRootContext();
  const {
    store,
    setOpen,
    disabled: comboboxDisabled,
    readOnly,
    inputRef,
  } = useComboboxRootContext();

  const open = useSelector(store, selectors.open);
  const anchorElement = useSelector(store, selectors.anchorElement);
  const listElement = useSelector(store, selectors.listElement);

  const disabled = fieldDisabled || comboboxDisabled || disabledProp;

  const { buttonRef, getButtonProps } = useButton({
    native: nativeButton,
    disabled,
    focusableWhenDisabled: true,
  });

  const state: ComboboxTrigger.State = React.useMemo(
    () => ({
      open,
      disabled,
    }),
    [open, disabled],
  );

  const setTriggerElement = useEventCallback((element) => {
    store.set('triggerElement', element);
  });

  const element = useRenderElement('button', componentProps, {
    ref: [forwardedRef, buttonRef, setTriggerElement],
    state,
    props: [
      {
        'aria-expanded': open,
        'aria-haspopup': 'dialog',
        'aria-controls': open ? listElement?.id : undefined,
        disabled,
        'aria-readonly': readOnly || undefined,
        onMouseDown(event) {
          if (disabled || readOnly) {
            return;
          }

          if (anchorElement !== null) {
            event.preventDefault();
          }
        },
        onClick(event) {
          if (disabled || readOnly) {
            return;
          }
          setOpen(!open, event.nativeEvent, undefined);
          inputRef.current?.focus();
        },
      },
      elementProps,
      getButtonProps,
    ],
    customStyleHookMapping: triggerOpenStateMapping,
  });

  return element;
});

export namespace ComboboxTrigger {
  export interface State {
    /**
     * Whether the combobox popup is open.
     */
    open: boolean;
    /**
     * Whether the component should ignore user interaction.
     */
    disabled: boolean;
  }

  export interface Props extends BaseUIComponentProps<'button', State> {
    /**
     * Whether the component renders a native `<button>` element when replacing it
     * via the `render` prop.
     * Set to `false` if the rendered element is not a button (e.g. `<div>`).
     * @default true
     */
    nativeButton?: boolean;
    /**
     * Whether the component should ignore user interaction.
     * @default false
     */
    disabled?: boolean;
  }
}
