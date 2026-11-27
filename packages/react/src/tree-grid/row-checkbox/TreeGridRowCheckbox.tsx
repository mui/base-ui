'use client';
import * as React from 'react';
import { useMergedRefs } from '@base-ui/utils/useMergedRefs';
import { fastComponentRef } from '@base-ui/utils/fastHooks';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { useIsoLayoutEffect } from '@base-ui/utils/useIsoLayoutEffect';
import { Checkbox } from '../../checkbox';
import { REASONS } from '../../internals/reasons';
import { NO_FORM_ID } from '../../internals/constants';
import {
  DEFAULT_FIELD_ROOT_CONTEXT,
  FieldRootContext,
} from '../../internals/field-root-context/FieldRootContext';
import { DEFAULT_FIELD_ITEM_CONTEXT, FieldItemContext } from '../../field/item/FieldItemContext';
import { CheckboxGroupContext } from '../../checkbox-group/CheckboxGroupContext';
import { LabelableProvider } from '../../internals/labelable-provider';
import type { BaseUIComponentProps, NonNativeButtonProps } from '../../internals/types';
import type { CheckboxRootProps, CheckboxRootState } from '../../checkbox';
import { useTreeRootContext } from '../../tree/root/TreeRootContext';
import { useTreeItemContext } from '../../tree/item/TreeItemContext';
import { ACTION_CONTROL_KEYS, useTreeGridCellControl } from '../utils/useTreeGridCellControl';
import { mapStateProps } from '../../tree/utils/mapStateProps';

function toItemCheckboxState(state: CheckboxRootState): TreeGridRowCheckboxState {
  return { checked: state.checked, indeterminate: state.indeterminate, disabled: state.disabled };
}

/**
 * A checkbox that controls selection for its tree item.
 * Requires `TreeGrid.Root`.
 * Renders a `<span>` element and a hidden `<input>` beside it.
 *
 * Documentation: [Base UI Tree Grid](https://base-ui.com/react/components/tree-grid)
 */
export const TreeGridRowCheckbox = fastComponentRef(function TreeGridRowCheckbox(
  componentProps: TreeGridRowCheckbox.Props,
  forwardedRef: React.ForwardedRef<HTMLElement>,
) {
  const { id, inputRef, className, style, render, ...otherProps } = componentProps;
  const store = useTreeRootContext();
  const itemId = useTreeItemContext();
  const status = store.useState('checkboxSelectionStatus', itemId);
  const checkboxDisabled = !store.useState('canItemBeSelected', itemId);
  const label = store.useState('itemLabel', itemId);

  const control = useTreeGridCellControl({
    part: 'RowCheckbox',
    treePart: 'CheckboxItem',
    defaultKeys: ACTION_CONTROL_KEYS,
    disabled: checkboxDisabled,
  });
  const checked = status === 'checked';
  const indeterminate = status === 'indeterminate';

  // The row selects like its checkbox, so both go through the same press.
  useIsoLayoutEffect(() => store.grid?.registerRowCheckbox(itemId), [store, itemId]);

  const handleCheckedChange = useStableCallback<NonNullable<CheckboxRootProps['onCheckedChange']>>(
    (_nextChecked, details) => {
      const event = details.event;
      store.selection.press(
        itemId,
        { shiftKey: 'shiftKey' in event && event.shiftKey === true },
        REASONS.itemPress,
        event,
      );
    },
  );

  const mergedRef = useMergedRefs(forwardedRef, control.ref);

  return (
    // A row checkbox selects its item; it isn't the control of a field or checkbox group
    // around the tree. The default contexts tell `Checkbox.Root` that none encloses it, so
    // its name, validation and disabled state come from the tree only.
    <FieldRootContext.Provider value={DEFAULT_FIELD_ROOT_CONTEXT}>
      <FieldItemContext.Provider value={DEFAULT_FIELD_ITEM_CONTEXT}>
        <CheckboxGroupContext.Provider value={undefined}>
          {/* A labelable scope per checkbox gives each hidden input its own id. */}
          <LabelableProvider>
            <Checkbox.Root
              aria-label={`Select ${label}`}
              {...otherProps}
              {...mapStateProps({ className, style, render }, toItemCheckboxState)}
              ref={mergedRef}
              id={id}
              inputRef={inputRef}
              checked={checked}
              indeterminate={indeterminate}
              disabled={checkboxDisabled}
              // Out of the tab order while disabled, as the arrows skip it too.
              tabIndex={otherProps.tabIndex ?? (checkboxDisabled ? -1 : control.tabIndex)}
              onCheckedChange={handleCheckedChange}
              // Selecting a row isn't a form value, and Enter must not submit a surrounding form.
              form={NO_FORM_ID}
            />
          </LabelableProvider>
        </CheckboxGroupContext.Provider>
      </FieldItemContext.Provider>
    </FieldRootContext.Provider>
  );
});

export interface TreeGridRowCheckboxProps
  extends
    NonNativeButtonProps,
    Omit<BaseUIComponentProps<'span', TreeGridRowCheckboxState>, 'onChange' | 'value'> {
  /**
   * The id of the hidden input element.
   */
  id?: string | undefined;
  /**
   * A ref to access the hidden `<input>` element.
   */
  inputRef?: React.Ref<HTMLInputElement> | undefined;
}

export interface TreeGridRowCheckboxState {
  /**
   * Whether the item is selected.
   */
  checked: boolean;
  /**
   * Whether the item is not selected but some of its selectable descendants are.
   */
  indeterminate: boolean;
  /**
   * Whether the checkbox is disabled, because its item is disabled or can't be selected.
   */
  disabled: boolean;
}

export namespace TreeGridRowCheckbox {
  export type State = TreeGridRowCheckboxState;
  export type Props = TreeGridRowCheckboxProps;
}
