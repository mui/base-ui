'use client';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { useStore } from '@base-ui-components/utils/store';
import { useRenderElement } from '../../utils/useRenderElement';
import { BaseUIComponentProps } from '../../utils/types';
import { useComboboxChipsContext } from '../chips/ComboboxChipsContext';
import { useComboboxRootContext } from '../root/ComboboxRootContext';
import { useCompositeListItem } from '../../composite/list/useCompositeListItem';
import { ComboboxChipContext } from './ComboboxChipContext';
import { stopEvent } from '../../floating-ui-react/utils';
import { selectors } from '../store';

/**
 * An individual chip that represents a value in a multiselectable input.
 * Renders a `<div>` element.
 */
export const ComboboxChip = React.forwardRef(function ComboboxChip(
  componentProps: ComboboxChip.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const { render, className, ...elementProps } = componentProps;

  const { inputRef, store, setSelectedValue, setOpen, disabled, readOnly } =
    useComboboxRootContext();
  const { setHighlightedChipIndex, chipsRef } = useComboboxChipsContext()!;

  const selectedValue = useStore(store, selectors.selectedValue);

  const { ref, index } = useCompositeListItem();

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (disabled) {
      event.preventDefault();
      return index;
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
      if (index < selectedValue.length - 1) {
        nextIndex = index + 1;
      } else {
        nextIndex = undefined;
      }
    } else if (event.key === 'Backspace' || event.key === 'Delete') {
      if (readOnly) {
        event.preventDefault();
        return index;
      }

      const computedNextIndex =
        index >= selectedValue.length - 1 ? selectedValue.length - 2 : index;
      nextIndex = computedNextIndex >= 0 ? computedNextIndex : undefined;

      stopEvent(event);
      setSelectedValue(
        selectedValue.filter((_: any, i: number) => i !== index),
        event.nativeEvent,
        undefined,
      );
    } else if (event.key === 'Enter' || event.key === ' ') {
      stopEvent(event);
      nextIndex = undefined;
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      stopEvent(event);
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
        tabIndex: -1,
        'aria-disabled': disabled || undefined,
        'aria-readonly': readOnly || undefined,
        onKeyDown(event) {
          if (disabled || readOnly) {
            return;
          }

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
          if (disabled || readOnly) {
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
