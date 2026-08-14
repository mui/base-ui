'use client';
import * as React from 'react';
import { ownerDocument } from '@base-ui/utils/owner';
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
  const keyboardNavigationCountRef = React.useRef(0);
  const keyboardModalityRef = React.useRef(false);
  const previousFocusVisibleRef = React.useRef(context.inputFocusVisible);

  React.useEffect(() => {
    const input = context.inputRef.current;
    if (!input) {
      return undefined;
    }

    const document = ownerDocument(input);
    function handleKeyDown() {
      keyboardModalityRef.current = true;
    }
    function handlePointerDown() {
      keyboardModalityRef.current = false;
    }

    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('pointerdown', handlePointerDown, true);
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('pointerdown', handlePointerDown, true);
    };
  }, [context.inputRef]);

  if (previousFocusVisibleRef.current && !context.inputFocusVisible) {
    keyboardNavigationCountRef.current = 0;
  }
  previousFocusVisibleRef.current = context.inputFocusVisible;

  return useRenderElement('input', componentProps, {
    ref: [forwardedRef, context.inputRef],
    props: [
      context.inputProps,
      {
        type: 'text',
        disabled: context.disabled || disabled,
        [FilterDropdownInputDataAttributes.focusVisible as string]: context.inputFocusVisible
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
          context.setActiveIndex(null);
          context.onValueChange(nextValue, createChangeEventDetails(reason, event.nativeEvent));
        },
        onMouseEnter(event) {
          keyboardNavigationCountRef.current = 0;
          event.currentTarget.focus({ preventScroll: true });
          context.setInputFocusVisible(false);
        },
        onFocus(event) {
          if (keyboardModalityRef.current && event.currentTarget.matches(':focus-visible')) {
            context.setInputFocusVisible(true);
          }
        },
        onKeyDown(event: BaseUIEvent<React.KeyboardEvent<HTMLInputElement>>) {
          const isMovingCaret = MOVE_CARET_KEYS.includes(event.key);
          const isMainNavigationKey = event.key === 'ArrowUp' || event.key === 'ArrowDown';
          const isTyping = event.key.length === 1;
          const isInputActive = activeItemId == null;

          if (isMainNavigationKey) {
            // The input already consumed the host's reference handler. Keep the same event from
            // reaching the popup's floating handler and moving the virtual cursor a second time.
            event.stopPropagation();
            keyboardNavigationCountRef.current += 1;
            if (keyboardNavigationCountRef.current > 1) {
              context.setInputFocusVisible(true);
            }
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
