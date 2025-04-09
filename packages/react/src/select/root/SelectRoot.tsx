'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useSelectRoot } from './useSelectRoot';
import { SelectRootContext } from './SelectRootContext';
import { SelectIndexContext } from './SelectIndexContext';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { visuallyHidden } from '../../utils/visuallyHidden';

/**
 * Groups all parts of the select.
 * Doesn’t render its own HTML element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
const SelectRoot: SelectRoot = function SelectRoot<Value>(
  props: SelectRoot.Props<Value>,
): React.JSX.Element {
  const {
    value: valueProp,
    defaultValue = null,
    onValueChange,
    open,
    defaultOpen = false,
    onOpenChange,
    alignItemToTrigger = true,
    name,
    disabled = false,
    readOnly = false,
    required = false,
    modal = true,
    actionsRef,
    onOpenChangeComplete,
  } = props;

  const selectRoot = useSelectRoot<Value>({
    value: valueProp,
    defaultValue,
    onValueChange,
    open,
    defaultOpen,
    onOpenChange,
    alignItemToTrigger,
    name,
    disabled,
    readOnly,
    required,
    modal,
    actionsRef,
    onOpenChangeComplete,
  });

  const { setDirty, validityData, validationMode } = useFieldRootContext();

  const { rootContext } = selectRoot;
  const value = rootContext.value;

  const serializedValue = React.useMemo(() => {
    if (value == null) {
      return ''; // avoid uncontrolled -> controlled error
    }
    if (typeof value === 'string') {
      return value;
    }
    return JSON.stringify(value);
  }, [value]);

  return (
    <SelectRootContext.Provider value={selectRoot.rootContext}>
      <SelectIndexContext.Provider value={selectRoot.indexContext}>
        {props.children}
        <input
          {...rootContext.fieldControlValidation.getInputValidationProps({
            onFocus() {
              // Move focus to the trigger element when the hidden input is focused.
              rootContext.triggerElement?.focus();
            },
            // Handle browser autofill.
            onChange(event: React.ChangeEvent<HTMLSelectElement>) {
              // Workaround for https://github.com/facebook/react/issues/9023
              if (event.nativeEvent.defaultPrevented) {
                return;
              }

              const nextValue = event.target.value;

              const exactValue = rootContext.valuesRef.current.find(
                (v) =>
                  v === nextValue ||
                  (typeof value === 'string' && nextValue.toLowerCase() === v.toLowerCase()),
              );

              if (exactValue != null) {
                setDirty(exactValue !== validityData.initialValue);
                rootContext.setValue?.(exactValue, event.nativeEvent);

                if (validationMode === 'onChange') {
                  selectRoot.rootContext.fieldControlValidation.commitValidation(exactValue);
                }
              }
            },
            id: rootContext.id,
            name: rootContext.name,
            disabled: rootContext.disabled,
            required: rootContext.required,
            readOnly: rootContext.readOnly,
            value: serializedValue,
            ref: rootContext.fieldControlValidation.inputRef,
            style: visuallyHidden,
            tabIndex: -1,
            'aria-hidden': true,
          })}
        />
      </SelectIndexContext.Provider>
    </SelectRootContext.Provider>
  );
};

namespace SelectRoot {
  export interface Props<Value> extends useSelectRoot.Parameters<Value> {
    children?: React.ReactNode;
  }

  export interface State {}

  export type Actions = useSelectRoot.Actions;
}

interface SelectRoot {
  <Value>(props: SelectRoot.Props<Value>): React.JSX.Element;
  propTypes?: any;
}

SelectRoot.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
  /**
   * A ref to imperative actions.
   * - `unmount`: When specified, the select will not be unmounted when closed.
   * Instead, the `unmount` function must be called to unmount the select manually.
   * Useful when the select's animation is controlled by an external library.
   */
  actionsRef: PropTypes.shape({
    current: PropTypes.shape({
      unmount: PropTypes.func.isRequired,
    }).isRequired,
  }),
  /**
   * Determines if the selected item inside the popup should align to the trigger element.
   * @default true
   */
  alignItemToTrigger: PropTypes.bool,
  /**
   * @ignore
   */
  children: PropTypes.node,
  /**
   * Whether the select menu is initially open.
   *
   * To render a controlled select menu, use the `open` prop instead.
   * @default false
   */
  defaultOpen: PropTypes.bool,
  /**
   * The uncontrolled value of the select when it’s initially rendered.
   *
   * To render a controlled select, use the `value` prop instead.
   * @default null
   */
  defaultValue: PropTypes.any,
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled: PropTypes.bool,
  /**
   * Whether the select should prevent outside clicks and lock page scroll when open.
   * @default true
   */
  modal: PropTypes.bool,
  /**
   * Identifies the field when a form is submitted.
   */
  name: PropTypes.string,
  /**
   * Event handler called when the select menu is opened or closed.
   */
  onOpenChange: PropTypes.func,
  /**
   * Event handler called after any animations complete when the select menu is opened or closed.
   */
  onOpenChangeComplete: PropTypes.func,
  /**
   * Callback fired when the value of the select changes. Use when controlled.
   */
  onValueChange: PropTypes.func,
  /**
   * Whether the select menu is currently open.
   */
  open: PropTypes.bool,
  /**
   * Whether the user should be unable to choose a different option from the select menu.
   * @default false
   */
  readOnly: PropTypes.bool,
  /**
   * Whether the user must choose a value before submitting a form.
   * @default false
   */
  required: PropTypes.bool,
  /**
   * The value of the select.
   */
  value: PropTypes.any,
} as any;

export { SelectRoot };
