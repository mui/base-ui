'use client';
import * as React from 'react';
import { useMergedRefs } from '@base-ui/utils/useMergedRefs';
import { fastComponentRef } from '@base-ui/utils/fastHooks';
import { useStableCallback } from '@base-ui/utils/useStableCallback';
import { Checkbox } from '../../checkbox';
import { REASONS } from '../../internals/reasons';
import {
  DEFAULT_FIELD_ROOT_CONTEXT,
  FieldRootContext,
  useFieldRootContext,
} from '../../internals/field-root-context/FieldRootContext';
import { LabelableProvider } from '../../internals/labelable-provider';
import type { BaseUIComponentProps, NonNativeButtonProps } from '../../internals/types';
import type { CheckboxRootProps, CheckboxRootState } from '../../checkbox';
import { useTreeRootContext } from '../root/TreeRootContext';
import { useTreeItemContext } from '../item/TreeItemContext';
import { ACTION_CONTROL_KEYS, useTreeItemControl } from '../utils/useTreeItemControl';
import { mapStateProps } from '../utils/mapStateProps';

// `Checkbox.Root` also inherits the disabled state of an enclosing field or checkbox group.
function isCheckboxDisabled(element: HTMLElement) {
  return element.hasAttribute('data-disabled');
}

function toItemCheckboxState(state: CheckboxRootState): TreeItemCheckboxState {
  return { checked: state.checked, indeterminate: state.indeterminate, disabled: state.disabled };
}

/**
 * A checkbox that controls selection for its tree item.
 * Renders a `<span>` element and a hidden `<input>` beside it.
 *
 * Documentation: [Base UI Tree](https://base-ui.com/react/components/tree)
 */
export const TreeItemCheckbox = fastComponentRef(function TreeItemCheckbox(
  componentProps: TreeItemCheckbox.Props,
  forwardedRef: React.ForwardedRef<HTMLElement>,
) {
  const { id, inputRef, className, style, render, ...otherProps } = componentProps;
  const store = useTreeRootContext();
  const itemId = useTreeItemContext();
  const status = store.useState('checkboxSelectionStatus', itemId);
  const checkboxDisabled = !store.useState('canItemBeSelected', itemId);
  const label = store.useState('itemLabel', itemId);

  const control = useTreeItemControl({
    controlKeys: undefined,
    defaultKeys: ACTION_CONTROL_KEYS,
    disabled: isCheckboxDisabled,
  });
  const checked = status === 'checked';
  const indeterminate = status === 'indeterminate';

  const handleCheckedChange = useStableCallback<NonNullable<CheckboxRootProps['onCheckedChange']>>(
    (nextChecked, details) => {
      store.selection.setItemChecked(itemId, nextChecked, REASONS.itemPress, details.event);
    },
  );

  const mergedRef = useMergedRefs(forwardedRef, control.ref);

  // A row checkbox selects its item; it isn't the control of a field around the tree.
  // The default context tells `Checkbox.Root` that no field encloses it, so it doesn't
  // take the field's name, id or validation. Only the field's disabled state is kept,
  // like a native `<fieldset disabled>`.
  const fieldDisabled = useFieldRootContext().disabled;
  const fieldContext = React.useMemo(
    () => ({ ...DEFAULT_FIELD_ROOT_CONTEXT, disabled: fieldDisabled }),
    [fieldDisabled],
  );

  return (
    // A labelable scope per checkbox gives each hidden input its own id.
    <FieldRootContext.Provider value={fieldContext}>
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
        />
      </LabelableProvider>
    </FieldRootContext.Provider>
  );
});

export interface TreeItemCheckboxProps
  extends
    NonNativeButtonProps,
    Omit<BaseUIComponentProps<'span', TreeItemCheckboxState>, 'onChange' | 'value'> {
  /**
   * The id of the hidden input element.
   */
  id?: string | undefined;
  /**
   * A ref to access the hidden `<input>` element.
   */
  inputRef?: React.Ref<HTMLInputElement> | undefined;
}

export interface TreeItemCheckboxState {
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

export namespace TreeItemCheckbox {
  export type State = TreeItemCheckboxState;
  export type Props = TreeItemCheckboxProps;
}
