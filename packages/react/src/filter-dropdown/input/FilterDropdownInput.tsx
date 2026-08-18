'use client';
import * as React from 'react';
import type { BaseUIComponentProps, BaseUIEvent } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import {
  useActiveItemId,
  useFilterDropdownRootContext,
  useFilterDropdownValueContext,
} from '../root/FilterDropdownRootContext';
import { FilterDropdownInputDataAttributes } from './FilterDropdownInputDataAttributes';

const MOVE_CARET_KEYS = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];

/**
 * @internal
 */
export const FilterDropdownInput = React.forwardRef(function FilterDropdownInput(
  componentProps: FilterDropdownInput.Props,
  forwardedRef: React.ForwardedRef<HTMLInputElement>,
) {
  const { render, className, style, disabled, ...elementProps } = componentProps;

  const context = useFilterDropdownRootContext();
  const value = useFilterDropdownValueContext();
  const activeItemId = useActiveItemId(context);

  return useRenderElement('input', componentProps, {
    ref: [forwardedRef, context.setInputElement],
    props: [
      context.inputProps,
      {
        type: 'text',
        disabled: context.disabled || disabled,
        [FilterDropdownInputDataAttributes.focusVisible as string]:
          context.inputFocusVisible && (!context.keyboardModality || activeItemId == null)
            ? ''
            : undefined,
        'aria-activedescendant': activeItemId,
        role: 'searchbox',
        inputMode: 'search',
        enterKeyHint: 'search',
        autoComplete: 'off',
        // The aria-autocomplete 'list' value is only valid with `aria-haspopup` so we depend
        // on the searchbox role to communicate affordance, with an input label as fallback
        // https://w3c.github.io/aria/#aria-autocomplete
        'aria-autocomplete': undefined,
        'aria-controls': context.listId,
        value,
        onChange(event) {
          const nextValue = event.currentTarget.value;
          const reason = nextValue === '' ? REASONS.inputClear : REASONS.inputChange;
          const details = createChangeEventDetails(reason, event.nativeEvent);
          context.onValueChange(nextValue, details);
          if (!details.isCanceled && !context.autoHighlight) {
            context.setActiveIndex(null);
          }
        },
        onMouseEnter(event) {
          context.setKeyboardModality(false);
          if (context.open && !context.inline) {
            event.currentTarget.focus({ preventScroll: true });
          }
        },
        onPointerDown() {
          context.setKeyboardModality(false);
        },
        onFocus() {
          context.setInputFocusVisible(true);
        },
        onBlur() {
          context.setInputFocusVisible(false);
        },
        onKeyDown(event: BaseUIEvent<React.KeyboardEvent<HTMLInputElement>>) {
          context.setKeyboardModality(true);
          const isMovingCaret = MOVE_CARET_KEYS.includes(event.key);
          const isMainNavigationKey = event.key === 'ArrowUp' || event.key === 'ArrowDown';
          const isTyping = event.key.length === 1;
          const isInputActive = activeItemId == null;

          if (isMainNavigationKey) {
            // The input already consumed the host's reference handler. Keep the same event from
            // reaching the popup's floating handler and moving the virtual cursor a second time.
            event.stopPropagation();
          } else if (!isInputActive && isMovingCaret) {
            // Cross-axis and boundary keys were forwarded to the active item by the reference.
            event.stopPropagation();
          }

          if (isMovingCaret && !isInputActive) {
            event.preventDefault();
          }

          if (isTyping || (value !== '' && isInputActive && isMovingCaret)) {
            // Keep character input out of parent handlers such as typeahead. With no active
            // descendant the input keeps its native caret navigation instead of moving the
            // highlight.
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
