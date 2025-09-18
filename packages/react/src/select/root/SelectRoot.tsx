'use client';
import * as React from 'react';
import { useRefWithInit } from '@base-ui-components/utils/useRefWithInit';
import { useOnFirstRender } from '@base-ui-components/utils/useOnFirstRender';
import { useControlled } from '@base-ui-components/utils/useControlled';
import { useIsoLayoutEffect } from '@base-ui-components/utils/useIsoLayoutEffect';
import { useEventCallback } from '@base-ui-components/utils/useEventCallback';
import { useLatestRef } from '@base-ui-components/utils/useLatestRef';
import { useStore, Store } from '@base-ui-components/utils/store';
import { visuallyHidden } from '@base-ui-components/utils/visuallyHidden';
import { useMergedRefs } from '@base-ui-components/utils/useMergedRefs';
import {
  useClick,
  useDismiss,
  useFloatingRootContext,
  useInteractions,
  useListNavigation,
  useRole,
  useTypeahead,
} from '../../floating-ui-react';
import { useFieldControlValidation } from '../../field/control/useFieldControlValidation';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useTransitionStatus } from '../../utils/useTransitionStatus';
import { selectors, State } from '../store';
import { SelectFloatingContext, SelectRootContext } from './SelectRootContext';
import { BaseUIEventDetails, createBaseUIEventDetails } from '../../utils/createBaseUIEventDetails';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { useFormContext } from '../../form/FormContext';
import { useField } from '../../field/useField';
import { EMPTY_ARRAY } from '../../utils/constants';
import { serializeValue } from '../../utils/serializeValue';
import { BaseUIChangeEventReason } from '../../utils/types';

/**
 * Groups all parts of the select.
 * Doesn’t render its own HTML element.
 *
 * Documentation: [Base UI Select](https://base-ui.com/react/components/select)
 */
export function SelectRoot<Value, Multiple extends boolean | undefined = false>(
  props: SelectRoot.Props<Value, Multiple>,
): React.JSX.Element {
  const {
    id: idProp,
    name: nameProp,
    value: valueProp,
    defaultValue = null,
    onValueChange,
    open: openProp,
    defaultOpen: defaultOpenProp = false,
    onOpenChange,
    disabled: disabledProp = false,
    readOnly = false,
    required = false,
    modal = true,
    inputRef,
    onOpenChangeComplete,
    items,
    multiple = false,
    children,
  } = props;

  const { clearErrors } = useFormContext();
  const {
    setDirty,
    validityData,
    validationMode,
    setControlId,
    setFilled,
    name: fieldName,
    disabled: fieldDisabled,
  } = useFieldRootContext();
  const fieldControlValidation = useFieldControlValidation();

  const id = useBaseUiId(idProp);

  const disabled = fieldDisabled || disabledProp;
  const name = fieldName ?? nameProp;

  useIsoLayoutEffect(() => {
    setControlId(id);
    return () => {
      setControlId(undefined);
    };
  }, [id, setControlId]);

  const [value, setValueUnwrapped] = useControlled({
    controlled: valueProp,
    default: multiple ? (defaultValue ?? EMPTY_ARRAY) : defaultValue,
    name: 'Select',
    state: 'value',
  });

  const [open, setOpenUnwrapped] = useControlled({
    controlled: openProp,
    default: defaultOpenProp,
    name: 'Select',
    state: 'open',
  });

  const listRef = React.useRef<Array<HTMLElement | null>>([]);
  const labelsRef = React.useRef<Array<string | null>>([]);
  const popupRef = React.useRef<HTMLDivElement | null>(null);
  const valueRef = React.useRef<HTMLSpanElement | null>(null);
  const valuesRef = React.useRef<Array<any>>([]);
  const typingRef = React.useRef(false);
  const keyboardActiveRef = React.useRef(false);
  const selectedItemTextRef = React.useRef<HTMLSpanElement | null>(null);
  const selectionRef = React.useRef({
    allowSelectedMouseUp: false,
    allowUnselectedMouseUp: false,
  });
  const alignItemWithTriggerActiveRef = React.useRef(false);

  const { mounted, setMounted, transitionStatus } = useTransitionStatus(open);

  const store = useRefWithInit(
    () =>
      new Store<State>({
        id,
        modal,
        multiple,
        value,
        open,
        mounted,
        forceMount: false,
        transitionStatus,
        items,
        touchModality: false,
        activeIndex: null,
        selectedIndex: null,
        popupProps: {},
        triggerProps: {},
        triggerElement: null,
        positionerElement: null,
        scrollUpArrowVisible: false,
        scrollDownArrowVisible: false,
      }),
  ).current;

  const initialValueRef = React.useRef(value);
  useIsoLayoutEffect(() => {
    // Ensure the values and labels are registered for programmatic value changes.
    if (value !== initialValueRef.current) {
      store.set('forceMount', true);
    }
  }, [store, value]);

  const activeIndex = useStore(store, selectors.activeIndex);
  const selectedIndex = useStore(store, selectors.selectedIndex);
  const triggerElement = useStore(store, selectors.triggerElement);
  const positionerElement = useStore(store, selectors.positionerElement);

  const controlRef = useLatestRef(store.state.triggerElement);
  const commitValidation = fieldControlValidation.commitValidation;

  useField({
    id,
    commitValidation,
    value,
    controlRef,
    name,
    getValue: () => value,
  });

  const prevValueRef = React.useRef(value);

  useIsoLayoutEffect(() => {
    setFilled(value !== null);
  }, [value, setFilled]);

  useIsoLayoutEffect(() => {
    if (prevValueRef.current === value) {
      return;
    }

    clearErrors(name);
    setDirty(value !== validityData.initialValue);
    commitValidation(value, validationMode !== 'onChange');

    if (validationMode === 'onChange') {
      commitValidation(value);
    }
  }, [
    value,
    commitValidation,
    clearErrors,
    name,
    validationMode,
    store,
    setDirty,
    validityData.initialValue,
    setFilled,
  ]);

  useIsoLayoutEffect(() => {
    prevValueRef.current = value;
  }, [value]);

  const setOpen = useEventCallback(
    (nextOpen: boolean, eventDetails: SelectRoot.ChangeEventDetails) => {
      onOpenChange?.(nextOpen, eventDetails);

      if (eventDetails.isCanceled) {
        return;
      }

      setOpenUnwrapped(nextOpen);

      // Workaround `enableFocusInside` in Floating UI setting `tabindex=0` of a non-highlighted
      // option upon close when tabbing out due to `keepMounted=true`:
      // https://github.com/floating-ui/floating-ui/pull/3004/files#diff-962a7439cdeb09ea98d4b622a45d517bce07ad8c3f866e089bda05f4b0bbd875R194-R199
      // This otherwise causes options to retain `tabindex=0` incorrectly when the popup is closed
      // when tabbing outside.
      if (!nextOpen && store.state.activeIndex !== null) {
        const activeOption = listRef.current[store.state.activeIndex];
        // Wait for Floating UI's focus effect to have fired
        queueMicrotask(() => {
          activeOption?.setAttribute('tabindex', '-1');
        });
      }
    },
  );

  const handleUnmount = useEventCallback(() => {
    setMounted(false);
    onOpenChangeComplete?.(false);
    store.set('activeIndex', null);
  });

  useOpenChangeComplete({
    enabled: !props.actionsRef,
    open,
    ref: popupRef,
    onComplete() {
      if (!open) {
        handleUnmount();
      }
    },
  });

  React.useImperativeHandle(props.actionsRef, () => ({ unmount: handleUnmount }), [handleUnmount]);

  const setValue = useEventCallback(
    (nextValue: any, eventDetails: SelectRoot.ChangeEventDetails) => {
      onValueChange?.(nextValue, eventDetails);

      if (eventDetails.isCanceled) {
        return;
      }

      setValueUnwrapped(nextValue);
    },
  );

  const syncSelectedIndex = useEventCallback(() => {
    if (multiple) {
      const currentValue = Array.isArray(value) ? value : [];
      const lastValue = currentValue[currentValue.length - 1];
      const lastIndex = valuesRef.current.indexOf(lastValue);
      store.set('selectedIndex', lastIndex === -1 ? null : lastIndex);
    } else {
      const index = valuesRef.current.indexOf(value);
      store.set('selectedIndex', index === -1 ? null : index);
    }
  });

  useIsoLayoutEffect(() => {
    if (!open) {
      syncSelectedIndex();
    }
  }, [open, value, syncSelectedIndex]);

  const handleScrollArrowVisibility = useEventCallback(() => {
    const popupElement = popupRef.current;
    if (!popupElement) {
      return;
    }

    const viewportTop = popupElement.scrollTop;
    const viewportBottom = popupElement.scrollTop + popupElement.clientHeight;
    const shouldShowUp = viewportTop > 1;
    const shouldShowDown = viewportBottom < popupElement.scrollHeight - 1;

    if (store.state.scrollUpArrowVisible !== shouldShowUp) {
      store.set('scrollUpArrowVisible', shouldShowUp);
    }
    if (store.state.scrollDownArrowVisible !== shouldShowDown) {
      store.set('scrollDownArrowVisible', shouldShowDown);
    }
  });

  const floatingContext = useFloatingRootContext({
    open,
    onOpenChange: setOpen,
    elements: {
      reference: triggerElement,
      floating: positionerElement,
    },
  });

  const click = useClick(floatingContext, {
    enabled: !readOnly && !disabled,
    event: 'mousedown',
  });

  const dismiss = useDismiss(floatingContext, {
    bubbles: false,
  });

  const role = useRole(floatingContext, {
    role: 'select',
  });

  const listNavigation = useListNavigation(floatingContext, {
    enabled: !readOnly && !disabled,
    listRef,
    activeIndex,
    selectedIndex,
    disabledIndices: EMPTY_ARRAY,
    onNavigate(nextActiveIndex) {
      // Retain the highlight only while closed.
      if (nextActiveIndex === null && !open) {
        return;
      }

      store.set('activeIndex', nextActiveIndex);
    },
    // Implement our own listeners since `onPointerLeave` on each option fires while scrolling with
    // the `alignItemWithTrigger=true`, causing a performance issue on Chrome.
    focusItemOnHover: false,
  });

  const typeahead = useTypeahead(floatingContext, {
    enabled: !readOnly && !disabled && (open || !multiple),
    listRef: labelsRef,
    activeIndex,
    selectedIndex,
    onMatch(index) {
      if (open) {
        store.set('activeIndex', index);
      } else {
        setValue(valuesRef.current[index], createBaseUIEventDetails('none'));
      }
    },
    onTypingChange(typing) {
      // FIXME: Floating UI doesn't support allowing space to select an item while the popup is
      // closed and the trigger isn't a native <button>.
      typingRef.current = typing;
    },
  });

  const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions([
    click,
    dismiss,
    role,
    listNavigation,
    typeahead,
  ]);

  useOnFirstRender(() => {
    // These should be initialized at store creation, but there is an interdependency
    // between some values used in floating hooks above.
    store.apply({
      popupProps: getFloatingProps(),
      triggerProps: getReferenceProps(),
    });
  });

  // Store values that depend on other hooks
  React.useEffect(() => {
    store.apply({
      id,
      modal,
      multiple,
      value,
      open,
      mounted,
      transitionStatus,
      popupProps: getFloatingProps(),
      triggerProps: getReferenceProps(),
      items,
    });
  }, [
    store,
    id,
    modal,
    multiple,
    value,
    open,
    mounted,
    transitionStatus,
    getFloatingProps,
    getReferenceProps,
    items,
  ]);

  const rootContext: SelectRootContext = React.useMemo(
    () => ({
      store,
      name,
      required,
      disabled,
      readOnly,
      multiple,
      setValue,
      setOpen,
      listRef,
      popupRef,
      handleScrollArrowVisibility,
      getItemProps,
      events: floatingContext.events,
      valueRef,
      valuesRef,
      labelsRef,
      typingRef,
      selectionRef,
      selectedItemTextRef,
      fieldControlValidation,
      onOpenChangeComplete,
      keyboardActiveRef,
      alignItemWithTriggerActiveRef,
      initialValueRef,
    }),
    [
      store,
      name,
      required,
      disabled,
      readOnly,
      multiple,
      setValue,
      setOpen,
      listRef,
      popupRef,
      getItemProps,
      floatingContext.events,
      valueRef,
      valuesRef,
      labelsRef,
      typingRef,
      selectionRef,
      selectedItemTextRef,
      fieldControlValidation,
      onOpenChangeComplete,
      keyboardActiveRef,
      alignItemWithTriggerActiveRef,
      handleScrollArrowVisibility,
    ],
  );

  const ref = useMergedRefs(inputRef, rootContext.fieldControlValidation.inputRef);

  const serializedValue = React.useMemo(() => {
    if (multiple && Array.isArray(value) && value.length === 0) {
      return '';
    }
    return serializeValue(value);
  }, [multiple, value]);

  const hiddenInputs = React.useMemo(() => {
    if (!multiple || !Array.isArray(value) || !rootContext.name) {
      return null;
    }

    return value.map((v) => {
      const currentSerializedValue = serializeValue(v);
      return (
        <input
          key={currentSerializedValue}
          type="hidden"
          name={rootContext.name}
          value={currentSerializedValue}
        />
      );
    });
  }, [multiple, value, rootContext.name]);

  return (
    <SelectRootContext.Provider value={rootContext}>
      <SelectFloatingContext.Provider value={floatingContext}>
        {children}
        <input
          {...rootContext.fieldControlValidation.getInputValidationProps({
            onFocus() {
              // Move focus to the trigger element when the hidden input is focused.
              store.state.triggerElement?.focus();
            },
            // Handle browser autofill.
            onChange(event: React.ChangeEvent<HTMLSelectElement>) {
              // Workaround for https://github.com/facebook/react/issues/9023
              if (event.nativeEvent.defaultPrevented) {
                return;
              }

              const nextValue = event.target.value;

              store.set('forceMount', true);

              queueMicrotask(() => {
                if (multiple) {
                  // Browser autofill only ever writes one scalar value per field.
                  // Because a multi-select expects an array, every mainstream engine skips it.
                  // Reliably pre-selecting multiple options therefore has to be done in
                  // application code, not via browser autofill.
                } else {
                  // Handle single selection
                  const exactValue = rootContext.valuesRef.current.find(
                    (v) =>
                      v === nextValue ||
                      (typeof value === 'string' && nextValue.toLowerCase() === v.toLowerCase()),
                  );

                  if (exactValue != null) {
                    setDirty(exactValue !== validityData.initialValue);
                    rootContext.setValue?.(
                      exactValue,
                      createBaseUIEventDetails('none', event.nativeEvent),
                    );

                    if (validationMode === 'onChange') {
                      rootContext.fieldControlValidation.commitValidation(exactValue);
                    }
                  }
                }
              });
            },
            id,
            name: multiple ? undefined : rootContext.name,
            value: serializedValue,
            disabled: rootContext.disabled,
            required: rootContext.required,
            readOnly: rootContext.readOnly,
            ref,
            style: visuallyHidden,
            tabIndex: -1,
            'aria-hidden': true,
          })}
        />
        {hiddenInputs}
      </SelectFloatingContext.Provider>
    </SelectRootContext.Provider>
  );
}

interface SelectRootProps<Value> {
  children?: React.ReactNode;
  /**
   * A ref to access the hidden input element.
   */
  inputRef?: React.Ref<HTMLInputElement>;
  /**
   * Identifies the field when a form is submitted.
   */
  name?: string;
  /**
   * The id of the select.
   */
  id?: string;
  /**
   * Whether the user must choose a value before submitting a form.
   * @default false
   */
  required?: boolean;
  /**
   * Whether the user should be unable to choose a different option from the select menu.
   * @default false
   */
  readOnly?: boolean;
  /**
   * Whether the component should ignore user interaction.
   * @default false
   */
  disabled?: boolean;
  /**
   * Whether multiple items can be selected.
   * @default false
   */
  multiple?: boolean;
  /**
   * The value of the select.
   */
  value?: Value;
  /**
   * Callback fired when the value of the select changes. Use when controlled.
   */
  onValueChange?: (value: Value, eventDetails: SelectRoot.ChangeEventDetails) => void;
  /**
   * The uncontrolled value of the select when it’s initially rendered.
   *
   * To render a controlled select, use the `value` prop instead.
   * @default null
   */
  defaultValue?: Value | null;
  /**
   * Whether the select menu is initially open.
   *
   * To render a controlled select menu, use the `open` prop instead.
   * @default false
   */
  defaultOpen?: boolean;
  /**
   * Event handler called when the select menu is opened or closed.
   */
  onOpenChange?: (open: boolean, eventDetails: SelectRoot.ChangeEventDetails) => void;
  /**
   * Event handler called after any animations complete when the select menu is opened or closed.
   */
  onOpenChangeComplete?: (open: boolean) => void;
  /**
   * Whether the select menu is currently open.
   */
  open?: boolean;
  /**
   * Determines if the select enters a modal state when open.
   * - `true`: user interaction is limited to the select: document page scroll is locked and and pointer interactions on outside elements are disabled.
   * - `false`: user interaction with the rest of the document is allowed.
   * @default true
   */
  modal?: boolean;
  /**
   * A ref to imperative actions.
   * - `unmount`: When specified, the select will not be unmounted when closed.
   * Instead, the `unmount` function must be called to unmount the select manually.
   * Useful when the select's animation is controlled by an external library.
   */
  actionsRef?: React.RefObject<SelectRoot.Actions>;
  /**
   * Data structure of the items rendered in the select menu.
   * When specified, `<Select.Value>` renders the label of the selected item instead of the raw value.
   * @example
   * ```tsx
   * const items = {
   *   sans: 'Sans-serif',
   *   serif: 'Serif',
   *   mono: 'Monospace',
   *   cursive: 'Cursive',
   * };
   * <Select.Root items={items} />
   * ```
   */
  items?: Record<string, React.ReactNode> | Array<{ label: React.ReactNode; value: Value }>;
}

type SelectValueType<Value, Multiple extends boolean | undefined> = Multiple extends true
  ? Value[]
  : Value;

export type SelectRootConditionalProps<Value, Multiple extends boolean | undefined = false> = Omit<
  SelectRootProps<Value>,
  'multiple' | 'value' | 'defaultValue' | 'onValueChange'
> & {
  /**
   * Whether multiple items can be selected.
   * @default false
   */
  multiple?: Multiple;
  /**
   * The value of the select.
   */
  value?: SelectValueType<Value, Multiple>;
  /**
   * The uncontrolled value of the select when it’s initially rendered.
   *
   * To render a controlled select, use the `value` prop instead.
   * @default null
   */
  defaultValue?: SelectValueType<Value, Multiple> | null;
  /**
   * Callback fired when the value of the select changes. Use when controlled.
   */
  onValueChange?: (
    value: SelectValueType<Value, Multiple>,
    eventDetails: SelectRoot.ChangeEventDetails,
  ) => void;
};

export namespace SelectRoot {
  export type Props<
    Value,
    Multiple extends boolean | undefined = false,
  > = SelectRootConditionalProps<Value, Multiple>;

  export interface State {}

  export interface Actions {
    unmount: () => void;
  }

  export type ChangeEventReason = BaseUIChangeEventReason | 'window-resize';
  export type ChangeEventDetails = BaseUIEventDetails<ChangeEventReason>;
}
