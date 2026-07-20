'use client';
import * as React from 'react';
import { useStore } from '@base-ui/utils/store';
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
import { ComboboxItem } from '../item/ComboboxItem';
import { COMBOBOX_SELECT_ALL_VALUE } from './selectAllValue';

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

/**
 * Selects or deselects all currently filtered items in multiple selection mode.
 * Renders as the first `role="option"` in the list so keyboard navigation can reach it.
 *
 * Place it inside `<Combobox.List>` before the collection items.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
export const ComboboxSelectAll = React.forwardRef(function ComboboxSelectAll(
  componentProps: ComboboxSelectAll.Props,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) {
  const {
    render,
    className: classNameProp,
    style: styleProp,
    disabled: disabledProp = false,
    children = 'Select all',
    onClick,
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
  const highlighted = useStore(store, selectors.isActive, 0);

  const current = Array.isArray(selectedValue) ? selectedValue : [];
  const allVisibleSelected =
    filteredItems.length > 0 &&
    filteredItems.every((item) => selectedValueIncludes(current, item, isItemEqualToValue));
  const someVisibleSelected = filteredItems.some((item) =>
    selectedValueIncludes(current, item, isItemEqualToValue),
  );
  const indeterminate = someVisibleSelected && !allVisibleSelected;

  const disabled =
    fieldDisabled ||
    disabledProp ||
    comboboxDisabled ||
    selectionMode !== 'multiple' ||
    filteredItems.length === 0;

  const selectAllState: ComboboxSelectAllState = {
    checked: allVisibleSelected,
    indeterminate,
    disabled,
    selected: allVisibleSelected,
    highlighted,
  };

  const className =
    typeof classNameProp === 'function' ? classNameProp(selectAllState) : classNameProp;
  const style = typeof styleProp === 'function' ? styleProp(selectAllState) : styleProp;

  return (
    <ComboboxItem
      {...elementProps}
      ref={forwardedRef}
      render={render}
      className={className}
      style={style}
      value={COMBOBOX_SELECT_ALL_VALUE}
      disabled={disabled}
      aria-selected={allVisibleSelected}
      onClick={(event) => {
        if (!disabled && !readOnly && selectionMode === 'multiple') {
          event.preventBaseUIHandler();

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
        }

        onClick?.(event);
      }}
    >
      {children}
    </ComboboxItem>
  );
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
  /**
   * Whether the list option is selected.
   */
  selected: boolean;
  /**
   * Whether the list option is highlighted.
   */
  highlighted: boolean;
}

export interface ComboboxSelectAllProps extends Omit<ComboboxItem.Props, 'value' | 'index' | 'className' | 'style'> {
  children?: React.ReactNode;
  className?: string | ((state: ComboboxSelectAllState) => string | undefined) | undefined;
  style?:
    | React.CSSProperties
    | ((state: ComboboxSelectAllState) => React.CSSProperties | undefined)
    | undefined;
}

export namespace ComboboxSelectAll {
  export type State = ComboboxSelectAllState;
  export type Props = ComboboxSelectAllProps;
}
