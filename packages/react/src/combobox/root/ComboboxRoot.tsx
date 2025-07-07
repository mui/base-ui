'use client';
import * as React from 'react';
import {
  ElementProps,
  useDismiss,
  useFloatingRootContext,
  useInteractions,
  useListNavigation,
  useClick,
} from '../../floating-ui-react';
import { contains, getTarget } from '../../floating-ui-react/utils';
import {
  BaseOpenChangeReason,
  translateOpenChangeReason,
} from '../../utils/translateOpenChangeReason';
import {
  ComboboxFloatingContext,
  ComboboxRootContext,
  ValueChangeReason,
} from './ComboboxRootContext';
import { useControlled, useModernLayoutEffect, useTransitionStatus } from '../../utils';
import { selectors, type State as StoreState } from '../store';
import { Store, useSelector } from '../../utils/store';
import { useLazyRef } from '../../utils/useLazyRef';
import { useEventCallback } from '../../utils/useEventCallback';
import { useOpenChangeComplete } from '../../utils/useOpenChangeComplete';
import { useOnFirstRender } from '../../utils/useOnFirstRender';
import { CompositeList } from '../../composite/list/CompositeList';
import { useFieldRootContext } from '../../field/root/FieldRootContext';
import { useFieldControlValidation } from '../../field/control/useFieldControlValidation';
import { useFormContext } from '../../form/FormContext';
import { useField } from '../../field/useField';
import { visuallyHidden } from '../../utils/visuallyHidden';
import { useForkRef } from '../../utils/useForkRef';
import { useBaseUiId } from '../../utils/useBaseUiId';
import { useLatestRef } from '../../utils/useLatestRef';
import {
  ComboboxGroup,
  defaultItemFilter,
  isGroupedItems,
  defaultGroupFilter,
  getFormValue,
} from './utils';

/**
 * Groups all parts of the combobox.
 * Doesn't render its own HTML element.
 *
 * Documentation: [Base UI Combobox](https://base-ui.com/react/components/combobox)
 */
export function ComboboxRoot<Item = ComboboxRoot.Item>(
  props: ComboboxRoot.SingleProps<Item>,
): React.JSX.Element;
export function ComboboxRoot<Item = ComboboxRoot.Item>(
  props: ComboboxRoot.MultipleProps<Item>,
): React.JSX.Element;
export function ComboboxRoot<Item = ComboboxRoot.Item>(
  props: ComboboxRoot.Props<Item>,
): React.JSX.Element {
  const {
    id: idProp,
    onOpenChangeComplete,
    defaultSelectedValue,
    selectedValue: selectedValueProp,
    onSelectedValueChange,
    defaultValue = '',
    value: valueProp,
    select: selectProp = 'none',
    onItemHighlighted: onItemHighlightedProp,
    name: nameProp,
    disabled: disabledProp = false,
    readOnly = false,
    required = false,
    inputRef: inputRefProp,
    cols = 1,
    items,
    filter = defaultItemFilter,
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
  const multiple = selectProp === 'multiple';

  useModernLayoutEffect(() => {
    setControlId(id);
    return () => {
      setControlId(undefined);
    };
  }, [id, setControlId]);

  const defaultUncontrolledValue = React.useMemo(() => {
    if (multiple) {
      return defaultSelectedValue !== null && defaultSelectedValue !== undefined
        ? defaultSelectedValue
        : [];
    }
    return defaultSelectedValue !== null && defaultSelectedValue !== undefined
      ? defaultSelectedValue
      : '';
  }, [defaultSelectedValue, multiple]);

  const [selectedValue, setSelectedValueUnwrapped] = useControlled<any>({
    controlled: selectedValueProp,
    default: defaultUncontrolledValue,
    name: 'Combobox',
    state: 'selectedValue',
  });

  const [inputValue, setInputValueUnwrapped] = useControlled({
    controlled: valueProp,
    default: defaultValue,
    name: 'Combobox',
    state: 'value',
  });

  const [openRaw, setOpenUnwrapped] = useControlled({
    controlled: props.open,
    default: props.defaultOpen,
    name: 'Combobox',
    state: 'open',
  });

  const query = React.useMemo(() => {
    if (inputValue == null) {
      return '';
    }
    return String(inputValue).toLowerCase();
  }, [inputValue]);

  const isGrouped = React.useMemo(() => isGroupedItems(items), [items]);

  const flatItems = React.useMemo(() => {
    if (!items) {
      return [];
    }

    if (isGrouped) {
      return (items as ComboboxGroup<Item>[]).flatMap((group) => group.items);
    }

    return items as Item[];
  }, [items, isGrouped]);

  const filteredItems = React.useMemo(() => {
    if (!items) {
      return [];
    }

    if (isGrouped) {
      const groupedItems = items as ComboboxGroup<Item>[];
      if (query.trim() === '') {
        return groupedItems;
      }
      return groupedItems
        .map((group) => defaultGroupFilter(group, query, filter))
        .filter((group): group is ComboboxGroup<Item> => group !== null);
    }

    const flatItemsArray = items as Item[];
    if (query.trim() === '') {
      return flatItemsArray;
    }
    return flatItemsArray.filter((item) => filter(item, query));
  }, [items, query, filter, isGrouped]);

  const { mounted, setMounted, transitionStatus } = useTransitionStatus(openRaw);

  const store = useLazyRef(
    () =>
      new Store<StoreState>({
        id,
        value: selectedValue,
        open: openRaw,
        mounted,
        transitionStatus,
        inline: false,
        activeIndex: null,
        selectedIndex: null,
        popupProps: {},
        triggerProps: {},
        triggerElement: null,
        positionerElement: null,
        listElement: null,
      }),
  ).current;

  const onItemHighlighted = useEventCallback(onItemHighlightedProp);

  const activeIndex = useSelector(store, selectors.activeIndex);
  const selectedIndex = useSelector(store, selectors.selectedIndex);
  const triggerElement = useSelector(store, selectors.triggerElement);
  const positionerElement = useSelector(store, selectors.positionerElement);
  const listElement = useSelector(store, selectors.listElement);
  const inline = useSelector(store, selectors.inline);
  const open = inline ? true : openRaw;

  const listRef = React.useRef<Array<HTMLElement | null>>([]);
  const popupRef = React.useRef<HTMLDivElement | null>(null);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const valuesRef = React.useRef<Array<any>>([]);
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const keyboardActiveRef = React.useRef(true);
  const allowActiveIndexSyncRef = React.useRef(true);
  const closingRef = React.useRef(false);

  const controlRef = useLatestRef(triggerElement);
  const commitValidation = fieldControlValidation.commitValidation;

  const updateValue = useEventCallback((nextValue: any) => {
    clearErrors(name);
    setDirty(nextValue !== validityData.initialValue);
  });

  const formValue = selectProp === 'none' ? inputValue : selectedValue;

  useField({
    id,
    commitValidation,
    value: formValue,
    controlRef,
    name,
    getValue: () => formValue,
  });

  const prevValueRef = React.useRef(selectedValue);

  useModernLayoutEffect(() => {
    if (prevValueRef.current === selectedValue) {
      return;
    }

    clearErrors(name);
    commitValidation?.(selectedValue, true);

    if (validationMode === 'onChange') {
      commitValidation?.(selectedValue);
    }
  }, [selectedValue, commitValidation, clearErrors, name, validationMode]);

  useModernLayoutEffect(() => {
    const hasValue = multiple
      ? Array.isArray(selectedValue) && selectedValue.length > 0
      : selectedValue !== null && selectedValue !== undefined && selectedValue !== '';
    setFilled(hasValue);
    if (prevValueRef.current !== selectedValue) {
      updateValue(selectedValue);
    }
  }, [setFilled, updateValue, selectedValue, multiple]);

  useModernLayoutEffect(() => {
    prevValueRef.current = selectedValue;
  }, [selectedValue]);

  const setInputValue = useEventCallback(
    (next: string, event: Event | undefined, reason: ValueChangeReason | undefined) => {
      props.onValueChange?.(next, event, reason);
      setInputValueUnwrapped(next);
    },
  );

  const setOpen = useEventCallback(
    (nextOpen: boolean, event: Event | undefined, reason: BaseOpenChangeReason | undefined) => {
      // Mark that the popup is closing so we can retain the highlight until the
      // exit transition fully completes.
      closingRef.current = !nextOpen;
      props.onOpenChange?.(nextOpen, event, reason);
      setOpenUnwrapped(nextOpen);
    },
  );

  const handleUnmount = useEventCallback(() => {
    closingRef.current = false;
    allowActiveIndexSyncRef.current = true;
    listRef.current = [];
    setMounted(false);
    store.set('activeIndex', null);
    onItemHighlighted(undefined, 'pointer');
    onOpenChangeComplete?.(false);
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

  const setSelectedValue = useEventCallback(
    (nextValue: any, event: Event | undefined, reason: string | undefined) => {
      onSelectedValueChange?.(nextValue, event, reason);
      setSelectedValueUnwrapped(nextValue);

      // If input value is uncontrolled, keep it in sync for single selection
      if (!multiple && props.value === undefined) {
        let stringVal: string;
        if (nextValue == null) {
          stringVal = '';
        } else if (typeof nextValue === 'object' && 'value' in nextValue) {
          stringVal = String((nextValue as { value: unknown }).value);
        } else {
          stringVal = String(nextValue);
        }
        setInputValueUnwrapped(stringVal);
      }

      // Clear the uncontrolled input after a selection in multiple-select mode when filtering was used.
      const hadInputValue = inputRef.current ? inputRef.current.value.trim() !== '' : false;
      if (multiple && props.value === undefined && hadInputValue) {
        setInputValueUnwrapped('');
        // Reset active index and clear any highlighted item since the list will re-filter.
        store.set('activeIndex', null);
        onItemHighlighted(undefined, keyboardActiveRef.current ? 'keyboard' : 'pointer');
      }
    },
  );

  React.useImperativeHandle(props.actionsRef, () => ({ unmount: handleUnmount }), [handleUnmount]);

  const hasRegisteredRef = React.useRef(false);

  const registerSelectedItem = useEventCallback((suppliedIndex: number | undefined) => {
    if (suppliedIndex !== undefined) {
      hasRegisteredRef.current = true;
    }

    if (multiple) {
      const currentValue = selectedValue as any[];
      const selectedIndices: number[] = [];

      if (Array.isArray(currentValue)) {
        currentValue.forEach((val) => {
          const index = valuesRef.current.indexOf(val);
          if (index !== -1) {
            selectedIndices.push(index);
          }
        });
      }

      store.set(
        'selectedIndex',
        selectedIndices.length > 0 ? selectedIndices[selectedIndices.length - 1] : null,
      );
    } else {
      const index = suppliedIndex ?? valuesRef.current.indexOf(selectedValue);
      const hasIndex = index !== -1;

      // Always clear the selected index when nothing is selected.
      if (selectedValue === null) {
        store.set('selectedIndex', null);
      } else if (allowActiveIndexSyncRef.current && hasIndex) {
        // Otherwise, sync only when synchronization is enabled.
        store.set('selectedIndex', index);
      }
    }
  });

  useModernLayoutEffect(() => {
    if (!hasRegisteredRef.current) {
      return;
    }

    registerSelectedItem(undefined);
  }, [selectedValue, registerSelectedItem]);

  const floatingRootContext = useFloatingRootContext({
    open: inline ? true : open,
    onOpenChange(nextOpen, event, reason) {
      setOpen(nextOpen, event, translateOpenChangeReason(reason));
    },
    elements: {
      reference: triggerElement,
      floating: positionerElement,
    },
  });

  let ariaHasPopup: 'grid' | 'listbox' | undefined;
  let ariaExpanded: 'true' | 'false' | undefined;
  if (!inline) {
    ariaHasPopup = cols > 1 ? 'grid' : 'listbox';
    ariaExpanded = open ? 'true' : 'false';
  }

  const role: ElementProps = React.useMemo(
    () => ({
      reference: {
        role: 'combobox',
        'aria-expanded': ariaExpanded,
        'aria-haspopup': ariaHasPopup,
        'aria-controls': open ? listElement?.id : undefined,
        'aria-autocomplete': 'list',
        autoComplete: 'off',
        spellCheck: 'false',
        autoCorrect: 'off',
        autoCapitalize: 'off',
      },
      floating: {
        role: 'presentation',
      },
    }),
    [ariaExpanded, ariaHasPopup, listElement?.id, open],
  );

  const click = useClick(floatingRootContext, {
    enabled: !readOnly && !disabled,
    event: 'mousedown-only',
    toggle: false,
  });

  const dismiss = useDismiss(floatingRootContext, {
    enabled: !readOnly && !disabled,
    bubbles: true,
    outsidePress(event) {
      const target = getTarget(event) as Element | null;
      return !contains(triggerRef.current, target);
    },
  });

  const hasActualSelections = React.useMemo(() => {
    if (multiple) {
      return Array.isArray(selectedValue) && selectedValue.length > 0;
    }
    return Boolean(selectedValue);
  }, [multiple, selectedValue]);

  const listNavigation = useListNavigation(floatingRootContext, {
    enabled: !readOnly && !disabled,
    listRef,
    activeIndex,
    selectedIndex,
    virtual: true,
    loop: true,
    allowEscape: true,
    focusItemOnOpen: selectProp !== 'none' && selectedIndex !== null && hasActualSelections,
    cols,
    orientation: cols > 1 ? 'horizontal' : undefined,
    onNavigate(nextActiveIndex) {
      // Retain the highlight while transitioning out.
      if (nextActiveIndex === null && (closingRef.current || !open)) {
        return;
      }

      const type = keyboardActiveRef.current ? 'keyboard' : 'pointer';
      if (nextActiveIndex !== null) {
        onItemHighlighted(valuesRef.current[nextActiveIndex], type);
      } else {
        onItemHighlighted(undefined, type);
      }

      store.set('activeIndex', nextActiveIndex);
    },
  });

  const { getReferenceProps, getFloatingProps, getItemProps } = useInteractions([
    role,
    click,
    dismiss,
    listNavigation,
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
      value: selectedValue,
      open,
      mounted,
      transitionStatus,
      popupProps: getFloatingProps(),
      triggerProps: getReferenceProps(),
    });
  }, [
    store,
    id,
    selectedValue,
    open,
    mounted,
    transitionStatus,
    getFloatingProps,
    getReferenceProps,
  ]);

  const hiddenInputRef = useForkRef(inputRefProp, fieldControlValidation.inputRef);

  const serializedValue = React.useMemo(() => {
    if (formValue == null || Array.isArray(formValue)) {
      return ''; // avoid uncontrolled -> controlled error
    }
    return getFormValue(formValue);
  }, [formValue]);

  const contextValue: ComboboxRootContext = React.useMemo(
    () => ({
      select: selectProp,
      mounted,
      selectedValue,
      setSelectedValue,
      open,
      setOpen,
      listRef,
      popupRef,
      triggerRef,
      valuesRef,
      inputRef,
      keyboardActiveRef,
      allowActiveIndexSyncRef,
      triggerElement,
      positionerElement,
      store,
      getItemProps,
      registerSelectedItem,
      onItemHighlighted,
      value: inputValue,
      setValue: setInputValue,
      name,
      disabled,
      readOnly,
      required,
      fieldControlValidation,
      cols,
      items,
      filteredItems,
      flatItems,
      isGrouped,
      filter,
    }),
    [
      selectProp,
      mounted,
      selectedValue,
      setSelectedValue,
      open,
      positionerElement,
      setOpen,
      triggerElement,
      store,
      getItemProps,
      registerSelectedItem,
      onItemHighlighted,
      inputValue,
      setInputValue,
      name,
      disabled,
      readOnly,
      required,
      fieldControlValidation,
      cols,
      items,
      filteredItems,
      flatItems,
      isGrouped,
      filter,
    ],
  );

  return (
    <ComboboxRootContext.Provider value={contextValue}>
      <ComboboxFloatingContext.Provider value={floatingRootContext}>
        <CompositeList elementsRef={listRef}>
          {props.children}
          <input
            {...fieldControlValidation.getInputValidationProps({
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

                const exactValue = valuesRef.current.find(
                  (v: any) =>
                    v === nextValue ||
                    (typeof selectedValue === 'string' &&
                      nextValue.toLowerCase() === v.toLowerCase()),
                );

                if (exactValue != null) {
                  setDirty(exactValue !== validityData.initialValue);
                  setSelectedValue?.(exactValue, event.nativeEvent, 'input-change');

                  if (validationMode === 'onChange') {
                    fieldControlValidation.commitValidation(exactValue);
                  }
                }
              },
              id,
              name: multiple ? undefined : name,
              disabled,
              required,
              readOnly,
              value: serializedValue,
              ref: hiddenInputRef,
              style: visuallyHidden,
              tabIndex: -1,
              'aria-hidden': true,
            })}
          />
          {multiple && Array.isArray(selectedValue) && name
            ? selectedValue.map((v, index) => (
                <input key={index} type="hidden" name={name} value={getFormValue(v)} />
              ))
            : null}
        </CompositeList>
      </ComboboxFloatingContext.Provider>
    </ComboboxRootContext.Provider>
  );
}

export namespace ComboboxRoot {
  export interface State {}

  type ItemValue<T> = T extends { value: infer V } ? V : T;

  interface BaseProps<ItemObject = Item> {
    children?: React.ReactNode;
    /**
     * Identifies the field when a form is submitted.
     */
    name?: string;
    /**
     * The id of the combobox.
     */
    id?: string;
    /**
     * Whether the user must choose a value before submitting a form.
     * @default false
     */
    required?: boolean;
    /**
     * Whether the user should be unable to choose a different option from the combobox popup.
     * @default false
     */
    readOnly?: boolean;
    /**
     * Whether the component should ignore user interaction.
     * @default false
     */
    disabled?: boolean;
    /**
     * Whether the combobox popup is initially open.
     *
     * To render a controlled combobox popup, use the `open` prop instead.
     * @default false
     */
    defaultOpen?: boolean;
    /**
     * Event handler called when the combobox popup is opened or closed.
     * @type (open: boolean, event?: Event, reason?: combobox.Root.OpenChangeReason) => void
     */
    onOpenChange?: (
      open: boolean,
      event: Event | undefined,
      reason: BaseOpenChangeReason | undefined,
    ) => void;
    /**
     * Event handler called after any animations complete when the combobox popup is opened or closed.
     */
    onOpenChangeComplete?: (open: boolean) => void;
    /**
     * Whether the combobox popup is currently open.
     */
    open?: boolean;
    /**
     * The input value of the combobox.
     */
    value?: React.ComponentProps<'input'>['value'];
    /**
     * Callback fired when the input value of the combobox changes.
     */
    onValueChange?: (value: string, event: Event | undefined, reason: string | undefined) => void;
    /**
     * The uncontrolled input value when initially rendered.
     */
    defaultValue?: React.ComponentProps<'input'>['defaultValue'];
    /**
     * How the combobox should remember the selected value.
     * - `single`: Remembers the last selected value.
     * - `multiple`: Remember all selected values.
     * - `none`: Do not remember the selected value.
     * @type 'single' | 'multiple' | 'none'
     * @default 'none'
     */
    select?: 'single' | 'multiple' | 'none';
    /**
     * A ref to imperative actions.
     * - `unmount`: When specified, the combobox will not be unmounted when closed.
     * Instead, the `unmount` function must be called to unmount the combobox manually.
     * Useful when the combobox's animation is controlled by an external library.
     */
    actionsRef?: React.RefObject<Actions>;
    /**
     * Callback fired when the user navigates the list and highlights an item.
     * Passes the item's `value` or `undefined` when no item is highlighted.
     */
    onItemHighlighted?: (
      value: ItemValue<ItemObject> | undefined,
      type: 'keyboard' | 'pointer',
    ) => void;
    /**
     * A ref to the hidden input element used for form submission.
     */
    inputRef?: React.RefObject<HTMLInputElement>;
    /**
     * The number of columns the items are rendered in grid layout.
     * @default 1
     */
    cols?: number;
    /**
     * The items to be displayed in the combobox.
     * Can be either a flat array of items or an array of groups with items.
     */
    items?: ItemObject[] | ComboboxGroup<ItemObject>[];
    /**
     * Filter function used to match items vs input query.
     */
    filter?: (item: ItemObject, query: string) => boolean;
  }

  export interface SingleProps<ItemObject = Item> extends BaseProps<ItemObject> {
    /**
     * How the combobox should remember the selected value.
     * - `single`: Remembers the last selected value.
     * - `multiple`: Remember all selected values.
     * - `none`: Do not remember the selected value.
     * @type 'single' | 'multiple' | 'none'
     * @default 'none'
     */
    select?: 'single';
    /**
     * The selected value of the combobox.
     */
    selectedValue?: ItemValue<ItemObject>;
    /**
     * Callback fired when the selected value of the combobox changes.
     */
    onSelectedValueChange?: (
      value: ItemValue<ItemObject>,
      event: Event | undefined,
      reason: string | undefined,
    ) => void;
    /**
     * The uncontrolled selected value of the combobox when it's initially rendered.
     *
     * To render a controlled combobox, use the `selectedValue` prop instead.
     */
    defaultSelectedValue?: ItemValue<ItemObject>;
  }

  export interface MultipleProps<ItemObject = Item> extends BaseProps<ItemObject> {
    /**
     * How the combobox should remember the selected value.
     * - `single`: Remembers the last selected value.
     * - `multiple`: Remember all selected values.
     * - `none`: Do not remember the selected value.
     * @type 'single' | 'multiple' | 'none'
     * @default 'none'
     */
    select?: 'multiple';
    /**
     * The selected values of the combobox.
     */
    selectedValue?: ItemValue<ItemObject>[];
    /**
     * Callback fired when the selected values of the combobox change.
     */
    onSelectedValueChange?: (
      value: ItemValue<ItemObject>[],
      event: Event | undefined,
      reason: string | undefined,
    ) => void;
    /**
     * The uncontrolled selected values of the combobox when it's initially rendered.
     *
     * To render a controlled combobox, use the `selectedValue` prop instead.
     */
    defaultSelectedValue?: ItemValue<ItemObject>[];
  }

  export type Item = ({ value: unknown } & Record<string, unknown>) | string | number;

  export type Props<ItemObject = Item> = SingleProps<ItemObject> | MultipleProps<ItemObject>;

  export interface Actions {
    unmount: () => void;
  }
}
