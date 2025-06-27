'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { useRenderElement } from '../../utils/useRenderElement';
import { BaseUIComponentProps } from '../../utils/types';
import { useComboboxChipsContext } from '../chips/ComboboxChipsContext';
import { useComboboxRootContext } from '../root/ComboboxRootContext';
import { useCompositeListItem } from '../../composite/list/useCompositeListItem';
import { ComboboxChipContext } from './ComboboxChipContext';
import { stopEvent } from '../../floating-ui-react/utils';

/**
 * An individual chip that represents a value in a multiselectable combobox.
 * Renders a `<div>` element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
export const ComboboxChip = React.forwardRef(function ComboboxChip(
  componentProps: ComboboxChip.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, ...elementProps } = componentProps;

  const {
    inputRef,
    selectedValue: value,
    setSelectedValue: setValue,
    setOpen,
    disabled,
    readOnly,
  } = useComboboxRootContext();
  const { setHighlightedChipIndex, chipsRef } = useComboboxChipsContext()!;

  const { ref, index } = useCompositeListItem();

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (disabled) {
      // When disabled, prevent all keyboard interactions
      event.preventDefault();
      return index; // Return current index to keep focus on same chip
    }

    let nextIndex: number | undefined = index;

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      if (index > 0) {
        nextIndex = index - 1;
      } else {
        nextIndex = undefined;
      }
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      if (index < value.length - 1) {
        nextIndex = index + 1;
      } else {
        nextIndex = undefined;
      }
    } else if (event.key === 'Backspace' || event.key === 'Delete') {
      if (readOnly) {
        event.preventDefault();
        return index; // Return current index to keep focus on same chip when readOnly
      }
      stopEvent(event);
      setValue(
        value.filter((_: any, i: number) => i !== index),
        event.nativeEvent,
        undefined,
      );
      const computedNextIndex = index >= value.length - 1 ? value.length - 2 : index;
      nextIndex = computedNextIndex >= 0 ? computedNextIndex : undefined;
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      nextIndex = undefined;
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setOpen(true, event.nativeEvent, undefined);
      nextIndex = undefined;
    } else if (
      // Check for printable characters (letters, numbers, symbols)
      event.key.length === 1 &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey
    ) {
      nextIndex = undefined;
    }

    return nextIndex;
  }

  const state: ComboboxChip.State = React.useMemo(
    () => ({
      disabled,
    }),
    [disabled],
  );

  const element = useRenderElement('div', componentProps, {
    ref: [forwardedRef, ref],
    state,
    props: [
      {
        tabIndex: disabled ? -1 : -1, // Always -1 since chips are not directly focusable
        'aria-disabled': disabled || undefined,
        'aria-readonly': readOnly || undefined,
        onKeyDown(event) {
          const nextIndex = handleKeyDown(event);

          ReactDOM.flushSync(() => {
            setHighlightedChipIndex(nextIndex);
          });

          if (nextIndex === undefined) {
            inputRef.current?.focus();
          } else {
            chipsRef.current[nextIndex]?.focus();
          }
        },
        onMouseDown(event) {
          if (disabled) {
            return;
          }
          event.preventDefault();
          inputRef.current?.focus();
        },
      },
      elementProps,
    ],
  });

  const contextValue: ComboboxChipContext = React.useMemo(
    () => ({
      index,
    }),
    [index],
  );

  return (
    <ComboboxChipContext.Provider value={contextValue}>{element}</ComboboxChipContext.Provider>
  );
});

export namespace ComboboxChip {
  export interface State {
    /**
     * Whether the component should ignore user interaction.
     */
    disabled: boolean;
  }

  export interface Props extends BaseUIComponentProps<'div', State> {}
}
