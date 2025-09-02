'use client';
import * as React from 'react';
import { useStore } from '@base-ui-components/utils/store';
import { useComboboxRootContext } from '../root/ComboboxRootContext';
import type { BaseUIComponentProps } from '../../utils/types';
import { useRenderElement } from '../../utils/useRenderElement';
import { selectors } from '../store';
import { useButton } from '../../use-button';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { TransitionStatus, useTransitionStatus } from '../../utils/useTransitionStatus';
import { transitionStatusMapping } from '../../utils/styleHookMapping';
import { CustomStyleHookMapping } from '../../utils/getStyleHookProps';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { createBaseUIEventDetails } from '../../utils/createBaseUIEventDetails';

const customStyleHookMapping: CustomStyleHookMapping<ComboboxClear.State> = transitionStatusMapping;

/**
 * Clears the value when clicked.
 * Renders a `<button>` element.
 */
export const ComboboxClear = React.forwardRef(function ComboboxClear(
  componentProps: ComboboxClear.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const {
    render,
    className,
    disabled: disabledProp = false,
    nativeButton = true,
    keepMounted = false,
    ...elementProps
  } = componentProps;

  const {
    setInputValue,
    setSelectedValue,
    inputRef,
    store,
    selectionMode,
    disabled: comboboxDisabled,
    readOnly,
    clearRef,
    setIndices,
    keyboardActiveRef,
  } = useComboboxRootContext();
  const { disabled: fieldDisabled } = useFieldRootContext();

  const open = useStore(store, selectors.open);
  const selectedValue = useStore(store, selectors.selectedValue);
  const inputValue = useStore(store, selectors.inputValue);

  let visible = false;
  if (selectionMode === 'none') {
    visible = inputValue !== '';
  } else if (selectionMode === 'single') {
    visible = selectedValue != null;
  } else {
    visible = Array.isArray(selectedValue) && selectedValue.length > 0;
  }

  const disabled = fieldDisabled || comboboxDisabled || disabledProp;

  const { buttonRef, getButtonProps } = useButton({
    native: nativeButton,
    disabled,
  });

  const { mounted, transitionStatus, setMounted } = useTransitionStatus(visible);

  const state: ComboboxClear.State = React.useMemo(
    () => ({
      disabled,
      open,
      transitionStatus,
    }),
    [disabled, open, transitionStatus],
  );

  useOpenChangeComplete({
    open: visible,
    ref: clearRef,
    onComplete() {
      if (!visible) {
        setMounted(false);
      }
    },
  });

  const element = useRenderElement('button', componentProps, {
    state,
    enabled: visible,
    ref: [forwardedRef, buttonRef, clearRef],
    props: [
      {
        tabIndex: -1,
        hidden: !mounted,
        children: 'x',
        disabled,
        'aria-readonly': readOnly || undefined,
        onMouseDown(event) {
          if (disabled || readOnly) {
            return;
          }
          event.preventDefault();
        },
        onClick(event) {
          if (disabled || readOnly) {
            return;
          }

          setInputValue('', createBaseUIEventDetails('clear-press', event.nativeEvent));

          if (selectionMode !== 'none') {
            setSelectedValue(
              Array.isArray(selectedValue) ? [] : null,
              createBaseUIEventDetails('clear-press', event.nativeEvent),
            );
            setIndices({
              activeIndex: null,
              selectedIndex: null,
              type: keyboardActiveRef.current ? 'keyboard' : 'pointer',
            });
          } else {
            setIndices({
              activeIndex: null,
              type: keyboardActiveRef.current ? 'keyboard' : 'pointer',
            });
          }

          inputRef.current?.focus();
        },
      },
      elementProps,
      getButtonProps,
    ],
    customStyleHookMapping,
  });

  const shouldRender = keepMounted || mounted;
  if (!shouldRender) {
    return null;
  }

  return element;
});

export namespace ComboboxClear {
  export interface State {
    /**
     * Whether the popup is open.
     */
    open: boolean;
    /**
     * Whether the component should ignore user interaction.
     */
    disabled: boolean;
    transitionStatus: TransitionStatus;
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
    /**
     * Whether the component should remain mounted in the DOM when not visible.
     * @default false
     */
    keepMounted?: boolean;
  }
}
