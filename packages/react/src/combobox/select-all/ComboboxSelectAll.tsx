'use client';
import * as React from 'react';
import { useStore } from '@base-ui/utils/store';
import type { BaseUIComponentProps, NativeButtonProps } from '../../internals/types';
import { useRenderElement } from '../../internals/useRenderElement';
import { useButton } from '../../internals/use-button';
import { createChangeEventDetails } from '../../internals/createBaseUIEventDetails';
import { REASONS } from '../../internals/reasons';
import {
  removeItem,
  selectedValueIncludes,
  type ItemEqualityComparer,
} from '../../internals/itemEquality';
import {
  useComboboxDerivedItemsContext,
  useComboboxRootContext,
} from '../root/ComboboxRootContext';
import { useFieldRootContext } from '../../internals/field-root-context/FieldRootContext';
import { selectors } from '../store';
import type { StateAttributesMapping } from '../../internals/getStateAttributesProps';
import { ComboboxSelectAllDataAttributes } from './ComboboxSelectAllDataAttributes';

function mergeSelection<Value>(
  current: Value[],
  toAdd: Value[],
  isEqual: ItemEqualityComparer<Value, Value>,
): Value[] {
  const next = [...current];
  for (const item of toAdd) {
    if (!selectedValueIncludes(next, item, isEqual)) {
      next.push(item);
    }
  }
  return next;
}

const stateAttributesMapping: StateAttributesMapping<ComboboxSelectAllState> = {
  checked(value): Record<string, string> {
    if (value) {
      return { [ComboboxSelectAllDataAttributes.checked]: '' };
    }
    return { [ComboboxSelectAllDataAttributes.unchecked]: '' };
  },
  indeterminate(value): Record<string, string> {
    if (value) {
      return { [ComboboxSelectAllDataAttributes.indeterminate]: '' };
    }
    return {};
  },
  disabled(value): Record<string, string> {
    if (value) {
      return { [ComboboxSelectAllDataAttributes.disabled]: '' };
    }
    return {};
  },
};

/**
 * Selects or deselects all currently filtered items in multiple selection mode.
 * Renders a `<button>` element with `role="checkbox"`.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
export const ComboboxSelectAll = React.forwardRef(function ComboboxSelectAll(
  componentProps: ComboboxSelectAll.Props,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
) {
  const {
    render,
    className,
    disabled: disabledProp = false,
    nativeButton = true,
    children = 'Select all',
    style,
    ...elementProps
  } = componentProps;

  const { disabled: fieldDisabled } = useFieldRootContext();
  const store = useComboboxRootContext();
  const { filteredItems } = useComboboxDerivedItemsContext();

  const selectionMode = useStore(store, selectors.selectionMode);
  const comboboxDisabled = useStore(store, selectors.disabled);
  const readOnly = useStore(store, selectors.readOnly);
  const selectedValue = useStore(store, selectors.selectedValue);
  const isItemEqualToValue = useStore(store, selectors.isItemEqualToValue);

  const current = Array.isArray(selectedValue) ? selectedValue : [];
  const allVisibleSelected =
    filteredItems.length > 0 &&
    filteredItems.every((item) => selectedValueIncludes(current, item, isItemEqualToValue));
  const someVisibleSelected = filteredItems.some((item) =>
    selectedValueIncludes(current, item, isItemEqualToValue),
  );

  const disabled =
    fieldDisabled ||
    disabledProp ||
    comboboxDisabled ||
    selectionMode !== 'multiple' ||
    filteredItems.length === 0;

  const { buttonRef, getButtonProps } = useButton({
    native: nativeButton,
    disabled,
  });

  const state: ComboboxSelectAllState = {
    checked: allVisibleSelected,
    indeterminate: someVisibleSelected && !allVisibleSelected,
    disabled,
  };

  return useRenderElement('button', componentProps, {
    state,
    ref: [forwardedRef, buttonRef],
    props: [
      {
        type: 'button',
        role: 'checkbox',
        'aria-checked': state.indeterminate ? 'mixed' : state.checked,
        children,
        onMouseDown(event) {
          event.preventDefault();
        },
        onClick(event) {
          if (disabled || readOnly || selectionMode !== 'multiple') {
            return;
          }

          let next = current;

          if (allVisibleSelected) {
            for (const item of filteredItems) {
              next = removeItem(next, item, isItemEqualToValue);
            }
          } else {
            next = mergeSelection(current, filteredItems, isItemEqualToValue);
          }

          store.state.setSelectedValue(
            next,
            createChangeEventDetails(REASONS.selectAllPress, event.nativeEvent),
          );
        },
      },
      elementProps,
      getButtonProps,
    ],
    stateAttributesMapping,
  });
});

export interface ComboboxSelectAllState {
  /**
   * Whether all currently filtered items are selected.
   */
  checked: boolean;
  /**
   * Whether some but not all currently filtered items are selected.
   */
  indeterminate: boolean;
  /**
   * Whether the component should ignore user interaction.
   */
  disabled: boolean;
}

export interface ComboboxSelectAllProps
  extends NativeButtonProps, BaseUIComponentProps<'button', ComboboxSelectAllState> {
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean | undefined;
}

export namespace ComboboxSelectAll {
  export type State = ComboboxSelectAllState;
  export type Props = ComboboxSelectAllProps;
}
