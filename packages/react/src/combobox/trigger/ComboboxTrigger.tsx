'use client';
import * as React from 'react';
import { useStore } from '@base-ui-components/utils/store';
import { useEventCallback } from '@base-ui-components/utils/useEventCallback';
import { useTimeout } from '@base-ui-components/utils/useTimeout';
import { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { useButton } from '../../use-button';
import { useComboboxRootContext } from '../root/ComboboxRootContext';
import { selectors } from '../store';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { triggerOpenStateMapping } from '../../utils/popupStateMapping';
import { stopEvent } from '../../floating-ui-react/utils';

/**
 * A button that opens the popup.
 * Renders a `<button>` element.
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
    forceMount,
  } = useComboboxRootContext();

  const open = useStore(store, selectors.open);
  const anchorElement = useStore(store, selectors.anchorElement);
  const listElement = useStore(store, selectors.listElement);
  const triggerProps = useStore(store, selectors.triggerProps);
  const typeaheadTriggerProps = useStore(store, selectors.typeaheadTriggerProps);

  const disabled = fieldDisabled || comboboxDisabled || disabledProp;

  const focusTimeout = useTimeout();

  const currentPointerTypeRef = React.useRef<PointerEvent['pointerType']>('');

  const trackPointerType = useEventCallback((event: React.PointerEvent) => {
    currentPointerTypeRef.current = event.pointerType;
  });

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
      triggerProps,
      typeaheadTriggerProps,
      {
        disabled,
        'aria-expanded': open,
        'aria-haspopup': 'dialog',
        'aria-controls': open ? listElement?.id : undefined,
        'aria-readonly': readOnly || undefined,
        onPointerDown: trackPointerType,
        onPointerEnter: trackPointerType,
        onMouseDown(event) {
          if (disabled || readOnly) {
            return;
          }

          // Ensure items are registered for initial selection highlight.
          forceMount();

          if (anchorElement !== null) {
            event.preventDefault();
          }
        },
        onClick(event) {
          if (disabled || readOnly) {
            return;
          }

          setOpen(!open, event.nativeEvent, undefined);

          if (currentPointerTypeRef.current !== 'touch') {
            inputRef.current?.focus();
          }
        },
        onKeyDown(event) {
          if (disabled || readOnly) {
            return;
          }

          if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            stopEvent(event);
            setOpen(true, event.nativeEvent, undefined);
            inputRef.current?.focus();
          }
        },
        onFocus() {
          if (disabled || readOnly) {
            return;
          }

          focusTimeout.start(0, forceMount);
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
