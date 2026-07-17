'use client';
import * as React from 'react';
import type { BaseUIComponentProps, BaseUIEvent } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import { useFilterDropdownPopupContext } from '../popup/FilterDropdownPopupContext';
import {
  useFilterDropdownRootContext,
  useFilterDropdownValueContext,
} from '../root/FilterDropdownRootContext';

const MOVE_CARET_KEYS = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];

/**
 * @internal
 */
export const FilterDropdownInput = React.forwardRef(function FilterDropdownInput(
  componentProps: FilterDropdownInput.Props,
  forwardedRef: React.ForwardedRef<HTMLInputElement>,
) {
  const { render, className, style, ...elementProps } = componentProps;
  const context = useFilterDropdownRootContext();
  const popupContext = useFilterDropdownPopupContext();
  const value = useFilterDropdownValueContext();

  return useRenderElement('input', componentProps, {
    ref: [forwardedRef, popupContext.inputRef],
    props: [
      {
        type: 'text',
        role: 'searchbox',
        inputMode: 'search',
        enterKeyHint: 'search',
        autoComplete: 'off',
        'aria-autocomplete': 'list',
        'aria-controls': popupContext.listId,
        value,
        onChange(event) {
          const nextValue = event.currentTarget.value;
          context.onValueChange(
            nextValue,
            createChangeEventDetails(
              nextValue === '' ? REASONS.inputClear : REASONS.inputChange,
              event.nativeEvent,
            ),
          );
        },
        onMouseEnter(event: BaseUIEvent<React.MouseEvent<HTMLInputElement>>) {
          event.currentTarget.focus({ preventScroll: true });
        },
        onKeyDown(event: BaseUIEvent<React.KeyboardEvent<HTMLInputElement>>) {
          const isMovingCaret = MOVE_CARET_KEYS.includes(event.key);
          const isEmpty = value === '';
          const isTyping = event.key.length === 1;
          const isInputActive = !event.currentTarget.hasAttribute('aria-activedescendant');

          if (isMovingCaret && !isInputActive) {
            event.preventDefault();
          }

          if (isTyping || (!isEmpty && isInputActive && isMovingCaret)) {
            // Keep character input out of parent handlers e.g. typeahead. When the input has no active
            // descendant preserve its native caret navigation instead of navigating the list.
            event.stopPropagation();
            event.preventBaseUIHandler();
          }
        },
      },
      elementProps,
    ],
  });
});

export interface FilterDropdownInputState {}

export interface FilterDropdownInputProps extends BaseUIComponentProps<
  'input',
  FilterDropdownInputState
> {}

export namespace FilterDropdownInput {
  export type Props = FilterDropdownInputProps;
  export type State = FilterDropdownInputState;
}
