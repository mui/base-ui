'use client';
import * as React from 'react';
import PropTypes from 'prop-types';
import { useSelectRoot } from './useSelectRoot';
import { SelectRootContext } from './SelectRootContext';
import { SelectIndexContext } from './SelectIndexContext';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { visuallyHidden } from '../../utils/visuallyHidden';
import { PortalContext } from '../../portal/PortalContext';

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
  });

  const { setDirty, validityData } = useFieldRootContext();

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
        <PortalContext.Provider value={rootContext.mounted}>
          {props.children}
        </PortalContext.Provider>
        <input
          {...rootContext.fieldControlValidation.getInputValidationProps({
            onFocus() {
              // Move focus from the hidden <select> to the trigger element.
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

SelectRoot.propTypes /* remove-proptypes */ = {
  // ┌────────────────────────────── Warning ──────────────────────────────┐
  // │ These PropTypes are generated from the TypeScript type definitions. │
  // │ To update them, edit the TypeScript types and run `pnpm proptypes`. │
  // └─────────────────────────────────────────────────────────────────────┘
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
   * To render a controlled select menu, use the `open` prop instead.
   * @default false
   */
  defaultOpen: PropTypes.bool,
  /**
   * The default value of the select.
   * @default null
   */
  defaultValue: PropTypes.any,
  /**
   * Whether the component should ignore user actions.
   * @default false
   */
  disabled: PropTypes.bool,
  /**
   * The name of the Select in the owning form.
   */
  name: PropTypes.string,
  /**
   * Callback fired when the component requests to be opened or closed.
   */
  onOpenChange: PropTypes.func,
  /**
   * Callback fired when the value of the select changes. Use when controlled.
   */
  onValueChange: PropTypes.func,
  /**
   * Allows to control whether the dropdown is open.
   * This is a controlled counterpart of `defaultOpen`.
   */
  open: PropTypes.bool,
  /**
   * If `true`, the Select is read-only.
   * @default false
   */
  readOnly: PropTypes.bool,
  /**
   * If `true`, the Select is required.
   * @default false
   */
  required: PropTypes.bool,
  /**
   * The value of the select.
   */
  value: PropTypes.any,
} as any;

export { SelectRoot };

namespace SelectRoot {
  export interface Props<Value> extends useSelectRoot.Parameters<Value> {
    children?: React.ReactNode;
  }

  export interface State {}
}

interface SelectRoot {
  <Value>(props: SelectRoot.Props<Value>): React.JSX.Element;
  propTypes?: any;
}
