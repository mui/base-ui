'use client';
import * as React from 'react';
import { platform } from '@base-ui/utils/platform';
import { useStore } from '@base-ui/utils/store';
import { useMergedRefs } from '@base-ui/utils/useMergedRefs';
import {
  FilterDropdownInput,
  type FilterDropdownInputProps,
  type FilterDropdownInputState,
} from '../../filter-dropdown/input/FilterDropdownInput';
import { mergeProps } from '../../merge-props';
import type { BaseUIEvent } from '../../internals/types';
import { useSelectFilterableRootContext } from '../root/SelectRootContext';
import { selectors } from '../store';
import { SelectInputDataAttributes } from './SelectInputDataAttributes';

/**
 * A text input used to filter the select items.
 * Renders an `<input>` element.
 */
export const SelectInput = React.forwardRef(function SelectInput(
  componentProps: SelectInput.Props,
  forwardedRef: React.ForwardedRef<HTMLInputElement>,
) {
  const context = useSelectFilterableRootContext('Input');
  const isFocusVisible = useStore(context.store, selectors.inputFocusVisible);
  const listNavigationProps = useStore(context.store, selectors.inputProps);
  const mergedRefs = useMergedRefs(forwardedRef, context.filterInputRef);

  const inputProps = mergeProps<typeof FilterDropdownInput>(
    listNavigationProps,
    {
      [SelectInputDataAttributes.focusVisible as string]: isFocusVisible ? '' : undefined,
      onKeyDown(event: BaseUIEvent<React.KeyboardEvent<HTMLInputElement>>) {
        const activeIndex = context.store.state.activeIndex;
        const activeItem = context.listRef.current[activeIndex ?? -1];

        if (event.key === 'Enter' && activeItem) {
          // Prevent a containing form from submitting before the active item handles selection.
          event.preventDefault();
          activeItem.click();
        }

        const isNavigationKey = event.key === 'ArrowDown' || event.key === 'ArrowUp';
        const hasModifier = event.ctrlKey || event.metaKey || event.altKey;
        const hasItems = context.listRef.current.some(Boolean);
        if (
          platform.engine.webkit &&
          isNavigationKey &&
          hasItems &&
          !hasModifier &&
          !event.nativeEvent.isComposing
        ) {
          // WebKit only tracks `aria-activedescendant` when DOM focus is on the list element,
          // not the input, so navigation moves real focus there. The same keydown continues to
          // the list navigation handler, which sets the active item.
          context.store.state.listElement?.focus({ preventScroll: true });
        }
      },
    },
    componentProps,
    { disabled: componentProps.disabled || context.disabled },
  );

  return <FilterDropdownInput {...inputProps} ref={mergedRefs} />;
});

export interface SelectInputState extends FilterDropdownInputState {}
export interface SelectInputProps extends FilterDropdownInputProps {}

export namespace SelectInput {
  export type State = SelectInputState;
  export type Props = SelectInputProps;
}
