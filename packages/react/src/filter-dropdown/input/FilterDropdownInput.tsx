'use client';
import * as React from 'react';
import { platform } from '@base-ui/utils/platform';
import type { BaseUIComponentProps, HTMLProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import {
  useFilterDropdownItemContext,
  useFilterDropdownRootContext,
  useFilterDropdownValueContext,
} from '../root/FilterDropdownRootContext';
import { refocusOwner, isRefocusingOwner } from '../utils/refocusOwner';

/**
 * @internal
 */
export const FilterDropdownInput = React.forwardRef(function FilterDropdownInput(
  componentProps: FilterDropdownInputHostProps,
  forwardedRef: React.ForwardedRef<HTMLInputElement>,
) {
  const { render, className, style, disabled, activeItemId, navigationProps, ...elementProps } =
    componentProps;

  const context = useFilterDropdownRootContext();
  const { listRef } = useFilterDropdownItemContext();
  const value = useFilterDropdownValueContext();

  // IME text isn't committed until the composition ends, so filtering waits for it.
  const [composingValue, setComposingValue] = React.useState<string | null>(null);
  const isComposingRef = React.useRef(false);

  function commitValue(nextValue: string, nativeEvent: Event) {
    const reason = nextValue === '' ? REASONS.inputClear : REASONS.inputChange;
    context.onValueChange(nextValue, createChangeEventDetails(reason, nativeEvent));
  }

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
        autoComplete: 'off',
        spellCheck: 'false',
        autoCorrect: 'off',
        autoCapitalize: 'none',
        // The aria-autocomplete 'list' value is only valid with `aria-haspopup` so we depend
        // on the searchbox role to communicate affordance, with an input label as fallback
        // https://w3c.github.io/aria/#aria-autocomplete
        'aria-autocomplete': undefined,
        'aria-controls': context.listId,
        value: composingValue ?? value,
        onCompositionStart(event) {
          // Some Android keyboards treat all typing as one composition.
          if (platform.os.android) {
            return;
          }
          isComposingRef.current = true;
          setComposingValue(event.currentTarget.value);
        },
        onCompositionEnd(event) {
          if (!isComposingRef.current) {
            return;
          }
          isComposingRef.current = false;
          setComposingValue(null);
          commitValue(event.currentTarget.value, event.nativeEvent);
        },
        onChange(event) {
          if (isComposingRef.current) {
            setComposingValue(event.currentTarget.value);
            return;
          }
          commitValue(event.currentTarget.value, event.nativeEvent);
        },
        onKeyDown() {
          context.setKeyboardModality(true);
        },
        onPointerDown() {
          context.setKeyboardModality(false);
        },
        onMouseEnter(event) {
          context.setKeyboardModality(false);
          // Take focus so typing filters immediately.
          if (context.open) {
            refocusOwner(event.currentTarget);
          }
        },
        onFocus(event) {
          context.setInputFocusVisible(true);

          // A screen reader that followed `aria-activedescendant` put real focus on the item, so
          // focus returning from an item means the user moved back to the input on purpose and
          // the highlight no longer reflects where they are. The list's own key replay and
          // pointer refocus also pass through here and keep it.
          if (context.autoHighlight === 'always' || isRefocusingOwner()) {
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
> {}

interface FilterDropdownInputHostProps extends FilterDropdownInputProps {
  /**
   * The id of the item the host highlights, which the input points at while it holds focus.
   */
  activeItemId?: string | undefined;
  /**
   * The host's list navigation props. The host routes key presses itself, so these exclude a
   * key handler.
   */
  navigationProps?: HTMLProps | undefined;
}

export namespace FilterDropdownInput {
  export type Props = FilterDropdownInputProps;
  export type State = FilterDropdownInputState;
}
