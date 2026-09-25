'use client';
import * as React from 'react';
import type { BaseUIComponentProps, BaseUIEvent, HTMLProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import {
  useFilterDropdownItemContext,
  useFilterDropdownRootContext,
  useFilterDropdownValueContext,
} from '../root/FilterDropdownRootContext';
import { focusByPointer, isPointerFocusInProgress } from '../utils/focusByPointer';

const MOVE_CARET_KEYS = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];

/**
 * @internal
 */
export const FilterDropdownInput = React.forwardRef(function FilterDropdownInput(
  componentProps: FilterDropdownInput.Props,
  forwardedRef: React.ForwardedRef<HTMLInputElement>,
) {
  const { render, className, style, disabled, activeItemId, navigationProps, ...elementProps } =
    componentProps;

  const context = useFilterDropdownRootContext();
  const { listRef } = useFilterDropdownItemContext();
  const value = useFilterDropdownValueContext();

  const state: FilterDropdownInputState = {
    highlighted: context.inputFocusVisible && (!context.keyboardModality || activeItemId == null),
  };

  return useRenderElement('input', componentProps, {
    state,
    ref: [forwardedRef, context.focusOwnerRef],
    props: [
      navigationProps,
      {
        type: 'text',
        disabled: context.disabled || disabled,
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
          // Take focus so typing filters immediately.
          if (context.open) {
            focusByPointer(event.currentTarget);
          }
        },
        onPointerDown() {
          context.setKeyboardModality(false);
        },
        onFocus(event: React.FocusEvent<HTMLInputElement>) {
          context.setInputFocusVisible(true);

          // A screen reader that followed `aria-activedescendant` put real focus on the item, so
          // focus returning from an item means the user moved back to the input on purpose and
          // the highlight no longer reflects where they are. The list's own key replay and
          // pointer refocus also pass through here and keep it.
          if (
            context.autoHighlight === 'always' ||
            context.keyReplayRef.current ||
            isPointerFocusInProgress()
          ) {
            return;
          }
          const from = event.relatedTarget as HTMLElement | null;
          if (from !== null && listRef.current.includes(from)) {
            context.setActiveIndex(null);
          }
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
          const hasModifier = event.shiftKey || event.ctrlKey || event.altKey || event.metaKey;

          if (hasModifier && (isMovingCaret || isMainNavigationKey)) {
            // Modified arrows and boundary keys perform native text editing (extend the
            // selection, move by word or to a text boundary). Keep them away from list
            // navigation on this element and in the popup.
            event.stopPropagation();
            event.preventBaseUIHandler();
            return;
          }

          if (isMainNavigationKey) {
            // The reference handler runs on this element, so keep the same event from reaching
            // the popup's floating handler and moving the virtual cursor a second time.
            event.stopPropagation();
          } else if (!isInputActive && isMovingCaret) {
            // Cross-axis and boundary keys were forwarded to the active item by the reference.
            event.stopPropagation();
            event.preventDefault();
          }

          const isBoundaryKey = event.key === 'Home' || event.key === 'End';
          if (isTyping || (isInputActive && isMovingCaret && (value !== '' || isBoundaryKey))) {
            // Keep character input out of parent handlers such as typeahead. With no active
            // descendant the input keeps its native caret navigation instead of moving the
            // highlight; Home and End stay caret keys even when the input is empty. Cross-axis
            // arrows on an empty input fall through so they can still close or enter a submenu.
            event.stopPropagation();
            event.preventBaseUIHandler();
          }
        },
      },
      elementProps,
    ],
  });
});

export interface FilterDropdownInputState {
  /**
   * Whether the input shows its focus ring.
   * Cleared when keyboard navigation highlights an item.
   */
  highlighted: boolean;
}

export interface FilterDropdownInputProps extends BaseUIComponentProps<
  'input',
  FilterDropdownInputState
> {
  /**
   * The id of the item the host highlights, which the input points at while it holds focus.
   */
  activeItemId?: string | undefined;
  /**
   * The host's list navigation props, which run after the input's own handlers.
   */
  navigationProps?: HTMLProps | undefined;
}

export namespace FilterDropdownInput {
  export type Props = FilterDropdownInputProps;
  export type State = FilterDropdownInputState;
}
